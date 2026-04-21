/**
 * Unit tests for server actions.
 * These tests mock the database and auth modules to test action logic in isolation.
 */

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock next/headers
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock sonner
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Mock the database - define inline in jest.mock to avoid hoisting issues
jest.mock("@/lib/db", () => {
  const obj: Record<string, unknown> = {};
  const chainMethods = ["select", "from", "where", "orderBy", "limit", "offset", "insert", "values", "returning", "update", "set", "delete", "leftJoin", "innerJoin", "groupBy"];
  for (const method of chainMethods) {
    obj[method] = jest.fn(() => obj);
  }
  obj.get = jest.fn();
  obj.all = jest.fn().mockReturnValue([]);
  obj.run = jest.fn();
  return { db: obj };
});

// Get reference to the mocked db for use in tests
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { db: mockDb } = require("@/lib/db") as { db: Record<string, jest.Mock> };

jest.mock("@/db/schema", () => ({
  users: { id: "id", email: "email", name: "name", role: "role", passwordHash: "password_hash", contractorId: "contractor_id" },
  contractors: { id: "id", name: "name", constructionId: "construction_id", isActive: "is_active" },
  accounts: { id: "id", accountType: "account_type", constructionId: "construction_id", contractorId: "contractor_id", currentBalance: "current_balance", initialBalance: "initial_balance" },
  transactions: { id: "id", constructionId: "construction_id", accountId: "account_id", contractorId: "contractor_id", type: "type", amount: "amount", date: "date" },
  constructions: { id: "id", name: "name" },
  userConstructions: { userId: "user_id", constructionId: "construction_id" },
}));

// Mock auth module - all values inline to avoid hoisting issues
jest.mock("@/lib/auth", () => ({
  requireOwner: jest.fn().mockResolvedValue({ id: 1, email: "admin@example.com", role: "superadmin", name: "Admin" }),
  requireSuperAdmin: jest.fn().mockResolvedValue({ id: 1, email: "admin@example.com", role: "superadmin", name: "Admin" }),
  requireAuth: jest.fn().mockResolvedValue({ id: 1, email: "admin@example.com", role: "superadmin", name: "Admin" }),
  getActiveConstructionId: jest.fn().mockResolvedValue(1),
  getSessionPayload: jest.fn().mockResolvedValue({
    userId: 1,
    email: "admin@example.com",
    role: "superadmin",
    activeConstructionId: 1,
    exp: Date.now() + 86400000,
  }),
  createSession: jest.fn(),
  deleteSession: jest.fn(),
  requireConstructionAccess: jest.fn(),
}));

// Import after mocks
import {
  login,
  logout,
  createContractor,
  updateContractor,
  toggleContractorActive,
  createTransaction,
  deleteTransaction,
  updateAccountBalance,
  createConstruction,
  updateConstruction,
  toggleConstructionActive,
  switchConstruction,
  assignUserToConstruction,
  removeUserFromConstruction,
  createUser,
  updateUser,
  deleteConstruction,
  deleteUser,
  updateTransaction,
  updateProfile,
} from "@/lib/actions";

const { redirect } = require("next/navigation") as { redirect: jest.Mock };
const { createSession, deleteSession, requireOwner } = require("@/lib/auth") as {
  createSession: jest.Mock;
  deleteSession: jest.Mock;
  requireOwner: jest.Mock;
};

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value);
  }
  return fd;
}

const initialState = { status: "idle" as const, message: "" };

const chainMethods = ["select", "from", "where", "orderBy", "limit", "offset", "insert", "values", "returning", "update", "set", "delete", "leftJoin", "innerJoin", "groupBy"];

function resetMockDb() {
  jest.clearAllMocks();
  // Re-establish chain: each chain method returns mockDb so chaining works
  for (const method of chainMethods) {
    (mockDb[method] as jest.Mock).mockReturnValue(mockDb);
  }
  // Terminal methods return sensible defaults
  (mockDb.all as jest.Mock).mockReturnValue([]);
}

describe("createContractor", () => {
  beforeEach(() => resetMockDb());

  test("returns validation error for empty name", async () => {
    const formData = makeFormData({
      name: "",
      contractorType: "Building Contractor",
      initialBalance: "0",
    });
    const result = await createContractor(initialState, formData);
    expect(result.status).toBe("error");
    expect(result.errors?.name).toBeDefined();
  });

  test("returns validation error for invalid contractor type", async () => {
    const formData = makeFormData({
      name: "John",
      contractorType: "Invalid",
      initialBalance: "0",
    });
    const result = await createContractor(initialState, formData);
    expect(result.status).toBe("error");
  });

  test("creates contractor and account on valid data", async () => {
    mockDb.get.mockReturnValueOnce({ id: 10, name: "John" }); // contractor insert returning
    const formData = makeFormData({
      name: "John Builder",
      contractorType: "Building Contractor",
      contactPhone: "9876543210",
      contactEmail: "john@example.com",
      initialBalance: "50000",
    });
    const result = await createContractor(initialState, formData);
    expect(result.status).toBe("success");
    expect(result.message).toContain("John Builder");
    expect(mockDb.insert).toHaveBeenCalled();
  });
});

describe("createTransaction", () => {
  beforeEach(() => resetMockDb());

  test("returns validation error for missing fields", async () => {
    const formData = makeFormData({
      accountId: "",
      date: "",
      description: "",
      amount: "0",
      type: "",
      category: "",
    });
    const result = await createTransaction(initialState, formData);
    expect(result.status).toBe("error");
  });

  test("returns error when account not found", async () => {
    mockDb.get.mockReturnValueOnce(undefined); // account lookup
    const formData = makeFormData({
      accountId: "999",
      date: "2025-01-15",
      description: "Test expense",
      amount: "5000",
      type: "expense",
      category: "Material Purchase",
      notes: "",
    });
    const result = await createTransaction(initialState, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("account not found");
  });

  test("creates transaction on valid data", async () => {
    mockDb.get.mockReturnValueOnce({
      id: 1,
      accountType: "contractor",
      contractorId: 1,
      constructionId: 1,
      currentBalance: 50000,
    }); // account lookup
    const formData = makeFormData({
      accountId: "1",
      date: "2025-01-15",
      description: "Cement bags",
      amount: "5000",
      type: "expense",
      category: "Material Purchase",
      notes: "",
    });
    const result = await createTransaction(initialState, formData);
    expect(result.status).toBe("success");
    expect(result.message).toContain("added successfully");
  });

  test("creates mirror transaction for contractor payment", async () => {
    // Account lookup returns contractor account
    mockDb.get.mockReturnValueOnce({
      id: 2,
      accountType: "contractor",
      accountName: "Builder Account",
      contractorId: 1,
      constructionId: 1,
      currentBalance: 50000,
    });
    // Primary account lookup for double-entry
    mockDb.get.mockReturnValueOnce({
      id: 1,
      accountType: "primary",
      constructionId: 1,
      currentBalance: 5000000,
    });

    const formData = makeFormData({
      accountId: "2",
      date: "2025-01-15",
      description: "Payment to builder",
      amount: "100000",
      type: "payment",
      category: "Contractor Payment",
      notes: "",
    });
    const result = await createTransaction(initialState, formData);
    expect(result.status).toBe("success");
    // Should have called insert twice (original + mirror)
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
  });
});

describe("deleteTransaction", () => {
  beforeEach(() => resetMockDb());

  test("returns error when transaction not found", async () => {
    mockDb.get.mockReturnValueOnce(undefined);
    const result = await deleteTransaction(999);
    expect(result.status).toBe("error");
    expect(result.message).toContain("not found");
  });

  test("deletes transaction and recalculates balance", async () => {
    // Transaction lookup
    mockDb.get.mockReturnValueOnce({
      id: 1,
      type: "expense",
      amount: 5000,
      accountId: 1,
      contractorId: null,
      date: "2025-01-15",
      constructionId: 1,
    });
    // Account lookup
    mockDb.get.mockReturnValueOnce({
      id: 1,
      accountType: "primary",
      constructionId: 1,
      initialBalance: 5000000,
      currentBalance: 4995000,
    });
    // recalculateAccountBalance: account lookup
    mockDb.get.mockReturnValueOnce({
      id: 1,
      initialBalance: 5000000,
    });
    // recalculateAccountBalance: sum query
    mockDb.get.mockReturnValueOnce({
      totalPayments: 0,
      totalExpenses: 0,
    });

    const result = await deleteTransaction(1);
    expect(result.status).toBe("success");
    expect(mockDb.delete).toHaveBeenCalled();
  });
});

describe("updateAccountBalance", () => {
  beforeEach(() => resetMockDb());

  test("returns validation error for negative balance", async () => {
    const formData = makeFormData({ initialBalance: "-100" });
    const result = await updateAccountBalance(1, initialState, formData);
    expect(result.status).toBe("error");
  });

  test("returns error when account not found", async () => {
    mockDb.get.mockReturnValueOnce(undefined);
    const formData = makeFormData({ initialBalance: "5000000" });
    const result = await updateAccountBalance(1, initialState, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("not found");
  });

  test("updates balance correctly", async () => {
    mockDb.get.mockReturnValueOnce({
      id: 1,
      initialBalance: 1000000,
      currentBalance: 900000,
      constructionId: 1,
    });
    const formData = makeFormData({ initialBalance: "5000000" });
    const result = await updateAccountBalance(1, initialState, formData);
    expect(result.status).toBe("success");
    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe("createConstruction", () => {
  beforeEach(() => resetMockDb());

  test("returns validation error for empty name", async () => {
    const formData = makeFormData({ name: "", description: "" });
    const result = await createConstruction(initialState, formData);
    expect(result.status).toBe("error");
    expect(result.errors?.name).toBeDefined();
  });

  test("creates construction with primary account on valid data", async () => {
    mockDb.get.mockReturnValueOnce({ id: 5, name: "New Home" }); // construction insert returning
    const formData = makeFormData({
      name: "My New Home",
      description: "3BHK project",
    });
    const result = await createConstruction(initialState, formData);
    expect(result.status).toBe("success");
    expect(result.message).toContain("My New Home");
    // Should insert construction and primary account
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
  });
});

describe("createUser", () => {
  beforeEach(() => resetMockDb());

  test("returns validation error for missing password", async () => {
    const formData = makeFormData({
      name: "New User",
      email: "new@test.com",
      role: "owner",
      password: "",
    });
    const result = await createUser(initialState, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("Password is required");
  });

  test("returns error when email already exists", async () => {
    mockDb.get.mockReturnValueOnce({ id: 2, email: "existing@test.com" }); // existing user check
    const formData = makeFormData({
      name: "New User",
      email: "existing@test.com",
      role: "owner",
      password: "password123",
    });
    const result = await createUser(initialState, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("email is already in use");
  });

  test("creates user on valid data", async () => {
    mockDb.get.mockReturnValueOnce(undefined); // no existing user
    const formData = makeFormData({
      name: "Test User",
      email: "test@example.com",
      role: "owner",
      password: "password123",
    });
    const result = await createUser(initialState, formData);
    expect(result.status).toBe("success");
    expect(result.message).toContain("Test User");
  });
});

describe("updateUser", () => {
  beforeEach(() => resetMockDb());

  test("returns error when user not found", async () => {
    mockDb.get.mockReturnValueOnce(undefined);
    const formData = makeFormData({
      name: "Updated",
      email: "updated@test.com",
      role: "owner",
      password: "",
    });
    const result = await updateUser(999, initialState, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("not found");
  });

  test("updates user on valid data", async () => {
    mockDb.get.mockReturnValueOnce({
      id: 2,
      email: "old@test.com",
      name: "Old Name",
    });
    const formData = makeFormData({
      name: "Updated Name",
      email: "old@test.com",
      role: "owner",
      password: "",
    });
    const result = await updateUser(2, initialState, formData);
    expect(result.status).toBe("success");
    expect(result.message).toContain("Updated Name");
  });

  test("rejects duplicate email on update", async () => {
    mockDb.get
      .mockReturnValueOnce({ id: 2, email: "old@test.com" }) // user being updated
      .mockReturnValueOnce({ id: 3, email: "taken@test.com" }); // existing user with same email
    const formData = makeFormData({
      name: "User",
      email: "taken@test.com",
      role: "owner",
      password: "",
    });
    const result = await updateUser(2, initialState, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("email is already in use");
  });
});

describe("deleteConstruction", () => {
  beforeEach(() => resetMockDb());

  test("returns error when construction not found", async () => {
    mockDb.get.mockReturnValueOnce(undefined);
    const result = await deleteConstruction(999);
    expect(result.status).toBe("error");
    expect(result.message).toContain("not found");
  });

  test("returns error when construction has transactions", async () => {
    mockDb.get
      .mockReturnValueOnce({ id: 1, name: "Test" }) // construction
      .mockReturnValueOnce({ count: 5 }); // transaction count
    const result = await deleteConstruction(1);
    expect(result.status).toBe("error");
    expect(result.message).toContain("5 transaction(s)");
  });

  test("deletes construction with no transactions", async () => {
    mockDb.get
      .mockReturnValueOnce({ id: 1, name: "Empty Project" }) // construction
      .mockReturnValueOnce({ count: 0 }); // no transactions
    const result = await deleteConstruction(1);
    expect(result.status).toBe("success");
    expect(result.message).toContain("Empty Project");
    // Should delete accounts, contractors, user_constructions, and construction
    expect(mockDb.delete).toHaveBeenCalledTimes(4);
  });
});

describe("deleteUser", () => {
  beforeEach(() => resetMockDb());

  test("returns error when user not found", async () => {
    mockDb.get.mockReturnValueOnce(undefined);
    const result = await deleteUser(999);
    expect(result.status).toBe("error");
    expect(result.message).toContain("not found");
  });

  test("prevents self-deletion", async () => {
    mockDb.get.mockReturnValueOnce({ id: 1, name: "Admin" }); // user found (same as session userId)
    const result = await deleteUser(1);
    expect(result.status).toBe("error");
    expect(result.message).toContain("cannot delete your own");
  });

  test("deletes other user successfully", async () => {
    mockDb.get.mockReturnValueOnce({ id: 5, name: "Other User" });
    const result = await deleteUser(5);
    expect(result.status).toBe("success");
    expect(result.message).toContain("Other User");
    // Should delete user_constructions and user
    expect(mockDb.delete).toHaveBeenCalledTimes(2);
  });
});

describe("updateTransaction", () => {
  beforeEach(() => resetMockDb());

  test("returns error when transaction not found", async () => {
    mockDb.get.mockReturnValueOnce(undefined);
    const formData = makeFormData({
      accountId: "1",
      date: "2025-01-15",
      description: "Updated",
      amount: "5000",
      type: "expense",
      category: "Material Purchase",
      notes: "",
    });
    const result = await updateTransaction(999, initialState, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("not found");
  });

  test("updates transaction on valid data", async () => {
    // Transaction lookup
    mockDb.get.mockReturnValueOnce({
      id: 1,
      accountId: 1,
      constructionId: 1,
    });
    // recalculateAccountBalance: account lookup
    mockDb.get.mockReturnValueOnce({ id: 1, initialBalance: 5000000 });
    // recalculateAccountBalance: sum query
    mockDb.get.mockReturnValueOnce({ totalPayments: 100000, totalExpenses: 50000 });

    const formData = makeFormData({
      accountId: "1",
      date: "2025-01-20",
      description: "Updated description",
      amount: "7500",
      type: "expense",
      category: "Material Purchase",
      notes: "",
    });
    const result = await updateTransaction(1, initialState, formData);
    expect(result.status).toBe("success");
    expect(result.message).toContain("updated successfully");
  });
});

// --- login ---
describe("login", () => {
  beforeEach(() => resetMockDb());

  test("returns validation error for invalid email", async () => {
    const formData = makeFormData({ email: "bad", password: "pass123" });
    const result = await login(initialState, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("valid credentials");
  });

  test("returns error for wrong password", async () => {
    mockDb.get.mockReturnValueOnce({
      id: 1,
      email: "admin@test.com",
      passwordHash: "wrong_hash",
      role: "superadmin",
    });
    const formData = makeFormData({ email: "admin@test.com", password: "password123" });
    const result = await login(initialState, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("Invalid email or password");
  });

  test("returns error when user not found", async () => {
    mockDb.get.mockReturnValueOnce(undefined);
    const formData = makeFormData({ email: "nobody@test.com", password: "password123" });
    const result = await login(initialState, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("Invalid email or password");
  });

  test("logs in superadmin and redirects", async () => {
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update("password123").digest("hex");
    // User lookup
    mockDb.get.mockReturnValueOnce({
      id: 1,
      email: "admin@test.com",
      passwordHash: hash,
      role: "superadmin",
    });
    // First construction lookup for superadmin
    mockDb.get.mockReturnValueOnce({ id: 1 });

    const formData = makeFormData({ email: "admin@test.com", password: "password123" });
    await expect(login(initialState, formData)).rejects.toThrow("REDIRECT:/");
    expect(createSession).toHaveBeenCalledWith(
      { id: 1, email: "admin@test.com", role: "superadmin" },
      1
    );
  });

  test("logs in owner and finds construction via membership", async () => {
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update("pass123").digest("hex");
    // User lookup
    mockDb.get.mockReturnValueOnce({
      id: 2,
      email: "owner@test.com",
      passwordHash: hash,
      role: "owner",
      contractorId: null,
    });
    // Membership lookup
    mockDb.get.mockReturnValueOnce({ constructionId: 3 });

    const formData = makeFormData({ email: "owner@test.com", password: "pass123" });
    await expect(login(initialState, formData)).rejects.toThrow("REDIRECT:/");
    expect(createSession).toHaveBeenCalledWith(
      { id: 2, email: "owner@test.com", role: "owner" },
      3
    );
  });

  test("logs in contractor and finds construction via contractor record", async () => {
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update("pass123").digest("hex");
    // User lookup
    mockDb.get.mockReturnValueOnce({
      id: 3,
      email: "contractor@test.com",
      passwordHash: hash,
      role: "contractor",
      contractorId: 10,
    });
    // Contractor lookup
    mockDb.get.mockReturnValueOnce({ id: 10, constructionId: 2 });

    const formData = makeFormData({ email: "contractor@test.com", password: "pass123" });
    await expect(login(initialState, formData)).rejects.toThrow("REDIRECT:/");
    expect(createSession).toHaveBeenCalledWith(
      { id: 3, email: "contractor@test.com", role: "contractor" },
      2
    );
  });
});

// --- logout ---
describe("logout", () => {
  beforeEach(() => resetMockDb());

  test("deletes session and redirects to login", async () => {
    await expect(logout()).rejects.toThrow("REDIRECT:/login");
    expect(deleteSession).toHaveBeenCalled();
  });
});

// --- updateConstruction ---
describe("updateConstruction", () => {
  beforeEach(() => resetMockDb());

  test("returns validation error for empty name", async () => {
    const formData = makeFormData({ name: "", description: "" });
    const result = await updateConstruction(1, initialState, formData);
    expect(result.status).toBe("error");
    expect(result.errors?.name).toBeDefined();
  });

  test("updates construction on valid data", async () => {
    const formData = makeFormData({ name: "Updated Home", description: "New desc" });
    const result = await updateConstruction(1, initialState, formData);
    expect(result.status).toBe("success");
    expect(result.message).toContain("Updated Home");
    expect(mockDb.update).toHaveBeenCalled();
  });
});

// --- toggleConstructionActive ---
describe("toggleConstructionActive", () => {
  beforeEach(() => resetMockDb());

  test("toggles construction active status", async () => {
    await toggleConstructionActive(1, false);
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalled();
  });
});

// --- switchConstruction ---
describe("switchConstruction", () => {
  beforeEach(() => resetMockDb());

  test("switches construction and redirects", async () => {
    // User lookup
    mockDb.get.mockReturnValueOnce({ id: 1, email: "admin@test.com", role: "superadmin" });
    await expect(switchConstruction(2)).rejects.toThrow("REDIRECT:/");
    expect(createSession).toHaveBeenCalled();
  });

  test("redirects to login when no session", async () => {
    const { getSessionPayload } = require("@/lib/auth") as { getSessionPayload: jest.Mock };
    getSessionPayload.mockResolvedValueOnce(null);
    await expect(switchConstruction(1)).rejects.toThrow("REDIRECT:/login");
  });
});

// --- assignUserToConstruction ---
describe("assignUserToConstruction", () => {
  beforeEach(() => resetMockDb());

  test("returns error when already assigned", async () => {
    mockDb.get.mockReturnValueOnce({ userId: 1, constructionId: 1 });
    const result = await assignUserToConstruction(1, 1);
    expect(result.status).toBe("error");
    expect(result.message).toContain("already assigned");
  });

  test("assigns non-owner user successfully", async () => {
    mockDb.get
      .mockReturnValueOnce(undefined) // not yet assigned
      .mockReturnValueOnce({ id: 2, role: "contractor" }); // user lookup — not an owner
    const result = await assignUserToConstruction(2, 1);
    expect(result.status).toBe("success");
    expect(mockDb.insert).toHaveBeenCalled();
  });

  test("assigns owner when no existing owner", async () => {
    mockDb.get
      .mockReturnValueOnce(undefined) // not yet assigned
      .mockReturnValueOnce({ id: 3, role: "owner" }) // user lookup — is an owner
      .mockReturnValueOnce(undefined); // no existing owner on this construction
    const result = await assignUserToConstruction(3, 1);
    expect(result.status).toBe("success");
    expect(mockDb.insert).toHaveBeenCalled();
  });

  test("rejects second owner on same construction", async () => {
    mockDb.get
      .mockReturnValueOnce(undefined) // not yet assigned
      .mockReturnValueOnce({ id: 4, role: "owner" }) // user lookup — is an owner
      .mockReturnValueOnce({ userName: "Existing Owner" }); // existing owner found
    const result = await assignUserToConstruction(4, 1);
    expect(result.status).toBe("error");
    expect(result.message).toContain("already has an owner");
    expect(result.message).toContain("Existing Owner");
  });
});

// --- removeUserFromConstruction ---
describe("removeUserFromConstruction", () => {
  beforeEach(() => resetMockDb());

  test("removes user from construction", async () => {
    const result = await removeUserFromConstruction(2, 1);
    expect(result.status).toBe("success");
    expect(result.message).toContain("removed");
    expect(mockDb.delete).toHaveBeenCalled();
  });
});

// --- updateContractor ---
describe("updateContractor", () => {
  beforeEach(() => resetMockDb());

  test("returns validation error for empty name", async () => {
    const formData = makeFormData({
      name: "",
      contractorType: "Building Contractor",
      initialBalance: "0",
    });
    const result = await updateContractor(1, initialState, formData);
    expect(result.status).toBe("error");
    expect(result.errors?.name).toBeDefined();
  });

  test("updates contractor on valid data", async () => {
    const formData = makeFormData({
      name: "Updated Builder",
      contractorType: "Building Contractor",
      contactPhone: "9999999999",
      contactEmail: "builder@test.com",
      initialBalance: "50000",
    });
    const result = await updateContractor(1, initialState, formData);
    expect(result.status).toBe("success");
    expect(result.message).toContain("Updated Builder");
    expect(mockDb.update).toHaveBeenCalled();
  });
});

// --- toggleContractorActive ---
describe("toggleContractorActive", () => {
  beforeEach(() => resetMockDb());

  test("toggles contractor active status", async () => {
    await toggleContractorActive(1, false);
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalled();
  });
});

// --- updateProfile ---
describe("updateProfile", () => {
  beforeEach(() => resetMockDb());

  test("returns validation error for empty name", async () => {
    const formData = makeFormData({
      name: "",
      email: "test@test.com",
      currentPassword: "",
      newPassword: "",
    });
    const result = await updateProfile(initialState, formData);
    expect(result.status).toBe("error");
  });

  test("updates profile without password change", async () => {
    requireOwner.mockResolvedValueOnce({
      id: 1,
      email: "admin@test.com",
      role: "superadmin",
      name: "Admin",
      passwordHash: "somehash",
    });
    const formData = makeFormData({
      name: "New Name",
      email: "admin@test.com",
      currentPassword: "",
      newPassword: "",
    });
    const result = await updateProfile(initialState, formData);
    expect(result.status).toBe("success");
    expect(result.message).toContain("Profile updated");
    expect(mockDb.update).toHaveBeenCalled();
  });

  test("rejects duplicate email", async () => {
    requireOwner.mockResolvedValueOnce({
      id: 1,
      email: "admin@test.com",
      role: "superadmin",
      name: "Admin",
    });
    // Existing user with same email
    mockDb.get.mockReturnValueOnce({ id: 2, email: "taken@test.com" });
    const formData = makeFormData({
      name: "Admin",
      email: "taken@test.com",
      currentPassword: "",
      newPassword: "",
    });
    const result = await updateProfile(initialState, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("email is already in use");
  });

  test("rejects wrong current password when changing password", async () => {
    requireOwner.mockResolvedValueOnce({
      id: 1,
      email: "admin@test.com",
      role: "superadmin",
      name: "Admin",
      passwordHash: "correct_hash",
    });
    const formData = makeFormData({
      name: "Admin",
      email: "admin@test.com",
      currentPassword: "wrongpass",
      newPassword: "newpass123",
    });
    const result = await updateProfile(initialState, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("Current password is incorrect");
  });

  test("updates password when current password is correct", async () => {
    const crypto = require("crypto");
    const currentHash = crypto.createHash("sha256").update("oldpass123").digest("hex");
    requireOwner.mockResolvedValueOnce({
      id: 1,
      email: "admin@test.com",
      role: "superadmin",
      name: "Admin",
      passwordHash: currentHash,
    });
    const formData = makeFormData({
      name: "Admin",
      email: "admin@test.com",
      currentPassword: "oldpass123",
      newPassword: "newpass123",
    });
    const result = await updateProfile(initialState, formData);
    expect(result.status).toBe("success");
    expect(mockDb.update).toHaveBeenCalled();
    expect(createSession).toHaveBeenCalled();
  });
});

// --- deleteTransaction double-entry ---
describe("deleteTransaction double-entry", () => {
  beforeEach(() => resetMockDb());

  test("deletes mirror transaction when deleting contractor payment", async () => {
    // Transaction lookup: a payment on contractor account
    mockDb.get.mockReturnValueOnce({
      id: 10,
      type: "payment",
      amount: 50000,
      accountId: 2,
      contractorId: 1,
      date: "2025-01-15",
      constructionId: 1,
    });
    // Account lookup: contractor account
    mockDb.get.mockReturnValueOnce({
      id: 2,
      accountType: "contractor",
      constructionId: 1,
      initialBalance: 0,
      currentBalance: 50000,
    });
    // Primary account lookup
    mockDb.get.mockReturnValueOnce({
      id: 1,
      accountType: "primary",
      constructionId: 1,
      currentBalance: 4950000,
    });
    // Mirror transaction lookup
    mockDb.get.mockReturnValueOnce({
      id: 11,
      accountId: 1,
      type: "expense",
      amount: 50000,
    });
    // recalculateAccountBalance for primary: account lookup
    mockDb.get.mockReturnValueOnce({ id: 1, initialBalance: 5000000 });
    // recalculateAccountBalance for primary: sum
    mockDb.get.mockReturnValueOnce({ totalPayments: 0, totalExpenses: 0 });
    // recalculateAccountBalance for contractor: account lookup
    mockDb.get.mockReturnValueOnce({ id: 2, initialBalance: 0 });
    // recalculateAccountBalance for contractor: sum
    mockDb.get.mockReturnValueOnce({ totalPayments: 0, totalExpenses: 0 });

    const result = await deleteTransaction(10);
    expect(result.status).toBe("success");
    // delete: mirror txn + original txn
    expect(mockDb.delete).toHaveBeenCalledTimes(2);
  });
});

// --- createUser with contractor auto-assign ---
describe("createUser contractor auto-assign", () => {
  beforeEach(() => resetMockDb());

  test("auto-assigns contractor user to construction", async () => {
    mockDb.get
      .mockReturnValueOnce(undefined) // no existing email
      .mockReturnValueOnce({ id: 10, constructionId: 1 }) // contractor lookup
      .mockReturnValueOnce({ id: 5, email: "newcontractor@test.com" }); // new user lookup

    const formData = makeFormData({
      name: "New Contractor",
      email: "newcontractor@test.com",
      role: "contractor",
      password: "password123",
      contractorId: "10",
    });
    const result = await createUser(initialState, formData);
    expect(result.status).toBe("success");
    // insert: user + userConstructions
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
  });
});
