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

// Sample juice data
const sampleJuices = [
  {
    name: "Green Detox",
    description: "A refreshing mix of kale, cucumber, green apple, celery, and lemon. Perfect for detoxification and boosting your energy levels.",
    price: 8.99,
    imageUrl: "https://images.unsplash.com/photo-1622597467836-f3e6707e1191?q=80&w=1974&auto=format&fit=crop",
    category: "detox",
    stock: 50,
    featured: true,
    sku: "GRN-DTX-001"
  },
  {
    name: "Berry Blast",
    description: "A delicious blend of strawberries, blueberries, raspberries, and blackberries. Rich in antioxidants and bursting with flavor.",
    price: 7.99,
    imageUrl: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=1287&auto=format&fit=crop",
    category: "fruit",
    stock: 45,
    featured: true,
    sku: "BRY-BLST-002"
  },
  {
    name: "Tropical Paradise",
    description: "Experience a taste of the tropics with this exotic blend of pineapple, mango, passion fruit, and coconut water.",
    price: 9.49,
    imageUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?q=80&w=1287&auto=format&fit=crop",
    category: "fruit",
    stock: 40,
    featured: false,
    sku: "TRP-PRD-003"
  },
  {
    name: "Carrot Ginger",
    description: "A nutritious blend of fresh carrots and ginger, with a hint of apple and lemon. Great for digestion and immune support.",
    price: 6.99,
    imageUrl: "https://images.unsplash.com/photo-1622480916113-9056d01a4403?q=80&w=1335&auto=format&fit=crop",
    category: "vegetable",
    stock: 55,
    featured: false,
    sku: "CRT-GNG-004"
  },
  {
    name: "Beet Revitalizer",
    description: "A vibrant mix of beets, apple, and ginger. This earthy, sweet juice is packed with nutrients for enhanced stamina and recovery.",
    price: 7.49,
    imageUrl: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?q=80&w=1064&auto=format&fit=crop",
    category: "vegetable",
    stock: 35,
    featured: false,
    sku: "BET-REV-005"
  },
  {
    name: "Citrus Sunrise",
    description: "A tangy blend of oranges, grapefruit, lemon, and a touch of turmeric. Start your day with this vitamin C powerhouse.",
    price: 8.49,
    imageUrl: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?q=80&w=1287&auto=format&fit=crop",
    category: "fruit",
    stock: 60,
    featured: true,
    sku: "CTR-SNR-006"
  }
];

async function addSampleJuices() {
  try {
    console.log('Adding sample juices to the database...');
    
    // Check if we already have juices
    const existingJuices = await pool.query(`SELECT COUNT(*) FROM juices`);
    
    if (existingJuices.rows[0].count > 0) {
      console.log(`Found ${existingJuices.rows[0].count} existing juices. Skipping sample data insertion.`);
    } else {
      // Insert sample juices
      for (const juice of sampleJuices) {
        await pool.query(`
          INSERT INTO juices (name, description, price, image_url, category, stock, featured, sku)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          juice.name,
          juice.description,
          juice.price,
          juice.imageUrl,
          juice.category,
          juice.stock,
          juice.featured,
          juice.sku
        ]);
        console.log(`Added juice: ${juice.name}`);
      }
      console.log('Successfully added all sample juices');
    }
    
    // Query juices to verify
    const juicesResult = await pool.query(`SELECT id, name, price, category FROM juices`);
    console.log('Current juices in database:');
    console.table(juicesResult.rows);
    
  } catch (error) {
    console.error('Error adding sample juices:', error);
  } finally {
    await pool.end();
  }
}

addSampleJuices(); 