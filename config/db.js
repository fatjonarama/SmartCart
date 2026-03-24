const { Sequelize } = require("sequelize");

// lidhja me MySQL
const sequelize = new Sequelize("smartcart", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: console.log, // opsionale: tregon query-t në console
});

sequelize
  .authenticate()
  .then(() => console.log("MySQL Connected"))
  .catch((err) => console.error("Unable to connect to MySQL:", err));

module.exports = sequelize;