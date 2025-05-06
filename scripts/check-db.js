import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon's SSL connection
  }
});

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    const client = await pool.connect();
    console.log('Database connection successful!');

    console.log('Checking juices table...');
    const result = await client.query('SELECT COUNT(*) FROM juices');
    console.log(`Found ${result.rows[0].count} juices in the database`);

    const juices = await client.query('SELECT * FROM juices LIMIT 5');
    console.log('Sample juices:', juices.rows);

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Database check failed:', error);
    process.exit(1);
  }
}

checkDatabase(); 