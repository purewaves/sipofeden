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

async function checkTotalColumn() {
  try {
    console.log('Specifically checking the total column in orders table...');
    
    // Direct query to check the total column
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'total'
    `);
    
    if (result.rows.length > 0) {
      console.log('Total column exists with details:');
      console.table(result.rows);
    } else {
      console.log('Total column does NOT exist!');
      
      // Try to add it
      console.log('Attempting to add total column...');
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN total DOUBLE PRECISION NOT NULL DEFAULT 0
      `);
      console.log('Total column added successfully');
    }
    
    // Check if the column can be used in a query
    try {
      const testQuery = await pool.query(`
        SELECT id, total FROM orders LIMIT 1
      `);
      console.log('Successfully queried orders.total column:');
      console.log(testQuery.rows);
    } catch (queryError) {
      console.error('Error querying orders.total column:', queryError);
    }
    
  } catch (error) {
    console.error('Error checking total column:', error);
  } finally {
    await pool.end();
  }
}

checkTotalColumn(); 