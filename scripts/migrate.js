import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();
const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

// Create a connection pool with SSL configuration for Neon
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon's SSL connection
  }
});

async function runMigration() {
  try {
    console.log('Starting database migration...');
    console.log('Checking database connection...');
    
    try {
      // Test connection
      const result = await pool.query('SELECT NOW()');
      console.log('Database connection successful:', result.rows[0].now);
    } catch (connError) {
      console.error('Database connection failed:', connError);
      process.exit(1);
    }
    
    // Define the migration SQL file path - handle both development and production paths
    const migrationFilePath = path.join(__dirname, '../server/migrations/0001_sipofeden_schema.sql');
    
    // Check if migration file exists
    if (!fs.existsSync(migrationFilePath)) {
      console.error(`Migration file not found at path: ${migrationFilePath}`);
      process.exit(1);
    }
    
    console.log(`Reading migration file from: ${migrationFilePath}`);
    const sql = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Execute the migration
    console.log('Executing migration...');
    await pool.query(sql);
    
    console.log('Migration completed successfully');
    
    // Check if tables were created
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables in database:');
    tables.rows.forEach(row => console.log(`- ${row.table_name}`));
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration(); 