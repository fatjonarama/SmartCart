/**
 * Unit Tests — authMiddleware
 * Mbulimi: protect, authorizeRoles, verifyRefreshToken
 */

const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ── Helpers ──────────────────────────────────────
const mockReq = (token = null, user = null) => ({
  headers: token ? { authorization: `Bearer ${token}` } : {},
  user,
  ip: "127.0.0.1",
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = "test_secret";
});

// ══════════════════════════════════════════════════
// 1. PROTECT MIDDLEWARE
// ══════════════════════════════════════════════════
describe("protect middleware", () => {

  test("✅ kalon nëse token është valid", async () => {
    const payload = { id: 1, email: "test@test.com", role: "user", name: "Test" };
    jwt.verify = jest.fn().mockReturnValue(payload);

    const req  = mockReq("valid_token");
    const res  = mockRes();

    await protect(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ id: 1, role: "user" });
  });

  test("❌ refuzon nëse nuk ka token", async () => {
    const req = mockReq(null);
    const res = mockRes();

    await protect(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("❌ refuzon nëse token ka skaduar", async () => {
    const error = new Error("Token expired");
    error.name  = "TokenExpiredError";
    jwt.verify  = jest.fn().mockImplementation(() => { throw error; });

    const req = mockReq("expired_token");
    const res = mockRes();

    await protect(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("❌ refuzon nëse token është invalid", async () => {
    const error = new Error("Invalid token");
    error.name  = "JsonWebTokenError";
    jwt.verify  = jest.fn().mockImplementation(() => { throw error; });

    const req = mockReq("invalid_token");
    const res = mockRes();

    await protect(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════
// 2. AUTHORIZE ROLES
// ══════════════════════════════════════════════════
describe("authorizeRoles middleware", () => {

  test("✅ lejon admin të hyjë", () => {
    const req  = mockReq(null, { id: 1, role: "admin" });
    const res  = mockRes();
    const next = jest.fn();

    authorizeRoles("admin")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("❌ bllokon user të thjeshtë nga route admin", () => {
    const req  = mockReq(null, { id: 2, role: "user" });
    const res  = mockRes();
    const next = jest.fn();

    authorizeRoles("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("✅ lejon shumë role njëherësh", () => {
    const req  = mockReq(null, { id: 1, role: "manager" });
    const res  = mockRes();
    const next = jest.fn();

    authorizeRoles("admin", "manager")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("❌ bllokon nëse nuk ka user në request", () => {
    const req  = { headers: {}, ip: "127.0.0.1" };
    const res  = mockRes();
    const next = jest.fn();

    authorizeRoles("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});