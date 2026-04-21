import Database from "better-sqlite3";
import { createHash } from "crypto";
import path from "path";

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), "data", "construction.db");
const db = new Database(dbPath);

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

// Seed default users
const insertUser = db.prepare(
  "INSERT OR IGNORE INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, unixepoch())"
);

insertUser.run("Super Admin", "superadmin@example.com", hashPassword("superadmin123"), "superadmin");
insertUser.run("Owner", "owner@example.com", hashPassword("owner123"), "owner");

console.log("Default users seeded successfully.");
console.log("  Super Admin: superadmin@example.com / superadmin123");
console.log("  Owner:       owner@example.com / owner123");

// Get user IDs
const superadmin = db.prepare("SELECT id FROM users WHERE email = 'superadmin@example.com'").get();
const owner = db.prepare("SELECT id FROM users WHERE email = 'owner@example.com'").get();

// Seed default construction if not exists
const existingConstruction = db.prepare("SELECT id FROM constructions LIMIT 1").get();
if (!existingConstruction) {
  const result = db.prepare(
    "INSERT INTO constructions (name, description, is_active, created_by, created_at) VALUES (?, ?, 1, ?, unixepoch())"
  ).run("Default Construction", "Default construction project", superadmin.id);

  const constructionId = result.lastInsertRowid;
  console.log(`Default construction created (ID: ${constructionId}).`);

  // Create primary owner account for this construction
  db.prepare(
    "INSERT INTO accounts (construction_id, account_name, account_type, initial_balance, current_balance, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())"
  ).run(constructionId, "Owner Account", "primary", 0, 0);
  console.log("Default owner account created.");

  // Assign owner user to this construction
  db.prepare(
    "INSERT OR IGNORE INTO user_constructions (user_id, construction_id, assigned_at) VALUES (?, ?, unixepoch())"
  ).run(owner.id, constructionId);
  console.log("Owner assigned to default construction.");

  // Create a sample contractor
  const contractorResult = db.prepare(
    "INSERT INTO contractors (construction_id, name, contractor_type, contact_phone, contact_email, initial_balance, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, unixepoch())"
  ).run(constructionId, "Contractor", "Building Contractor", "9876543210", "ravi@example.com", 0);

  const contractorId = contractorResult.lastInsertRowid;
  console.log(`Sample contractor created (ID: ${contractorId}).`);

  // Create contractor account
  db.prepare(
    "INSERT INTO accounts (construction_id, account_name, account_type, contractor_id, initial_balance, current_balance, created_at) VALUES (?, ?, ?, ?, ?, ?, unixepoch())"
  ).run(constructionId, "Contractor", "contractor", contractorId, 0, 0);
  console.log("Contractor account created.");

  // Create contractor user linked to the contractor
  insertUser.run("Contractor", "contractor@example.com", hashPassword("contractor123"), "contractor");
  const contractorUser = db.prepare("SELECT id FROM users WHERE email = 'contractor@example.com'").get();

  if (contractorUser) {
    // Link user to contractor
    db.prepare("UPDATE users SET contractor_id = ? WHERE id = ?").run(contractorId, contractorUser.id);

    // Assign contractor user to this construction
    db.prepare(
      "INSERT OR IGNORE INTO user_constructions (user_id, construction_id, assigned_at) VALUES (?, ?, unixepoch())"
    ).run(contractorUser.id, constructionId);

    console.log("Contractor user created and linked.");
    console.log("  Contractor:  contractor@example.com / contractor123");
  }
} else {
  console.log("Construction already exists, skipping.");
}

db.close();
