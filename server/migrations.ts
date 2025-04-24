import { db } from './db';
import { pool } from './db';

/**
 * Run database migrations to add new columns to existing tables
 */
export async function runMigrations() {
  console.log("Running database migrations...");
  
  try {
    // Check if the email column exists in the admins table
    const checkColumnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'admins' AND column_name = 'email'
    `);
    
    // If the column doesn't exist, add the new columns
    if (checkColumnResult.rows.length === 0) {
      console.log("Adding new columns to admins table...");
      
      await pool.query(`
        ALTER TABLE admins 
        ADD COLUMN email TEXT DEFAULT '',
        ADD COLUMN full_name TEXT DEFAULT '',
        ADD COLUMN phone_number TEXT DEFAULT '',
        ADD COLUMN is_first_login BOOLEAN DEFAULT TRUE,
        ADD COLUMN last_login TEXT DEFAULT ''
      `);
      
      console.log("Admin table migration completed successfully");
    } else {
      console.log("Admin table already has the required columns");
    }
    
    // Create loyalty-related tables if they don't exist
    await createLoyaltyTables();
    
    // Create subscription plan and bundle tables if they don't exist
    await createSubscriptionAndBundleTables();
    
    // Create website settings table if it doesn't exist
    await createWebsiteSettingsTable();
    
    // Create admin notification subscriptions table if it doesn't exist
    await createNotificationSubscriptionsTable();
    
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

/**
 * Create tables for subscription plans and bundles if they don't exist
 */
async function createSubscriptionAndBundleTables() {
  try {
    // Check if subscription_plans table exists
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'subscription_plans'
      );
    `);
    
    if (!tableCheckResult.rows[0].exists) {
      console.log("Creating subscription and bundle tables...");
      
      // Create subscription_plans table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS subscription_plans (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          price DOUBLE PRECISION NOT NULL,
          frequency TEXT NOT NULL,
          features TEXT[] NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create subscriptions table with updated fields
      await pool.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id SERIAL PRIMARY KEY,
          plan_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          address TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          start_date TIMESTAMP WITH TIME ZONE NOT NULL,
          next_delivery TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create bundles table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bundles (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          price DOUBLE PRECISION NOT NULL,
          juice_ids INTEGER[] NOT NULL,
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log("Subscription and bundle tables created successfully");
    } else {
      console.log("Subscription and bundle tables already exist");
    }
  } catch (error) {
    console.error("Error creating subscription and bundle tables:", error);
    throw error;
  }
}

/**
 * Create website settings table if it doesn't exist
 */
async function createWebsiteSettingsTable() {
  try {
    // Check if website_settings table exists
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'website_settings'
      );
    `);
    
    if (!tableCheckResult.rows[0].exists) {
      console.log("Creating website settings table...");
      
      // Create website_settings table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS website_settings (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          business_email TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          address TEXT NOT NULL,
          instagram TEXT,
          twitter TEXT,
          facebook TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Insert default settings
      await pool.query(`
        INSERT INTO website_settings (
          name, business_email, phone_number, address
        ) VALUES (
          'Sip of Eden', 'contact@sipofeden.com', '+234 000 0000 000', 'Lagos, Nigeria'
        );
      `);
      
      console.log("Website settings table created successfully");
    } else {
      console.log("Website settings table already exists");
    }
  } catch (error) {
    console.error("Error creating website settings table:", error);
    throw error;
  }
}

/**
 * Create tables for loyalty points system if they don't exist
 */
async function createLoyaltyTables() {
  try {
    // Check if loyalty_customers table exists
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'loyalty_customers'
      );
    `);
    
    if (!tableCheckResult.rows[0].exists) {
      console.log("Creating loyalty tables...");
      
      // Create loyalty_customers table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS loyalty_customers (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          points INTEGER NOT NULL DEFAULT 0,
          tier TEXT NOT NULL DEFAULT 'bronze',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create loyalty_rewards table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS loyalty_rewards (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER NOT NULL REFERENCES loyalty_customers(id),
          description TEXT NOT NULL,
          points_required INTEGER NOT NULL,
          redeemed BOOLEAN DEFAULT FALSE,
          redeemed_at TIMESTAMP WITH TIME ZONE,
          expires_at TIMESTAMP WITH TIME ZONE
        );
      `);
      
      // Create loyalty_activities table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS loyalty_activities (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER NOT NULL REFERENCES loyalty_customers(id),
          points INTEGER NOT NULL,
          type TEXT NOT NULL,
          source TEXT NOT NULL,
          source_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log("Loyalty tables created successfully");
    } else {
      console.log("Loyalty tables already exist");
    }
  } catch (error) {
    console.error("Error creating loyalty tables:", error);
    throw error;
  }
}

/**
 * Create notification subscriptions table if it doesn't exist
 */
async function createNotificationSubscriptionsTable() {
  try {
    // Check if admin_notification_subscriptions table exists
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_notification_subscriptions'
      );
    `);
    
    if (!tableCheckResult.rows[0].exists) {
      console.log("Creating admin notification subscriptions table...");
      
      // Create the table with all required columns
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_notification_subscriptions (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
          subscription TEXT NOT NULL,
          user_agent TEXT,
          device_name TEXT,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log("Admin notification subscriptions table created successfully");
    } else {
      console.log("Admin notification subscriptions table already exists");
    }
  } catch (error) {
    console.error("Error creating admin notification subscriptions table:", error);
    throw error;
  }
}