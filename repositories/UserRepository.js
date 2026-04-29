const User = require("../models/User");
const { Op } = require("sequelize");

// ══════════════════════════════════════════════════
// USER REPOSITORY — Data Access Layer (DDD)
// Izoloni logjikën e qasjes së të dhënave nga business logic
// ══════════════════════════════════════════════════

class UserRepository {

  // Gjej me ID
  async findById(id) {
    return User.findByPk(id, { attributes: { exclude: ["password"] } });
  }

  // Gjej me ID (me fjalëkalim — për autentikim)
  async findByIdWithPassword(id) {
    return User.findByPk(id);
  }

  // Gjej me email
  async findByEmail(email) {
    return User.findOne({ where: { email } });
  }

  // Gjej të gjithë me pagination dhe filtering
  async findAll({ page = 1, limit = 10, role, search } = {}) {
    const where = {};
    if (role)   where.role  = role;
    if (search) where.name  = { [Op.like]: `%${search}%` };

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      limit:  parseInt(limit),
      offset,
      order:  [["createdAt", "DESC"]],
    });

    return {
      data: rows,
      pagination: {
        total:      count,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    };
  }

  // Krijo user të ri
  async create({ name, email, password, role = "user" }) {
    return User.create({ name, email, password, role });
  }

  // Përditëso profilin
  async updateProfile(id, { name, email }) {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update({ name, email });
    return user;
  }

  // Ndrysho fjalëkalimin
  async updatePassword(id, hashedPassword) {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update({ password: hashedPassword });
    return user;
  }

  // Ruaj reset token
  async saveResetToken(id, resetToken, resetTokenExpiry) {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update({ resetToken, resetTokenExpiry });
    return user;
  }

  // Gjej me reset token
  async findByResetToken(token) {
    return User.findOne({
      where: {
        resetToken:       token,
        resetTokenExpiry: { [Op.gt]: new Date() }, // token nuk ka skaduar
      },
    });
  }

  // Fshi reset token pas përdorimit
  async clearResetToken(id) {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update({ resetToken: null, resetTokenExpiry: null });
    return user;
  }

  // Fshi user
  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  }

  // Numëro total users
  async count() {
    return User.count();
  }
}

module.exports = new UserRepository();