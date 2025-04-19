import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  insertJuiceSchema, 
  insertCartItemSchema, 
  insertSubscriptionPlanSchema,
  insertSubscriptionSchema, 
  insertBundleSchema,
  insertOrderSchema, 
  insertOrderItemSchema,
  updateAdminProfileSchema,
  updateAdminPasswordSchema,
  insertLoyaltyCustomerSchema,
  updateLoyaltyPointsSchema,
  insertLoyaltyRewardSchema,
  loyaltyCustomers,
  loyaltyActivities
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to check if admin is authenticated
  const isAdminAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.adminId) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };
  
  // Set up storage for file uploads
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Configure multer for file uploads
  const uploadStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'product-' + uniqueSuffix + ext);
    }
  });
  
  const upload = multer({ 
    storage: uploadStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
      // Only accept images
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
      }
      cb(null, true);
    }
  });
  
  // API Routes
  
  // File upload route
  app.post('/api/admin/upload', isAdminAuthenticated, upload.single('image'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Return the full URL for the uploaded file
      // Make it an absolute URL that includes the hostname
      const host = req.get('host');
      const protocol = req.protocol;
      const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      
      res.json({
        message: 'File uploaded successfully',
        imageUrl
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });
  
  // Juice routes
  app.get("/api/juices", async (req: Request, res: Response) => {
    try {
      const juices = await storage.getAllJuices();
      res.json(juices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch juices" });
    }
  });

  app.get("/api/juices/featured", async (req: Request, res: Response) => {
    try {
      const featuredJuices = await storage.getFeaturedJuices();
      res.json(featuredJuices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured juices" });
    }
  });

  app.get("/api/juices/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid juice ID" });
      }
      
      const juice = await storage.getJuiceById(id);
      if (!juice) {
        return res.status(404).json({ message: "Juice not found" });
      }
      
      res.json(juice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch juice" });
    }
  });

  // Admin routes - Juice management
  app.post("/api/admin/juices", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertJuiceSchema.parse(req.body);
      const newJuice = await storage.createJuice(validatedData);
      res.status(201).json(newJuice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid juice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create juice" });
    }
  });

  app.put("/api/admin/juices/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid juice ID" });
      }
      
      // Validate partial update
      const validatedData = insertJuiceSchema.partial().parse(req.body);
      
      // Log the update for debugging
      console.log(`Updating juice ${id} with data:`, validatedData);
      
      const updatedJuice = await storage.updateJuice(id, validatedData);
      if (!updatedJuice) {
        return res.status(404).json({ message: "Juice not found" });
      }
      
      // Get the fresh data to ensure we have the latest
      const freshJuice = await storage.getJuiceById(id);
      
      res.json(freshJuice || updatedJuice);
    } catch (error) {
      console.error("Error updating juice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid juice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update juice" });
    }
  });

  app.delete("/api/admin/juices/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid juice ID" });
      }
      
      const success = await storage.deleteJuice(id);
      if (!success) {
        return res.status(404).json({ message: "Juice not found" });
      }
      
      res.json({ message: "Juice deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete juice" });
    }
  });

  // Cart routes
  app.get("/api/cart/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const cartItems = await storage.getCartItems(sessionId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      const { quantity } = req.body;
      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const updatedItem = await storage.updateCartItem(id, quantity);
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      const success = await storage.removeFromCart(id);
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/cart/clear/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      await storage.clearCart(sessionId);
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Subscription routes
  app.post("/api/subscriptions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Subscription Plan routes (admin)
  app.get("/api/admin/subscription-plans", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get("/api/admin/subscription-plans/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subscription plan ID" });
      }
      
      const plan = await storage.getSubscriptionPlanById(id);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription plan" });
    }
  });

  app.post("/api/admin/subscription-plans", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSubscriptionPlanSchema.parse(req.body);
      const newPlan = await storage.createSubscriptionPlan(validatedData);
      res.status(201).json(newPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription plan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create subscription plan" });
    }
  });

  app.put("/api/admin/subscription-plans/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subscription plan ID" });
      }
      
      // Validate partial update
      const validatedData = insertSubscriptionPlanSchema.partial().parse(req.body);
      
      const updatedPlan = await storage.updateSubscriptionPlan(id, validatedData);
      if (!updatedPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      res.json(updatedPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription plan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update subscription plan" });
    }
  });

  app.delete("/api/admin/subscription-plans/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subscription plan ID" });
      }
      
      const success = await storage.deleteSubscriptionPlan(id);
      if (!success) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      res.json({ message: "Subscription plan deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subscription plan" });
    }
  });

  // Bundle routes (admin)
  app.get("/api/admin/bundles", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const bundles = await storage.getAllBundles();
      res.json(bundles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bundles" });
    }
  });

  app.get("/api/admin/bundles/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid bundle ID" });
      }
      
      const bundle = await storage.getBundleById(id);
      if (!bundle) {
        return res.status(404).json({ message: "Bundle not found" });
      }
      
      res.json(bundle);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bundle" });
    }
  });

  app.post("/api/admin/bundles", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertBundleSchema.parse(req.body);
      const newBundle = await storage.createBundle(validatedData);
      res.status(201).json(newBundle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bundle data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bundle" });
    }
  });

  app.put("/api/admin/bundles/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid bundle ID" });
      }
      
      // Validate partial update
      const validatedData = insertBundleSchema.partial().parse(req.body);
      
      const updatedBundle = await storage.updateBundle(id, validatedData);
      if (!updatedBundle) {
        return res.status(404).json({ message: "Bundle not found" });
      }
      
      res.json(updatedBundle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bundle data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update bundle" });
    }
  });

  app.delete("/api/admin/bundles/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid bundle ID" });
      }
      
      const success = await storage.deleteBundle(id);
      if (!success) {
        return res.status(404).json({ message: "Bundle not found" });
      }
      
      res.json({ message: "Bundle deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bundle" });
    }
  });

  // Public subscription plan routes
  app.get("/api/subscription-plans", async (req: Request, res: Response) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Public bundle routes
  app.get("/api/bundles", async (req: Request, res: Response) => {
    try {
      const bundles = await storage.getAllBundles();
      res.json(bundles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bundles" });
    }
  });

  // Customer subscription routes (existing route)
  app.get("/api/admin/subscriptions", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Admin authentication
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const admin = await storage.getAdminByUsername(username);
      
      if (!admin || admin.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set up admin session
      req.session.adminId = admin.id;
      
      // Update last login time
      await storage.updateAdminLoginStatus(admin.id, admin.isFirstLogin);
      
      // Don't return the password
      const { password: _, ...adminWithoutPassword } = admin;
      
      res.json({ 
        message: "Login successful",
        admin: adminWithoutPassword
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  
  // Admin profile routes
  app.get("/api/admin/profile", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const adminId = req.session.adminId as number;
      const admin = await storage.getAdminById(adminId);
      
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      
      // Don't return password
      const { password, ...adminWithoutPassword } = admin;
      
      res.status(200).json(adminWithoutPassword);
    } catch (error) {
      console.error("Get admin profile error:", error);
      res.status(500).json({ message: "Failed to get admin profile" });
    }
  });
  
  // Update admin profile
  app.put("/api/admin/profile", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const adminId = req.session.adminId as number;
      const profileData = req.body;
      
      // Validate the profile data using Zod schema
      const result = updateAdminProfileSchema.safeParse(profileData);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          details: result.error.format() 
        });
      }
      
      const updatedAdmin = await storage.updateAdminProfile(adminId, profileData);
      
      if (!updatedAdmin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      
      // Don't return password
      const { password, ...adminWithoutPassword } = updatedAdmin;
      
      res.status(200).json(adminWithoutPassword);
    } catch (error) {
      console.error("Update admin profile error:", error);
      res.status(500).json({ message: "Failed to update admin profile" });
    }
  });
  
  // Update admin password
  app.put("/api/admin/password", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const adminId = req.session.adminId as number;
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      // Validate password data
      const result = updateAdminPasswordSchema.safeParse({
        currentPassword,
        newPassword,
        confirmPassword
      });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid password data", 
          details: result.error.format() 
        });
      }
      
      // Check if passwords match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "New passwords do not match" });
      }
      
      // Update password
      const success = await storage.updateAdminPassword(adminId, currentPassword, newPassword);
      
      if (!success) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // If this was the admin's first login, update the flag
      const admin = await storage.getAdminById(adminId);
      if (admin && admin.isFirstLogin) {
        await storage.updateAdminLoginStatus(adminId, false);
      }
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Update admin password error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const { order, items } = req.body;
      
      // Validate order and items
      const validatedOrder = insertOrderSchema.parse(order);
      const validatedItems = z.array(insertOrderItemSchema).parse(items);
      
      const newOrder = await storage.createOrder(validatedOrder, validatedItems);
      res.status(201).json(newOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/admin/orders", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/orders/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.put("/api/admin/orders/:id/status", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(id, status);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Loyalty System Routes
  
  // Register loyalty customer
  app.post("/api/loyalty/customers", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLoyaltyCustomerSchema.parse(req.body);
      
      // Check if customer already exists with this email
      const existingCustomer = await storage.getLoyaltyCustomerByEmail(validatedData.email);
      if (existingCustomer) {
        return res.status(400).json({ message: "Customer with this email already exists" });
      }
      
      const customer = await storage.createLoyaltyCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error creating loyalty customer:", error);
      res.status(500).json({ message: "Failed to create loyalty customer" });
    }
  });
  
  // Get customer by email
  app.get("/api/loyalty/customers/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      const customer = await storage.getLoyaltyCustomerByEmail(email);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Error fetching loyalty customer:", error);
      res.status(500).json({ message: "Failed to fetch loyalty customer" });
    }
  });
  
  // Update customer points
  app.post("/api/loyalty/points", async (req: Request, res: Response) => {
    try {
      const validatedData = updateLoyaltyPointsSchema.parse(req.body);
      
      // Get customer by email
      const customer = await storage.getLoyaltyCustomerByEmail(validatedData.email);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Update points
      const updatedCustomer = await storage.updateLoyaltyPoints(
        customer.id,
        validatedData.points,
        'earn', // 'earn' or 'redeem'
        validatedData.source
      );
      
      res.json(updatedCustomer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid points data", errors: error.errors });
      }
      console.error("Error updating loyalty points:", error);
      res.status(500).json({ message: "Failed to update loyalty points" });
    }
  });
  
  // Get customer activities
  app.get("/api/loyalty/activities/:customerId", async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.params.customerId);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const activities = await storage.getLoyaltyActivities(customerId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching loyalty activities:", error);
      res.status(500).json({ message: "Failed to fetch loyalty activities" });
    }
  });
  
  // Create a reward for a customer
  app.post("/api/loyalty/rewards", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLoyaltyRewardSchema.parse(req.body);
      const reward = await storage.createLoyaltyReward(validatedData);
      res.status(201).json(reward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reward data", errors: error.errors });
      }
      console.error("Error creating loyalty reward:", error);
      res.status(500).json({ message: "Failed to create loyalty reward" });
    }
  });
  
  // Get customer rewards
  app.get("/api/loyalty/rewards/:customerId", async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.params.customerId);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      
      const rewards = await storage.getLoyaltyCustomerRewards(customerId);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching loyalty rewards:", error);
      res.status(500).json({ message: "Failed to fetch loyalty rewards" });
    }
  });
  
  // Redeem a reward
  app.post("/api/loyalty/rewards/:rewardId/redeem", async (req: Request, res: Response) => {
    try {
      const rewardId = parseInt(req.params.rewardId);
      if (isNaN(rewardId)) {
        return res.status(400).json({ message: "Invalid reward ID" });
      }
      
      const redeemedReward = await storage.redeemReward(rewardId);
      if (!redeemedReward) {
        return res.status(404).json({ message: "Reward not found or already redeemed" });
      }
      
      res.json(redeemedReward);
    } catch (error) {
      console.error("Error redeeming reward:", error);
      res.status(500).json({ message: "Failed to redeem reward" });
    }
  });
  
  // Get loyalty tiers
  app.get("/api/loyalty/tiers", async (req: Request, res: Response) => {
    try {
      const tiers = await storage.getLoyaltyTiers();
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching loyalty tiers:", error);
      res.status(500).json({ message: "Failed to fetch loyalty tiers" });
    }
  });
  
  // Admin routes for loyalty system
  app.get("/api/admin/loyalty/customers", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get all customers with pagination
      const customers = await db.select().from(loyaltyCustomers).orderBy(loyaltyCustomers.points, 'desc');
      res.json(customers);
    } catch (error) {
      console.error("Error fetching loyalty customers for admin:", error);
      res.status(500).json({ message: "Failed to fetch loyalty customers" });
    }
  });
  
  app.get("/api/admin/loyalty/activities", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get latest activities with customer details
      const activities = await db.select({
        activity: loyaltyActivities,
        customer: loyaltyCustomers
      })
      .from(loyaltyActivities)
      .leftJoin(loyaltyCustomers, eq(loyaltyActivities.customerId, loyaltyCustomers.id))
      .orderBy(loyaltyActivities.createdAt, 'desc')
      .limit(50);
      
      const formattedActivities = activities.map(item => ({
        ...item.activity,
        customer: item.customer!
      }));
      
      res.json(formattedActivities);
    } catch (error) {
      console.error("Error fetching loyalty activities for admin:", error);
      res.status(500).json({ message: "Failed to fetch loyalty activities" });
    }
  });
  
  // Admin can manually add or remove points
  app.post("/api/admin/loyalty/adjust-points", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const { email, points, type, reason } = req.body;
      
      if (!email || !points || !type || !reason) {
        return res.status(400).json({ message: "Email, points, type, and reason are required" });
      }
      
      if (type !== 'earn' && type !== 'redeem') {
        return res.status(400).json({ message: "Type must be 'earn' or 'redeem'" });
      }
      
      // Get customer by email
      const customer = await storage.getLoyaltyCustomerByEmail(email);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Update points
      const updatedCustomer = await storage.updateLoyaltyPoints(
        customer.id,
        points,
        type,
        'admin-adjustment',
        reason
      );
      
      res.json(updatedCustomer);
    } catch (error) {
      console.error("Error adjusting loyalty points:", error);
      res.status(500).json({ message: "Failed to adjust loyalty points" });
    }
  });

  // Website Settings Routes
  app.get("/api/website-settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getWebsiteSettings();
      res.status(200).json(settings);
    } catch (error: any) {
      console.error("Error fetching website settings:", error);
      res.status(500).json({ message: "Failed to fetch website settings" });
    }
  });

  app.put("/api/admin/website-settings", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const settings = await storage.updateWebsiteSettings(req.body);
      res.status(200).json(settings);
    } catch (error: any) {
      console.error("Error updating website settings:", error);
      res.status(500).json({ message: "Failed to update website settings" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
