import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTables() {
  console.log("Creating database tables...");
  
  try {
    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) DEFAULT '',
        full_name VARCHAR(255) DEFAULT '',
        phone_number VARCHAR(20) DEFAULT '',
        is_first_login BOOLEAN DEFAULT FALSE,
        last_login VARCHAR(255) DEFAULT ''
      );
    `);
    console.log("Created admins table");
    
    // Create website_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS website_settings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL DEFAULT 'Sip of Eden',
        business_email VARCHAR(255) NOT NULL DEFAULT 'contact@sipofeden.com',
        phone_number VARCHAR(20) NOT NULL DEFAULT '+234 000 0000 000',
        address TEXT NOT NULL DEFAULT 'Lagos, Nigeria',
        instagram VARCHAR(255) DEFAULT 'https://instagram.com/sipofeden',
        twitter VARCHAR(255) DEFAULT 'https://twitter.com/sipofeden',
        facebook VARCHAR(255) DEFAULT 'https://facebook.com/sipofeden',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Created website_settings table");
    
    // Create juices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS juices (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        featured BOOLEAN DEFAULT FALSE,
        sku VARCHAR(100) NOT NULL UNIQUE
      );
    `);
    console.log("Created juices table");
    
    // Create cart_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        juice_id INTEGER NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1
      );
    `);
    console.log("Created cart_items table");
    
    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        total DOUBLE PRECISION NOT NULL,
        status VARCHAR(100) NOT NULL DEFAULT 'pending',
        created_at VARCHAR(255) NOT NULL
      );
    `);
    console.log("Created orders table");
    
    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        juice_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price DOUBLE PRECISION NOT NULL
      );
    `);
    console.log("Created order_items table");
    
    // Create admin_notification_subscriptions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_notification_subscriptions (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
        subscription TEXT NOT NULL,
        user_agent VARCHAR(255),
        device_name VARCHAR(255),
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Created admin_notification_subscriptions table");
    
    // Insert default admin if none exists
    const adminResult = await pool.query(`SELECT * FROM admins WHERE username = 'admin'`);
    if (adminResult.rows.length === 0) {
      await pool.query(`
        INSERT INTO admins (username, password) 
        VALUES ('admin', 'adminpass')
      `);
      console.log("Created default admin user");
    }
    
    // Insert default website settings if none exist
    const settingsResult = await pool.query(`SELECT * FROM website_settings`);
    if (settingsResult.rows.length === 0) {
      await pool.query(`
        INSERT INTO website_settings (name, business_email, phone_number, address) 
        VALUES ('Sip of Eden', 'contact@sipofeden.com', '+234 000 0000 000', 'Lagos, Nigeria')
      `);
      console.log("Created default website settings");
    }
    
    // Seed sample juices if none exist
    const juicesResult = await pool.query(`SELECT * FROM juices`);
    if (juicesResult.rows.length === 0) {
      await pool.query(`
        INSERT INTO juices (name, description, price, image_url, category, stock, featured, sku)
        VALUES 
        ('Liquid Sunset', 'Carrot, turmeric, pineapple, and ginger blend for immunity boosting.', 3500, '/assets/fae075af-fc0e-481c-8512-a972f44425b6-removebg-preview.png', 'Immunity', 85, TRUE, 'JC-LS-001'),
        ('Green Guardian', 'Kale, cucumber, green apple, mint, and a hint of lemon for detoxification.', 3200, '/assets/10f5e9d3-8a86-4858-8ad1-5859e7e98e89-removebg-preview.png', 'Detox', 62, TRUE, 'JC-GG-002'),
        ('Berry Bliss', 'Strawberry, blueberry, raspberry, and apple juice blend rich in antioxidants.', 3500, '/assets/8e75a215-9279-4c1f-8c70-c51150da25a5-removebg-preview.png', 'Antioxidant', 74, TRUE, 'JC-BB-003'),
        ('Zesty Citrus', 'Orange, lemon, and grapefruit with a hint of ginger for immune support.', 3000, '/assets/ac4187c6-a203-4f78-852d-d28399fba46d-removebg-preview.png', 'Immunity', 92, FALSE, 'JC-ZC-004'),
        ('Energy Boost', 'Beetroot, apple, ginger, and lemon for natural energy enhancement.', 3700, '/assets/acf70a16-0bc1-4fff-ab1f-8d93de00e191-removebg-preview.png', 'Energy Booster', 0, FALSE, 'JC-EB-005'),
        ('Tropical Wave', 'Pineapple, mango, passion fruit, and coconut water for hydration.', 3300, '/assets/ea4e5741-0311-4042-94b0-5d295542c844-removebg-preview.png', 'Wellness', 45, FALSE, 'JC-TW-006')
      `);
      console.log("Created sample juices");
    }
    
    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await pool.end();
  }
}

createTables(); 