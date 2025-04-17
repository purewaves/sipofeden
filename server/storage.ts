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
        name: "Green Detox",
        description: "Kale, cucumber, green apple, mint, and a hint of lemon.",
        price: 8.99,
        imageUrl: "https://images.unsplash.com/photo-1622597467836-f3e6808b4a07?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        category: "Detox",
        stock: 85,
        featured: true,
        sku: "JC-GD-001"
      },
      {
        name: "Berry Blast",
        description: "Strawberry, blueberry, raspberry, and apple juice blend.",
        price: 7.99,
        imageUrl: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        category: "Antioxidant",
        stock: 62,
        featured: true,
        sku: "JC-BB-002"
      },
      {
        name: "Citrus Sunrise",
        description: "Orange, grapefruit, pineapple, and carrot blend.",
        price: 6.99,
        imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        category: "Immune Boost",
        stock: 38,
        featured: true,
        sku: "JC-CS-003"
      },
      {
        name: "Tropical Paradise",
        description: "Mango, pineapple, passion fruit, and coconut water.",
        price: 9.99,
        imageUrl: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        category: "Energy",
        stock: 12,
        featured: false,
        sku: "JC-TP-004"
      },
      {
        name: "Beet Energizer",
        description: "Beetroot, apple, ginger, and lemon for natural energy.",
        price: 8.49,
        imageUrl: "https://images.unsplash.com/photo-1576506295286-5cda18df43e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        category: "Energy",
        stock: 0,
        featured: false,
        sku: "JC-BE-005"
      },
      {
        name: "Watermelon Refresh",
        description: "Pure watermelon juice with a hint of mint and lime.",
        price: 7.49,
        imageUrl: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        category: "Hydration",
        stock: 45,
        featured: false,
        sku: "JC-WR-006"
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
    const newJuice: Juice = { ...juice, id };
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
      const updatedItem = await this.updateCartItem(existingItem.id, existingItem.quantity + item.quantity);
      if (!updatedItem) throw new Error(`Failed to update cart item with id ${existingItem.id}`);
      return updatedItem;
    }
    
    // Create new cart item
    const id = this.cartItemCurrentId++;
    const newItem: CartItem = { ...item, id };
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
    const newOrder: Order = { ...order, id };
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
