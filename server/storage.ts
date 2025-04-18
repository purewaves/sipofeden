import { 
  Juice, InsertJuice, 
  CartItem, InsertCartItem, 
  Subscription, InsertSubscription, 
  Admin, InsertAdmin,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  juices, cartItems, subscriptions, admins, orders, orderItems
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
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptions(): Promise<Subscription[]>;
  
  // Admin operations
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  // Order operations
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<(Order & { items: (OrderItem & { juice: Juice })[] }) | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  sessionStore: session.Store;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Check if admin exists, if not create default admin
    this.initializeAdmin();
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
    const result = await db.insert(juices).values(juice).returning();
    return result[0];
  }
  
  async updateJuice(id: number, juiceUpdate: Partial<InsertJuice>): Promise<Juice | undefined> {
    const result = await db.update(juices)
      .set(juiceUpdate)
      .where(eq(juices.id, id))
      .returning();
    
    return result[0];
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
    
    return items.map(item => ({
      ...item.cart,
      juice: item.juice
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
  
  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions)
      .values(subscription)
      .returning();
    
    return result[0];
  }
  
  async getSubscriptions(): Promise<Subscription[]> {
    return db.select().from(subscriptions);
  }
  
  // Admin operations
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const result = await db.select()
      .from(admins)
      .where(eq(admins.username, username));
    
    return result[0];
  }
  
  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const result = await db.insert(admins)
      .values(admin)
      .returning();
    
    return result[0];
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
    
    const items = itemsData.map(item => ({
      ...item.orderItem,
      juice: item.juice
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
}

// Instantiate and export the database storage
export const storage = new DatabaseStorage();