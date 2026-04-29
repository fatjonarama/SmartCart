const express     = require("express");
const router      = express.Router();
const Joi         = require("joi");
const userService = require("../services/UserService");
const AuditLog    = require("../models/AuditLog");
const User        = require("../models/User");
const { protect, authorizeRoles, verifyRefreshToken } = require("../middleware/authMiddleware");

// ── SCHEMAS ─────────────────────────────────────
const registerSchema = Joi.object({
  name:     Joi.string().min(3).max(50).required().messages({ "string.min":"Emri duhet të ketë të paktën 3 karaktere!", "any.required":"Emri është i detyrueshëm!" }),
  email:    Joi.string().email().required().messages({ "string.email":"Email i pavlefshëm!", "any.required":"Emaili është i detyrueshëm!" }),
  password: Joi.string().min(6).required().messages({ "string.min":"Fjalëkalimi duhet të ketë të paktën 6 karaktere!", "any.required":"Fjalëkalimi është i detyrueshëm!" }),
  role:     Joi.string().valid("user","admin").default("user"),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name:  Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
});

// ══════════════════════════════════════════════════
// 1. REGISTER
// ══════════════════════════════════════════════════
router.post("/register", async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const result = await userService.register(req.body, req.ip);
    res.status(201).json({ message: "✅ Regjistrimi u krye me sukses!", ...result });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ══════════════════════════════════════════════════
// 2. LOGIN — kthen accessToken + refreshToken
// ══════════════════════════════════════════════════
router.post("/login", async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const result = await userService.login(req.body, req.ip);
    res.json({ message: "✅ Login i suksesshëm!", ...result });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ══════════════════════════════════════════════════
// 3. REFRESH TOKEN
// ══════════════════════════════════════════════════
router.post("/refresh", verifyRefreshToken, async (req, res) => {
  try {
    const tokens = await userService.refreshToken(req.user.id, req.ip);
    res.json({ message: "✅ Token u rifreskua!", ...tokens });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ══════════════════════════════════════════════════
// 4. LOGOUT
// ══════════════════════════════════════════════════
router.post("/logout", protect, async (req, res) => {
  try {
    await userService.logout(req.user.id, req.ip);
    res.json({ message: "✅ Logout i suksesshëm!" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ══════════════════════════════════════════════════
// 5. FORGOT PASSWORD
// ══════════════════════════════════════════════════
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email është i detyrueshëm!" });
    await userService.forgotPassword(email, req.ip);
    res.json({ message: "✅ Nëse ky email ekziston, do të marrësh udhëzimet për resetim." });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ══════════════════════════════════════════════════
// 6. RESET PASSWORD me token
// ══════════════════════════════════════════════════
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Token dhe fjalëkalimi janë të detyrueshëm!" });
    await userService.resetPassword(token, newPassword, req.ip);
    res.json({ message: "✅ Fjalëkalimi u ndryshua me sukses!" });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ══════════════════════════════════════════════════
// 7. GET PROFILE
// ══════════════════════════════════════════════════
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await userService.getProfile(req.user.id);
    res.json(user);
  } catch (err) { res.status(404).json({ message: err.message }); }
});

// ══════════════════════════════════════════════════
// 8. UPDATE PROFILE
// ══════════════════════════════════════════════════
router.put("/profile", protect, async (req, res) => {
  try {
    const { error } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const user = await userService.updateProfile(req.user.id, req.body, req.ip);
    res.json({ message: "✅ Profili u përditësua!", user });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ══════════════════════════════════════════════════
// 9. CHANGE PASSWORD
// ══════════════════════════════════════════════════
router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Të dy fjalëkalimet janë të detyrueshme!" });
    await userService.changePassword(req.user.id, { currentPassword, newPassword }, req.ip);
    res.json({ message: "✅ Fjalëkalimi u ndryshua!" });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ══════════════════════════════════════════════════
// 10. GET ALL USERS — Admin me pagination + filtering
// ══════════════════════════════════════════════════
router.get("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const filters = {
      page:   parseInt(req.query.page)  || 1,
      limit:  parseInt(req.query.limit) || 10,
      search: req.query.search || null,
      role:   req.query.role   || null,
    };
    const result = await userService.getAllUsers(filters);
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ══════════════════════════════════════════════════
// 11. DELETE USER (Admin)
// ══════════════════════════════════════════════════
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    await userService.deleteUser(parseInt(req.params.id), req.user.id, req.ip);
    res.json({ message: "✅ Llogaria u fshi!" });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ══════════════════════════════════════════════════
// 12. AUDIT LOGS (Admin) me pagination
// ══════════════════════════════════════════════════
router.get("/audit-logs", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await AuditLog.findAndCountAll({
      include: [{ model: User, attributes: ["id","name","email"] }],
      order:   [["createdAt","DESC"]],
      limit,
      offset,
    });

    res.json({
      data: rows,
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;