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

dotenv.config();

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Test connection first
    try {
      await pool.query('SELECT NOW()');
      console.log('Database connection verified for seeding.');
    } catch (connError) {
      console.error('Database connection failed during seeding:', connError);
      throw connError; // Re-throw to stop seeding
    }

    // Check if admin exists
    const adminExists = await db.select().from(admins).where(eq(admins.username, 'admin')).limit(1);
    
    if (adminExists.length === 0) {
      console.log('Default admin not found, seeding necessary items...');
      // Add admin seeding logic here if needed
      // Example: await db.insert(admins).values({ username: 'admin', password: 'hashed_password' });
    }

    // --- Force seeding by deleting existing juices first --- 
    console.log('Clearing existing juices before seeding...');
    await db.delete(juices);
    console.log('Existing juices cleared.');
    // ------------------------------------------------------

    console.log("Seeding sample juices...");
    
    // Use relative paths assuming images are moved to client/public/images/
    const sampleJuices: InsertJuice[] = [
      {
        name: "Liquid Sunset",
        description: "Carrot, turmeric, pineapple, and ginger blend for immunity boosting.",
        price: 3500,
        imageUrl: "/images/fae075af-fc0e-481c-8512-a972f44425b6-removebg-preview.png",
        category: "Immunity",
        stock: 85,
        featured: true,
        sku: "JC-LS-001"
      },
      {
        name: "Green Guardian",
        description: "Kale, cucumber, green apple, mint, and a hint of lemon for detoxification.",
        price: 3200,
        imageUrl: "/images/10f5e9d3-8a86-4858-8ad1-5859e7e98e89-removebg-preview.png",
        category: "Detox",
        stock: 62,
        featured: true,
        sku: "JC-GG-002"
      },
      {
        name: "Berry Bliss",
        description: "Strawberry, blueberry, raspberry, and apple juice blend rich in antioxidants.",
        price: 3500,
        imageUrl: "/images/8e75a215-9279-4c1f-8c70-c51150da25a5-removebg-preview.png",
        category: "Antioxidant",
        stock: 74,
        featured: true,
        sku: "JC-BB-003"
      },
      {
        name: "Zesty Citrus",
        description: "Orange, lemon, and grapefruit with a hint of ginger for immune support.",
        price: 3000,
        imageUrl: "/images/ac4187c6-a203-4f78-852d-d28399fba46d-removebg-preview.png",
        category: "Immunity",
        stock: 92,
        featured: false,
        sku: "JC-ZC-004"
      },
      {
        name: "Energy Boost",
        description: "Beetroot, apple, ginger, and lemon for natural energy enhancement.",
        price: 3700,
        imageUrl: "/images/acf70a16-0bc1-4fff-ab1f-8d93de00e191-removebg-preview.png",
        category: "Energy Booster",
        stock: 0, // Keep stock 0 as per original
        featured: false,
        sku: "JC-EB-005"
      },
      {
        name: "Tropical Wave",
        description: "Pineapple, mango, passion fruit, and coconut water for hydration.",
        price: 3300,
        imageUrl: "/images/ea4e5741-0311-4042-94b0-5d295542c844-removebg-preview.png",
        category: "Wellness",
        stock: 45,
        featured: false,
        sku: "JC-TW-006"
      }
    ];
    
    console.log(`Attempting to insert ${sampleJuices.length} juices...`);
    // Use transaction for bulk insert with explicit type
    await db.transaction(async (tx: NodePgTransaction) => { 
      for (const juice of sampleJuices) {
        await tx.insert(juices).values(juice);
      }
    });
    
    console.log("Sample juices seeded successfully");
    
    console.log("Database seeding check complete.");

  } catch (error) {
    console.error("Error seeding database:", error);
    // Exit with error code to potentially fail the build if seeding fails
    process.exit(1); 
  }
  // Removed finally block with pool.end() as the script might be part of a larger build process
}

// If called directly, run the seeding
// Check if the script is the main module being run
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDatabase()
    .then(() => {
      console.log("Seeding script finished.");
      // Explicitly end pool connection if run standalone
      pool.end().then(() => console.log("Pool closed.")); 
    })
    .catch(() => {
      console.error("Seeding script failed.");
      // Ensure pool is closed even on error
      pool.end().then(() => console.log("Pool closed after error.")); 
      process.exit(1);
    });
}