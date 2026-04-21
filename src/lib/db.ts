import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import * as schema from "@/db/schema";

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), "data", "construction.db");
const dataDir = path.dirname(dbPath);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const globalForDb = globalThis as unknown as {
  sqlite: InstanceType<typeof Database> | undefined;
};

const sqlite = globalForDb.sqlite ?? new Database(dbPath);

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
