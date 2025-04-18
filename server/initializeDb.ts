import { eq } from "drizzle-orm";
import { db } from "./db";
import { 
  juices, 
  admins, 
  InsertJuice, 
  InsertAdmin 
} from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log("Checking if database needs seeding...");
    
    // Check if admin exists
    const adminExists = await db.select().from(admins).where(eq(admins.username, 'admin'));
    
    if (adminExists.length === 0) {
      console.log("Creating default admin user...");
      const admin: InsertAdmin = {
        username: "admin",
        password: "adminpass" // In a real app, this would be hashed
      };
      
      await db.insert(admins).values(admin);
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }
    
    // Check if juices exist
    const juicesCount = await db.select().from(juices);
    
    if (juicesCount.length === 0) {
      console.log("Seeding sample juices...");
      
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
          category: "Energy",
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
      
      for (const juice of sampleJuices) {
        await db.insert(juices).values(juice);
      }
      
      console.log("Sample juices seeded successfully");
    } else {
      console.log(`Found ${juicesCount.length} juices in database`);
    }
    
    console.log("Database initialization complete");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}