const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { sendWelcomeEmail } = require("../utils/emailService"); 
const { protect, authorizeRoles, verifyRefreshToken } = require("../middleware/authMiddleware");

// ── SCHEMAS (VALIDIMI) ─────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.min": "Emri duhet të ketë të paktën 3 karaktere!",
    "any.required": "Emri është i detyrueshëm!",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Ju lutem jepni një adresë email të vlefshme!",
    "any.required": "Emaili është i detyrueshëm!",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Fjalëkalimi duhet të jetë të paktën 6 karaktere!",
    "any.required": "Fjalëkalimi është i detyrueshëm!",
  }),
  role: Joi.string().valid("user", "admin").default("user"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
});

// ── HELPER: GJENERO TOKENS (JWT) ──────────────────────────
const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, name: user.name, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

  const refreshToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

  return { accessToken, refreshToken };
};

// ── HELPER: SHKRUAJ AUDIT LOG (Gjurmueshmëria) ───────────────────────
const writeAudit = async ({ userId, action, details = {}, ip = null }) => {
  try {
    await AuditLog.create({ 
      user_id: userId, 
      action, 
      details: typeof details === 'string' ? details : JSON.stringify(details), 
      ip_address: ip 
    });
  } catch (e) {
    console.warn("⚠️ Audit log failed:", e.message);
  }
};

// ══════════════════════════════════════════════════
// 1. REGISTER (Regjistrimi + Hash + Audit + Email)
// ══════════════════════════════════════════════════
router.post("/register", async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Ky email është regjistruar më parë!" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role: role || "user" 
    });

    await writeAudit({ 
      userId: user.id, 
      action: "REGISTER", 
      details: { email, role: user.role }, 
      ip: req.ip 
    });

    try {
      await sendWelcomeEmail(user.email, user.name);
      console.log(`📧 Email u dërgua me sukses te: ${user.email}`);
    } catch (mailErr) {
      console.error("❌ Email dështoi por user-i u krijua:", mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "✅ Regjistrimi u krye me sukses!",
      data: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("Gabim në regjistrim:", err);
    res.status(500).json({ message: "Gabim i brendshëm i serverit!" });
  }
});

// ══════════════════════════════════════════════════
// 2. LOGIN (Autentikimi)
// ══════════════════════════════════════════════════
router.post("/login", async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      await writeAudit({ userId: user?.id || null, action: "LOGIN_FAILED", details: { email }, ip: req.ip });
      return res.status(400).json({ message: "Email ose fjalëkalim i gabuar!" });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    await writeAudit({ userId: user.id, action: "LOGIN", details: { email }, ip: req.ip });

    res.json({
      success: true,
      message: "✅ Identifikimi u krye!",
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Gabim gjatë identifikimit!" });
  }
});

// ══════════════════════════════════════════════════
// 3. PROFILE (Merr të dhënat e tua)
// ══════════════════════════════════════════════════
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { 
      attributes: { exclude: ["password"] } 
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════
// 4. ADMIN: LISTO TË GJITHË PËRDORUESIT
// ══════════════════════════════════════════════════
router.get("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════
// 5. ADMIN: SHIKO AUDIT LOGS
// ══════════════════════════════════════════════════
router.get("/audit-logs", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{ model: User, attributes: ["id", "name", "email"] }],
      order: [["createdAt", "DESC"]],
      limit: 50,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;