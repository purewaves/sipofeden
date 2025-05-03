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
  AdminNotificationSubscription, UpdateAdminNotificationSubscription,
  juices, cartItems, subscriptionPlans, subscriptions, bundles, admins, orders, orderItems,
  loyaltyCustomers, loyaltyRewards, loyaltyActivities, websiteSettings, adminNotificationSubscriptions
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import memorystore from 'memorystore';

const MemoryStore = memorystore(session);

// Define a type for the result of execute() for insert/update/delete
// Adjust this based on the actual driver's return type if necessary
type DrizzleExecuteResult = { 
  rowCount?: number;
  // Add other potential properties based on driver
};

// Helper function to check if an execute result indicates success (e.g., rows affected)
function wasSuccessful(result: DrizzleExecuteResult | any): boolean {
  // Neon/pg driver might return metadata directly or an array with metadata
  const actualResult = Array.isArray(result) ? result[0] : result;
  // Check if rowCount exists and is greater than 0
  return actualResult && typeof actualResult.rowCount === 'number' && actualResult.rowCount > 0;
}

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
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan | undefined>;
  updateSubscriptionPlan(id: number, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: number): Promise<boolean>;
  
  // Bundle operations
  getAllBundles(): Promise<Bundle[]>;
  getBundleById(id: number): Promise<Bundle | undefined>;
  createBundle(bundle: InsertBundle): Promise<Bundle | undefined>;
  updateBundle(id: number, bundle: Partial<InsertBundle>): Promise<Bundle | undefined>;
  deleteBundle(id: number): Promise<boolean>;
  
  // Subscription operations (customer subscriptions)
  createSubscription(subscription: InsertSubscription): Promise<Subscription | undefined>;
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
  createLoyaltyCustomer(customer: InsertLoyaltyCustomer): Promise<LoyaltyCustomer | undefined>;
  updateLoyaltyPoints(customerId: number, points: number, type: string, source: string, sourceId?: string): Promise<LoyaltyCustomer | undefined>;
  getLoyaltyCustomerRewards(customerId: number): Promise<LoyaltyReward[]>;
  getLoyaltyActivities(customerId: number, limit?: number): Promise<(LoyaltyActivity & { customer: LoyaltyCustomer })[]>;
  createLoyaltyReward(reward: InsertLoyaltyReward): Promise<LoyaltyReward | undefined>;
  redeemReward(rewardId: number): Promise<LoyaltyReward | undefined>;
  getLoyaltyTiers(): Promise<{ tier: string, minimumPoints: number, benefits: string[] }[]>;
  
  // Website Settings operations
  getWebsiteSettings(): Promise<WebsiteSettings>;
  updateWebsiteSettings(settings: UpdateWebsiteSettings): Promise<WebsiteSettings | undefined>;
  
  // Admin Notification Subscriptions
  saveNotificationSubscription(adminId: number, subscription: string, userAgent?: string, deviceName?: string): Promise<AdminNotificationSubscription>;
  getAdminNotificationSubscriptions(adminId: number): Promise<AdminNotificationSubscription[]>;
  updateNotificationSubscription(id: number, data: UpdateAdminNotificationSubscription): Promise<AdminNotificationSubscription | undefined>;
  deleteNotificationSubscription(id: number): Promise<boolean>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Use MemoryStore instead of PostgreSQL session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
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
      // iPhone images can be much larger, so we're now allowing up to 10MB (10,000,000 chars)
      const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10MB
      if (juice.imageUrl && juice.imageUrl.startsWith('data:') && juice.imageUrl.length > MAX_BASE64_SIZE) {
        console.warn(`Image data exceeds recommended size (${Math.round(juice.imageUrl.length/1024)}KB), reducing quality...`);
        
        // Implement simple compression by limiting the image data length
        // Get the type and encoding
        const [metaData, base64Data] = juice.imageUrl.split(',');
        if (base64Data && base64Data.length > MAX_BASE64_SIZE) {
          // We'll truncate to 10MB for database safety - this should support most modern images
          const truncatedData = base64Data.slice(0, MAX_BASE64_SIZE);
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
      
      // Use returning() to get the created juice
      const result = await db.insert(juices)
        .values(juiceWithDefaults)
        .returning()
        .execute();
      
      if (!result || result.length === 0) {
        throw new Error('Failed to create juice');
      }
      
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
      // iPhone images can be much larger, so we're now allowing up to 10MB (10,000,000 chars)
      const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10MB
      if (juiceUpdate.imageUrl && juiceUpdate.imageUrl.startsWith('data:') && juiceUpdate.imageUrl.length > MAX_BASE64_SIZE) {
        console.warn(`Image data exceeds recommended size (${Math.round(juiceUpdate.imageUrl.length/1024)}KB), reducing quality...`);
        
        // Implement simple compression by limiting the image data length
        // Get the type and encoding
        const [metaData, base64Data] = juiceUpdate.imageUrl.split(',');
        if (base64Data && base64Data.length > MAX_BASE64_SIZE) {
          // Truncate to 10MB for database safety - this should support most modern images
          const truncatedData = base64Data.slice(0, MAX_BASE64_SIZE);
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
      
      // Use returning() to get the updated juice
      const result = await db.update(juices)
        .set(cleanedUpdate)
        .where(eq(juices.id, id))
        .returning()
        .execute();
      
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error updating juice:', error);
      throw error;
    }
  }
  
  async deleteJuice(id: number): Promise<boolean> {
    const result = await db.delete(juices).where(eq(juices.id, id)).execute();
    return wasSuccessful(result);
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
    try {
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
        const newQuantity = existingItem[0].quantity + (item.quantity || 1);
        
        // Update the cart item and return it
        const result = await db.update(cartItems)
          .set({ quantity: newQuantity })
          .where(eq(cartItems.id, existingItem[0].id))
          .returning()
          .execute();
        
        if (!result || result.length === 0) {
          throw new Error(`Failed to update cart item with id ${existingItem[0].id}`);
        }
        
        return result[0];
      }
      
      // Create new cart item
      const result = await db.insert(cartItems)
        .values({
          ...item,
          quantity: item.quantity || 1
        })
        .returning() // Use returning() to get the inserted data
        .execute();
      
      if (!result || result.length === 0) {
        throw new Error("Failed to add item to cart");
      }
      
      return result[0];
    } catch (error) {
      console.error("Error in addToCart:", error);
      throw error;
    }
  }
  
  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    try {
      const result = await db.update(cartItems)
        .set({ quantity })
        .where(eq(cartItems.id, id))
        .returning()
        .execute();
      
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Error updating cart item ${id}:`, error);
      return undefined;
    }
  }
  
  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(cartItems)
      .where(eq(cartItems.id, id))
      .execute();
    
    return wasSuccessful(result);
  }
  
  async clearCart(sessionId: string): Promise<boolean> {
    const result = await db.delete(cartItems)
      .where(eq(cartItems.sessionId, sessionId))
      .execute();
    
    return wasSuccessful(result);
  }
  
  // Subscription Plan operations
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans);
  }
  
  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return result[0];
  }
  
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan | undefined> {
    const result = await db.insert(subscriptionPlans).values(plan).returning().execute();
    return result && result.length > 0 ? result[0] : undefined;
  }
  
  async updateSubscriptionPlan(id: number, planUpdate: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const result = await db.update(subscriptionPlans)
      .set(planUpdate)
      .where(eq(subscriptionPlans.id, id))
      .returning()
      .execute();
    
    return result && result.length > 0 ? result[0] : undefined;
  }
  
  async deleteSubscriptionPlan(id: number): Promise<boolean> {
    const result = await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id)).execute();
    return wasSuccessful(result);
  }
  
  // Bundle operations
  async getAllBundles(): Promise<Bundle[]> {
    return db.select().from(bundles);
  }
  
  async getBundleById(id: number): Promise<Bundle | undefined> {
    const result = await db.select().from(bundles).where(eq(bundles.id, id));
    return result[0];
  }
  
  async createBundle(bundle: InsertBundle): Promise<Bundle | undefined> {
    const result = await db.insert(bundles).values(bundle).returning().execute();
    return result && result.length > 0 ? result[0] : undefined;
  }
  
  async updateBundle(id: number, bundleUpdate: Partial<InsertBundle>): Promise<Bundle | undefined> {
    const result = await db.update(bundles)
      .set(bundleUpdate)
      .where(eq(bundles.id, id))
      .returning()
      .execute();
    
    return result && result.length > 0 ? result[0] : undefined;
  }
  
  async deleteBundle(id: number): Promise<boolean> {
    const result = await db.delete(bundles).where(eq(bundles.id, id)).execute();
    return wasSuccessful(result);
  }
  
  // Subscription operations (customer subscriptions)
  async createSubscription(subscription: InsertSubscription): Promise<Subscription | undefined> {
    const result = await db.insert(subscriptions)
      .values(subscription)
      .returning()
      .execute();
    
    return result && result.length > 0 ? result[0] : undefined;
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
      .returning()
      .execute();
    
    return result && result.length > 0 ? result[0] : undefined;
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
    // Use returning() to get the created admin
    const result = await db.insert(admins)
      .values(admin)
      .returning()
      .execute();
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create admin');
    }
    
    return result[0];
  }
  
  async updateAdminProfile(id: number, profileData: UpdateAdminProfile): Promise<Admin | undefined> {
    const result = await db.update(admins)
      .set(profileData)
      .where(eq(admins.id, id))
      .returning()
      .execute();
    
    return result && result.length > 0 ? result[0] : undefined;
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
      .execute();
    
    return wasSuccessful(result);
  }
  
  async updateAdminLoginStatus(id: number, isFirstLogin: boolean): Promise<boolean> {
    const now = new Date().toISOString();
    
    const result = await db.update(admins)
      .set({ 
        isFirstLogin: isFirstLogin,
        lastLogin: now
      })
      .where(eq(admins.id, id))
      .execute();
    
    return wasSuccessful(result);
  }
  
  // Order operations
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    try {
      console.log("Creating new order with validated data:", { 
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        itemCount: items.length,
        total: order.total 
      });
      
      // Create the order using validated InsertOrder data
      const orderResult = await db.insert(orders)
        .values({
          customerName: order.customerName, // Use validated customerName
          customerEmail: order.customerEmail, // Use validated customerEmail
          total: order.total, // Use validated total
          status: order.status || "pending", // Use validated status or default
          createdAt: order.createdAt || new Date().toISOString() // Use validated createdAt or default
        })
        .returning()
        .execute();
      
      if (!orderResult || !orderResult.length) {
        throw new Error("Failed to create order record in database");
      }
      
      const newOrder = orderResult[0];
      console.log("Order created successfully with ID:", newOrder.id);
      
      // Create the order items and update juice stock
      for (const item of items) {
        console.log(`Processing order item for juice ID: ${item.juiceId}, quantity: ${item.quantity}`);
        
        // Check if juice exists first
        const juice = await this.getJuiceById(item.juiceId);
        if (!juice) {
          console.error(`Juice with ID ${item.juiceId} not found, cannot add to order`);
          throw new Error(`Juice with ID ${item.juiceId} not found`);
        }
        
        // Create the order item
        await db.insert(orderItems)
          .values({
            orderId: newOrder.id, // Link to the created order
            juiceId: item.juiceId,
            quantity: item.quantity,
            price: item.price // Use the price from the item data
          })
          .execute();
        
        // Update the juice stock
        await db.update(juices)
          .set({ stock: Math.max(0, juice.stock - item.quantity) })
          .where(eq(juices.id, juice.id))
          .execute();
          
        console.log(`Updated stock for juice ID ${juice.id} to ${Math.max(0, juice.stock - item.quantity)}`);
      }
      
      return newOrder;
    } catch (error: unknown) { // Catch unknown type
      console.error("Error creating order:", error);
      // Type guard for specific error properties
      if (error instanceof Error) { // Check if it's a basic Error
        // Check for code property existence more safely
        const pgError = error as any; // Use 'any' carefully for property checking
        if (pgError.code) {
          console.error(`Database error code: ${pgError.code}, message: ${pgError.message}`);
        } else {
          console.error("Non-database error:", error.message);
        }
      } else {
         console.error("An unknown error occurred:", error);
      }
      throw new Error("Failed to create order due to a database error.");
    }
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
      .returning()
      .execute();
    
    return result && result.length > 0 ? result[0] : undefined;
  }
  
  // Loyalty operations
  async getLoyaltyCustomerByEmail(email: string): Promise<LoyaltyCustomer | undefined> {
    const result = await db.select()
      .from(loyaltyCustomers)
      .where(eq(loyaltyCustomers.email, email));
    
    return result[0];
  }
  
  async createLoyaltyCustomer(customer: InsertLoyaltyCustomer): Promise<LoyaltyCustomer | undefined> {
    const result = await db.insert(loyaltyCustomers)
      .values(customer)
      .returning()
      .execute();
    
    return result && result.length > 0 ? result[0] : undefined;
  }
  
  async updateLoyaltyPoints(customerId: number, points: number, type: string, source: string, sourceId?: string): Promise<LoyaltyCustomer | undefined> {
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
    const updateResult = await db.update(loyaltyCustomers)
      .set({ 
        points: newPoints,
        tier
      })
      .where(eq(loyaltyCustomers.id, customerId))
      .returning()
      .execute();
    
    // Record activity
    await db.insert(loyaltyActivities)
      .values({
        customerId,
        points,
        type,
        source,
        sourceId
      })
      .execute();
    
    return updateResult[0];
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
  
  async updateWebsiteSettings(settings: UpdateWebsiteSettings): Promise<WebsiteSettings | undefined> {
    const currentSettings = await this.getWebsiteSettings();
    
    const result = await db.update(websiteSettings)
      .set({
        ...settings,
        updatedAt: new Date()
      })
      .where(eq(websiteSettings.id, currentSettings.id))
      .returning()
      .execute();
    
    return result && result.length > 0 ? result[0] : undefined;
  }
  
  private async createDefaultWebsiteSettingsIfNeeded(): Promise<void> {
    try {
      const settings = await db.select().from(websiteSettings);
      
      if (settings.length === 0) {
        console.log("Creating default website settings...");
        await this.createDefaultWebsiteSettings();
      }
    } catch (error) {
      console.log("Creating website_settings table and default settings...");
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
  
  async createLoyaltyReward(reward: InsertLoyaltyReward): Promise<LoyaltyReward | undefined> {
    const result = await db.insert(loyaltyRewards)
      .values(reward)
      .returning()
      .execute();
    
    return result && result.length > 0 ? result[0] : undefined;
  }
  
  async redeemReward(rewardId: number): Promise<LoyaltyReward | undefined> {
    const now = new Date();
    
    const result = await db.update(loyaltyRewards)
      .set({ 
        redeemed: true,
        redeemedAt: now
      })
      .where(eq(loyaltyRewards.id, rewardId))
      .returning()
      .execute();
    
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
      .returning() // Ensure we get the created settings back
      .execute();
    
    if (!result || result.length === 0) {
      throw new Error("Failed to create default website settings");
    }
    return result[0];
  }
  
  // Admin Notification Subscriptions
  async saveNotificationSubscription(
    adminId: number, 
    subscription: string, 
    userAgent?: string, 
    deviceName?: string
  ): Promise<AdminNotificationSubscription> {
    try {
      console.log(`Saving notification subscription for admin ID ${adminId}`);
      
      // Check if admin exists
      const admin = await this.getAdminById(adminId);
      if (!admin) {
        throw new Error(`Admin with ID ${adminId} not found`);
      }
      
      // Check if subscription already exists for this admin/device
      const existingSubscriptions = await db.select()
        .from(adminNotificationSubscriptions)
        .where(
          and(
            eq(adminNotificationSubscriptions.adminId, adminId),
            eq(adminNotificationSubscriptions.subscription, subscription)
          )
        );
      
      // If it exists, update it
      if (existingSubscriptions.length > 0) {
        console.log(`Updating existing subscription for admin ID ${adminId}`);
        const [updatedSubscription] = await db.update(adminNotificationSubscriptions)
          .set({
            active: true,
            lastUsedAt: new Date(),
            userAgent: userAgent || existingSubscriptions[0].userAgent,
            deviceName: deviceName || existingSubscriptions[0].deviceName
          })
          .where(eq(adminNotificationSubscriptions.id, existingSubscriptions[0].id))
          .returning()
          .execute();
        
        return updatedSubscription;
      }
      
      // Otherwise, create a new one
      console.log(`Creating new subscription for admin ID ${adminId}`);
      const [newSubscription] = await db.insert(adminNotificationSubscriptions)
        .values({
          adminId,
          subscription,
          userAgent,
          deviceName: deviceName || `Device ${Math.floor(Math.random() * 1000)}`,
          active: true
        })
        .returning()
        .execute();
      
      return newSubscription;
    } catch (error) {
      console.error('Error saving notification subscription:', error);
      throw error;
    }
  }
  
  async getAdminNotificationSubscriptions(adminId: number): Promise<AdminNotificationSubscription[]> {
    try {
      return db.select()
        .from(adminNotificationSubscriptions)
        .where(
          and(
            eq(adminNotificationSubscriptions.adminId, adminId),
            eq(adminNotificationSubscriptions.active, true)
          )
        );
    } catch (error) {
      console.error('Error getting admin notification subscriptions:', error);
      throw error;
    }
  }
  
  async updateNotificationSubscription(
    id: number, 
    data: UpdateAdminNotificationSubscription
  ): Promise<AdminNotificationSubscription | undefined> {
    try {
      const result = await db.update(adminNotificationSubscriptions)
        .set({
          ...data,
          lastUsedAt: new Date()
        })
        .where(eq(adminNotificationSubscriptions.id, id))
        .returning()
        .execute();
      
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error updating notification subscription:', error);
      throw error;
    }
  }
  
  async deleteNotificationSubscription(id: number): Promise<boolean> {
    try {
      const result = await db.delete(adminNotificationSubscriptions)
        .where(eq(adminNotificationSubscriptions.id, id))
        .execute();
      
      return wasSuccessful(result);
    } catch (error) {
      console.error('Error deleting notification subscription:', error);
      throw error;
    }
  }
}

// Instantiate and export the database storage
export const storage = new DatabaseStorage();