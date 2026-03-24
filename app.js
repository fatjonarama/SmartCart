const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);
const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);
// Test route
app.get("/", (req, res) => {
  res.send("SmartCart API is running...");
});

// Database connection
const sequelize = require("./config/db");
require("./models/User");
require("./models/Product");
require("./models/Order");
require("./models/OrderItem");
sequelize.sync({ alter: true });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});