/**
 * Unit Tests — UserService
 * Fix: bcrypt dhe jwt mock si objekte të kontrollueshme
 */

process.env.JWT_SECRET             = "test_secret";
process.env.JWT_REFRESH_SECRET     = "test_refresh_secret";
process.env.JWT_EXPIRES_IN         = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

jest.mock("../models/AuditLog", () => ({ create: jest.fn().mockResolvedValue(true) }));

// ✅ Mock bcrypt si objekt i plotë
const mockBcrypt = {
  hash:    jest.fn().mockResolvedValue("hashed_password"),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue("salt"),
};
jest.mock("bcryptjs", () => mockBcrypt);

// ✅ Mock jsonwebtoken si objekt i plotë
const mockJwt = {
  sign:   jest.fn().mockReturnValue("mock_token"),
  verify: jest.fn().mockReturnValue({ id: 1, role: "user" }),
};
jest.mock("jsonwebtoken", () => mockJwt);

// ✅ Mock UserRepository
const mockUserRepo = {
  findByEmail:             jest.fn(),
  findByEmailWithPassword: jest.fn(),
  findById:                jest.fn(),
  findByIdWithPassword:    jest.fn(),
  create:                  jest.fn(),
  update:                  jest.fn().mockResolvedValue(true),
  updatePassword:          jest.fn().mockResolvedValue(true),
  delete:                  jest.fn().mockResolvedValue(true),
  findAll:                 jest.fn().mockResolvedValue([]),
  count:                   jest.fn().mockResolvedValue(0),
};
jest.mock("../repositories/UserRepository", () => mockUserRepo);

// ✅ Mock emailService
const mockEmail = {
  sendWelcomeEmail:         jest.fn().mockResolvedValue(true),
  sendPasswordChangedEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail:   jest.fn().mockResolvedValue(true),
};
jest.mock("../services/emailService", () => mockEmail);

// ── Import PAS të gjitha mock-eve ─────────────────
const userService = require("../services/UserService");

beforeEach(() => {
  jest.clearAllMocks();
  mockBcrypt.hash.mockResolvedValue("hashed_password");
  mockBcrypt.compare.mockResolvedValue(true);
  mockJwt.sign.mockReturnValue("mock_token");
});

// ══════════════════════════════════════════════════
// 1. REGISTER
// ══════════════════════════════════════════════════
describe("userService.register()", () => {

  test("✅ regjistron user — kthen userId dhe role", async () => {
    mockUserRepo.findByEmail = jest.fn().mockResolvedValue(null);
    mockUserRepo.create      = jest.fn().mockResolvedValue({
      id: 1, name: "Test User", email: "test@test.com", role: "user"
    });

    const result = await userService.register({
      name: "Test User", email: "test@test.com", password: "password123"
    });

    expect(result).toHaveProperty("userId", 1);
    expect(result).toHaveProperty("role", "user");
    expect(mockUserRepo.create).toHaveBeenCalledTimes(1);
    expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 12);
    expect(mockEmail.sendWelcomeEmail).toHaveBeenCalled();
  });

  test("✅ hash-on fjalëkalimin para ruajtjes", async () => {
    mockUserRepo.findByEmail = jest.fn().mockResolvedValue(null);
    mockUserRepo.create      = jest.fn().mockResolvedValue({ id: 2, role: "user" });

    await userService.register({ name: "User2", email: "u2@test.com", password: "pass1234" });

    expect(mockBcrypt.hash).toHaveBeenCalledWith("pass1234", 12);
  });

  test("✅ regjistron me role admin", async () => {
    mockUserRepo.findByEmail = jest.fn().mockResolvedValue(null);
    mockUserRepo.create      = jest.fn().mockResolvedValue({ id: 3, role: "admin" });

    const result = await userService.register({
      name: "Admin", email: "admin@test.com", password: "adminpass123", role: "admin"
    });

    expect(result).toHaveProperty("role", "admin");
  });

  test("❌ email ekziston → error", async () => {
    mockUserRepo.findByEmail = jest.fn().mockResolvedValue({ id: 1, email: "test@test.com" });

    await expect(userService.register({
      name: "Test", email: "test@test.com", password: "password123"
    })).rejects.toThrow("Ky email është regjistruar më parë!");
  });
});

// ══════════════════════════════════════════════════
// 2. LOGIN
// ══════════════════════════════════════════════════
describe("userService.login()", () => {

  test("✅ login i suksesshëm kthen tokens", async () => {
    mockUserRepo.findByEmail = jest.fn().mockResolvedValue({
      id: 1, name: "Test", email: "test@test.com", password: "hashed", role: "user"
    });
    mockBcrypt.compare.mockResolvedValue(true);
    mockJwt.sign
      .mockReturnValueOnce("access_token_123")
      .mockReturnValueOnce("refresh_token_456");

    const result = await userService.login({ email: "test@test.com", password: "pass123" });

    expect(result).toHaveProperty("accessToken", "access_token_123");
    expect(result).toHaveProperty("refreshToken", "refresh_token_456");
    expect(result.user).not.toHaveProperty("password");
  });

  test("✅ login admin kthen role admin", async () => {
    mockUserRepo.findByEmail = jest.fn().mockResolvedValue({
      id: 2, name: "Admin", email: "admin@test.com", password: "hashed", role: "admin"
    });
    mockBcrypt.compare.mockResolvedValue(true);
    mockJwt.sign
      .mockReturnValueOnce("admin_access")
      .mockReturnValueOnce("admin_refresh");

    const result = await userService.login({ email: "admin@test.com", password: "adminpass" });

    expect(result.user.role).toBe("admin");
    expect(result).toHaveProperty("accessToken", "admin_access");
  });

  test("❌ email i gabuar → error", async () => {
    mockUserRepo.findByEmail = jest.fn().mockResolvedValue(null);
    mockBcrypt.compare.mockResolvedValue(false);

    await expect(userService.login({
      email: "wrong@test.com", password: "pass"
    })).rejects.toThrow("Email ose fjalëkalim i gabuar!");
  });

  test("❌ password i gabuar → error", async () => {
    mockUserRepo.findByEmail = jest.fn().mockResolvedValue({
      id: 1, email: "test@test.com", password: "hashed", role: "user"
    });
    mockBcrypt.compare.mockResolvedValue(false);

    await expect(userService.login({
      email: "test@test.com", password: "wrong"
    })).rejects.toThrow("Email ose fjalëkalim i gabuar!");
  });
});

// ══════════════════════════════════════════════════
// 3. GET PROFILE
// ══════════════════════════════════════════════════
describe("userService.getProfile()", () => {

  test("✅ kthen profilin e userit", async () => {
    mockUserRepo.findById = jest.fn().mockResolvedValue({
      id: 1, name: "Test", email: "test@test.com", role: "user"
    });

    const result = await userService.getProfile(1);
    expect(result).toHaveProperty("id", 1);
    expect(result).toHaveProperty("email", "test@test.com");
  });

  test("❌ user nuk ekziston → error", async () => {
    mockUserRepo.findById = jest.fn().mockResolvedValue(null);
    await expect(userService.getProfile(999)).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════
// 4. CHANGE PASSWORD
// ══════════════════════════════════════════════════
describe("userService.changePassword()", () => {

  test("✅ ndryshon fjalëkalimin", async () => {
    mockUserRepo.findByIdWithPassword = jest.fn().mockResolvedValue({
      id: 1, email: "test@test.com", name: "Test", password: "old_hashed"
    });
    mockBcrypt.compare.mockResolvedValue(true);
    mockBcrypt.hash.mockResolvedValue("new_hashed");

    const result = await userService.changePassword(1, {
      currentPassword: "old_pass", newPassword: "new_pass123"
    });

    expect(result).toBe(true);
    expect(mockUserRepo.updatePassword).toHaveBeenCalledWith(1, "new_hashed");
    expect(mockEmail.sendPasswordChangedEmail).toHaveBeenCalled();
  });

  test("❌ fjalëkalimi aktual i gabuar", async () => {
    mockUserRepo.findByIdWithPassword = jest.fn().mockResolvedValue({
      id: 1, password: "hashed"
    });
    mockBcrypt.compare.mockResolvedValue(false);

    await expect(userService.changePassword(1, {
      currentPassword: "wrong", newPassword: "new_pass123"
    })).rejects.toThrow("Fjalëkalimi aktual nuk është i saktë!");
  });

  test("❌ fjalëkalimi i ri shumë i shkurtër", async () => {
    mockUserRepo.findByIdWithPassword = jest.fn().mockResolvedValue({
      id: 1, password: "hashed"
    });
    mockBcrypt.compare.mockResolvedValue(true);

    await expect(userService.changePassword(1, {
      currentPassword: "old", newPassword: "123"
    })).rejects.toThrow("Fjalëkalimi i ri duhet të ketë të paktën 6 karaktere!");
  });

  test("❌ user nuk ekziston", async () => {
    mockUserRepo.findByIdWithPassword = jest.fn().mockResolvedValue(null);

    await expect(userService.changePassword(999, {
      currentPassword: "pass", newPassword: "newpass123"
    })).rejects.toThrow("Përdoruesi nuk u gjet!");
  });
});

// ══════════════════════════════════════════════════
// 5. DELETE USER
// ══════════════════════════════════════════════════
describe("userService.deleteUser()", () => {

  test("✅ fshi user me sukses", async () => {
    mockUserRepo.findByIdWithPassword = jest.fn().mockResolvedValue({
      id: 2, email: "user@test.com"
    });

    const result = await userService.deleteUser(2, 1, "127.0.0.1");
    expect(result).toBe(true);
    expect(mockUserRepo.delete).toHaveBeenCalledWith(2);
  });

  test("❌ user nuk ekziston", async () => {
    mockUserRepo.findByIdWithPassword = jest.fn().mockResolvedValue(null);
    await expect(userService.deleteUser(999, 1, "127.0.0.1")).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════
// 6. GET ALL USERS
// ══════════════════════════════════════════════════
describe("userService.getAllUsers()", () => {

  test("✅ kthen listën e userave", async () => {
    mockUserRepo.findAll = jest.fn().mockResolvedValue([
      { id: 1, name: "User1", role: "user" },
      { id: 2, name: "Admin", role: "admin" },
    ]);
    mockUserRepo.count = jest.fn().mockResolvedValue(2);

    const result = await userService.getAllUsers({});
    expect(result).toBeDefined();
  });

  test("✅ kthen listën bosh", async () => {
    mockUserRepo.findAll = jest.fn().mockResolvedValue([]);
    mockUserRepo.count   = jest.fn().mockResolvedValue(0);

    const result = await userService.getAllUsers({});
    expect(result).toBeDefined();
  });
});