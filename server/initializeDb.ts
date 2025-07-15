import { db } from './db';
import { 
  juices, admins, cartItems, orders, orderItems, 
  subscriptionPlans, websiteSettings
} from '@shared/schema';

export async function seedDatabase() {
  console.log("Seeding database with initial data...");
  
  try {
    // Check if we already have data
    const existingJuices = await db.select().from(juices).limit(1);
    if (existingJuices.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    // Insert default admin
    await db.insert(admins).values([{
      username: "admin",
      password: "adminpass", // In production, this should be hashed
      email: "admin@sipofeden.com",
      fullName: "Administrator",
      phoneNumber: "+1 (555) 123-4567"
    }]).onConflictDoNothing();

    // Insert sample juices
    await db.insert(juices).values([
      {
        name: "Green Machine",
        description: "A powerful blend of kale, spinach, cucumber, green apple, and lemon. Packed with vitamins and minerals.",
        price: 8.99,
        imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDIwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZjBmOWZmIi8+CjxyZWN0IHg9IjUwIiB5PSI3MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIHJ4PSIxMCIgZmlsbD0iIzRhZjA0NiIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI1MCIgcj0iMTUiIGZpbGw9IiMyYTlkMmEiLz4KPC9zdmc+",
        category: "Green Juice",
        stock: 25,
        featured: true,
        sku: "GM001"
      },
      {
        name: "Carrot Ginger Blast",
        description: "Fresh carrots with a kick of ginger, orange, and turmeric. Anti-inflammatory and energizing.",
        price: 7.99,
        imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDIwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZmVmNGU2Ii8+CjxyZWN0IHg9IjUwIiB5PSI3MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIHJ4PSIxMCIgZmlsbD0iI2ZiNzE4NSIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI1MCIgcj0iMTUiIGZpbGw9IiNkMTQ1MTAiLz4KPC9zdmc+",
        category: "Root Vegetable",
        stock: 30,
        featured: true,
        sku: "CGB002"
      },
      {
        name: "Berry Antioxidant",
        description: "Mixed berries, pomegranate, and acai. Rich in antioxidants and natural sweetness.",
        price: 9.49,
        imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDIwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZmVmMmY5Ii8+CjxyZWN0IHg9IjUwIiB5PSI3MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIHJ4PSIxMCIgZmlsbD0iIzk5MzNmZiIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI1MCIgcj0iMTUiIGZpbGw9IiM1Zjk5ZjciLz4KPC9zdmc+",
        category: "Berry",
        stock: 20,
        featured: true,
        sku: "BA003"
      },
      {
        name: "Citrus Sunshine",
        description: "Orange, grapefruit, lemon, and a touch of mint. Vitamin C boost for immunity.",
        price: 6.99,
        imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDIwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZmVmYmVhIi8+CjxyZWN0IHg9IjUwIiB5PSI3MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIHJ4PSIxMCIgZmlsbD0iI2Y5NzMxNiIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI1MCIgcj0iMTUiIGZpbGw9IiNkYzI2MjYiLz4KPC9zdmc+",
        category: "Citrus",
        stock: 35,
        featured: false,
        sku: "CS004"
      },
      {
        name: "Celery Hydrator",
        description: "Pure celery juice with cucumber and lime. Perfect for hydration and detox.",
        price: 7.49,
        imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDIwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZjNmOWY2Ii8+CjxyZWN0IHg9IjUwIiB5PSI3MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIHJ4PSIxMCIgZmlsbD0iIzIyYzU1ZSIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI1MCIgcj0iMTUiIGZpbGw9IiMxNjdkNDAiLz4KPC9zdmc+",
        category: "Green Juice",
        stock: 28,
        featured: false,
        sku: "CH005"
      },
      {
        name: "Beet Energy",
        description: "Earthy beets with apple, ginger, and carrot. Natural energy and stamina boost.",
        price: 8.49,
        imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDIwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZmVmM2Y0Ii8+CjxyZWN0IHg9IjUwIiB5PSI3MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIHJ4PSIxMCIgZmlsbD0iI2RjMjYyNiIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI1MCIgcj0iMTUiIGZpbGw9IiM5MTE2MjEiLz4KPC9zdmc+",
        category: "Root Vegetable",
        stock: 22,
        featured: true,
        sku: "BE006"
      }
    ]);

    // Insert sample subscription plans
    await db.insert(subscriptionPlans).values([
      {
        name: "Weekly Fresh",
        description: "Get 6 fresh juices delivered weekly",
        price: 45.99,
        frequency: "weekly",
        features: JSON.stringify(["6 bottles per week", "Free delivery", "Cancel anytime", "Mix and match flavors"])
      },
      {
        name: "Monthly Wellness",
        description: "Monthly juice cleanse package with 20 bottles",
        price: 149.99,
        frequency: "monthly",
        features: JSON.stringify(["20 bottles per month", "Free delivery", "Nutrition guide included", "Cancel anytime", "15% savings"])
      }
    ]);

    // Insert default website settings
    await db.insert(websiteSettings).values([{
      siteName: "Sip of Eden",
      siteDescription: "Organic Cold-Pressed Juices",
      contactEmail: "hello@sipofeden.com",
      contactPhone: "+1 (555) 123-4567",
      address: "123 Juice St, Fresh City, FC 12345",
      socialMediaLinks: JSON.stringify({}),
      businessHours: JSON.stringify({}),
      shippingInfo: "We offer free shipping on orders over $50",
      returnPolicy: "30-day return policy on all products",
      privacyPolicy: "Your privacy is important to us",
      termsOfService: "Terms and conditions apply",
      aboutUs: "We are passionate about providing fresh, organic cold-pressed juices"
    }]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}