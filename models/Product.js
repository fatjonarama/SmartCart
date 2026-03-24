// models/Product.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Product = sequelize.define(
  "Products", // emri i tabelës si në MySQL
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, field: 'NAME' }, // përshtat me kolonën ekzistuese
    price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    description: { type: DataTypes.TEXT },
  },
  { timestamps: true, createdAt: 'created_at', updatedAt: false }
);

module.exports = Product;