/**
 * Integration Tests — Order Routes
 */

process.env.JWT_SECRET         = "test_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
process.env.JWT_EXPIRES_IN     = "15m";

jest.mock("../config/messageQueue", () => ({ publish: jest.fn(), subscribe: jest.fn(), connectRabbitMQ: jest.fn() }));
jest.mock("../config/logger", () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }));
jest.mock("../models/AuditLog", () => ({ create: jest.fn().mockResolvedValue(true), findAll: jest.fn(), belongsTo: jest.fn(), hasMany: jest.fn() }));

const mockProductFindByPk  = jest.fn();
const mockProductDecrement = jest.fn().mockResolvedValue(true);
const mockProductIncrement = jest.fn().mockResolvedValue(true);
const mockOrderCreate      = jest.fn();
const mockOrderFindByPk    = jest.fn();
const mockOrderFindAll     = jest.fn();
const mockItemCreate       = jest.fn();

jest.mock("../models/Product", () => ({
  findByPk:  mockProductFindByPk,
  findAll:   jest.fn(),
  decrement: mockProductDecrement,
  increment: mockProductIncrement,
  update:    jest.fn(),
  belongsTo: jest.fn(), hasMany: jest.fn(),
}));
jest.mock("../models/Order", () => ({
  create: mockOrderCreate, findByPk: mockOrderFindByPk,
  findAll: mockOrderFindAll, belongsTo: jest.fn(), hasMany: jest.fn(),
}));
jest.mock("../models/OrderItem", () => ({
  create: mockItemCreate, destroy: jest.fn(), belongsTo: jest.fn(), hasMany: jest.fn(),
}));
jest.mock("../models/User",     () => ({ findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), create: jest.fn(), belongsTo: jest.fn(), hasMany: jest.fn() }));
jest.mock("../models/Review",   () => ({ findAll: jest.fn(), create: jest.fn(), belongsTo: jest.fn(), hasMany: jest.fn() }));

jest.mock("../repositories/OrderRepository",   () => ({ create: jest.fn(), findById: jest.fn(), updateStatus: jest.fn() }));
jest.mock("../repositories/ProductRepository", () => ({ findById: jest.fn(), incrementStock: jest.fn(), decrementStock: jest.fn() }));
jest.mock("../repositories/UserRepository",    () => ({ findById: jest.fn(), findByEmail: jest.fn(), findByEmailWithPassword: jest.fn(), findByIdWithPassword: jest.fn(), create: jest.fn() }));
jest.mock("../services/emailService",          () => ({ sendWelcomeEmail: jest.fn(), sendOrderConfirmation: jest.fn() }));
jest.mock("bcryptjs",                          () => ({ hash: jest.fn().mockResolvedValue("h"), compare: jest.fn().mockResolvedValue(true) }));

const request = require("supertest");
const express = require("express");
const jwt     = require("jsonwebtoken");

const testApp = express();
testApp.use(express.json());
testApp.use("/", require("../routes/orderRoutes"));

const makeToken = (p) => jwt.sign(p, "test_secret", { expiresIn: "1h" });
const userToken  = makeToken({ id: 1,  email: "user@test.com",  role: "user",  name: "User"  });
const adminToken = makeToken({ id: 99, email: "admin@test.com", role: "admin", name: "Admin" });

const mockProduct = { id: 1, name: "Test Product", price: 14.99, stock: 100, update: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  mockProductFindByPk.mockResolvedValue(mockProduct);
  mockProductDecrement.mockResolvedValue(true);
  mockProductIncrement.mockResolvedValue(true);
  mockOrderCreate.mockResolvedValue({ id: 1, user_id: 1, total_price: 29.99, status: "pending" });
  mockItemCreate.mockResolvedValue({ id: 1 });
  mockOrderFindAll.mockResolvedValue([]);
  mockOrderFindByPk.mockResolvedValue(null);
});

// ══════════════════════════════════════════════════
// 1. POST /
// ══════════════════════════════════════════════════
describe("POST / (create order)", () => {

  test("✅ krijon order cash (201)", async () => {
    const res = await request(testApp)
      .post("/")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ total_price: 29.99, payment_method: "cash", items: [{ product_id: 1, quantity: 2, price: 14.99 }] });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("orderId");
  });

  test("✅ krijon order card (201)", async () => {
    const res = await request(testApp)
      .post("/")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ total_price: 49.99, payment_method: "card", items: [{ product_id: 1, quantity: 1, price: 49.99 }] });
    expect(res.status).toBe(201);
  });

  test("✅ krijon order paypal (201)", async () => {
    const res = await request(testApp)
      .post("/")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ total_price: 99.99, payment_method: "paypal", items: [{ product_id: 1, quantity: 1, price: 99.99 }] });
    expect(res.status).toBe(201);
  });

  test("❌ pa token → 401", async () => {
    const res = await request(testApp)
      .post("/")
      .send({ total_price: 29.99, items: [{ product_id: 1, quantity: 1, price: 29.99 }] });
    expect(res.status).toBe(401);
  });

  test("❌ items bosh → 400", async () => {
    const res = await request(testApp)
      .post("/")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ total_price: 29.99, items: [] });
    expect(res.status).toBe(400);
  });

  test("❌ total_price negativ → 400", async () => {
    const res = await request(testApp)
      .post("/")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ total_price: -5, items: [{ product_id: 1, quantity: 1, price: 5 }] });
    expect(res.status).toBe(400);
  });

  test("❌ payment_method invalid → 400", async () => {
    const res = await request(testApp)
      .post("/")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ total_price: 10, payment_method: "bitcoin", items: [{ product_id: 1, quantity: 1, price: 10 }] });
    expect(res.status).toBe(400);
  });

  test("❌ produkt jashtë stokut → 400", async () => {
    mockProductFindByPk.mockResolvedValue({ ...mockProduct, stock: 1 });
    const res = await request(testApp)
      .post("/")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ total_price: 59.98, payment_method: "cash", items: [{ product_id: 1, quantity: 5, price: 11.99 }] });
    expect(res.status).toBe(400);
  });

  test("❌ produkt i panjohur → 404", async () => {
    mockProductFindByPk.mockResolvedValue(null);
    const res = await request(testApp)
      .post("/")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ total_price: 29.99, payment_method: "cash", items: [{ product_id: 999, quantity: 1, price: 29.99 }] });
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════
// 2. GET /my
// ══════════════════════════════════════════════════
describe("GET /my", () => {

  test("✅ kthen porositë (200)", async () => {
    mockOrderFindAll.mockResolvedValue([
      { id: 1, user_id: 1, total_price: 29.99, status: "pending", OrderItems: [] },
    ]);
    const res = await request(testApp)
      .get("/my")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("✅ kthen array bosh (200)", async () => {
    const res = await request(testApp)
      .get("/my")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("❌ pa token → 401", async () => {
    const res = await request(testApp).get("/my");
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════
// 3. PATCH /:id/cancel
// ══════════════════════════════════════════════════
describe("PATCH /:id/cancel", () => {

  test("✅ anulon pending (200)", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, user_id: 1, status: "pending",
      update: jest.fn().mockResolvedValue(true),
      OrderItems: [],
    });
    const res = await request(testApp)
      .patch("/1/cancel")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });

  test("✅ anulon processing (200)", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 2, user_id: 1, status: "processing",
      update: jest.fn().mockResolvedValue(true),
      OrderItems: [],
    });
    const res = await request(testApp)
      .patch("/2/cancel")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });

  test("❌ porosia e tjetrit → 403", async () => {
    mockOrderFindByPk.mockResolvedValue({ id: 2, user_id: 999, status: "pending", OrderItems: [] });
    const res = await request(testApp)
      .patch("/2/cancel")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test("❌ delivered → 400", async () => {
    mockOrderFindByPk.mockResolvedValue({ id: 3, user_id: 1, status: "delivered", OrderItems: [] });
    const res = await request(testApp)
      .patch("/3/cancel")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(400);
  });

  test("❌ nuk ekziston → 404", async () => {
    const res = await request(testApp)
      .patch("/9999/cancel")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  test("❌ pa token → 401", async () => {
    const res = await request(testApp).patch("/1/cancel");
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════
// 4. GET / (admin)
// ══════════════════════════════════════════════════
describe("GET / (admin)", () => {

  test("✅ admin merr të gjitha (200)", async () => {
    mockOrderFindAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const res = await request(testApp)
      .get("/")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("❌ user → 403", async () => {
    const res = await request(testApp)
      .get("/")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test("❌ pa token → 401", async () => {
    const res = await request(testApp).get("/");
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════
// 5. PUT /:id (admin update status)
// ══════════════════════════════════════════════════
describe("PUT /:id (admin update status)", () => {

  test("✅ ndryshon status → shipped (200)", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, status: "pending",
      update: jest.fn().mockResolvedValue(true),
    });
    const res = await request(testApp)
      .put("/1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "shipped" });
    expect(res.status).toBe(200);
  });

  test("✅ ndryshon status → delivered (200)", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 2, status: "shipped",
      update: jest.fn().mockResolvedValue(true),
    });
    const res = await request(testApp)
      .put("/2")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "delivered" });
    expect(res.status).toBe(200);
  });

  test("❌ status invalid → 400", async () => {
    const res = await request(testApp)
      .put("/1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "flying" });
    expect(res.status).toBe(400);
  });

  test("❌ user → 403", async () => {
    const res = await request(testApp)
      .put("/1")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ status: "shipped" });
    expect(res.status).toBe(403);
  });
});

// ══════════════════════════════════════════════════
// 6. PATCH /:id/return — Return Request
// ══════════════════════════════════════════════════
describe("PATCH /:id/return", () => {

  test("✅ happy path — return request dërgohet (200)", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, user_id: 1, status: "pending",
      update: jest.fn().mockResolvedValue(true)
    });
    const res = await request(testApp)
      .patch("/1/return")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ note: "Produkti është i dëmtuar" });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("✅");
  });

  test("❌ pa note → 400", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, user_id: 1, status: "pending",
      update: jest.fn()
    });
    const res = await request(testApp)
      .patch("/1/return")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ note: "" });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("detyrueshëm");
  });

  test("❌ order nuk ekziston → 404", async () => {
    mockOrderFindByPk.mockResolvedValue(null);
    const res = await request(testApp)
      .patch("/99/return")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ note: "Defekt" });
    expect(res.status).toBe(404);
  });

  test("❌ user tjetër → 403", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, user_id: 999, status: "pending",
      update: jest.fn()
    });
    const res = await request(testApp)
      .patch("/1/return")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ note: "Defekt" });
    expect(res.status).toBe(403);
  });

  test("❌ status cancelled → 400", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, user_id: 1, status: "cancelled",
      update: jest.fn()
    });
    const res = await request(testApp)
      .patch("/1/return")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ note: "Defekt" });
    expect(res.status).toBe(400);
  });

  test("❌ pa token → 401", async () => {
    const res = await request(testApp)
      .patch("/1/return")
      .send({ note: "Defekt" });
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════
// 7. PATCH /:id/exchange — Exchange Request
// ══════════════════════════════════════════════════
describe("PATCH /:id/exchange", () => {

  test("✅ happy path — exchange request (200)", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, user_id: 1, status: "delivered",
      update: jest.fn().mockResolvedValue(true)
    });
    const res = await request(testApp)
      .patch("/1/exchange")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ reason: "size", note: "Madhësia nuk përshtatet" });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("✅");
  });

  test("❌ pa reason → 400", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, user_id: 1, status: "delivered",
      update: jest.fn()
    });
    const res = await request(testApp)
      .patch("/1/exchange")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ reason: "" });
    expect(res.status).toBe(400);
  });

  test("❌ order nuk ekziston → 404", async () => {
    mockOrderFindByPk.mockResolvedValue(null);
    const res = await request(testApp)
      .patch("/99/exchange")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ reason: "color" });
    expect(res.status).toBe(404);
  });

  test("❌ user tjetër → 403", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, user_id: 999, status: "delivered",
      update: jest.fn()
    });
    const res = await request(testApp)
      .patch("/1/exchange")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ reason: "size" });
    expect(res.status).toBe(403);
  });

  test("❌ status cancelled → 400", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, user_id: 1, status: "cancelled",
      update: jest.fn()
    });
    const res = await request(testApp)
      .patch("/1/exchange")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ reason: "size" });
    expect(res.status).toBe(400);
  });

  test("❌ pa token → 401", async () => {
    const res = await request(testApp)
      .patch("/1/exchange")
      .send({ reason: "size" });
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════
// 8. GET /returns/all — Admin sheh returns
// ══════════════════════════════════════════════════
describe("GET /returns/all", () => {

  test("✅ admin sheh listën (200)", async () => {
    mockOrderFindAll.mockResolvedValue([
      { id: 1, status: "return_requested", return_reason: "Defekt", User: { name: "Test" } }
    ]);
    const res = await request(testApp)
      .get("/returns/all")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("✅ listë bosh (200)", async () => {
    mockOrderFindAll.mockResolvedValue([]);
    const res = await request(testApp)
      .get("/returns/all")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("❌ user i zakonshëm → 403", async () => {
    const res = await request(testApp)
      .get("/returns/all")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test("❌ pa token → 401", async () => {
    const res = await request(testApp)
      .get("/returns/all");
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════
// 9. PATCH /returns/:id/resolve — Admin zgjidh
// ══════════════════════════════════════════════════
describe("PATCH /returns/:id/resolve", () => {

  test("✅ approve_refund (200)", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, status: "return_requested",
      update: jest.fn().mockResolvedValue(true)
    });
    const res = await request(testApp)
      .patch("/returns/1/resolve")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "approve_refund", admin_note: "Aprovuar" });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("aprovua");
  });

  test("✅ approve_exchange (200)", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, status: "return_requested",
      update: jest.fn().mockResolvedValue(true)
    });
    const res = await request(testApp)
      .patch("/returns/1/resolve")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "approve_exchange", admin_note: "Exchange OK" });
    expect(res.status).toBe(200);
  });

  test("✅ reject (200)", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, status: "return_requested",
      update: jest.fn().mockResolvedValue(true)
    });
    const res = await request(testApp)
      .patch("/returns/1/resolve")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "reject", admin_note: "Nuk plotëson kushtet" });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("refuzua");
  });

  test("❌ action invalid → 400", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, status: "return_requested",
      update: jest.fn()
    });
    const res = await request(testApp)
      .patch("/returns/1/resolve")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "invalid_action" });
    expect(res.status).toBe(400);
  });

  test("❌ order nuk është return_requested → 400", async () => {
    mockOrderFindByPk.mockResolvedValue({
      id: 1, status: "pending",
      update: jest.fn()
    });
    const res = await request(testApp)
      .patch("/returns/1/resolve")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "approve_refund" });
    expect(res.status).toBe(400);
  });

  test("❌ order nuk ekziston → 404", async () => {
    mockOrderFindByPk.mockResolvedValue(null);
    const res = await request(testApp)
      .patch("/returns/99/resolve")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "approve_refund" });
    expect(res.status).toBe(404);
  });

  test("❌ user i zakonshëm → 403", async () => {
    const res = await request(testApp)
      .patch("/returns/1/resolve")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ action: "approve_refund" });
    expect(res.status).toBe(403);
  });

  test("❌ pa token → 401", async () => {
    const res = await request(testApp)
      .patch("/returns/1/resolve")
      .send({ action: "approve_refund" });
    expect(res.status).toBe(401);
  });
});