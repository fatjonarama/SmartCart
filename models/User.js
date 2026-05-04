const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "Users",
  {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    name: { 
      type: DataTypes.STRING(255), 
      allowNull: false, 
      field: "NAME" 
    },
    email: { 
      type: DataTypes.STRING(100), 
      allowNull: false, 
      unique: true 
    },
    password: { 
      type: DataTypes.STRING(255), 
      allowNull: false, 
      field: "PASSWORD" 
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
    created_at: { 
      type: DataTypes.DATE, 
      allowNull: false, 
      defaultValue: DataTypes.NOW, 
      field: "created_at" 
    },
    reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "reset_token"
    },
    reset_token_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "reset_token_expiry"
    },
  },
  {
    timestamps: false,
  }
);

// ✅ POLYMORPHISM - override toString()
User.prototype.toString = function() {
  return `User[${this.id}]: ${this.name} (${this.role})`;
};

// ✅ POLYMORPHISM - override toSafeJSON()
User.prototype.toSafeJSON = function() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
  };
};

module.exports = User;