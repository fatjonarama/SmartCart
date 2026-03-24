const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Order = sequelize.define("Order", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  total_price: { type: DataTypes.DECIMAL(10,2) },
}, { timestamps: true, createdAt: 'created_at', updatedAt: false });

// Association
Order.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Order, { foreignKey: 'user_id' });

module.exports = Order;