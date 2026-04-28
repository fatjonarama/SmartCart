const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const AuditLog = sequelize.define("AuditLog", {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:    { type: DataTypes.INTEGER, allowNull: true },
  action:     { type: DataTypes.STRING(50), allowNull: false },
  details:    { type: DataTypes.TEXT, allowNull: true },
  ip_address: { type: DataTypes.STRING(50), allowNull: true },
}, {
  timestamps: true,
  tableName: "audit_logs",
});

AuditLog.belongsTo(User, { foreignKey: "user_id", onDelete: "SET NULL" });

module.exports = AuditLog;