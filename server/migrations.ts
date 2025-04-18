import { db } from './db';
import { pool } from './db';

/**
 * Run database migrations to add new columns to existing tables
 */
export async function runMigrations() {
  console.log("Running database migrations...");
  
  try {
    // Check if the email column exists in the admins table
    const checkColumnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'admins' AND column_name = 'email'
    `);
    
    // If the column doesn't exist, add the new columns
    if (checkColumnResult.rows.length === 0) {
      console.log("Adding new columns to admins table...");
      
      await pool.query(`
        ALTER TABLE admins 
        ADD COLUMN email TEXT DEFAULT '',
        ADD COLUMN full_name TEXT DEFAULT '',
        ADD COLUMN phone_number TEXT DEFAULT '',
        ADD COLUMN is_first_login BOOLEAN DEFAULT TRUE,
        ADD COLUMN last_login TEXT DEFAULT ''
      `);
      
      console.log("Admin table migration completed successfully");
    } else {
      console.log("Admin table already has the required columns");
    }
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}