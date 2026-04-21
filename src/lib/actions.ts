"use server";

import { db } from "@/lib/db";
import { users, contractors, accounts, transactions, constructions, userConstructions } from "@/db/schema";
import { contractorSchema, transactionSchema, loginSchema, accountBalanceSchema, profileSchema, constructionSchema, userManageSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { createSession, deleteSession, requireOwner, requireSuperAdmin, getActiveConstructionId, requireConstructionAccess, getSessionPayload } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Record<string, string[] | undefined>;
  timestamp?: number;
};

function parseFormErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// --- Auth Actions ---

export async function login(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please enter valid credentials.",
      errors: parseFormErrors(parsed.error),
      timestamp: Date.now(),
    };
  }

  const passwordHash = hashPassword(parsed.data.password);

  const user = db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .get();

  if (!user || user.passwordHash !== passwordHash) {
    return {
      status: "error",
      message: "Invalid email or password.",
      timestamp: Date.now(),
    };
  }

  // Find user's first accessible construction
  let activeConstructionId: number | null = null;

  if (user.role === "superadmin") {
    // Superadmin gets the first construction
    const first = db.select().from(constructions).limit(1).get();
    activeConstructionId = first?.id ?? null;
  } else if (user.role === "contractor" && user.contractorId) {
    // Contractor: find construction via their linked contractor record
    const contractor = db
      .select()
      .from(contractors)
      .where(eq(contractors.id, user.contractorId))
      .get();
    activeConstructionId = contractor?.constructionId ?? null;
  } else {
    // Owner: find first assigned construction
    const membership = db
      .select()
      .from(userConstructions)
      .where(eq(userConstructions.userId, user.id))
      .limit(1)
      .get();
    activeConstructionId = membership?.constructionId ?? null;
  }

  await createSession({ id: user.id, email: user.email, role: user.role }, activeConstructionId);
  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

// --- Construction Actions ---

export async function createConstruction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireSuperAdmin();

  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
  };

  const parsed = constructionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      errors: parseFormErrors(parsed.error),
      timestamp: Date.now(),
    };
  }

  const construction = db
    .insert(constructions)
    .values({
      name: parsed.data.name,
      description: parsed.data.description || null,
      createdBy: admin.id,
    })
    .returning()
    .get();

  // Auto-create a primary (owner) account for this construction
  db.insert(accounts)
    .values({
      constructionId: construction.id,
      accountName: "Owner Account",
      accountType: "primary",
      initialBalance: 0,
      currentBalance: 0,
    })
    .run();

  revalidatePath("/constructions");

  return {
    status: "success",
    message: `Construction "${parsed.data.name}" created successfully.`,
    timestamp: Date.now(),
  };
}

export async function updateConstruction(
  id: number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();

  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
  };

  const parsed = constructionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      errors: parseFormErrors(parsed.error),
      timestamp: Date.now(),
    };
  }

  db.update(constructions)
    .set({
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .where(eq(constructions.id, id))
    .run();

  revalidatePath("/constructions");
  revalidatePath(`/constructions/${id}`);

  return {
    status: "success",
    message: `Construction "${parsed.data.name}" updated successfully.`,
    timestamp: Date.now(),
  };
}

export async function toggleConstructionActive(id: number, isActive: boolean): Promise<void> {
  await requireSuperAdmin();

  db.update(constructions)
    .set({ isActive })
    .where(eq(constructions.id, id))
    .run();

  revalidatePath("/constructions");
  revalidatePath(`/constructions/${id}`);
}

export async function switchConstruction(constructionId: number): Promise<void> {
  const session = await getSessionPayload();
  if (!session) redirect("/login");

  await requireConstructionAccess(constructionId);

  const user = db.select().from(users).where(eq(users.id, session!.userId)).get();
  if (!user) redirect("/login");

  await createSession({ id: user.id, email: user.email, role: user.role }, constructionId);
  revalidatePath("/");
  redirect("/");
}

export async function assignUserToConstruction(
  userId: number,
  constructionId: number
): Promise<ActionState> {
  await requireSuperAdmin();

  // Check if already assigned
  const existing = db
    .select()
    .from(userConstructions)
    .where(and(eq(userConstructions.userId, userId), eq(userConstructions.constructionId, constructionId)))
    .get();

  if (existing) {
    return { status: "error", message: "User is already assigned to this construction.", timestamp: Date.now() };
  }

  // Check one-owner-per-construction rule
  const userToAssign = db.select().from(users).where(eq(users.id, userId)).get();
  if (userToAssign?.role === "owner") {
    const existingOwner = db
      .select({ userName: users.name })
      .from(userConstructions)
      .innerJoin(users, eq(users.id, userConstructions.userId))
      .where(
        and(
          eq(userConstructions.constructionId, constructionId),
          eq(users.role, "owner")
        )
      )
      .limit(1)
      .get();

    if (existingOwner) {
      return {
        status: "error",
        message: `This construction already has an owner (${existingOwner.userName}). Only one owner is allowed per construction.`,
        timestamp: Date.now(),
      };
    }
  }

  db.insert(userConstructions)
    .values({ userId, constructionId })
    .run();

  revalidatePath(`/constructions/${constructionId}`);

  return { status: "success", message: "User assigned successfully.", timestamp: Date.now() };
}

export async function removeUserFromConstruction(
  userId: number,
  constructionId: number
): Promise<ActionState> {
  await requireSuperAdmin();

  db.delete(userConstructions)
    .where(and(eq(userConstructions.userId, userId), eq(userConstructions.constructionId, constructionId)))
    .run();

  revalidatePath(`/constructions/${constructionId}`);

  return { status: "success", message: "User removed from construction.", timestamp: Date.now() };
}

// --- Contractor Actions ---

export async function createContractor(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const constructionId = await getActiveConstructionId();

  const raw = {
    name: formData.get("name"),
    contractorType: formData.get("contractorType"),
    contactPhone: formData.get("contactPhone"),
    contactEmail: formData.get("contactEmail"),
    initialBalance: formData.get("initialBalance"),
  };

  const parsed = contractorSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      errors: parseFormErrors(parsed.error),
      timestamp: Date.now(),
    };
  }

  const contractor = db
    .insert(contractors)
    .values({
      constructionId,
      name: parsed.data.name,
      contractorType: parsed.data.contractorType,
      contactPhone: parsed.data.contactPhone || null,
      contactEmail: parsed.data.contactEmail || null,
      initialBalance: parsed.data.initialBalance,
    })
    .returning()
    .get();

  // Auto-create a linked account for this contractor
  db.insert(accounts)
    .values({
      constructionId,
      accountName: `${parsed.data.name} Account`,
      accountType: "contractor",
      contractorId: contractor.id,
      initialBalance: parsed.data.initialBalance,
      currentBalance: parsed.data.initialBalance,
    })
    .run();

  revalidatePath("/contractors");
  revalidatePath("/accounts");
  revalidatePath("/");

  return {
    status: "success",
    message: `Contractor "${parsed.data.name}" added successfully.`,
    timestamp: Date.now(),
  };
}

export async function updateContractor(
  id: number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const constructionId = await getActiveConstructionId();

  const raw = {
    name: formData.get("name"),
    contractorType: formData.get("contractorType"),
    contactPhone: formData.get("contactPhone"),
    contactEmail: formData.get("contactEmail"),
    initialBalance: formData.get("initialBalance"),
  };

  const parsed = contractorSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      errors: parseFormErrors(parsed.error),
      timestamp: Date.now(),
    };
  }

  db.update(contractors)
    .set({
      name: parsed.data.name,
      contractorType: parsed.data.contractorType,
      contactPhone: parsed.data.contactPhone || null,
      contactEmail: parsed.data.contactEmail || null,
    })
    .where(and(eq(contractors.id, id), eq(contractors.constructionId, constructionId)))
    .run();

  revalidatePath("/contractors");
  revalidatePath("/");

  return {
    status: "success",
    message: `Contractor "${parsed.data.name}" updated successfully.`,
    timestamp: Date.now(),
  };
}

export async function toggleContractorActive(id: number, isActive: boolean): Promise<void> {
  const constructionId = await getActiveConstructionId();

  db.update(contractors)
    .set({ isActive })
    .where(and(eq(contractors.id, id), eq(contractors.constructionId, constructionId)))
    .run();

  revalidatePath("/contractors");
  revalidatePath("/");
}

// --- Transaction Actions ---

export async function createTransaction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSessionPayload();
  const constructionId = await getActiveConstructionId();

  const raw = {
    accountId: formData.get("accountId"),
    date: formData.get("date"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    category: formData.get("category"),
    notes: formData.get("notes"),
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      errors: parseFormErrors(parsed.error),
      timestamp: Date.now(),
    };
  }

  // Get the account (scoped by constructionId)
  const account = db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, parsed.data.accountId), eq(accounts.constructionId, constructionId)))
    .get();

  if (!account) {
    return {
      status: "error",
      message: "Selected account not found.",
      timestamp: Date.now(),
    };
  }

  // Get receipt filename if uploaded
  const receiptPath = (formData.get("receiptPath") as string) || null;

  // Insert transaction
  db.insert(transactions)
    .values({
      constructionId,
      accountId: parsed.data.accountId,
      contractorId: account.contractorId,
      date: parsed.data.date,
      description: parsed.data.description,
      amount: parsed.data.amount,
      type: parsed.data.type,
      category: parsed.data.category,
      notes: parsed.data.notes || null,
      receiptPath,
      createdBy: session?.userId ?? null,
    })
    .run();

  // Update account balance
  const balanceChange = parsed.data.type === "payment"
    ? parsed.data.amount
    : parsed.data.type === "expense"
      ? -parsed.data.amount
      : 0; // adjustment doesn't auto-change balance

  if (balanceChange !== 0) {
    db.update(accounts)
      .set({
        currentBalance: account.currentBalance + balanceChange,
      })
      .where(eq(accounts.id, parsed.data.accountId))
      .run();
  }

  // Double-entry: if paying a contractor, create a mirror expense on owner's account
  if (parsed.data.type === "payment" && account.accountType === "contractor") {
    const primaryAccount = db
      .select()
      .from(accounts)
      .where(and(eq(accounts.accountType, "primary"), eq(accounts.constructionId, constructionId)))
      .get();

    if (primaryAccount) {
      // Create mirror expense transaction on owner's account
      db.insert(transactions)
        .values({
          constructionId,
          accountId: primaryAccount.id,
          contractorId: account.contractorId,
          date: parsed.data.date,
          description: `Payment to ${account.accountName.replace(" Account", "")}`,
          amount: parsed.data.amount,
          type: "expense",
          category: parsed.data.category,
          notes: parsed.data.notes || null,
        })
        .run();

      // Deduct from owner's balance
      db.update(accounts)
        .set({ currentBalance: primaryAccount.currentBalance - parsed.data.amount })
        .where(eq(accounts.id, primaryAccount.id))
        .run();
      revalidatePath(`/accounts/${primaryAccount.id}`);
    }
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/accounts/${parsed.data.accountId}`);

  return {
    status: "success",
    message: "Transaction added successfully.",
    timestamp: Date.now(),
  };
}

// --- Account Actions ---

export async function updateAccountBalance(
  id: number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireOwner();
  const constructionId = await getActiveConstructionId();

  const raw = { initialBalance: formData.get("initialBalance") };
  const parsed = accountBalanceSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Validation failed.",
      errors: parseFormErrors(parsed.error),
      timestamp: Date.now(),
    };
  }

  const account = db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.constructionId, constructionId)))
    .get();

  if (!account) {
    return { status: "error", message: "Account not found.", timestamp: Date.now() };
  }

  // Recalculate current balance: newInitial + (currentBalance - oldInitial)
  const balanceDiff = account.currentBalance - account.initialBalance;
  const newCurrentBalance = parsed.data.initialBalance + balanceDiff;

  db.update(accounts)
    .set({
      initialBalance: parsed.data.initialBalance,
      currentBalance: newCurrentBalance,
    })
    .where(eq(accounts.id, id))
    .run();

  revalidatePath(`/accounts/${id}`);
  revalidatePath("/accounts");
  revalidatePath("/");

  return {
    status: "success",
    message: "Initial balance updated successfully.",
    timestamp: Date.now(),
  };
}

// --- Profile Actions ---

export async function updateProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const owner = await requireOwner();

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      errors: parseFormErrors(parsed.error),
      timestamp: Date.now(),
    };
  }

  // Check if email is taken by another user
  if (parsed.data.email !== owner.email) {
    const existing = db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .get();
    if (existing) {
      return {
        status: "error",
        message: "This email is already in use.",
        errors: { email: ["This email is already in use."] },
        timestamp: Date.now(),
      };
    }
  }

  // If changing password, verify current password
  if (parsed.data.newPassword) {
    const currentHash = hashPassword(parsed.data.currentPassword!);
    if (currentHash !== owner.passwordHash) {
      return {
        status: "error",
        message: "Current password is incorrect.",
        errors: { currentPassword: ["Current password is incorrect."] },
        timestamp: Date.now(),
      };
    }
  }

  const updateData: { name: string; email: string; passwordHash?: string } = {
    name: parsed.data.name,
    email: parsed.data.email,
  };

  if (parsed.data.newPassword) {
    updateData.passwordHash = hashPassword(parsed.data.newPassword);
  }

  db.update(users)
    .set(updateData)
    .where(eq(users.id, owner.id))
    .run();

  // Refresh session with updated email, preserve activeConstructionId
  const session = await getSessionPayload();
  await createSession(
    { id: owner.id, email: parsed.data.email, role: owner.role },
    session?.activeConstructionId ?? null
  );

  revalidatePath("/settings");
  revalidatePath("/");

  return {
    status: "success",
    message: "Profile updated successfully.",
    timestamp: Date.now(),
  };
}

export async function deleteTransaction(id: number): Promise<ActionState> {
  await requireSuperAdmin();
  const constructionId = await getActiveConstructionId();

  const txn = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.constructionId, constructionId)))
    .get();

  if (!txn) {
    return { status: "error", message: "Transaction not found.", timestamp: Date.now() };
  }

  const account = db
    .select()
    .from(accounts)
    .where(eq(accounts.id, txn.accountId))
    .get();

  // Double-entry reversal: if this was a payment to a contractor, remove mirror too
  if (txn.type === "payment" && account && account.accountType === "contractor") {
    const primaryAccount = db
      .select()
      .from(accounts)
      .where(and(eq(accounts.accountType, "primary"), eq(accounts.constructionId, constructionId)))
      .get();

    if (primaryAccount) {
      // Delete the mirror expense transaction on owner's account
      const mirrorTxn = db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.accountId, primaryAccount.id),
            eq(transactions.type, "expense"),
            eq(transactions.amount, txn.amount),
            eq(transactions.date, txn.date),
            eq(transactions.contractorId, txn.contractorId!)
          )
        )
        .get();

      if (mirrorTxn) {
        db.delete(transactions).where(eq(transactions.id, mirrorTxn.id)).run();
      }

      // Recalculate owner's balance from remaining transactions
      recalculateAccountBalance(primaryAccount.id);
      revalidatePath(`/accounts/${primaryAccount.id}`);
    }
  }

  // Delete the transaction
  db.delete(transactions).where(eq(transactions.id, id)).run();

  // Recalculate the account balance from remaining transactions
  if (account) {
    recalculateAccountBalance(account.id);
  }

  revalidatePath("/");
  revalidatePath("/transactions");

  return { status: "success", message: "Transaction deleted.", timestamp: Date.now() };
}

function recalculateAccountBalance(accountId: number) {
  const account = db.select().from(accounts).where(eq(accounts.id, accountId)).get();
  if (!account) return;

  const result = db
    .select({
      totalPayments: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'payment' THEN ${transactions.amount} ELSE 0 END), 0)`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.accountId, accountId))
    .get();

  const newBalance = account.initialBalance + (result?.totalPayments ?? 0) - (result?.totalExpenses ?? 0);

  db.update(accounts)
    .set({ currentBalance: newBalance })
    .where(eq(accounts.id, accountId))
    .run();
}

// --- User Management Actions (Superadmin only) ---

export async function createUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  };

  const parsed = userManageSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      errors: parseFormErrors(parsed.error),
      timestamp: Date.now(),
    };
  }

  if (!parsed.data.password) {
    return {
      status: "error",
      message: "Password is required for new users.",
      errors: { password: ["Password is required."] },
      timestamp: Date.now(),
    };
  }

  // Check if email already exists
  const existing = db.select().from(users).where(eq(users.email, parsed.data.email)).get();
  if (existing) {
    return {
      status: "error",
      message: "This email is already in use.",
      errors: { email: ["This email is already in use."] },
      timestamp: Date.now(),
    };
  }

  const contractorIdStr = formData.get("contractorId") as string;
  const contractorId = contractorIdStr ? Number(contractorIdStr) : null;

  db.insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: hashPassword(parsed.data.password),
      contractorId: parsed.data.role === "contractor" ? contractorId : null,
    })
    .run();

  // If contractor role with a linked contractor, auto-assign to that contractor's construction
  if (parsed.data.role === "contractor" && contractorId) {
    const contractor = db.select().from(contractors).where(eq(contractors.id, contractorId)).get();
    if (contractor) {
      const newUser = db.select().from(users).where(eq(users.email, parsed.data.email)).get();
      if (newUser) {
        db.insert(userConstructions)
          .values({ userId: newUser.id, constructionId: contractor.constructionId })
          .run();
      }
    }
  }

  revalidatePath("/users");

  return {
    status: "success",
    message: `User "${parsed.data.name}" created successfully.`,
    timestamp: Date.now(),
  };
}

export async function updateUser(
  id: number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  };

  const parsed = userManageSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      errors: parseFormErrors(parsed.error),
      timestamp: Date.now(),
    };
  }

  const user = db.select().from(users).where(eq(users.id, id)).get();
  if (!user) {
    return { status: "error", message: "User not found.", timestamp: Date.now() };
  }

  // Check if email is taken by another user
  if (parsed.data.email !== user.email) {
    const existing = db.select().from(users).where(eq(users.email, parsed.data.email)).get();
    if (existing) {
      return {
        status: "error",
        message: "This email is already in use.",
        errors: { email: ["This email is already in use."] },
        timestamp: Date.now(),
      };
    }
  }

  const contractorIdStr = formData.get("contractorId") as string;
  const contractorId = contractorIdStr ? Number(contractorIdStr) : null;

  const updateData: {
    name: string;
    email: string;
    role: "superadmin" | "owner" | "contractor";
    passwordHash?: string;
    contractorId: number | null;
  } = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    contractorId: parsed.data.role === "contractor" ? contractorId : null,
  };

  if (parsed.data.password) {
    updateData.passwordHash = hashPassword(parsed.data.password);
  }

  db.update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .run();

  revalidatePath("/users");
  revalidatePath(`/users/${id}`);

  return {
    status: "success",
    message: `User "${parsed.data.name}" updated successfully.`,
    timestamp: Date.now(),
  };
}

// --- Edit Transaction ---

export async function updateTransaction(
  id: number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireOwner();
  const constructionId = await getActiveConstructionId();

  const txn = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.constructionId, constructionId)))
    .get();

  if (!txn) {
    return { status: "error", message: "Transaction not found.", timestamp: Date.now() };
  }

  const raw = {
    accountId: formData.get("accountId"),
    date: formData.get("date"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    category: formData.get("category"),
    notes: formData.get("notes"),
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      errors: parseFormErrors(parsed.error),
      timestamp: Date.now(),
    };
  }

  const receiptPath = (formData.get("receiptPath") as string) || null;

  // Update the transaction record
  db.update(transactions)
    .set({
      date: parsed.data.date,
      description: parsed.data.description,
      amount: parsed.data.amount,
      type: parsed.data.type,
      category: parsed.data.category,
      notes: parsed.data.notes || null,
      receiptPath,
    })
    .where(eq(transactions.id, id))
    .run();

  // Recalculate the account balance
  recalculateAccountBalance(txn.accountId);

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/accounts/${txn.accountId}`);

  return {
    status: "success",
    message: "Transaction updated successfully.",
    timestamp: Date.now(),
  };
}

// --- Delete Construction ---

export async function deleteConstruction(id: number): Promise<ActionState> {
  await requireSuperAdmin();

  const construction = db.select().from(constructions).where(eq(constructions.id, id)).get();
  if (!construction) {
    return { status: "error", message: "Construction not found.", timestamp: Date.now() };
  }

  // Check if there are any transactions
  const txnCount = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(eq(transactions.constructionId, id))
    .get();

  if (txnCount && txnCount.count > 0) {
    return {
      status: "error",
      message: `Cannot delete: this construction has ${txnCount.count} transaction(s). Delete all transactions first.`,
      timestamp: Date.now(),
    };
  }

  // Delete in order: accounts, contractors, user_constructions, then construction
  db.delete(accounts).where(eq(accounts.constructionId, id)).run();
  db.delete(contractors).where(eq(contractors.constructionId, id)).run();
  db.delete(userConstructions).where(eq(userConstructions.constructionId, id)).run();
  db.delete(constructions).where(eq(constructions.id, id)).run();

  revalidatePath("/constructions");

  return {
    status: "success",
    message: `Construction "${construction.name}" deleted.`,
    timestamp: Date.now(),
  };
}

// --- Delete User ---

export async function deleteUser(id: number): Promise<ActionState> {
  await requireSuperAdmin();

  const user = db.select().from(users).where(eq(users.id, id)).get();
  if (!user) {
    return { status: "error", message: "User not found.", timestamp: Date.now() };
  }

  // Don't allow deleting yourself
  const session = await getSessionPayload();
  if (session?.userId === id) {
    return { status: "error", message: "You cannot delete your own account.", timestamp: Date.now() };
  }

  // Remove from construction assignments
  db.delete(userConstructions).where(eq(userConstructions.userId, id)).run();
  // Delete user
  db.delete(users).where(eq(users.id, id)).run();

  revalidatePath("/users");

  return {
    status: "success",
    message: `User "${user.name}" deleted.`,
    timestamp: Date.now(),
  };
}

// ── Delete Contractor ───────────────────────────────────────────────

export async function deleteContractor(id: number): Promise<ActionState> {
  await requireSuperAdmin();

  const contractor = db.select().from(contractors).where(eq(contractors.id, id)).get();
  if (!contractor) {
    return { status: "error", message: "Contractor not found.", timestamp: Date.now() };
  }

  // Check if there are any transactions linked to this contractor
  const txnCount = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(eq(transactions.contractorId, id))
    .get();

  if (txnCount && txnCount.count > 0) {
    return {
      status: "error",
      message: `Cannot delete: this contractor has ${txnCount.count} transaction(s). Delete all transactions first.`,
      timestamp: Date.now(),
    };
  }

  // Unlink any user tied to this contractor (must be before contractor delete due to FK)
  db.update(users).set({ contractorId: null }).where(eq(users.contractorId, id)).run();
  // Delete contractor's accounts, then the contractor
  db.delete(accounts).where(eq(accounts.contractorId, id)).run();
  db.delete(contractors).where(eq(contractors.id, id)).run();

  revalidatePath("/contractors");

  return {
    status: "success",
    message: `Contractor "${contractor.name}" deleted.`,
    timestamp: Date.now(),
  };
}
