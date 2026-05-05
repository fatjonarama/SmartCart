/**
 * SmartCart â€” Security Middleware
 * - XSS Protection (manual)
 * - SQL Injection Protection
 * - Rate Limiting
 * - Output Encoding
 * ShÃ«nim: express-mongo-sanitize dhe hpp hequr pasi nuk janÃ« kompatibÃ«l me Express 5
 */

const rateLimit = require("express-rate-limit");

// â”€â”€ 1. XSS Protection (manual - pa xss-clean) â”€â”€â”€â”€â”€
const xssProtection = (req, res, next) => {
  const sanitize = (value) => {
    if (typeof value !== "string") return value;
    return value
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      // .replace(/'/g, "&#x27;") // HEQUR
      // .replace(/\//g, "&#x2F;") // HEQUR â€” prish email dhe URL paths
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

// â”€â”€ 2. Rate Limiters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { message: "ShumÃ« kÃ«rkesa! Provo pÃ«rsÃ«ri pas 15 minutave." },
  standardHeaders: true,
  legacyHeaders:   false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { message: "ShumÃ« tentativa login! Provo pÃ«rsÃ«ri pas 15 minutave." },
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,
});

// â”€â”€ 3. SQL Injection Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    console.warn(`âš ï¸ SQL Injection attempt from ${req.ip}: ${req.originalUrl}`);
    return res.status(400).json({ message: "KÃ«rkesÃ« e pavlefshme!" });
  }

  next();
};

// â”€â”€ 4. Output Encoding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const sanitizeOutput = (data) => {
  if (typeof data === "string") {
    return data
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      // .replace(/'/g, "&#x27;") // HEQUR;
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
