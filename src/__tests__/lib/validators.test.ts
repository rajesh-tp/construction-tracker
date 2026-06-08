import {
  contractorSchema,
  transactionSchema,
  loginSchema,
  constructionSchema,
  userManageSchema,
  accountBalanceSchema,
  profileSchema,
  workerSchema,
  attendanceSchema,
  bulkAttendanceSchema,
  wagePaymentSchema,
  ATTENDANCE_UNITS,
  CONTRACTOR_TYPES,
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
} from "@/lib/validators";

describe("Validator Constants", () => {
  test("CONTRACTOR_TYPES contains expected types", () => {
    expect(CONTRACTOR_TYPES).toContain("Building Contractor");
    expect(CONTRACTOR_TYPES).toContain("Electrical Contractor");
    expect(CONTRACTOR_TYPES).toContain("Plumbing Contractor");
    expect(CONTRACTOR_TYPES).toContain("Architect");
    expect(CONTRACTOR_TYPES).toContain("Flooring Contractor");
    expect(CONTRACTOR_TYPES).toContain("Other");
    expect(CONTRACTOR_TYPES.length).toBe(10);
  });

  test("TRANSACTION_CATEGORIES contains expected categories", () => {
    expect(TRANSACTION_CATEGORIES).toContain("Material Purchase");
    expect(TRANSACTION_CATEGORIES).toContain("Labour Payment");
    expect(TRANSACTION_CATEGORIES).toContain("Contractor Payment");
    expect(TRANSACTION_CATEGORIES).toContain("Earth Work");
    expect(TRANSACTION_CATEGORIES).toContain("Miscellaneous");
    expect(TRANSACTION_CATEGORIES.length).toBe(9);
  });

  test("TRANSACTION_TYPES contains expense, payment, adjustment", () => {
    expect(TRANSACTION_TYPES).toEqual(["expense", "payment", "adjustment"]);
  });
});

describe("contractorSchema", () => {
  test("validates valid contractor data", () => {
    const result = contractorSchema.safeParse({
      name: "John Contractor",
      contractorType: "Building Contractor",
      contactPhone: "9876543210",
      contactEmail: "john@example.com",
      initialBalance: 50000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("John Contractor");
      expect(result.data.initialBalance).toBe(50000);
    }
  });

  test("rejects empty name", () => {
    const result = contractorSchema.safeParse({
      name: "",
      contractorType: "Building Contractor",
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid contractor type", () => {
    const result = contractorSchema.safeParse({
      name: "John",
      contractorType: "Invalid Type",
    });
    expect(result.success).toBe(false);
  });

  test("allows optional phone and email", () => {
    const result = contractorSchema.safeParse({
      name: "John",
      contractorType: "Architect",
    });
    expect(result.success).toBe(true);
  });

  test("rejects negative initial balance", () => {
    const result = contractorSchema.safeParse({
      name: "John",
      contractorType: "Other",
      initialBalance: -100,
    });
    expect(result.success).toBe(false);
  });

  test("defaults initial balance to 0", () => {
    const result = contractorSchema.safeParse({
      name: "John",
      contractorType: "Other",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.initialBalance).toBe(0);
    }
  });

  test("validates email format when provided", () => {
    const result = contractorSchema.safeParse({
      name: "John",
      contractorType: "Other",
      contactEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  test("rejects name exceeding 100 characters", () => {
    const result = contractorSchema.safeParse({
      name: "A".repeat(101),
      contractorType: "Other",
    });
    expect(result.success).toBe(false);
  });
});

describe("transactionSchema", () => {
  const validTransaction = {
    accountId: 1,
    date: "2025-01-15",
    description: "Cement purchase",
    amount: 5000,
    type: "expense",
    category: "Material Purchase",
  };

  test("validates valid transaction data", () => {
    const result = transactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(5000);
      expect(result.data.type).toBe("expense");
    }
  });

  test("rejects zero amount", () => {
    const result = transactionSchema.safeParse({ ...validTransaction, amount: 0 });
    expect(result.success).toBe(false);
  });

  test("rejects negative amount", () => {
    const result = transactionSchema.safeParse({ ...validTransaction, amount: -100 });
    expect(result.success).toBe(false);
  });

  test("rejects empty description", () => {
    const result = transactionSchema.safeParse({ ...validTransaction, description: "" });
    expect(result.success).toBe(false);
  });

  test("rejects empty date", () => {
    const result = transactionSchema.safeParse({ ...validTransaction, date: "" });
    expect(result.success).toBe(false);
  });

  test("rejects invalid transaction type", () => {
    const result = transactionSchema.safeParse({ ...validTransaction, type: "refund" });
    expect(result.success).toBe(false);
  });

  test("rejects invalid category", () => {
    const result = transactionSchema.safeParse({ ...validTransaction, category: "Invalid Category" });
    expect(result.success).toBe(false);
  });

  test("accepts all valid transaction types", () => {
    for (const type of TRANSACTION_TYPES) {
      const result = transactionSchema.safeParse({ ...validTransaction, type });
      expect(result.success).toBe(true);
    }
  });

  test("accepts all valid categories", () => {
    for (const category of TRANSACTION_CATEGORIES) {
      const result = transactionSchema.safeParse({ ...validTransaction, category });
      expect(result.success).toBe(true);
    }
  });

  test("coerces string accountId to number", () => {
    const result = transactionSchema.safeParse({ ...validTransaction, accountId: "5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accountId).toBe(5);
    }
  });

  test("coerces string amount to number", () => {
    const result = transactionSchema.safeParse({ ...validTransaction, amount: "1500.50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(1500.5);
    }
  });

  test("rejects description over 200 characters", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      description: "A".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  test("defaults notes to empty string", () => {
    const result = transactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe("");
    }
  });

  test("rejects notes over 500 characters", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      notes: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  test("validates valid login credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });
});

describe("constructionSchema", () => {
  test("validates valid construction data", () => {
    const result = constructionSchema.safeParse({
      name: "Rajesh's Home",
      description: "3BHK construction project",
    });
    expect(result.success).toBe(true);
  });

  test("rejects empty name", () => {
    const result = constructionSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  test("allows optional description", () => {
    const result = constructionSchema.safeParse({ name: "My Home" });
    expect(result.success).toBe(true);
  });

  test("rejects name over 200 characters", () => {
    const result = constructionSchema.safeParse({ name: "A".repeat(201) });
    expect(result.success).toBe(false);
  });

  test("rejects description over 500 characters", () => {
    const result = constructionSchema.safeParse({
      name: "Home",
      description: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("userManageSchema", () => {
  test("validates valid user data", () => {
    const result = userManageSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      role: "owner",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid role", () => {
    const result = userManageSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      role: "admin",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  test("accepts all valid roles", () => {
    for (const role of ["superadmin", "owner", "contractor"]) {
      const result = userManageSchema.safeParse({
        name: "User",
        email: "user@test.com",
        role,
        password: "password123",
      });
      expect(result.success).toBe(true);
    }
  });

  test("rejects password shorter than 6 characters", () => {
    const result = userManageSchema.safeParse({
      name: "User",
      email: "user@test.com",
      role: "owner",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  test("allows empty password (for updates)", () => {
    const result = userManageSchema.safeParse({
      name: "User",
      email: "user@test.com",
      role: "owner",
      password: "",
    });
    expect(result.success).toBe(true);
  });

  test("allows no password field (defaults to empty)", () => {
    const result = userManageSchema.safeParse({
      name: "User",
      email: "user@test.com",
      role: "owner",
    });
    expect(result.success).toBe(true);
  });

  test("rejects empty name", () => {
    const result = userManageSchema.safeParse({
      name: "",
      email: "user@test.com",
      role: "owner",
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid email", () => {
    const result = userManageSchema.safeParse({
      name: "User",
      email: "invalid",
      role: "owner",
    });
    expect(result.success).toBe(false);
  });
});

describe("accountBalanceSchema", () => {
  test("validates valid balance", () => {
    const result = accountBalanceSchema.safeParse({ initialBalance: 500000 });
    expect(result.success).toBe(true);
  });

  test("allows zero balance", () => {
    const result = accountBalanceSchema.safeParse({ initialBalance: 0 });
    expect(result.success).toBe(true);
  });

  test("rejects negative balance", () => {
    const result = accountBalanceSchema.safeParse({ initialBalance: -100 });
    expect(result.success).toBe(false);
  });

  test("coerces string to number", () => {
    const result = accountBalanceSchema.safeParse({ initialBalance: "5000000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.initialBalance).toBe(5000000);
    }
  });
});

describe("profileSchema", () => {
  test("validates valid profile data", () => {
    const result = profileSchema.safeParse({
      name: "Updated Name",
      email: "new@example.com",
    });
    expect(result.success).toBe(true);
  });

  test("validates password change with current password", () => {
    const result = profileSchema.safeParse({
      name: "User",
      email: "user@test.com",
      currentPassword: "oldpass123",
      newPassword: "newpass123",
    });
    expect(result.success).toBe(true);
  });

  test("rejects new password without current password", () => {
    const result = profileSchema.safeParse({
      name: "User",
      email: "user@test.com",
      newPassword: "newpass123",
    });
    expect(result.success).toBe(false);
  });

  test("rejects new password shorter than 6 characters", () => {
    const result = profileSchema.safeParse({
      name: "User",
      email: "user@test.com",
      currentPassword: "oldpass",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty name", () => {
    const result = profileSchema.safeParse({
      name: "",
      email: "user@test.com",
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid email", () => {
    const result = profileSchema.safeParse({
      name: "User",
      email: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("workerSchema", () => {
  const valid = {
    name: "Suresh",
    contractorId: "1",
    dailyWage: "800",
    phone: "",
    notes: "",
  };

  test("accepts valid input", () => {
    const r = workerSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  test("rejects empty name", () => {
    const r = workerSchema.safeParse({ ...valid, name: "" });
    expect(r.success).toBe(false);
  });

  test("rejects negative daily wage", () => {
    const r = workerSchema.safeParse({ ...valid, dailyWage: "-100" });
    expect(r.success).toBe(false);
  });

  test("rejects missing/zero contractorId", () => {
    const r = workerSchema.safeParse({ ...valid, contractorId: "0" });
    expect(r.success).toBe(false);
  });
});

describe("attendanceSchema", () => {
  const valid = {
    workerId: "1",
    date: "2026-04-21",
    units: "1",
    wageSnapshot: "800",
    notes: "",
  };

  test("accepts units = 0, 0.5, 1, 1.5", () => {
    for (const u of ATTENDANCE_UNITS) {
      const r = attendanceSchema.safeParse({ ...valid, units: String(u) });
      expect(r.success).toBe(true);
    }
  });

  test("rejects units = 2", () => {
    const r = attendanceSchema.safeParse({ ...valid, units: "2" });
    expect(r.success).toBe(false);
  });

  test("rejects units = 0.25", () => {
    const r = attendanceSchema.safeParse({ ...valid, units: "0.25" });
    expect(r.success).toBe(false);
  });

  test("rejects empty date", () => {
    const r = attendanceSchema.safeParse({ ...valid, date: "" });
    expect(r.success).toBe(false);
  });

  test("rejects negative wageSnapshot", () => {
    const r = attendanceSchema.safeParse({ ...valid, wageSnapshot: "-1" });
    expect(r.success).toBe(false);
  });
});

describe("bulkAttendanceSchema", () => {
  test("accepts a list of valid entries", () => {
    const r = bulkAttendanceSchema.safeParse({
      date: "2026-04-21",
      contractorId: "1",
      entries: [
        { workerId: 1, units: 1 },
        { workerId: 2, units: 0.5 },
      ],
    });
    expect(r.success).toBe(true);
  });

  test("rejects an entry with invalid units", () => {
    const r = bulkAttendanceSchema.safeParse({
      date: "2026-04-21",
      contractorId: "1",
      entries: [{ workerId: 1, units: 3 }],
    });
    expect(r.success).toBe(false);
  });
});

describe("wagePaymentSchema", () => {
  const valid = {
    contractorId: "1",
    date: "2026-04-21",
    attendanceIds: [1, 2, 3],
    amount: "2000",
    notes: "",
  };

  test("accepts a valid payment with multiple attendance ids", () => {
    const r = wagePaymentSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  test("rejects empty attendance list", () => {
    const r = wagePaymentSchema.safeParse({ ...valid, attendanceIds: [] });
    expect(r.success).toBe(false);
  });

  test("rejects missing contractor", () => {
    const r = wagePaymentSchema.safeParse({ ...valid, contractorId: "0" });
    expect(r.success).toBe(false);
  });

  test("rejects empty date", () => {
    const r = wagePaymentSchema.safeParse({ ...valid, date: "" });
    expect(r.success).toBe(false);
  });

  test("rejects non-positive amount", () => {
    const r1 = wagePaymentSchema.safeParse({ ...valid, amount: "0" });
    const r2 = wagePaymentSchema.safeParse({ ...valid, amount: "-100" });
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });

  test("coerces string amount to number", () => {
    const r = wagePaymentSchema.safeParse({ ...valid, amount: "2500" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.amount).toBe(2500);
  });
});
