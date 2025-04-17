import { 
  Juice, InsertJuice, 
  CartItem, InsertCartItem, 
  Subscription, InsertSubscription, 
  Admin, InsertAdmin,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private juices: Map<number, Juice>;
  private cartItems: Map<number, CartItem>;
  private subscriptions: Map<number, Subscription>;
  private admins: Map<number, Admin>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private juiceCurrentId: number;
  private cartItemCurrentId: number;
  private subscriptionCurrentId: number;
  private adminCurrentId: number;
  private orderCurrentId: number;
  private orderItemCurrentId: number;

  constructor() {
    this.juices = new Map();
    this.cartItems = new Map();
    this.subscriptions = new Map();
    this.admins = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.juiceCurrentId = 1;
    this.cartItemCurrentId = 1;
    this.subscriptionCurrentId = 1;
    this.adminCurrentId = 1;
    this.orderCurrentId = 1;
    this.orderItemCurrentId = 1;
    
    // Add default admin
    this.createAdmin({
      username: "admin",
      password: "adminpass" // In a real app, this would be hashed
    });
    
    // Add sample juices
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
    
    sampleJuices.forEach(juice => this.createJuice(juice));
  }

  // Juice operations
  async getAllJuices(): Promise<Juice[]> {
    return Array.from(this.juices.values());
  }

  async getFeaturedJuices(): Promise<Juice[]> {
    return Array.from(this.juices.values()).filter(juice => juice.featured);
  }

  async getJuiceById(id: number): Promise<Juice | undefined> {
    return this.juices.get(id);
  }

  async createJuice(juice: InsertJuice): Promise<Juice> {
    const id = this.juiceCurrentId++;
    const newJuice: Juice = { 
      ...juice, 
      id,
      stock: juice.stock || 0,
      featured: juice.featured || false 
    };
    this.juices.set(id, newJuice);
    return newJuice;
  }

  async updateJuice(id: number, juiceUpdate: Partial<InsertJuice>): Promise<Juice | undefined> {
    const existingJuice = this.juices.get(id);
    if (!existingJuice) return undefined;
    
    const updatedJuice = { ...existingJuice, ...juiceUpdate };
    this.juices.set(id, updatedJuice);
    return updatedJuice;
  }

  async deleteJuice(id: number): Promise<boolean> {
    return this.juices.delete(id);
  }

  // Cart operations
  async getCartItems(sessionId: string): Promise<(CartItem & { juice: Juice })[]> {
    const items = Array.from(this.cartItems.values()).filter(item => item.sessionId === sessionId);
    
    return items.map(item => {
      const juice = this.juices.get(item.juiceId);
      if (!juice) throw new Error(`Juice with id ${item.juiceId} not found`);
      return { ...item, juice };
    });
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if the juice exists
    const juice = this.juices.get(item.juiceId);
    if (!juice) throw new Error(`Juice with id ${item.juiceId} not found`);
    
    // Check if the item is already in the cart
    const existingItem = Array.from(this.cartItems.values()).find(
      cartItem => cartItem.juiceId === item.juiceId && cartItem.sessionId === item.sessionId
    );
    
    if (existingItem) {
      // Update quantity if item already exists
      const updatedItem = await this.updateCartItem(
        existingItem.id, 
        existingItem.quantity + (item.quantity || 1)
      );
      if (!updatedItem) throw new Error(`Failed to update cart item with id ${existingItem.id}`);
      return updatedItem;
    }
    
    // Create new cart item
    const id = this.cartItemCurrentId++;
    const newItem: CartItem = { 
      ...item, 
      id, 
      quantity: item.quantity || 1 
    };
    this.cartItems.set(id, newItem);
    return newItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const existingItem = this.cartItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async removeFromCart(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(sessionId: string): Promise<boolean> {
    const itemsToDelete = Array.from(this.cartItems.values())
      .filter(item => item.sessionId === sessionId)
      .map(item => item.id);
    
    itemsToDelete.forEach(id => this.cartItems.delete(id));
    return true;
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.subscriptionCurrentId++;
    const newSubscription: Subscription = { ...subscription, id };
    this.subscriptions.set(id, newSubscription);
    return newSubscription;
  }

  async getSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values());
  }

  // Admin operations
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(admin => admin.username === username);
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const id = this.adminCurrentId++;
    const newAdmin: Admin = { ...admin, id };
    this.admins.set(id, newAdmin);
    return newAdmin;
  }

  // Order operations
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Create the order
    const id = this.orderCurrentId++;
    const newOrder: Order = { 
      ...order, 
      id,
      status: order.status || "pending" 
    };
    this.orders.set(id, newOrder);
    
    // Create the order items
    items.forEach(item => {
      const itemId = this.orderItemCurrentId++;
      const newItem: OrderItem = { ...item, id: itemId, orderId: id };
      this.orderItems.set(itemId, newItem);
      
      // Update the juice stock
      const juice = this.juices.get(item.juiceId);
      if (juice) {
        juice.stock = Math.max(0, juice.stock - item.quantity);
        this.juices.set(juice.id, juice);
      }
    });
    
    return newOrder;
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrderById(id: number): Promise<(Order & { items: (OrderItem & { juice: Juice })[] }) | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const orderItems = Array.from(this.orderItems.values())
      .filter(item => item.orderId === id)
      .map(item => {
        const juice = this.juices.get(item.juiceId);
        if (!juice) throw new Error(`Juice with id ${item.juiceId} not found`);
        return { ...item, juice };
      });
    
    return { ...order, items: orderItems };
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
}

export const storage = new MemStorage();
