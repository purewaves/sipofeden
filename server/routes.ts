import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertJuiceSchema, insertCartItemSchema, insertSubscriptionSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
  app.post('/api/admin/upload', upload.single('image'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Return the URL for the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;
      
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
  app.post("/api/admin/juices", async (req: Request, res: Response) => {
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

  app.put("/api/admin/juices/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid juice ID" });
      }
      
      // Validate partial update
      const validatedData = insertJuiceSchema.partial().parse(req.body);
      
      const updatedJuice = await storage.updateJuice(id, validatedData);
      if (!updatedJuice) {
        return res.status(404).json({ message: "Juice not found" });
      }
      
      res.json(updatedJuice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid juice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update juice" });
    }
  });

  app.delete("/api/admin/juices/:id", async (req: Request, res: Response) => {
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

  app.get("/api/admin/subscriptions", async (req: Request, res: Response) => {
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
      
      // In a real app, you would generate a JWT token here
      res.json({ 
        message: "Login successful",
        admin: { id: admin.id, username: admin.username }
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
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

  app.get("/api/admin/orders", async (req: Request, res: Response) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/orders/:id", async (req: Request, res: Response) => {
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

  app.put("/api/admin/orders/:id/status", async (req: Request, res: Response) => {
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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
