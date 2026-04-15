require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const morgan = require("morgan");
const logger = require("./config/logger");

const app = express();

// --- 1. SIGURIA ---
app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Keni bërë shumë kërkesa, provoni përsëri pas 15 minutash!" }
});
app.use("/api/", apiLimiter);

// --- 2. MIDDLEWARES ---
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json());

// --- 3. LOGGING ---
app.use(morgan("combined", {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// --- 4. SWAGGER DOKUMENTACION ---
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- 5. ROUTES me Versioning v1 ---
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const statsRoutes = require("./routes/statsRoutes");

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/stats", statsRoutes);

// --- 6. ROOT ---
app.get("/", (req, res) => {
  res.json({
    message: "SmartCart API is running!",
    version: "v1",
    docs: "http://localhost:5000/api-docs"
  });
});

// --- 7. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method}`);
  res.status(err.status || 500).json({ 
    message: err.message || "Diçka shkoi keq në server!" 
  });
});

// --- 8. DATABASE & SERVER START ---
const sequelize = require("./config/db");
const connectMongo = require("./config/mongodb");
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL Connected!");
    await sequelize.sync({ alter: true });
    await connectMongo();
    console.log("✅ MongoDB Connected!");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("❌ Gabim fatal:", error.message);
    process.exit(1);
  }
}

startServer();