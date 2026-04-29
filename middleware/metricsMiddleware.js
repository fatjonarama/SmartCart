/**
 * SmartCart — Prometheus Metrics Middleware
 */

const client = require("prom-client");

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const orderCounter = new client.Counter({
  name: "smartcart_orders_total",
  help: "Total number of orders created",
  labelNames: ["payment_method"],
  registers: [register],
});

const userRegistrationCounter = new client.Counter({
  name: "smartcart_user_registrations_total",
  help: "Total number of user registrations",
  registers: [register],
});

// Middleware - skipon /metrics route
const metricsMiddleware = (req, res, next) => {
  if (req.path === "/metrics") return next();

  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route    = req.route?.path || req.path || "unknown";
    const labels   = {
      method:      req.method,
      route:       route,
      status_code: res.statusCode,
    };
    httpRequestDuration.observe(labels, duration);
    httpRequestCounter.inc(labels);
  });

  next();
};

// Route handler
const metricsRoute = async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).end(err.message);
  }
};

module.exports = {
  metricsMiddleware,
  metricsRoute,
  orderCounter,
  userRegistrationCounter,
  register,
};