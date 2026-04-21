import { sqliteTable, text, integer, real, index, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// --- Users (defined first, forward-references use AnySQLiteColumn) ---

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["superadmin", "owner", "contractor"] }).notNull().default("contractor"),
  contractorId: integer("contractor_id").references((): AnySQLiteColumn => contractors.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// --- Constructions ---

export const constructions = sqliteTable("constructions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Construction = typeof constructions.$inferSelect;
export type NewConstruction = typeof constructions.$inferInsert;

// --- User-Construction Join Table ---

export const userConstructions = sqliteTable(
  "user_constructions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    constructionId: integer("construction_id").notNull().references(() => constructions.id),
    assignedAt: integer("assigned_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_uc_user_id").on(table.userId),
    index("idx_uc_construction_id").on(table.constructionId),
  ]
);

export type UserConstruction = typeof userConstructions.$inferSelect;

// --- Contractors ---

export const contractors = sqliteTable(
  "contractors",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    constructionId: integer("construction_id").notNull().references(() => constructions.id),
    name: text("name").notNull(),
    contractorType: text("contractor_type").notNull(),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    initialBalance: real("initial_balance").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_contractors_construction_id").on(table.constructionId),
  ]
);

export type Contractor = typeof contractors.$inferSelect;
export type NewContractor = typeof contractors.$inferInsert;

// --- Accounts ---

export const accounts = sqliteTable(
  "accounts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    constructionId: integer("construction_id").notNull().references(() => constructions.id),
    accountName: text("account_name").notNull(),
    accountType: text("account_type", { enum: ["primary", "contractor"] }).notNull(),
    contractorId: integer("contractor_id").references(() => contractors.id),
    initialBalance: real("initial_balance").notNull().default(0),
    currentBalance: real("current_balance").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_accounts_contractor_id").on(table.contractorId),
    index("idx_accounts_construction_id").on(table.constructionId),
  ]
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

// --- Transactions ---

export const transactions = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    constructionId: integer("construction_id").notNull().references(() => constructions.id),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id),
    contractorId: integer("contractor_id").references(() => contractors.id),
    date: text("date").notNull(),
    description: text("description").notNull(),
    amount: real("amount").notNull(),
    type: text("type", { enum: ["expense", "payment", "adjustment"] }).notNull(),
    category: text("category").notNull(),
    notes: text("notes"),
    receiptPath: text("receipt_path"),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_transactions_construction_id").on(table.constructionId),
    index("idx_transactions_account_id").on(table.accountId),
    index("idx_transactions_contractor_id").on(table.contractorId),
    index("idx_transactions_date").on(table.date),
    index("idx_transactions_type").on(table.type),
    index("idx_transactions_date_type").on(table.date, table.type),
  ]
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
