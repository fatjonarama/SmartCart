require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const path         = require("path");
const morgan       = require("morgan");
const https        = require("https");
const fs           = require("fs");
const swaggerUi    = require("swagger-ui-express");
const swaggerSpec  = require("./config/swagger");
const logger       = require("./config/logger");

// ── MONITORING ────────────────────────────────────
const { metricsMiddleware, metricsRoute } = require("./middleware/metricsMiddleware");

// ── SECURITY ──────────────────────────────────────
const {
  xssProtection,
  apiLimiter,
  authLimiter,
  sqlInjectionProtection,
} = require("./middleware/securityMiddleware");

const app = express();

// ══════════════════════════════════════════════════
// 1. SECURITY HEADERS (Helmet.js)
// ══════════════════════════════════════════════════
app.use((req, res, next) => {
  res.setHeader("X-API-Gateway", "SmartCart-Express-Gateway-v1");
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      scriptSrc:  ["'self'"],
      imgSrc:     ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge:            31536000,
    includeSubDomains: true,
    preload:           true,
  },
  noSniff:        true,
  xssFilter:      true,
  frameguard:     { action: "deny" },
  hidePoweredBy:  true,
}));

// ══════════════════════════════════════════════════
// 2. CORS
// ══════════════════════════════════════════════════
app.use(cors({
  origin:      process.env.ALLOWED_ORIGINS?.split(",") || "*",
  credentials: true,
  methods:     ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ══════════════════════════════════════════════════
// 3. BODY PARSING
// ══════════════════════════════════════════════════
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ══════════════════════════════════════════════════
// 4. INPUT SANITIZATION
// ══════════════════════════════════════════════════
app.use(xssProtection);           // XSS Protection
app.use("/api", sqlInjectionProtection);  // SQL Injection - vetëm API

// ══════════════════════════════════════════════════
// 5. RATE LIMITING
// ══════════════════════════════════════════════════
app.use("/api/", apiLimiter);
app.use("/api/v1/users/login",    authLimiter);
app.use("/api/v1/users/register", authLimiter);

// ══════════════════════════════════════════════════
// 6. STATIC FILES & LOGGING
// ══════════════════════════════════════════════════
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ══════════════════════════════════════════════════
// 7. MONITORING
// ══════════════════════════════════════════════════
// Metrics endpoint
app.get("/metrics", metricsRoute);
app.use(metricsMiddleware);

// Status endpoint i thjeshtë
app.get("/status", (req, res) => {
  const used = process.memoryUsage();
  res.json({
    status:   "UP",
    uptime:   `${Math.floor(process.uptime())}s`,
    memory: {
      heapUsed:  `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    },
    cpu:      process.cpuUsage(),
    pid:      process.pid,
    node:     process.version,
    timestamp: new Date().toISOString(),
  });
});

// ══════════════════════════════════════════════════
// 8. SWAGGER
// ══════════════════════════════════════════════════
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ══════════════════════════════════════════════════
// 9. ROUTES
// ══════════════════════════════════════════════════
app.use("/api/v1/users",    require("./routes/userRoutes"));
app.use("/api/v1/products", require("./routes/productRoutes"));
app.use("/api/v1/orders",   require("./routes/orderRoutes"));
app.use("/api/v1/reviews",  require("./routes/reviewRoutes"));
app.use("/api/v1/stats",    require("./routes/statsRoutes"));

// ══════════════════════════════════════════════════
// 10. HEALTH & METRICS
// ══════════════════════════════════════════════════
app.use("/health", require("./routes/healthRoutes"));

// ══════════════════════════════════════════════════
// 11. STATUS
// ══════════════════════════════════════════════════
app.get("/api/services", (req, res) => res.json({
  status:    "Healthy",
  version:   "v1.0.0",
  timestamp: new Date().toISOString(),
  security: {
    helmet:         true,
    xssProtection:  true,
    sqlProtection:  true,
    rateLimiting:   true,
    https:          process.env.NODE_ENV === "production",
  },
  monitor:   `http://localhost:${process.env.PORT || 5000}/status`,
  metrics:   `http://localhost:${process.env.PORT || 5000}/metrics`,
  health:    `http://localhost:${process.env.PORT || 5000}/health/detail`,
}));

app.get("/", (req, res) => res.json({ message: "SmartCart API running!", status: "Ready" }));

// ══════════════════════════════════════════════════
// 12. ERROR HANDLER
// ══════════════════════════════════════════════════
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.ip}`);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === "production"
      ? "Dicka shkoi keq!"
      : err.message,
  });
});

module.exports = app;

// ══════════════════════════════════════════════════
// 13. START SERVER
// ══════════════════════════════════════════════════
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
  const breaker = new CircuitBreaker(dummyServiceCall, {
    timeout: 3000, errorThresholdPercentage: 50, resetTimeout: 10000
  });
  breaker.fallback(() => ({ status: "Fallback" }));

  async function startServer() {
    try {
      await sequelize.authenticate(); console.log("MySQL Connected!");
      await sequelize.sync();
      await connectMongo();           console.log("MongoDB Connected!");

      try {
        const { connectRedis } = require("./config/redis");
        await connectRedis();         console.log("Redis Connected!");
      } catch { console.log("Redis skip..."); }

      await messageQueue.connectRabbitMQ(); console.log("RabbitMQ Connected!");

      try {
        await consul.agent.service.register({
          name: "smartcart-api", id: serviceId,
          address: "localhost", port: process.env.PORT || 5000,
          check: {
            http:     `http://localhost:${process.env.PORT || 5000}/health/live`,
            interval: "10s", timeout: "5s"
          }
        });
        console.log("Consul Registered!");
      } catch { console.log("Consul skip..."); }

      const PORT = process.env.PORT || 5000;

      // ── HTTPS në production ────────────────────
      if (process.env.NODE_ENV === "production" &&
          fs.existsSync("./certs/server.key") &&
          fs.existsSync("./certs/server.cert")) {
        const httpsOptions = {
          key:  fs.readFileSync("./certs/server.key"),
          cert: fs.readFileSync("./certs/server.cert"),
        };
        https.createServer(httpsOptions, app).listen(443, () => {
          console.log("HTTPS Server running on port 443");
        });
        // Redirect HTTP → HTTPS
        express().use((req, res) => {
          res.redirect(`https://${req.headers.host}${req.url}`);
        }).listen(80, () => console.log("HTTP redirect running on port 80"));
      } else {
        // HTTP në development
        app.listen(PORT, () => {
          console.log(`\nServer running on port ${PORT}`);
          console.log(`Metrics:        http://localhost:${PORT}/metrics`);
          console.log(`Health:         http://localhost:${PORT}/health/detail`);
          console.log(`Status Monitor: http://localhost:${PORT}/status`);
          console.log(`Swagger:        http://localhost:${PORT}/api-docs`);
          console.log(`Security:       XSS + SQL + NoSQL + HPP + RateLimit + Helmet`);
        });
      }

      startGrpcServer();
    } catch (error) {
      console.error("Server start error:", error.message);
      process.exit(1);
    }
  }

  startServer();
}