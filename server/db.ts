import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'sip-of-eden.db');
console.log(`Using SQLite database at: ${dbPath}`);

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

// Export a mock pool for compatibility with session store
export const pool = {
  query: async (sql: string, params?: any[]) => {
    try {
      const stmt = sqlite.prepare(sql);
      const result = stmt.all(params || []);
      return { rows: result };
    } catch (error) {
      throw error;
    }
  }
};
