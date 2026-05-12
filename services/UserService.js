const bcrypt      = require("bcryptjs");
const jwt         = require("jsonwebtoken");
const crypto      = require("crypto");
const userRepo    = require("../repositories/UserRepository");
const AuditLog    = require("../models/AuditLog");
const emailService = require("./emailService");

class UserService {

  generateTokens(user) {
    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken  = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "15m" });
    const refreshToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" });
    return { accessToken, refreshToken, token: accessToken };
  }

  async audit(userId, action, details = {}, ip = null) {
    try {
      await AuditLog.create({ user_id: userId, action, details: JSON.stringify(details), ip_address: ip });
    } catch (e) { console.warn("⚠️ Audit log failed:", e.message); }
  }

  // ══════════════════════════════════════════════
  // REGISTER
  // ══════════════════════════════════════════════
  async register({ name, email, password, role = "user" }, ip) {
    const existing = await userRepo.findByEmail(email);
    if (existing) throw new Error("Ky email është regjistruar më parë!");

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await userRepo.create({ name, email, password: hashedPassword, role, is_verified: true });

    // Dërgo email verifikimi në background — nuk bllokon response
    const verificationToken = crypto.randomBytes(32).toString("hex");
    setImmediate(() => {
      userRepo.saveVerificationToken(user.id, verificationToken).catch(() => {});
      emailService.sendVerificationEmail({ to: email, name, verificationToken })
        .catch(e => console.warn("Verification email failed:", e.message));
    });

    setImmediate(() => {
      this.audit(user.id, "REGISTER", { name, email, role }, ip).catch(() => {});
    });

    return { userId: user.id, role: user.role, message: "✅ Regjistrimi u krye me sukses!" };
  }

  // ══════════════════════════════════════════════
  // VERIFY EMAIL
  // ══════════════════════════════════════════════
  async verifyEmail(token, ip) {
    const user = await userRepo.findByVerificationToken(token);
    if (!user) throw new Error("Token i pavlefshëm ose llogaria është aktivizuar tashmë!");

    await userRepo.verifyUser(user.id);
    await this.audit(user.id, "EMAIL_VERIFIED", {}, ip);
    return true;
  }

  // ══════════════════════════════════════════════
  // LOGIN
  // ══════════════════════════════════════════════
  async login({ email, password }, ip) {
    const user = await userRepo.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      await this.audit(user?.id || null, "LOGIN_FAILED", { email }, ip);
      throw new Error("Email ose fjalëkalim i gabuar!");
    }

    const tokens = this.generateTokens(user);

    setImmediate(() => {
      this.audit(user.id, "LOGIN", { email }, ip).catch(() => {});
    });

    return {
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async refreshToken(userId, ip) {
    const user = await userRepo.findByIdWithPassword(userId);
    if (!user) throw new Error("Përdoruesi nuk u gjet!");
    const tokens = this.generateTokens(user);
    await this.audit(user.id, "TOKEN_REFRESH", {}, ip);
    return tokens;
  }

  async logout(userId, ip) {
    await this.audit(userId, "LOGOUT", {}, ip);
    return true;
  }

  async updateProfile(userId, { name, email }, ip) {
    const user = await userRepo.findByIdWithPassword(userId);
    if (!user) throw new Error("Përdoruesi nuk u gjet!");

    const before = { name: user.name, email: user.email };
    if (email && email !== user.email) {
      const existing = await userRepo.findByEmail(email);
      if (existing) throw new Error("Ky email është i zënë!");
    }

    const updated = await userRepo.updateProfile(userId, { name, email });
    await this.audit(userId, "PROFILE_UPDATE", { before, after: { name, email } }, ip);
    return { id: updated.id, name: updated.name, email: updated.email, role: updated.role };
  }

  async changePassword(userId, { currentPassword, newPassword }, ip) {
    const user = await userRepo.findByIdWithPassword(userId);
    if (!user) throw new Error("Përdoruesi nuk u gjet!");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("Fjalëkalimi aktual nuk është i saktë!");
    if (newPassword.length < 6) throw new Error("Fjalëkalimi i ri duhet të ketë të paktën 6 karaktere!");

    const hashed = await bcrypt.hash(newPassword, 12);
    await userRepo.updatePassword(userId, hashed);

    setImmediate(() => {
      emailService.sendPasswordChangedEmail({ to: user.email, name: user.name })
        .catch(e => console.warn("Email failed:", e.message));
    });

    await this.audit(userId, "PASSWORD_CHANGE", {}, ip);
    return true;
  }

  async forgotPassword(email, ip) {
    const user = await userRepo.findByEmail(email);
    if (!user) return true;

    const resetToken  = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await userRepo.saveResetToken(user.id, resetToken, tokenExpiry);

    setImmediate(() => {
      emailService.sendPasswordResetEmail({ to: user.email, name: user.name, resetToken })
        .catch(e => console.warn("Email failed:", e.message));
    });

    setImmediate(() => {
      this.audit(user.id, "PASSWORD_RESET_REQUESTED", { email }, ip).catch(() => {});
    });

    return true;
  }

  async resetPassword(token, newPassword, ip) {
    const user = await userRepo.findByResetToken(token);
    if (!user) throw new Error("Token i pavlefshëm ose i skaduar!");
    if (newPassword.length < 6) throw new Error("Fjalëkalimi duhet të ketë të paktën 6 karaktere!");

    const hashed = await bcrypt.hash(newPassword, 12);
    await userRepo.updatePassword(user.id, hashed);
    await userRepo.clearResetToken(user.id);

    setImmediate(() => {
      emailService.sendPasswordChangedEmail({ to: user.email, name: user.name })
        .catch(e => console.warn("Email failed:", e.message));
    });

    await this.audit(user.id, "PASSWORD_RESET_COMPLETED", {}, ip);
    return true;
  }

  async deleteUser(targetId, adminId, ip) {
    const user = await userRepo.findByIdWithPassword(targetId);
    if (!user) throw new Error("Përdoruesi nuk u gjet!");
    await this.audit(adminId, "USER_DELETE", { deletedUserId: targetId, deletedEmail: user.email }, ip);
    await userRepo.delete(targetId);
    return true;
  }

  async getAllUsers(filters) {
    return userRepo.findAll(filters);
  }

  async getProfile(userId) {
    const user = await userRepo.findById(userId);
    if (!user) throw new Error("Përdoruesi nuk u gjet!");
    return user;
  }
}

module.exports = new UserService();