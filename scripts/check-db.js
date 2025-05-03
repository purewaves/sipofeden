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

async function checkDb() {
  try {
    console.log('Checking database...');
    
    // List all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in database:');
    console.table(tablesResult.rows);
    
    // Check if orders table exists and get its columns
    if (tablesResult.rows.some(row => row.table_name === 'orders')) {
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'orders'
      `);
      console.log('Columns in orders table:');
      console.table(columnsResult.rows);
    } else {
      console.log('Orders table not found!');
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await pool.end();
  }
}

checkDb(); 