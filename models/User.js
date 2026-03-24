const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "Users", // emri ekzistues i tabelës
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false, field: 'NAME' },
    email: { type: DataTypes.STRING(100), allowNull: false },
    password: { type: DataTypes.STRING(255), allowNull: false, field: 'PASSWORD' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  },
  {
    timestamps: false,
  }
);

module.exports = User;