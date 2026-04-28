const jwt = require("jsonwebtoken");

// ── Middleware: Verifikon Access Token ──────────
const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      // ✅ Dallo nëse token skadoi apo është i pasaktë
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token skadoi!", expired: true });
      }
      return res.status(401).json({ message: "Token i pasaktë!" });
    }
  }
  if (!token) {
    return res.status(401).json({ message: "Aksesi i mohuar, nuk ka token!" });
  }
};

// ── Middleware: Kontrollon Rolin ────────────────
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Roli '${req.user?.role}' nuk ka leje për këtë veprim!`
      });
    }
    next();
  };
};

// ── Middleware: Verifikon Refresh Token ─────────
const verifyRefreshToken = (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token mungon!" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token skadoi! Logohu përsëri.", sessionExpired: true });
    }
    return res.status(401).json({ message: "Refresh token i pasaktë!" });
  }
};

module.exports = { protect, authorizeRoles, verifyRefreshToken };