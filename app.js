require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const path        = require("path");
const rateLimit   = require("express-rate-limit");
const swaggerUi   = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const morgan      = require("morgan");
const logger      = require("./config/logger");

const app = express();

// --- 1. SECURITY ---
app.use((req, res, next) => { res.setHeader("X-API-Gateway", "SmartCart-Express-Gateway-v1"); next(); });
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { message: "Keni bërë shumë kërkesa!" } }));

// --- 2. MIDDLEWARES ---
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001"], credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// --- 3. SWAGGER ---
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- 4. ROUTES ---
app.use("/api/v1/users",    require("./routes/userRoutes"));
app.use("/api/v1/products", require("./routes/productRoutes"));
app.use("/api/v1/orders",   require("./routes/orderRoutes"));
app.use("/api/v1/reviews",  require("./routes/reviewRoutes"));
app.use("/api/v1/stats",    require("./routes/statsRoutes"));

// --- 5. HEALTH ---
app.get("/api/services", (req, res) => res.json({ status: "Healthy", version: "v1.0.0" }));
app.get("/", (req, res) => res.json({ message: "SmartCart API running!", status: "Ready" }));

// --- 6. ERROR HANDLER ---
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message}`);
  res.status(err.status || 500).json({ message: err.message || "Diçka shkoi keq!" });
});

// ✅ Export për testing
module.exports = app;

// --- 7. START (vetëm direkt) ---
if (require.main === module) {
  const Consul         = require("consul");
  const CircuitBreaker = require("opossum");
  const { startGrpcServer } = require("./config/grpcServer");
  const messageQueue   = require("./config/messageQueue");
  const sequelize      = require("./config/db");
  const connectMongo   = require("./config/mongodb");

  const consul    = new Consul();
  const serviceId = "smartcart-api-" + Math.random().toString(36).substr(2, 9);

  const dummyServiceCall = async () => new Promise(r => setTimeout(() => r("OK"), 100));
  const breaker = new CircuitBreaker(dummyServiceCall, { timeout: 3000, errorThresholdPercentage: 50, resetTimeout: 10000 });
  breaker.fallback(() => ({ status: "Fallback" }));

  async function startServer() {
    try {
      await sequelize.authenticate(); console.log("✅ MySQL Connected!");
      await sequelize.sync();
      await connectMongo();           console.log("✅ MongoDB Connected!");

      try {
        const { connectRedis } = require("./config/redis");
        await connectRedis();         console.log("✅ Redis Connected!");
      } catch { console.log("⚠️ Redis skip..."); }

      await messageQueue.connectRabbitMQ(); console.log("✅ RabbitMQ Connected!");

      try {
        await consul.agent.service.register({
          name: "smartcart-api", id: serviceId,
          address: "localhost", port: process.env.PORT || 5000,
          check: { http: `http://localhost:${process.env.PORT || 5000}/api/services`, interval: "10s", timeout: "5s" }
        });
        console.log("✅ Consul Registered!");
      } catch { console.log("⚠️ Consul skip..."); }

      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
        console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
        console.log(`🔍 Service Discovery: http://localhost:${PORT}/api/services`);
      });

      startGrpcServer();
    } catch (error) {
      console.error("❌ Fatal Error:", error.message);
      process.exit(1);
    }
  }

  process.on("SIGINT", async () => {
    try { await consul.agent.service.deregister(serviceId); } catch {}
    process.exit();
  });

  startServer();
}