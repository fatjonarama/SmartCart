/**
 * SmartCart — Security Middleware
 * - XSS Protection (manual)
 * - SQL Injection Protection
 * - Rate Limiting
 * - Output Encoding
 * Shënim: express-mongo-sanitize dhe hpp hequr pasi nuk janë kompatibël me Express 5
 */

const rateLimit = require("express-rate-limit");

// ── 1. XSS Protection (manual - pa xss-clean) ─────
const xssProtection = (req, res, next) => {
  const sanitize = (value) => {
    if (typeof value !== "string") return value;
    return value
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  };

  const sanitizeObj = (obj) => {
    if (typeof obj === "string") return sanitize(obj);
    if (typeof obj !== "object" || obj === null) return obj;
    for (const key in obj) {
      obj[key] = sanitizeObj(obj[key]);
    }
    return obj;
  };

  if (req.body)   req.body   = sanitizeObj(req.body);
  if (req.query)  req.query  = sanitizeObj(req.query);
  if (req.params) req.params = sanitizeObj(req.params);

  next();
};

// ── 2. Rate Limiters ──────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { message: "Shumë kërkesa! Provo përsëri pas 15 minutave." },
  standardHeaders: true,
  legacyHeaders:   false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { message: "Shumë tentativa login! Provo përsëri pas 15 minutave." },
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,
});

// ── 3. SQL Injection Detection ─────────────────────
const sqlInjectionProtection = (req, res, next) => {
  const sqlPattern = /(\b(DROP\s+TABLE|EXEC\s*\(|UNION\s+SELECT|INSERT\s+INTO|DELETE\s+FROM|ALTER\s+TABLE)\b)|(--\s|;\s*DROP|\/\*[\s\S]*?\*\/)/gi;

  const checkValue = (value) => {
    if (typeof value === "string") {
      sqlPattern.lastIndex = 0;
      return sqlPattern.test(value);
    }
    return false;
  };

  const checkObject = (obj) => {
    if (!obj || typeof obj !== "object") return false;
    for (const key in obj) {
      if (checkValue(obj[key]) || checkValue(key)) return true;
      if (typeof obj[key] === "object" && checkObject(obj[key])) return true;
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    console.warn(`⚠️ SQL Injection attempt from ${req.ip}: ${req.originalUrl}`);
    return res.status(400).json({ message: "Kërkesë e pavlefshme!" });
  }

  next();
};

// ── 4. Output Encoding ─────────────────────────────
const sanitizeOutput = (data) => {
  if (typeof data === "string") {
    return data
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }
  if (typeof data === "object" && data !== null) {
    return Object.keys(data).reduce((acc, key) => {
      acc[key] = sanitizeOutput(data[key]);
      return acc;
    }, Array.isArray(data) ? [] : {});
  }
  return data;
};

module.exports = {
  xssProtection,
  apiLimiter,
  authLimiter,
  sanitizeOutput,
  sqlInjectionProtection,
};