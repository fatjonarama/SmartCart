/**
 * Unit Tests — OrderService & ProductService
 * Eksporti: { productService, orderService } = require("../services/ProductOrderService")
 */

process.env.JWT_SECRET         = "test_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret";

jest.mock("../config/messageQueue", () => ({
  publish: jest.fn(), subscribe: jest.fn(), connectRabbitMQ: jest.fn()
}));
jest.mock("../models/AuditLog", () => ({ create: jest.fn().mockResolvedValue(true) }));
jest.mock("../services/emailService", () => ({
  sendWelcomeEmail: jest.fn(), sendOrderConfirmation: jest.fn(),
  sendPasswordResetEmail: jest.fn(), sendPasswordChangedEmail: jest.fn(),
}));

// ── Mock repositories si instancë ─────────────────
const mockOrderRepo = {
  findById:     jest.fn(),
  create:       jest.fn(),
  createItem:   jest.fn(),
  findByUserId: jest.fn(),
  updateStatus: jest.fn().mockResolvedValue(true),
  delete:       jest.fn().mockResolvedValue(true),
};
jest.mock("../repositories/OrderRepository",   () => mockOrderRepo);

const mockProductRepo = {
  findById:        jest.fn(),
  update:          jest.fn(),
  decrementStock:  jest.fn().mockResolvedValue(true),
  incrementStock:  jest.fn().mockResolvedValue(true),
};
jest.mock("../repositories/ProductRepository", () => mockProductRepo);

const mockUserRepo = {
  findById: jest.fn(), findByEmail: jest.fn(),
  findByEmailWithPassword: jest.fn(), create: jest.fn(),
};
jest.mock("../repositories/UserRepository", () => mockUserRepo);

// Mock models
jest.mock("../models/Order",   () => ({ findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn().mockResolvedValue({ id: 1, status: "pending" }), belongsTo: jest.fn(), hasMany: jest.fn() }));
jest.mock("../models/OrderItem",()=> ({ create: jest.fn().mockResolvedValue({ id:1 }), destroy: jest.fn(), belongsTo: jest.fn(), hasMany: jest.fn() }));
jest.mock("../models/Product", () => ({ findByPk: jest.fn(), findAll: jest.fn(), belongsTo: jest.fn(), hasMany: jest.fn() }));
jest.mock("../models/User",    () => ({ findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), create: jest.fn(), belongsTo: jest.fn(), hasMany: jest.fn() }));
jest.mock("../models/Review",  () => ({ findAll: jest.fn(), create: jest.fn(), belongsTo: jest.fn(), hasMany: jest.fn() }));

const { orderService } = require("../services/ProductOrderService");

beforeEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════════════
// 1. orderService.cancel()
// ══════════════════════════════════════════════════
describe("orderService.cancel()", () => {

  test("✅ anulon porosinë pending me sukses", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 1, user_id: 1, status: "pending", OrderItems: [],
    });
    mockOrderRepo.updateStatus = jest.fn().mockResolvedValue({ id: 1, status: "cancelled" });

    const result = await orderService.cancel(1, 1);
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith(1, "cancelled");
  });

  test("✅ anulon porosinë processing me sukses", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 2, user_id: 1, status: "processing", OrderItems: [],
    });
    mockOrderRepo.updateStatus = jest.fn().mockResolvedValue({ id: 2, status: "cancelled" });

    await orderService.cancel(2, 1);
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith(2, "cancelled");
  });

  test("❌ hedh error nëse porosia nuk ekziston", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue(null);
    await expect(orderService.cancel(999, 1)).rejects.toThrow("Porosia nuk u gjet!");
  });

  test("❌ hedh error nëse user nuk është pronari", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 1, user_id: 999, status: "pending", OrderItems: [],
    });
    await expect(orderService.cancel(1, 1)).rejects.toThrow("Nuk ke leje!");
  });

  test("❌ hedh error nëse statusi është delivered", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 1, user_id: 1, status: "delivered", OrderItems: [],
    });
    await expect(orderService.cancel(1, 1)).rejects.toThrow();
  });

  test("❌ hedh error nëse statusi është cancelled", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 1, user_id: 1, status: "cancelled", OrderItems: [],
    });
    await expect(orderService.cancel(1, 1)).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════
// 2. orderService.requestExchange()
// ══════════════════════════════════════════════════
describe("orderService.requestExchange()", () => {

  test("✅ dërgon kërkesë exchange me sukses", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 1, user_id: 1, status: "delivered", OrderItems: [],
    });
    mockOrderRepo.updateStatus = jest.fn().mockResolvedValue({ id: 1, status: "exchange" });

    await orderService.requestExchange(1, 1, { reason: "color", note: "Dua ngjyrë tjetër" });
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith(1, "exchange", expect.any(String));
  });

  test("❌ hedh error nëse arsyeja mungon", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 1, user_id: 1, status: "delivered", OrderItems: [],
    });
    await expect(orderService.requestExchange(1, 1, { reason: "", note: "" })).rejects.toThrow();
  });

  test("❌ hedh error nëse porosia nuk ekziston", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue(null);
    await expect(orderService.requestExchange(999, 1, { reason: "color" })).rejects.toThrow();
  });

  test("❌ hedh error nëse user nuk është pronari", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 1, user_id: 999, status: "delivered",
    });
    await expect(orderService.requestExchange(1, 1, { reason: "color" })).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════
// 3. orderService.requestReturn()
// ══════════════════════════════════════════════════
describe("orderService.requestReturn()", () => {

  test("✅ dërgon kërkesë return me sukses", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 1, user_id: 1, status: "delivered", OrderItems: [],
    });
    mockOrderRepo.updateStatus = jest.fn().mockResolvedValue({ id: 1, status: "return" });

    await orderService.requestReturn(1, 1, { note: "Produkti është i dëmtuar" });
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith(1, "return", expect.any(String));
  });

  test("❌ hedh error nëse nota mungon", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 1, user_id: 1, status: "delivered",
    });
    await expect(orderService.requestReturn(1, 1, { note: "" })).rejects.toThrow();
  });

  test("❌ hedh error nëse porosia nuk ekziston", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue(null);
    await expect(orderService.requestReturn(999, 1, { note: "defekt" })).rejects.toThrow();
  });

  test("❌ hedh error nëse user nuk është pronari", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 1, user_id: 999, status: "delivered",
    });
    await expect(orderService.requestReturn(1, 1, { note: "defekt" })).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════
// 4. orderService.updateStatus() — admin
// ══════════════════════════════════════════════════
describe("orderService.updateStatus()", () => {

  test("✅ admin ndryshon statusin në delivered", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 1, status: "processing", OrderItems: [],
    });
    mockOrderRepo.updateStatus = jest.fn().mockResolvedValue({ id: 1, status: "delivered" });

    await orderService.updateStatus(1, "delivered");
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith(1, "delivered");
  });

  test("✅ admin ndryshon statusin në shipped", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue({
      id: 1, status: "pending", OrderItems: [],
    });
    mockOrderRepo.updateStatus = jest.fn().mockResolvedValue({ id: 1, status: "shipped" });

    await orderService.updateStatus(1, "shipped");
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith(1, "shipped");
  });

  test("❌ hedh error nëse porosia nuk ekziston", async () => {
    mockOrderRepo.findById = jest.fn().mockResolvedValue(null);
    await expect(orderService.updateStatus(999, "delivered")).rejects.toThrow();
  });
});