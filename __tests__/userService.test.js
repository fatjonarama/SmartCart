/**
 * Unit Tests — UserService
 */

process.env.JWT_SECRET             = "test_secret";
process.env.JWT_REFRESH_SECRET     = "test_refresh_secret";
process.env.JWT_EXPIRES_IN         = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

jest.mock("../models/AuditLog", () => ({ create: jest.fn().mockResolvedValue(true) }));

const mockBcrypt = {
  hash:    jest.fn().mockResolvedValue("hashed_password"),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue("salt"),
};
jest.mock("bcryptjs", () => mockBcrypt);

const mockJwt = {
  sign:   jest.fn().mockReturnValue("mock_token"),
  verify: jest.fn().mockReturnValue({ id: 1, role: "user" }),
};
jest.mock("jsonwebtoken", () => mockJwt);

const mockUserRepo = {
  findByEmail:             jest.fn(),
  findByEmailWithPassword: jest.fn(),
  findById:                jest.fn(),
  findByIdWithPassword:    jest.fn(),
  create:                  jest.fn(),
  update:                  jest.fn().mockResolvedValue(true),
  updatePassword:          jest.fn().mockResolvedValue(true),
  updateProfile:           jest.fn().mockResolvedValue({ id: 1, name: "Test", email: "test@test.com", role: "user" }),
  delete:                  jest.fn().mockResolvedValue(true),
  findAll:                 jest.fn().mockResolvedValue([]),
  count:                   jest.fn().mockResolvedValue(0),
  saveResetToken:          jest.fn().mockResolvedValue(true),
  findByResetToken:        jest.fn(),
  clearResetToken:         jest.fn().mockResolvedValue(true),
  saveVerificationToken:   jest.fn().mockResolvedValue(true),
  findByVerificationToken: jest.fn(),
  verifyUser:              jest.fn().mockResolvedValue(true),
};
jest.mock("../repositories/UserRepository", () => mockUserRepo);

const mockEmail = {
  sendWelcomeEmail:          jest.fn().mockResolvedValue(true),
  sendPasswordChangedEmail:  jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail:    jest.fn().mockResolvedValue(true),
  sendVerificationEmail:     jest.fn().mockResolvedValue(true),
};
jest.mock("../services/emailService", () => mockEmail);

const userService = require("../services/UserService");

const mockUser = {
  id: 1,
  name: "Test User",
  email: "test@test.com",
  password: "hashed_password",
  role: "user",
  is_verified: 1,
};

const mockAdmin = {
  id: 2,
  name: "Admin User",
  email: "admin@test.com",
  password: "hashed_password",
  role: "admin",
  is_verified: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockBcrypt.hash.mockResolvedValue("hashed_password");
  mockBcrypt.compare.mockResolvedValue(true);
  mockJwt.sign.mockReturnValue("mock_token");
});

// ══════════════════════════════════════════════════
// REGISTER
// ══════════════════════════════════════════════════
describe("userService.register()", () => {
  test("✅ regjistron user — kthen userId dhe role", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue({ id: 1, role: "user" });

    const result = await userService.register(
      { name: "Test", email: "test@test.com", password: "pass123" },
      "127.0.0.1"
    );

    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("role");
    expect(mockUserRepo.saveVerificationToken).toHaveBeenCalled();
    expect(mockEmail.sendVerificationEmail).toHaveBeenCalled();
  });

  test("✅ hedh error nëse email ekziston", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    await expect(
      userService.register({ name: "Test", email: "test@test.com", password: "pass123" }, "127.0.0.1")
    ).rejects.toThrow("Ky email është regjistruar më parë!");
  });

  test("✅ hash-on fjalëkalimin para ruajtjes", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue({ id: 1, role: "user" });

    await userService.register(
      { name: "Test", email: "test@test.com", password: "pass123" },
      "127.0.0.1"
    );

    expect(mockBcrypt.hash).toHaveBeenCalledWith("pass123", 12);
  });

  test("✅ regjistron me role admin", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue({ id: 2, role: "admin" });

    const result = await userService.register(
      { name: "Admin", email: "admin@test.com", password: "pass123", role: "admin" },
      "127.0.0.1"
    );

    expect(result.role).toBe("admin");
  });
});

// ══════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════
describe("userService.login()", () => {
  test("✅ login i suksesshëm kthen tokens", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(true);

    const result = await userService.login(
      { email: "test@test.com", password: "pass123" },
      "127.0.0.1"
    );

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
  });

  test("✅ login admin kthen role admin", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockAdmin);
    mockBcrypt.compare.mockResolvedValue(true);

    const result = await userService.login(
      { email: "admin@test.com", password: "pass123" },
      "127.0.0.1"
    );

    expect(result.user.role).toBe("admin");
  });

  test("✅ hedh error për kredenciale të gabuara", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(false);

    await expect(
      userService.login({ email: "test@test.com", password: "wrong" }, "127.0.0.1")
    ).rejects.toThrow("Email ose fjalëkalim i gabuar!");
  });

  test("✅ hedh error nëse llogaria nuk është verifikuar", async () => {
    const unverifiedUser = { ...mockUser, is_verified: 0 };
    mockUserRepo.findByEmail.mockResolvedValue(unverifiedUser);
    mockBcrypt.compare.mockResolvedValue(true);

    await expect(
      userService.login({ email: "test@test.com", password: "pass123" }, "127.0.0.1")
    ).rejects.toThrow("Llogaria nuk është aktivizuar!");
  });

  test("✅ hedh error nëse user nuk ekziston", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      userService.login({ email: "notfound@test.com", password: "pass123" }, "127.0.0.1")
    ).rejects.toThrow("Email ose fjalëkalim i gabuar!");
  });
});

// ══════════════════════════════════════════════════
// CHANGE PASSWORD
// ══════════════════════════════════════════════════
describe("userService.changePassword()", () => {
  test("✅ ndryshon fjalëkalimin me sukses", async () => {
    mockUserRepo.findByIdWithPassword.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(true);

    const result = await userService.changePassword(
      1,
      { currentPassword: "oldPass", newPassword: "newPass123" },
      "127.0.0.1"
    );

    expect(result).toBe(true);
    expect(mockUserRepo.updatePassword).toHaveBeenCalled();
  });

  test("✅ hedh error për fjalëkalim aktual të gabuar", async () => {
    mockUserRepo.findByIdWithPassword.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(false);

    await expect(
      userService.changePassword(1, { currentPassword: "wrong", newPassword: "newPass123" }, "127.0.0.1")
    ).rejects.toThrow("Fjalëkalimi aktual nuk është i saktë!");
  });
});

// ══════════════════════════════════════════════════
// FORGOT PASSWORD
// ══════════════════════════════════════════════════
describe("userService.forgotPassword()", () => {
  test("✅ dërgon reset email nëse user ekziston", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);

    const result = await userService.forgotPassword("test@test.com", "127.0.0.1");

    expect(result).toBe(true);
    expect(mockUserRepo.saveResetToken).toHaveBeenCalled();
    expect(mockEmail.sendPasswordResetEmail).toHaveBeenCalled();
  });

  test("✅ kthen true edhe nëse email nuk ekziston (siguri)", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    const result = await userService.forgotPassword("notfound@test.com", "127.0.0.1");

    expect(result).toBe(true);
    expect(mockUserRepo.saveResetToken).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════
// VERIFY EMAIL
// ══════════════════════════════════════════════════
describe("userService.verifyEmail()", () => {
  test("✅ verifikon email me token valid", async () => {
    mockUserRepo.findByVerificationToken.mockResolvedValue(mockUser);

    const result = await userService.verifyEmail("valid_token", "127.0.0.1");

    expect(result).toBe(true);
    expect(mockUserRepo.verifyUser).toHaveBeenCalledWith(1);
  });

  test("✅ hedh error për token të pavlefshëm", async () => {
    mockUserRepo.findByVerificationToken.mockResolvedValue(null);

    await expect(
      userService.verifyEmail("invalid_token", "127.0.0.1")
    ).rejects.toThrow("Token i pavlefshëm");
  });
});

// ══════════════════════════════════════════════════
// GET PROFILE
// ══════════════════════════════════════════════════
describe("userService.getProfile()", () => {
  test("✅ kthen profilin e user-it", async () => {
    mockUserRepo.findById.mockResolvedValue(mockUser);

    const result = await userService.getProfile(1);

    expect(result).toHaveProperty("email");
    expect(result.id).toBe(1);
  });

  test("✅ hedh error nëse user nuk ekziston", async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(userService.getProfile(999)).rejects.toThrow("Përdoruesi nuk u gjet!");
  });
});