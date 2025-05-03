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

async function checkOrders() {
  try {
    console.log('Checking orders table...');
    
    // Check orders table columns
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
    console.log('Columns in orders table:');
    console.table(columnsResult.rows);
    
  } catch (error) {
    console.error('Error checking orders table:', error);
  } finally {
    await pool.end();
  }
}

checkOrders(); 