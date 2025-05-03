import { eq } from "drizzle-orm";
import { db, pool } from "./db";
import { 
  juices, 
  admins, 
  InsertJuice, 
  InsertAdmin 
} from "@shared/schema";
import * as dotenv from "dotenv";
import type { NodePgTransaction } from 'drizzle-orm/node-postgres';
import { pathToFileURL } from 'url';
import bcrypt from 'bcrypt';

dotenv.config();

const SALT_ROUNDS = 10;

export async function seedDatabase() {
  try {
    console.log('[SEED] Starting database seeding process...');

    // Test connection first
    try {
      await pool.query('SELECT NOW()');
      console.log('[SEED] Database connection verified.');
    } catch (connError) {
      console.error('[SEED] Database connection failed:', connError);
      throw connError;
    }

    // --- Seed Admin User --- 
    console.log('[SEED] Checking for default admin user...');
    const adminExists = await db.select().from(admins).where(eq(admins.username, 'admin')).limit(1);
    
    if (adminExists.length === 0) {
      console.log('[SEED] Default admin not found. Creating admin:adminpass...');
      const hashedPassword = await bcrypt.hash('adminpass', SALT_ROUNDS);
      const admin: InsertAdmin = {
        username: "admin",
        password: hashedPassword 
      };
      await db.insert(admins).values(admin);
      console.log('[SEED] Default admin user created successfully.');
    } else {
      console.log('[SEED] Default admin user already exists.');
    }
    // -----------------------

    // --- Force seeding juices by deleting existing first --- 
    console.log('[SEED] Clearing existing juices before seeding...');
    const deleteResult = await db.delete(juices);
    console.log(`[SEED] Existing juices cleared. Rows affected: ${deleteResult.rowCount ?? 'N/A'}`);
    // ------------------------------------------------------

    console.log("[SEED] Seeding sample juices...");
    
    const sampleJuices: InsertJuice[] = [
      {
        name: "Liquid Sunset",
        description: "Carrot, turmeric, pineapple, and ginger blend for immunity boosting.",
        price: 3500,
        imageUrl: "/assets/fae075af-fc0e-481c-8512-a972f44425b6-removebg-preview.png",
        category: "Immunity",
        stock: 85,
        featured: true,
        sku: "JC-LS-001"
      },
      {
        name: "Green Guardian",
        description: "Kale, cucumber, green apple, mint, and a hint of lemon for detoxification.",
        price: 3200,
        imageUrl: "/assets/10f5e9d3-8a86-4858-8ad1-5859e7e98e89-removebg-preview.png",
        category: "Detox",
        stock: 62,
        featured: true,
        sku: "JC-GG-002"
      },
      {
        name: "Berry Bliss",
        description: "Strawberry, blueberry, raspberry, and apple juice blend rich in antioxidants.",
        price: 3500,
        imageUrl: "/assets/8e75a215-9279-4c1f-8c70-c51150da25a5-removebg-preview.png",
        category: "Antioxidant",
        stock: 74,
        featured: true,
        sku: "JC-BB-003"
      },
      {
        name: "Zesty Citrus",
        description: "Orange, lemon, and grapefruit with a hint of ginger for immune support.",
        price: 3000,
        imageUrl: "/assets/ac4187c6-a203-4f78-852d-d28399fba46d-removebg-preview.png",
        category: "Immunity",
        stock: 92,
        featured: false,
        sku: "JC-ZC-004"
      },
      {
        name: "Energy Boost",
        description: "Beetroot, apple, ginger, and lemon for natural energy enhancement.",
        price: 3700,
        imageUrl: "/assets/acf70a16-0bc1-4fff-ab1f-8d93de00e191-removebg-preview.png",
        category: "Energy Booster",
        stock: 0,
        featured: false,
        sku: "JC-EB-005"
      },
      {
        name: "Tropical Wave",
        description: "Pineapple, mango, passion fruit, and coconut water for hydration.",
        price: 3300,
        imageUrl: "/assets/ea4e5741-0311-4042-94b0-5d295542c844-removebg-preview.png",
        category: "Wellness",
        stock: 45,
        featured: false,
        sku: "JC-TW-006"
      }
    ];
    
    console.log(`[SEED] Attempting to insert ${sampleJuices.length} juices...`);
    // Use transaction for bulk insert - remove explicit type annotation that's causing problems
    await db.transaction(async (tx) => { 
      for (const juice of sampleJuices) {
        await tx.insert(juices).values(juice);
      }
    });
    
    console.log("[SEED] Sample juices seeded successfully.");
    
    console.log("[SEED] Database seeding process complete.");

  } catch (error) {
    console.error("[SEED] Error during database seeding:", error);
    process.exit(1); 
  }
}

// Standalone execution logic remains the same
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDatabase()
    .then(() => {
      console.log("[SEED] Seeding script finished running standalone.");
      pool.end().then(() => console.log("[SEED] Pool closed.")); 
    })
    .catch(() => {
      console.error("[SEED] Seeding script failed running standalone.");
      pool.end().then(() => console.log("[SEED] Pool closed after error.")); 
      process.exit(1);
    });
}