import { db } from "./db";

/**
 * Run database migrations to add new columns to existing tables
 */
export async function runMigrations() {
  console.log("Running database migrations...");
  
  try {
    // Create users table if it doesn't exist
    await createUsersTable();
    
    // Create OTP verifications table if it doesn't exist
    await createOtpVerificationsTable();
    
    console.log("✓ Database migrations completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

/**
 * Create users table if it doesn't exist
 */
async function createUsersTable() {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        is_verified INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_login TEXT
      )
    `);
    console.log("✓ Users table created or already exists");
  } catch (error) {
    console.error("Error creating users table:", error);
    throw error;
  }
}

/**
 * Create OTP verifications table if it doesn't exist
 */
async function createOtpVerificationsTable() {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        is_used INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ OTP verifications table created or already exists");
  } catch (error) {
    console.error("Error creating OTP verifications table:", error);
    throw error;
  }
}