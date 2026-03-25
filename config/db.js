const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("smartcart", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});

sequelize
  .authenticate()
  .then(() => console.log("✅ MySQL Connected!"))
  .catch((err) => console.error("❌ MySQL Error:", err));

module.exports = sequelize;