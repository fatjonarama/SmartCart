require("dotenv").config();
const express = require("express");
const Consul = require("consul"); 
const CircuitBreaker = require("opossum"); // SHTUAR: Për Fault Tolerance
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const morgan = require("morgan");
const logger = require("./config/logger");
const { startGrpcServer } = require("./config/grpcServer");

// Importojmë modulet e infrastrukturës
const messageQueue = require("./config/messageQueue");
const { connectRedis } = require("./config/redis"); 
const sequelize    = require("./config/db");
const connectMongo = require("./config/mongodb");

const app = express();
const consul = new Consul(); 

// --- 0. CONSUL REGISTRATION CONFIG ---
const serviceId = 'smartcart-api-' + Math.random().toString(36).substr(2, 9);

const registerInConsul = async () => {
  try {
    await consul.agent.service.register({
      name: 'smartcart-api',
      id: serviceId,
      address: 'localhost',
      port: 5000,
      check: {
        http: 'http://localhost:5000/api/services',
        interval: '10s',
        timeout: '5s'
      }
    });
    console.log('✅ Registered in Consul Service Registry!');
  } catch (err) {
    console.error('❌ Consul Registration Error:', err);
  }
};

// --- 0.1 CIRCUIT BREAKER CONFIG (Pika 2.3) ---
// Funksion i thjeshtë që simulon një thirrje mikroshërbimi
const dummyServiceCall = async () => {
  return new Promise((resolve) => setTimeout(() => resolve("Service Data"), 100));
};

const breakerOptions = {
  timeout: 3000, 
  errorThresholdPercentage: 50, 
  resetTimeout: 10000 
};

const breaker = new CircuitBreaker(dummyServiceCall, breakerOptions);
breaker.fallback(() => ({ status: "Fallback", message: "Shërbimi është i mbingarkuar, duke përdorur të dhëna rezervë." }));

// --- 1. GATEWAY IDENTIFICATION & SECURITY ---
app.use((req, res, next) => {
  res.setHeader("X-API-Gateway", "SmartCart-Express-Gateway-v1");
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));

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

// --- 3. STATIC FILES ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- 4. LOGGING ---
app.use(morgan("combined", {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// --- 5. SWAGGER ---
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- 6. ROUTES ---
const userRoutes     = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes   = require("./routes/orderRoutes");
const reviewRoutes  = require("./routes/reviewRoutes");
const statsRoutes   = require("./routes/statsRoutes");

app.use("/api/v1/users",     userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders",   orderRoutes);
app.use("/api/v1/reviews",  reviewRoutes);
app.use("/api/v1/stats",    statsRoutes);

// --- 7. SERVICE DISCOVERY & REGISTRY ---
app.get("/api/services", async (req, res) => {
  // Përdorim Circuit Breaker këtu për të demonstruar Fault Tolerance
  const serviceStatus = await breaker.fire();
  
  res.json({
    gateway: {
      name: "SmartCart API Gateway",
      technology: "Express.js",
      status: "Healthy",
      managed_features: ["Rate Limiting", "Security Headers", "Log Management", "Service Discovery"]
    },
    registry: [
      { service: "Auth",    endpoint: "/api/v1/users",    status: "UP", protocol: "REST" },
      { service: "Product", endpoint: "/api/v1/products", status: "UP", protocol: "REST + gRPC" },
      { service: "Order",   endpoint: "/api/v1/orders",   status: "UP", protocol: "REST + AMQP" },
      { service: "Review",  endpoint: "/api/v1/reviews",  status: "UP", protocol: "REST" },
      { service: "Stats",   endpoint: "/api/v1/stats",    status: "UP", protocol: "REST" }
    ],
    fault_tolerance: {
      circuit_breaker: breaker.opened ? "OPEN (Active Protection)" : "CLOSED (Normal)",
      last_fallback_data: serviceStatus
    },
    infrastructure: {
      messageBroker: "RabbitMQ (CloudAMQP) - Active",
      caching: "Redis Cloud - Active",
      discovery: "HashiCorp Consul - Active"
    },
    version: "v1.0.0",
    server_time: new Date()
  });
});

app.get("/", (req, res) => {
  res.json({ message: "SmartCart API Gateway is running!", status: "Ready" });
});

// --- 8. ERROR HANDLER ---
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl}`);
  res.status(err.status || 500).json({ message: err.message || "Diçka shkoi keq!" });
});

// --- 9. BOOTSTRAP SYSTEM ---
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log("\n--- Duke inicializuar SmartCart Infrastructure ---");

    await sequelize.authenticate();
    console.log("✅ MySQL: Connected");
    
    await sequelize.sync(); 
    console.log("✅ MySQL: Synchronized (Safe Mode)");

    await connectMongo();
    console.log("✅ MongoDB: Connected (Cloud Atlas)");

    await connectRedis(); 
    console.log("✅ Redis: Connected (Cloud)");

    await messageQueue.connectRabbitMQ();
    console.log("✅ RabbitMQ: Connected (CloudAMQP)");

    await registerInConsul();

    app.listen(PORT, () => {
      console.log(`\n🚀 GATEWAY: http://localhost:${PORT}`);
      console.log(`📚 DOCUMENTATION: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 DISCOVERY: http://localhost:${PORT}/api-services`);
      console.log(`--------------------------------------------------\n`);
    });

    startGrpcServer();

  } catch (error) {
    console.error("❌ Fatal Startup Error:", error.message);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  try {
    await consul.agent.service.deregister(serviceId);
    console.log('Deregistered from Consul. Exiting...');
    process.exit();
  } catch (err) {
    process.exit(1);
  }
});

startServer();