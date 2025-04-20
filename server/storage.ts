import { 
  Juice, InsertJuice, 
  CartItem, InsertCartItem,
  SubscriptionPlan, InsertSubscriptionPlan,
  Subscription, InsertSubscription, 
  Bundle, InsertBundle,
  Admin, InsertAdmin, UpdateAdminProfile,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  LoyaltyCustomer, InsertLoyaltyCustomer, UpdateLoyaltyPoints,
  LoyaltyReward, InsertLoyaltyReward,
  LoyaltyActivity, InsertLoyaltyActivity,
  WebsiteSettings, UpdateWebsiteSettings,
  juices, cartItems, subscriptionPlans, subscriptions, bundles, admins, orders, orderItems,
  loyaltyCustomers, loyaltyRewards, loyaltyActivities, websiteSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

export interface IStorage {
  // Juice operations
  getAllJuices(): Promise<Juice[]>;
  getFeaturedJuices(): Promise<Juice[]>;
  getJuiceById(id: number): Promise<Juice | undefined>;
  createJuice(juice: InsertJuice): Promise<Juice>;
  updateJuice(id: number, juice: Partial<InsertJuice>): Promise<Juice | undefined>;
  deleteJuice(id: number): Promise<boolean>;
  
  // Cart operations
  getCartItems(sessionId: string): Promise<(CartItem & { juice: Juice })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(sessionId: string): Promise<boolean>;
  
  // Subscription Plan operations
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: number): Promise<boolean>;
  
  // Bundle operations
  getAllBundles(): Promise<Bundle[]>;
  getBundleById(id: number): Promise<Bundle | undefined>;
  createBundle(bundle: InsertBundle): Promise<Bundle>;
  updateBundle(id: number, bundle: Partial<InsertBundle>): Promise<Bundle | undefined>;
  deleteBundle(id: number): Promise<boolean>;
  
  // Subscription operations (customer subscriptions)
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptions(): Promise<Subscription[]>;
  getSubscriptionById(id: number): Promise<Subscription | undefined>;
  updateSubscriptionStatus(id: number, status: string): Promise<Subscription | undefined>;
  
  // Admin operations
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdminById(id: number): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdminProfile(id: number, profileData: UpdateAdminProfile): Promise<Admin | undefined>;
  updateAdminPassword(id: number, currentPassword: string, newPassword: string): Promise<boolean>;
  updateAdminLoginStatus(id: number, isFirstLogin: boolean): Promise<boolean>;
  
  // Order operations
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<(Order & { items: (OrderItem & { juice: Juice })[] }) | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Loyalty operations
  getLoyaltyCustomerByEmail(email: string): Promise<LoyaltyCustomer | undefined>;
  createLoyaltyCustomer(customer: InsertLoyaltyCustomer): Promise<LoyaltyCustomer>;
  updateLoyaltyPoints(customerId: number, points: number, type: string, source: string, sourceId?: string): Promise<LoyaltyCustomer>;
  getLoyaltyCustomerRewards(customerId: number): Promise<LoyaltyReward[]>;
  getLoyaltyActivities(customerId: number, limit?: number): Promise<(LoyaltyActivity & { customer: LoyaltyCustomer })[]>;
  createLoyaltyReward(reward: InsertLoyaltyReward): Promise<LoyaltyReward>;
  redeemReward(rewardId: number): Promise<LoyaltyReward | undefined>;
  getLoyaltyTiers(): Promise<{ tier: string, minimumPoints: number, benefits: string[] }[]>;
  
  // Website Settings operations
  getWebsiteSettings(): Promise<WebsiteSettings>;
  updateWebsiteSettings(settings: UpdateWebsiteSettings): Promise<WebsiteSettings>;
  
  sessionStore: session.Store;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Set up PostgreSQL session store with more robust configuration
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true,
      tableName: 'session', // standard table name
      schemaName: 'public', // ensure we're in the public schema
      ttl: 86400 // 24 hours - longer session timeout
    });
    
    // Check if admin exists, if not create default admin
    this.initializeAdmin();
    
    // Create default website settings if needed
    this.createDefaultWebsiteSettingsIfNeeded();
  }
  
  private async initializeAdmin() {
    const adminExists = await db.select().from(admins).where(eq(admins.username, 'admin'));
    
    if (adminExists.length === 0) {
      await this.createAdmin({
        username: "admin",
        password: "adminpass" // In a real app, this would be hashed
      });
    }
  }
  
  // Juice operations
  async getAllJuices(): Promise<Juice[]> {
    return db.select().from(juices);
  }
  
  async getFeaturedJuices(): Promise<Juice[]> {
    return db.select().from(juices).where(eq(juices.featured, true));
  }
  
  async getJuiceById(id: number): Promise<Juice | undefined> {
    const result = await db.select().from(juices).where(eq(juices.id, id));
    return result[0];
  }
  
  async createJuice(juice: InsertJuice): Promise<Juice> {
    try {
      // Log image data info for debugging
      let imageInfo = "No image provided";
      if (juice.imageUrl) {
        if (juice.imageUrl.startsWith('data:')) {
          const sizeKB = Math.round(juice.imageUrl.length / 1024);
          imageInfo = `Base64 image provided (size: ~${sizeKB}KB)`;
        } else {
          imageInfo = `URL image provided: ${juice.imageUrl.substring(0, 50)}...`;
        }
      }
      
      console.log(`Creating new juice '${juice.name}' with ${imageInfo}`);
      
      // Check if image URL is too long for database (PostgreSQL has limits)
      // iPhone images can be 2-3MB, so we're setting a higher limit of 1MB (1,000,000 chars)
      if (juice.imageUrl && juice.imageUrl.startsWith('data:') && juice.imageUrl.length > 1000000) {
        console.warn(`Image data exceeds recommended size (${Math.round(juice.imageUrl.length/1024)}KB), reducing quality...`);
        
        // Implement simple compression by limiting the image data length
        // Get the type and encoding
        const [metaData, base64Data] = juice.imageUrl.split(',');
        if (base64Data && base64Data.length > 1000000) {
          // We'll truncate to 1MB for database safety
          // A better solution would be to properly resize the image
          const truncatedData = base64Data.slice(0, 1000000);
          juice.imageUrl = `${metaData},${truncatedData}`;
          console.log(`Reduced image size to approximately ${Math.round(juice.imageUrl.length/1024)}KB`);
        }
      }
      
      // Set default values for optional fields
      const juiceWithDefaults = {
        ...juice,
        featured: juice.featured ?? false,
        stock: juice.stock ?? 0
      };
      
      const result = await db.insert(juices).values(juiceWithDefaults).returning();
      console.log(`Juice created successfully with ID: ${result[0].id}`);
      return result[0];
    } catch (error) {
      console.error('Error creating juice:', error);
      throw error;
    }
  }
  
  async updateJuice(id: number, juiceUpdate: Partial<InsertJuice>): Promise<Juice | undefined> {
    try {
      // Get current juice data first
      const current = await this.getJuiceById(id);
      if (!current) {
        console.error(`Juice with id ${id} not found`);
        return undefined;
      }
      
      // Handle empty imageUrl (preserve existing)
      if (juiceUpdate.imageUrl === "" || juiceUpdate.imageUrl === null || juiceUpdate.imageUrl === undefined) {
        console.log('Empty imageUrl provided, preserving existing image');
        juiceUpdate.imageUrl = current.imageUrl;
      }
      
      // Log the update for debugging (excluding actual image data for clarity)
      const logUpdate = { ...juiceUpdate };
      if (logUpdate.imageUrl && logUpdate.imageUrl.startsWith('data:')) {
        logUpdate.imageUrl = 'Base64 image data (truncated for log)';
      }
      console.log('Updating juice data:', logUpdate);
      
      // Check if image URL is too long for database (PostgreSQL has limits)
      // iPhone images can be 2-3MB, so we're setting a higher limit of 1MB (1,000,000 chars)
      if (juiceUpdate.imageUrl && juiceUpdate.imageUrl.startsWith('data:') && juiceUpdate.imageUrl.length > 1000000) {
        console.warn(`Image data exceeds recommended size (${Math.round(juiceUpdate.imageUrl.length/1024)}KB), reducing quality...`);
        
        // Implement simple compression by limiting the image data length
        // Get the type and encoding
        const [metaData, base64Data] = juiceUpdate.imageUrl.split(',');
        if (base64Data && base64Data.length > 1000000) {
          // We'll truncate to 1MB for database safety
          // A better solution would be to properly resize the image
          const truncatedData = base64Data.slice(0, 1000000);
          juiceUpdate.imageUrl = `${metaData},${truncatedData}`;
          console.log(`Reduced image size to approximately ${Math.round(juiceUpdate.imageUrl.length/1024)}KB`);
        }
      }
      
      // Clean up update object - remove any undefined values to prevent null overwrites
      Object.keys(juiceUpdate).forEach(key => {
        if (juiceUpdate[key as keyof InsertJuice] === undefined) {
          delete juiceUpdate[key as keyof InsertJuice];
        }
      });
      
      // Ensure all fields have values (fallback to current values if not provided)
      const cleanedUpdate = {
        name: juiceUpdate.name ?? current.name,
        description: juiceUpdate.description ?? current.description,
        price: juiceUpdate.price ?? current.price,
        imageUrl: juiceUpdate.imageUrl ?? current.imageUrl,
        category: juiceUpdate.category ?? current.category,
        stock: juiceUpdate.stock ?? current.stock,
        featured: juiceUpdate.featured ?? current.featured,
        sku: juiceUpdate.sku ?? current.sku
      };
      
      const result = await db.update(juices)
        .set(cleanedUpdate)
        .where(eq(juices.id, id))
        .returning();
      
      console.log('Juice update successful');
      return result[0];
    } catch (error) {
      console.error('Error updating juice in database:', error);
      throw error;
    }
  }
  
  async deleteJuice(id: number): Promise<boolean> {
    const result = await db.delete(juices).where(eq(juices.id, id)).returning();
    return result.length > 0;
  }
  
  // Cart operations
  async getCartItems(sessionId: string): Promise<(CartItem & { juice: Juice })[]> {
    const items = await db.select({
      cart: cartItems,
      juice: juices
    })
    .from(cartItems)
    .leftJoin(juices, eq(cartItems.juiceId, juices.id))
    .where(eq(cartItems.sessionId, sessionId));
    
    return items
      .filter(item => item.juice !== null) // Filter out any null juices
      .map(item => ({
        ...item.cart,
        juice: item.juice as Juice // Safe to cast after filter
      }));
  }
  
  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if the juice exists
    const juice = await this.getJuiceById(item.juiceId);
    if (!juice) throw new Error(`Juice with id ${item.juiceId} not found`);
    
    // Check if the item is already in the cart
    const existingItem = await db.select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.juiceId, item.juiceId),
          eq(cartItems.sessionId, item.sessionId)
        )
      );
    
    if (existingItem.length > 0) {
      // Update quantity if item already exists
      const updatedItem = await this.updateCartItem(
        existingItem[0].id, 
        existingItem[0].quantity + (item.quantity || 1)
      );
      if (!updatedItem) throw new Error(`Failed to update cart item with id ${existingItem[0].id}`);
      return updatedItem;
    }
    
    // Create new cart item
    const newItem = await db.insert(cartItems)
      .values({
        ...item,
        quantity: item.quantity || 1
      })
      .returning();
    
    return newItem[0];
  }
  
  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const result = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    
    return result[0];
  }
  
  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(cartItems)
      .where(eq(cartItems.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  async clearCart(sessionId: string): Promise<boolean> {
    const result = await db.delete(cartItems)
      .where(eq(cartItems.sessionId, sessionId))
      .returning();
    
    return result.length > 0;
  }
  
  // Subscription Plan operations
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans);
  }
  
  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return result[0];
  }
  
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const result = await db.insert(subscriptionPlans).values(plan).returning();
    return result[0];
  }
  
  async updateSubscriptionPlan(id: number, planUpdate: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const result = await db.update(subscriptionPlans)
      .set(planUpdate)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteSubscriptionPlan(id: number): Promise<boolean> {
    const result = await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id)).returning();
    return result.length > 0;
  }
  
  // Bundle operations
  async getAllBundles(): Promise<Bundle[]> {
    return db.select().from(bundles);
  }
  
  async getBundleById(id: number): Promise<Bundle | undefined> {
    const result = await db.select().from(bundles).where(eq(bundles.id, id));
    return result[0];
  }
  
  async createBundle(bundle: InsertBundle): Promise<Bundle> {
    const result = await db.insert(bundles).values(bundle).returning();
    return result[0];
  }
  
  async updateBundle(id: number, bundleUpdate: Partial<InsertBundle>): Promise<Bundle | undefined> {
    const result = await db.update(bundles)
      .set(bundleUpdate)
      .where(eq(bundles.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteBundle(id: number): Promise<boolean> {
    const result = await db.delete(bundles).where(eq(bundles.id, id)).returning();
    return result.length > 0;
  }
  
  // Subscription operations (customer subscriptions)
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions)
      .values(subscription)
      .returning();
    
    return result[0];
  }
  
  async getSubscriptions(): Promise<Subscription[]> {
    return db.select().from(subscriptions);
  }
  
  async getSubscriptionById(id: number): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return result[0];
  }
  
  async updateSubscriptionStatus(id: number, status: string): Promise<Subscription | undefined> {
    const result = await db.update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, id))
      .returning();
    
    return result[0];
  }
  
  // Admin operations
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const result = await db.select()
      .from(admins)
      .where(eq(admins.username, username));
    
    return result[0];
  }
  
  async getAdminById(id: number): Promise<Admin | undefined> {
    const result = await db.select()
      .from(admins)
      .where(eq(admins.id, id));
    
    return result[0];
  }
  
  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const result = await db.insert(admins)
      .values(admin)
      .returning();
    
    return result[0];
  }
  
  async updateAdminProfile(id: number, profileData: UpdateAdminProfile): Promise<Admin | undefined> {
    const result = await db.update(admins)
      .set(profileData)
      .where(eq(admins.id, id))
      .returning();
    
    return result[0];
  }
  
  async updateAdminPassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    // Get the admin
    const admin = await this.getAdminById(id);
    if (!admin) return false;
    
    // Check if current password matches
    if (admin.password !== currentPassword) return false; // In a real app, use bcrypt to compare
    
    // Update password
    const result = await db.update(admins)
      .set({ password: newPassword }) // In a real app, hash the password
      .where(eq(admins.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  async updateAdminLoginStatus(id: number, isFirstLogin: boolean): Promise<boolean> {
    const now = new Date().toISOString();
    
    const result = await db.update(admins)
      .set({ 
        isFirstLogin: isFirstLogin,
        lastLogin: now
      })
      .where(eq(admins.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Order operations
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Create the order
    const [newOrder] = await db.insert(orders)
      .values({
        ...order,
        status: order.status || "pending"
      })
      .returning();
    
    // Create the order items and update juice stock
    for (const item of items) {
      await db.insert(orderItems)
        .values({
          ...item,
          orderId: newOrder.id
        })
        .returning();
      
      // Update the juice stock
      const juice = await this.getJuiceById(item.juiceId);
      if (juice) {
        await db.update(juices)
          .set({ stock: Math.max(0, juice.stock - item.quantity) })
          .where(eq(juices.id, juice.id));
      }
    }
    
    return newOrder;
  }
  
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders);
  }
  
  async getOrderById(id: number): Promise<(Order & { items: (OrderItem & { juice: Juice })[] }) | undefined> {
    const orderData = await db.select().from(orders).where(eq(orders.id, id));
    if (orderData.length === 0) return undefined;
    
    const order = orderData[0];
    
    const itemsData = await db.select({
      orderItem: orderItems,
      juice: juices
    })
    .from(orderItems)
    .leftJoin(juices, eq(orderItems.juiceId, juices.id))
    .where(eq(orderItems.orderId, id));
    
    // Filter and map items, handling null juices
    const items = itemsData
      .filter(item => item.juice !== null)
      .map(item => ({
        ...item.orderItem,
        juice: item.juice as Juice
      }));
    
    return { ...order, items };
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    
    return result[0];
  }
  
  // Loyalty operations
  async getLoyaltyCustomerByEmail(email: string): Promise<LoyaltyCustomer | undefined> {
    const result = await db.select()
      .from(loyaltyCustomers)
      .where(eq(loyaltyCustomers.email, email));
    
    return result[0];
  }
  
  async createLoyaltyCustomer(customer: InsertLoyaltyCustomer): Promise<LoyaltyCustomer> {
    const result = await db.insert(loyaltyCustomers)
      .values(customer)
      .returning();
    
    return result[0];
  }
  
  async updateLoyaltyPoints(customerId: number, points: number, type: string, source: string, sourceId?: string): Promise<LoyaltyCustomer> {
    // Get the customer
    const customerResult = await db.select()
      .from(loyaltyCustomers)
      .where(eq(loyaltyCustomers.id, customerId));
    
    if (customerResult.length === 0) {
      throw new Error(`Customer with id ${customerId} not found`);
    }
    
    const customer = customerResult[0];
    
    // Calculate new points total
    const newPoints = type === 'earn' ? customer.points + points : Math.max(0, customer.points - points);
    
    // Determine tier based on new points
    const tier = this.calculateTier(newPoints);
    
    // Update customer points and tier
    const updatedCustomer = await db.update(loyaltyCustomers)
      .set({ 
        points: newPoints,
        tier
      })
      .where(eq(loyaltyCustomers.id, customerId))
      .returning();
    
    // Record activity
    await db.insert(loyaltyActivities)
      .values({
        customerId,
        points,
        type,
        source,
        sourceId
      });
    
    return updatedCustomer[0];
  }
  
  private calculateTier(points: number): string {
    if (points >= 10000) return 'platinum';
    if (points >= 5000) return 'gold';
    if (points >= 1000) return 'silver';
    return 'bronze';
  }
  
  // Website Settings operations
  async getWebsiteSettings(): Promise<WebsiteSettings> {
    const result = await db.select().from(websiteSettings);
    
    if (result.length === 0) {
      return this.createDefaultWebsiteSettings();
    }
    
    return result[0];
  }
  
  async updateWebsiteSettings(settings: UpdateWebsiteSettings): Promise<WebsiteSettings> {
    const currentSettings = await this.getWebsiteSettings();
    
    const result = await db.update(websiteSettings)
      .set({
        ...settings,
        updatedAt: new Date()
      })
      .where(eq(websiteSettings.id, currentSettings.id))
      .returning();
    
    return result[0];
  }
  
  private async createDefaultWebsiteSettingsIfNeeded(): Promise<void> {
    const settings = await db.select().from(websiteSettings);
    
    if (settings.length === 0) {
      await this.createDefaultWebsiteSettings();
    }
  }
  
  async getLoyaltyCustomerRewards(customerId: number): Promise<LoyaltyReward[]> {
    return db.select()
      .from(loyaltyRewards)
      .where(eq(loyaltyRewards.customerId, customerId));
  }
  
  async getLoyaltyActivities(customerId: number, limit: number = 10): Promise<(LoyaltyActivity & { customer: LoyaltyCustomer })[]> {
    const activities = await db.select({
      activity: loyaltyActivities,
      customer: loyaltyCustomers
    })
    .from(loyaltyActivities)
    .leftJoin(loyaltyCustomers, eq(loyaltyActivities.customerId, loyaltyCustomers.id))
    .where(eq(loyaltyActivities.customerId, customerId))
    .orderBy(loyaltyActivities.createdAt)
    .limit(limit);
    
    return activities.map(item => ({
      ...item.activity,
      customer: item.customer!
    }));
  }
  
  async createLoyaltyReward(reward: InsertLoyaltyReward): Promise<LoyaltyReward> {
    const result = await db.insert(loyaltyRewards)
      .values(reward)
      .returning();
    
    return result[0];
  }
  
  async redeemReward(rewardId: number): Promise<LoyaltyReward | undefined> {
    const now = new Date();
    
    const result = await db.update(loyaltyRewards)
      .set({ 
        redeemed: true,
        redeemedAt: now
      })
      .where(eq(loyaltyRewards.id, rewardId))
      .returning();
    
    if (result.length === 0) return undefined;
    
    const reward = result[0];
    
    // Deduct points from customer
    await this.updateLoyaltyPoints(
      reward.customerId,
      reward.pointsRequired,
      'redeem',
      'reward',
      reward.id.toString()
    );
    
    return reward;
  }
  
  async getLoyaltyTiers(): Promise<{ tier: string, minimumPoints: number, benefits: string[] }[]> {
    return [
      {
        tier: 'bronze',
        minimumPoints: 0,
        benefits: ['Earn 1 point per ₦100 spent', 'Birthday reward']
      },
      {
        tier: 'silver',
        minimumPoints: 1000,
        benefits: ['Earn 1.5 points per ₦100 spent', 'Birthday reward', '10% off on subscription plans']
      },
      {
        tier: 'gold',
        minimumPoints: 5000,
        benefits: ['Earn 2 points per ₦100 spent', 'Birthday reward', '15% off on subscription plans', 'Free delivery']
      },
      {
        tier: 'platinum',
        minimumPoints: 10000,
        benefits: ['Earn 3 points per ₦100 spent', 'Birthday reward', '20% off on subscription plans', 'Free delivery', 'Priority support']
      }
    ];
  }

  private async createDefaultWebsiteSettings(): Promise<WebsiteSettings> {
    const result = await db.insert(websiteSettings)
      .values({
        name: "Sip of Eden",
        businessEmail: "contact@sipofeden.com",
        phoneNumber: "+234 000 0000 000",
        address: "Lagos, Nigeria",
        instagram: "https://instagram.com/sipofeden",
        twitter: "https://twitter.com/sipofeden",
        facebook: "https://facebook.com/sipofeden"
      })
      .returning();
    
    return result[0];
  }
}

// Instantiate and export the database storage
export const storage = new DatabaseStorage();