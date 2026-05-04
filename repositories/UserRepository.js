const User = require("../models/User");
const { Op } = require("sequelize");

class UserRepository {

  async findById(id) {
    return User.findByPk(id, { attributes: { exclude: ["password"] } });
  }

  async findByIdWithPassword(id) {
    return User.findByPk(id);
  }

  async findByEmail(email) {
    return User.findOne({ where: { email } });
  }

  async findAll({ page = 1, limit = 10, role, search } = {}) {
    const where = {};
    if (role)   where.role = role;
    if (search) where.name = { [Op.like]: `%${search}%` };

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      limit:  parseInt(limit),
      offset,
      order:  [["created_at", "DESC"]],
    });

    return {
      users: rows,
      pagination: {
        total:      count,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    };
  }

  async create({ name, email, password, role = "user" }) {
    return User.create({ name, email, password, role });
  }

  async updateProfile(id, { name, email }) {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update({ name, email });
    return user;
  }

  async updatePassword(id, hashedPassword) {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update({ password: hashedPassword });
    return user;
  }

  // ── Reset Token (kolona: reset_token, reset_token_expiry) ──
  async saveResetToken(id, token, expiry) {
    await User.update(
      { reset_token: token, reset_token_expiry: expiry },
      { where: { id } }
    );
  }

  async findByResetToken(token) {
    return User.findOne({
      where: {
        reset_token:        token,
        reset_token_expiry: { [Op.gt]: new Date() },
      },
    });
  }

  async clearResetToken(id) {
    await User.update(
      { reset_token: null, reset_token_expiry: null },
      { where: { id } }
    );
  }

  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  }

  async count() {
    return User.count();
  }
}

module.exports = new UserRepository();