"use server";

import { db } from "@/lib/db";
import { accounts, constructions, contractors, transactions, users, userConstructions } from "@/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

// --- Construction Queries ---

export async function getAllConstructions() {
  return db.select().from(constructions).orderBy(desc(constructions.createdAt)).all();
}

export async function getConstructionById(id: number) {
  return db.select().from(constructions).where(eq(constructions.id, id)).get();
}

export async function getConstructionOwnerName(constructionId: number): Promise<string | null> {
  const result = db
    .select({ name: users.name })
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
  return result?.name ?? null;
}

export async function getUserConstructions(userId: number) {
  const memberships = db
    .select({ constructionId: userConstructions.constructionId })
    .from(userConstructions)
    .where(eq(userConstructions.userId, userId))
    .all();

  const constructionIds = memberships.map((m) => m.constructionId);
  if (constructionIds.length === 0) return [];

  return db
    .select()
    .from(constructions)
    .where(sql`${constructions.id} IN (${sql.join(constructionIds.map(id => sql`${id}`), sql`, `)})`)
    .orderBy(desc(constructions.createdAt))
    .all();
}

export async function getConstructionUsers(constructionId: number) {
  const memberships = db
    .select({ userId: userConstructions.userId })
    .from(userConstructions)
    .where(eq(userConstructions.constructionId, constructionId))
    .all();

  const userIds = memberships.map((m) => m.userId);
  if (userIds.length === 0) return [];

  return db
    .select()
    .from(users)
    .where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
    .all();
}

// --- Contractor Queries ---

export async function getAllContractors(constructionId: number) {
  return db
    .select()
    .from(contractors)
    .where(eq(contractors.constructionId, constructionId))
    .orderBy(desc(contractors.createdAt))
    .all();
}

export async function getActiveContractors(constructionId: number) {
  return db
    .select()
    .from(contractors)
    .where(and(eq(contractors.constructionId, constructionId), eq(contractors.isActive, true)))
    .orderBy(contractors.name)
    .all();
}

export async function getContractorById(id: number, constructionId: number) {
  return db
    .select()
    .from(contractors)
    .where(and(eq(contractors.id, id), eq(contractors.constructionId, constructionId)))
    .get();
}

// --- Account Queries ---

export async function getAllAccounts(constructionId: number) {
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.constructionId, constructionId))
    .orderBy(accounts.accountName)
    .all();
}

export async function getAccountById(id: number, constructionId: number) {
  return db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.constructionId, constructionId)))
    .get();
}

export async function getAccountByContractorId(contractorId: number, constructionId: number) {
  return db
    .select()
    .from(accounts)
    .where(and(eq(accounts.contractorId, contractorId), eq(accounts.constructionId, constructionId)))
    .get();
}

// --- Transaction Queries ---

export async function getTransactionsByAccountId(accountId: number, constructionId: number) {
  return db
    .select({
      id: transactions.id,
      constructionId: transactions.constructionId,
      accountId: transactions.accountId,
      contractorId: transactions.contractorId,
      date: transactions.date,
      description: transactions.description,
      amount: transactions.amount,
      type: transactions.type,
      category: transactions.category,
      notes: transactions.notes,
      receiptPath: transactions.receiptPath,
      createdBy: transactions.createdBy,
      createdAt: transactions.createdAt,
      createdByName: users.name,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.createdBy, users.id))
    .where(and(eq(transactions.accountId, accountId), eq(transactions.constructionId, constructionId)))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .all();
}

function buildTransactionConditions(
  constructionId: number,
  filters: {
    accountId?: number;
    contractorId?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  const conditions = [eq(transactions.constructionId, constructionId)];
  if (filters.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
  if (filters.contractorId) conditions.push(eq(transactions.contractorId, filters.contractorId));
  if (filters.type) conditions.push(eq(transactions.type, filters.type as "expense" | "payment" | "adjustment"));
  if (filters.dateFrom) conditions.push(gte(transactions.date, filters.dateFrom));
  if (filters.dateTo) conditions.push(lte(transactions.date, filters.dateTo));
  return conditions;
}

export async function getFilteredTransactionCount(
  constructionId: number,
  filters: {
    accountId?: number;
    contractorId?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  const conditions = buildTransactionConditions(constructionId, filters);
  const result = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(and(...conditions))
    .get();
  return result?.count ?? 0;
}

export async function getFilteredTransactions(
  constructionId: number,
  filters: {
    accountId?: number;
    contractorId?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  pagination?: { page: number; pageSize: number }
) {
  const conditions = buildTransactionConditions(constructionId, filters);

  const query = db
    .select({
      id: transactions.id,
      constructionId: transactions.constructionId,
      accountId: transactions.accountId,
      contractorId: transactions.contractorId,
      date: transactions.date,
      description: transactions.description,
      amount: transactions.amount,
      type: transactions.type,
      category: transactions.category,
      notes: transactions.notes,
      receiptPath: transactions.receiptPath,
      createdBy: transactions.createdBy,
      createdAt: transactions.createdAt,
      createdByName: users.name,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));

  if (pagination) {
    return query
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize)
      .all();
  }

  return query.all();
}

export async function getMonthlyExpenses(constructionId: number) {
  return db
    .select({
      month: sql<string>`substr(${transactions.date}, 1, 7)`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
      totalPayments: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'payment' THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.constructionId, constructionId))
    .groupBy(sql`substr(${transactions.date}, 1, 7)`)
    .orderBy(sql`substr(${transactions.date}, 1, 7)`)
    .all();
}

export async function getCategoryBreakdown(constructionId: number) {
  return db
    .select({
      category: transactions.category,
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.constructionId, constructionId), eq(transactions.type, "expense")))
    .groupBy(transactions.category)
    .orderBy(sql`SUM(${transactions.amount}) DESC`)
    .all();
}

// --- Dashboard Queries ---

export async function getProjectSummary(constructionId: number) {
  const result = db
    .select({
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
      totalPayments: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'payment' THEN ${transactions.amount} ELSE 0 END), 0)`,
      totalTransactions: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(eq(transactions.constructionId, constructionId))
    .get();

  const ownerAccount = db
    .select()
    .from(accounts)
    .where(and(eq(accounts.accountType, "primary"), eq(accounts.constructionId, constructionId)))
    .get();

  return {
    totalExpenses: result?.totalExpenses ?? 0,
    totalPayments: result?.totalPayments ?? 0,
    totalTransactions: result?.totalTransactions ?? 0,
    ownerBalance: ownerAccount?.currentBalance ?? 0,
    ownerInitialBalance: ownerAccount?.initialBalance ?? 0,
  };
}

export async function getAccountSummaries(constructionId: number) {
  return db
    .select({
      id: accounts.id,
      accountName: accounts.accountName,
      accountType: accounts.accountType,
      contractorId: accounts.contractorId,
      initialBalance: accounts.initialBalance,
      currentBalance: accounts.currentBalance,
    })
    .from(accounts)
    .where(eq(accounts.constructionId, constructionId))
    .orderBy(accounts.accountName)
    .all();
}

export async function getRecentTransactions(constructionId: number, limit: number = 10) {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.constructionId, constructionId))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(limit)
    .all();
}

export async function getTransactionById(id: number, constructionId: number) {
  return db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.constructionId, constructionId)))
    .get();
}

// --- Contractor-specific Queries ---

export async function getContractorDashboard(contractorId: number, constructionId: number) {
  const account = db
    .select()
    .from(accounts)
    .where(and(eq(accounts.contractorId, contractorId), eq(accounts.constructionId, constructionId)))
    .get();

  if (!account) {
    return {
      account: null,
      recentTransactions: [],
      totalExpenses: 0,
      totalPayments: 0,
      totalTransactions: 0,
    };
  }

  const txnSummary = db
    .select({
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
      totalPayments: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'payment' THEN ${transactions.amount} ELSE 0 END), 0)`,
      totalTransactions: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(and(eq(transactions.accountId, account.id), eq(transactions.constructionId, constructionId)))
    .get();

  const recentTransactions = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.accountId, account.id), eq(transactions.constructionId, constructionId)))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(10)
    .all();

  return {
    account,
    recentTransactions,
    totalExpenses: txnSummary?.totalExpenses ?? 0,
    totalPayments: txnSummary?.totalPayments ?? 0,
    totalTransactions: txnSummary?.totalTransactions ?? 0,
  };
}

export async function getAllContractorsGlobal() {
  return db
    .select({
      id: contractors.id,
      name: contractors.name,
      constructionId: contractors.constructionId,
    })
    .from(contractors)
    .orderBy(contractors.name)
    .all();
}

// --- User Queries ---

export async function getUserById(id: number) {
  return db.select().from(users).where(eq(users.id, id)).get();
}

export async function getAllUsers() {
  return db.select().from(users).orderBy(users.name).all();
}

export async function getUserConstructionNames() {
  const rows = db
    .select({
      userId: userConstructions.userId,
      constructionName: constructions.name,
    })
    .from(userConstructions)
    .innerJoin(constructions, eq(userConstructions.constructionId, constructions.id))
    .all();

  const map = new Map<number, string[]>();
  for (const row of rows) {
    const names = map.get(row.userId) || [];
    names.push(row.constructionName);
    map.set(row.userId, names);
  }
  return map;
}
