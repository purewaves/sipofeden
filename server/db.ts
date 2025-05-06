import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from "ws";
import * as schema from '../shared/schema';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Create a connection
export const sql = neon(process.env.DATABASE_URL);

// Test the connection
sql`SELECT NOW()`
  .then(() => {
    console.log('Successfully connected to database');
  })
  .catch((err) => {
    console.error('Error connecting to database:', err);
  });

// Create a drizzle client with the SQL connection
export const db = drizzle(sql);
export { schema };