import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixOrdersTable() {
  try {
    console.log('Checking and fixing orders table...');
    
    // Check if status column exists
    const statusColumnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'status'
    `);
    
    if (statusColumnResult.rows.length === 0) {
      console.log('Adding missing status column to orders table...');
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN status VARCHAR(100) NOT NULL DEFAULT 'pending'
      `);
      console.log('Status column added successfully');
    } else {
      console.log('Status column already exists');
    }
    
    // Check if total column exists
    const totalColumnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'total'
    `);
    
    if (totalColumnResult.rows.length === 0) {
      console.log('Adding missing total column to orders table...');
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN total DOUBLE PRECISION NOT NULL DEFAULT 0
      `);
      console.log('Total column added successfully');
    } else {
      console.log('Total column already exists');
    }
    
    // Check the updated structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `);
    console.log('Updated orders table structure:');
    console.table(columnsResult.rows);
    
  } catch (error) {
    console.error('Error fixing orders table:', error);
  } finally {
    await pool.end();
  }
}

fixOrdersTable(); 