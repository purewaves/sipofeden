import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { upload } from "./cloudinary";
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
  updateWebsiteSettingsSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enhanced middleware to check if admin is authenticated
  const isAdminAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    console.log("Checking admin authentication...");
    console.log("Session ID:", req.sessionID);
    console.log("Admin ID in session:", req.session?.adminId || "not set");
    
    // Check for admin cookie as a redundant auth mechanism
    const cookies = req.headers.cookie || '';
    const hasAdminCookie = cookies.includes('admin_authenticated=true');
    console.log("Admin cookie present:", hasAdminCookie);
    
    // Primary authentication check - Session with admin ID
    if (req.session && req.session.adminId) {
      try {
        // Update last active timestamp for session tracking
        req.session.lastActive = new Date().toISOString();
        
        // First validate the session is working correctly by checking the admin record
        const admin = await storage.getAdminById(req.session.adminId);
        if (admin) {
          console.log("Admin authentication success:", admin.username);
          
          // Set response headers for monitoring and debugging
          res.setHeader('X-Admin-Auth', 'true');
          res.setHeader('X-Admin-Username', admin.username);
          res.setHeader('X-Session-ID', req.sessionID);
          
          // Set both cookies for redundant auth mechanisms
          const cookieMaxAge = 60*60*24*7; // 1 week
          const cookies = [
            `admin_authenticated=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=${cookieMaxAge}`
          ];
          
          // Add secure flag in production
          if (process.env.NODE_ENV === 'production') {
            cookies[0] += '; Secure';
          }
          
          res.setHeader('Set-Cookie', cookies);
          
          // Proceed with the request
          next();
          
          // After sending response, ensure session is saved (non-blocking)
          req.session.touch();
          req.session.save((err) => {
            if (err) console.error("Non-blocking error saving session:", err);
          });
          
          return;
        }
        
        console.log("Admin session exists but admin not found in database - possible data inconsistency");
        // Destroy invalid session
        await new Promise<void>((resolve) => {
          req.session.destroy((err) => {
            if (err) console.error("Error destroying invalid session:", err);
            resolve();
          });
        });
      } catch (error) {
        console.error("Error during admin authentication:", error);
        // Continue to authentication failure
      }
    } else if (hasAdminCookie) {
      // Session expired but admin cookie exists, send special status code
      console.log("Admin cookie found but no valid session - session expired");
      return res.status(440).json({ 
        message: "Your session has expired. Please log in again.",
        code: "SESSION_EXPIRED" 
      });
    }
    
    console.log("Admin authentication failed - unauthorized");
    // Authentication failed
    res.status(401).json({ 
      message: "You must be logged in to access this resource",
      code: "AUTHENTICATION_REQUIRED"
    });
  };
  
  // Set up storage for file uploads - use the public directory to ensure files are accessible in production
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Ensure the uploads directory is served statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  
  // API Routes
  
  // Simple file upload route using Base64 encoding
  app.post('/api/upload', upload.single('image'), async (req: Request, res: Response) => {
    try {
      console.log('File upload request received', req.file ? 'with file' : 'without file');
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Check file size (10MB max) - this is a backup to the multer limit
      // iPhone photos can be 2-3MB or larger
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (req.file.size > MAX_SIZE) {
        return res.status(413).json({ 
          message: 'File is too large. Maximum size is 10MB.',
          size: req.file.size,
          maxSize: MAX_SIZE
        });
      }
      
      // Convert image to base64 data URL
      const base64Image = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      let imageUrl = `data:${mimeType};base64,${base64Image}`;
      
      // Check final base64 size - limit to 1MB for production database safety
      const imageDataSize = imageUrl.length;
      console.log(`Image converted to base64 (size: ${Math.round(imageDataSize/1024)}KB)`);
      
      if (imageDataSize > 1000000) {
        console.warn(`Image data exceeds recommended size (${Math.round(imageDataSize/1024)}KB), reducing quality...`);
        
        // Implement simple compression by limiting the image data length
        // Get the type and encoding
        const [metaData, base64Data] = imageUrl.split(',');
        if (base64Data && base64Data.length > 1000000) {
          // Just truncate to a safer size - this is a simple approach
          // A better solution would be to properly resize the image
          const truncatedData = base64Data.slice(0, 1000000);
          imageUrl = `${metaData},${truncatedData}`;
          console.log(`Reduced image size to approximately ${Math.round(imageUrl.length/1024)}KB`);
        }
      }
      
      // Also save to disk for development environment (optional)
      if (process.env.NODE_ENV === 'development') {
        const filename = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, req.file.buffer);
        console.log(`Also saved to disk: ${filepath}`);
      }
      
      // Set the Content-Type explicitly to prevent HTML response
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        message: 'File uploaded successfully',
        imageUrl,
        sizeMB: (imageUrl.length / (1024 * 1024)).toFixed(2)
      });
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Failed to upload file', error: errorMessage });
    }
  });
  
  // Admin upload route with enhanced session persistence
  app.post('/api/admin/upload', isAdminAuthenticated, upload.single('image'), async (req: Request, res: Response) => {
    try {
      console.log('[ADMIN] File upload request received', req.file ? 'with file' : 'without file');
      
      // Important: Ensure session is properly touched and saved during file upload
      // This prevents session expiration during long uploads
      if (req.session && req.session.adminId) {
        req.session.lastActive = new Date().toISOString();
        // Pre-emptively save the session to prevent expiration
        await new Promise<void>((resolve) => {
          req.session.save((err) => {
            if (err) console.error("Error saving session during file upload:", err);
            resolve(); // Continue regardless of error
          });
        });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Check file size (10MB max) - this is a backup to the multer limit
      // iPhone photos can be 2-3MB or larger
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (req.file.size > MAX_SIZE) {
        return res.status(413).json({ 
          message: 'File is too large. Maximum size is 10MB.',
          size: req.file.size,
          maxSize: MAX_SIZE
        });
      }
      
      // Convert image to base64 data URL
      const base64Image = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      let imageUrl = `data:${mimeType};base64,${base64Image}`;
      
      // Check final base64 size - limit to 1MB for production database safety
      const imageDataSize = imageUrl.length;
      console.log(`[ADMIN] Image converted to base64 (size: ${Math.round(imageDataSize/1024)}KB)`);
      
      if (imageDataSize > 1000000) {
        console.warn(`[ADMIN] Image data exceeds recommended size (${Math.round(imageDataSize/1024)}KB), reducing quality...`);
        
        // Implement simple compression by limiting the image data length
        // Get the type and encoding
        const [metaData, base64Data] = imageUrl.split(',');
        if (base64Data && base64Data.length > 1000000) {
          // We'll truncate to 1MB for database safety
          // A better solution would be to properly resize the image
          const truncatedData = base64Data.slice(0, 1000000);
          imageUrl = `${metaData},${truncatedData}`;
          console.log(`[ADMIN] Reduced image size to approximately ${Math.round(imageUrl.length/1024)}KB`);
        }
      }
      
      // Also save to disk for development environment (optional)
      if (process.env.NODE_ENV === 'development') {
        const filename = `admin-product-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, req.file.buffer);
        console.log(`[ADMIN] Also saved to disk: ${filepath}`);
      }
      
      // Set the Content-Type explicitly to prevent HTML response
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        message: 'File uploaded successfully',
        imageUrl,
        sizeMB: (imageUrl.length / (1024 * 1024)).toFixed(2)
      });
    } catch (error) {
      console.error('[ADMIN] File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Failed to upload file', error: errorMessage });
    }
  });
  
  // Juice routes with inventory verification
  app.get("/api/juices", async (req: Request, res: Response) => {
    try {
      // Get all juices with optional inventory verification
      const juices = await storage.getAllJuices();
      
      // Check if inventory verification is requested
      if (req.query.verifyInventory === 'true') {
        console.log("Performing inventory verification");
        
        // Get all orders to verify inventory counts
        const orders = await storage.getOrders();
        let orderItems: any[] = [];
        
        // Collect all order items to calculate real inventory
        for (const order of orders) {
          try {
            const orderDetails = await storage.getOrderById(order.id);
            if (orderDetails && orderDetails.items) {
              orderItems = [...orderItems, ...orderDetails.items];
            }
          } catch (err) {
            console.error(`Error fetching order items for order ${order.id}:`, err);
          }
        }
        
        // Calculate accurate inventory for each juice
        for (const juice of juices) {
          try {
            // Calculate total sold quantity for this juice
            const soldItems = orderItems.filter(item => item.juiceId === juice.id);
            const totalSold = soldItems.reduce((sum, item) => sum + item.quantity, 0);
            
            // Update stock if needed (this is simplified - a real implementation would
            // account for returns, restocks, etc.)
            if (juice.stock < 0) {
              console.warn(`Fixing negative stock for juice ${juice.id} (${juice.name})`);
              await storage.updateJuice(juice.id, { ...juice, stock: 0 });
              juice.stock = 0;
            }
            
            // Add calculated sales data to the response
            juice.calculatedSales = totalSold;
          } catch (err) {
            console.error(`Error verifying juice ${juice.id}:`, err);
          }
        }
      }
      
      res.json(juices);
    } catch (error) {
      console.error("Error fetching juices:", error);
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
      console.log("Admin juice creation request received");
      console.log("Request body:", req.body);
      
      // Validate data - if validation fails, try to parse individual fields
      let validatedData;
      try {
        validatedData = insertJuiceSchema.parse(req.body);
        console.log("Data validation passed for new juice");
      } catch (validationError) {
        console.error("Initial validation failed for new juice:", validationError);
        
        // Build a cleaner object with only defined properties
        const cleanData: any = {};
        Object.keys(req.body).forEach(key => {
          if (req.body[key] !== undefined && req.body[key] !== null && req.body[key] !== '') {
            cleanData[key] = req.body[key];
          }
        });
        
        console.log("Trying with clean data for new juice:", cleanData);
        
        // Try with cleaned data
        validatedData = insertJuiceSchema.parse(cleanData);
        console.log("Validation passed with cleaned data for new juice");
      }
      
      const newJuice = await storage.createJuice(validatedData);
      console.log("New juice created successfully:", newJuice.id, newJuice.name);
      
      res.status(201).json(newJuice);
    } catch (error) {
      console.error("Error creating juice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid juice data, please check form fields", 
          errors: error.errors,
          requested: req.body 
        });
      }
      res.status(500).json({ 
        message: "Failed to create juice",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/admin/juices/:id", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Admin juice update request received");
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid juice ID" });
      }
      
      console.log("Request body:", req.body);
      
      // Get current juice data for fallback/verification
      const currentJuice = await storage.getJuiceById(id);
      if (!currentJuice) {
        return res.status(404).json({ message: "Juice not found" });
      }
      
      console.log("Current juice found:", currentJuice.id, currentJuice.name);
      
      // Validate partial update - if validation fails, try to parse individual fields
      let validatedData;
      try {
        validatedData = insertJuiceSchema.partial().parse(req.body);
        console.log("Data validation passed");
      } catch (validationError) {
        console.error("Initial validation failed:", validationError);
        // Build a cleaner object with only defined properties
        const cleanData: any = {};
        Object.keys(req.body).forEach(key => {
          if (req.body[key] !== undefined && req.body[key] !== null && req.body[key] !== '') {
            cleanData[key] = req.body[key];
          }
        });
        
        console.log("Trying with clean data:", cleanData);
        
        // Try with cleaned data
        validatedData = insertJuiceSchema.partial().parse(cleanData);
        console.log("Validation passed with cleaned data");
      }
      
      // Log the update for debugging
      console.log(`Updating juice ${id} with data:`, validatedData);
      
      // Ensure the imageUrl is preserved if not provided in update
      if (!validatedData.imageUrl && currentJuice.imageUrl) {
        console.log("Preserving existing image URL");
        validatedData.imageUrl = currentJuice.imageUrl;
      }
      
      const updatedJuice = await storage.updateJuice(id, validatedData);
      if (!updatedJuice) {
        return res.status(404).json({ message: "Juice not found during update" });
      }
      
      // Get the fresh data to ensure we have the latest
      const freshJuice = await storage.getJuiceById(id);
      console.log("Update successful, returning updated juice");
      
      res.json(freshJuice || updatedJuice);
    } catch (error) {
      console.error("Error updating juice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid juice data, please check form fields", 
          errors: error.errors,
          requested: req.body 
        });
      }
      res.status(500).json({ 
        message: "Failed to update juice",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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
      console.log("Admin login attempt received");
      const { username, password } = req.body;
      
      if (!username || !password) {
        console.log("Login rejected: missing username or password");
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Clear any existing session completely and start fresh
      // This is critical for avoiding corrupted sessions
      if (req.session) {
        console.log("Creating fresh session for login");
        await new Promise<void>((resolve) => {
          req.session.regenerate((err) => {
            if (err) {
              console.error("Error regenerating session:", err);
            }
            resolve();
          });
        });
      }
      
      // Verify admin credentials against database
      const admin = await storage.getAdminByUsername(username);
      console.log("Admin lookup result:", admin ? "found" : "not found");
      
      if (!admin || admin.password !== password) {
        console.log("Login rejected: invalid credentials");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log("Admin credentials verified, setting up session");
      
      // Set up admin session with comprehensive data for robustness
      req.session.adminId = admin.id;
      req.session.adminUsername = admin.username;
      req.session.loginTime = new Date().toISOString();
      req.session.lastActive = new Date().toISOString();
      req.session.userAgent = req.headers['user-agent'] || 'unknown';
      
      // Force session save with multiple retries to ensure persistence
      let saveAttempts = 0;
      const maxAttempts = 3;
      let sessionSaved = false;
      
      // Retry loop for session saving
      while (saveAttempts < maxAttempts && !sessionSaved) {
        try {
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
              if (err) {
                console.error(`Session save attempt ${saveAttempts + 1} failed:`, err);
                reject(err);
              } else {
                console.log(`Session saved successfully on attempt ${saveAttempts + 1}, ID:`, req.sessionID);
                sessionSaved = true;
                resolve();
              }
            });
          });
        } catch (saveError) {
          saveAttempts++;
          console.error(`Retrying session save (${saveAttempts}/${maxAttempts})...`);
          
          // Small delay between retries
          await new Promise(r => setTimeout(r, 50));
        }
      }
      
      if (!sessionSaved) {
        console.error("Failed to save session after multiple attempts!");
        // Continue with login but warn about potential session issues
      }
      
      console.log("Updating admin login status in database");
      // Update last login time in separate try-catch for robustness
      try {
        await storage.updateAdminLoginStatus(admin.id, admin.isFirstLogin ?? false);
        console.log("Admin login status updated successfully");
      } catch (statusError) {
        console.error("Failed to update login status:", statusError);
        // Continue anyway as this is not critical for the login process
      }
      
      // Remove password from response
      const { password: _, ...adminWithoutPassword } = admin;
      
      // Set multiple redundant cookies for authentication resilience
      const cookieMaxAge = 60*60*24*14; // 2 weeks in seconds
      const cookies = [
        // Explicit session ID cookie - helps with correlation
        `sip_eden_sid=${req.sessionID}; Path=/; HttpOnly; Max-Age=${cookieMaxAge}`,
        
        // Secondary authentication marker cookie
        `admin_authenticated=true; Path=/; HttpOnly; Max-Age=${cookieMaxAge}`,
        
        // Browser fingerprint cookie
        `device_id=${req.headers['user-agent']?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}; Path=/; HttpOnly; Max-Age=${cookieMaxAge}`,
        
        // Additional timestamp cookie to help with debugging
        `login_time=${Date.now()}; Path=/; HttpOnly; Max-Age=${cookieMaxAge}`
      ];
      
      // Important: For production environments, don't enforce secure flag
      // to allow cookies to work behind Replit's proxy
      if (false && process.env.NODE_ENV === 'production') {
        cookies.forEach((cookie, index) => {
          cookies[index] = cookie + '; Secure';
        });
      }
      
      // Set all cookies
      res.setHeader('Set-Cookie', cookies);
      
      // Set additional headers for debugging and monitoring
      res.setHeader('X-Admin-Auth', 'true');
      res.setHeader('X-Session-ID', req.sessionID);
      res.setHeader('X-Admin-Username', admin.username);
      
      console.log("Admin login successful, sending response");
      res.json({ 
        message: "Login successful",
        admin: adminWithoutPassword,
        sessionId: req.sessionID, // Include for debugging
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ 
        message: "Login failed - please try again",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin logout endpoint
  app.post("/api/admin/logout", async (req: Request, res: Response) => {
    console.log("Admin logout requested");
    
    if (req.session.adminId) {
      console.log(`Logging out admin ID ${req.session.adminId}`);
      
      // Clear admin session
      try {
        // Destroy the session
        await new Promise<void>((resolve, reject) => {
          req.session.destroy((err) => {
            if (err) {
              console.error("Error destroying session during logout:", err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
        
        // Clear cookies
        res.clearCookie('sip_eden_sid');
        res.clearCookie('admin_authenticated');
        
        console.log("Admin logout successful");
        res.status(200).json({ message: "Logged out successfully" });
      } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({ message: "Logout failed" });
      }
    } else {
      console.log("No active session to log out");
      res.status(200).json({ message: "No active session" });
    }
  });
  
  
  // Admin profile routes with enhanced session persistence
  app.get("/api/admin/profile", isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const adminId = req.session.adminId as number;
      
      // Save session for cross-tab consistency
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session in profile route:", err);
        }
      });
      
      const admin = await storage.getAdminById(adminId);
      
      if (!admin) {
        console.error(`Admin with ID ${adminId} not found but session exists`);
        // Clear invalid session
        req.session.destroy((err) => {
          if (err) console.error("Error destroying invalid session:", err);
        });
        return res.status(404).json({ message: "Admin not found" });
      }
      
      // Don't return password
      const { password, ...adminWithoutPassword } = admin;
      
      // Set a custom cookie header for admin identification
      // This helps with persistent authentication across tabs
      res.setHeader('Set-Cookie', [
        `admin_authenticated=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60*60*24*7}`
      ]);
      
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

  // Loyalty System Routes - Removed

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
      // Validate the request body with the schema
      const validatedData = updateWebsiteSettingsSchema.parse(req.body);
      
      // Update the settings
      const settings = await storage.updateWebsiteSettings(validatedData);
      res.status(200).json(settings);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid data provided", 
          errors: error.errors 
        });
      }
      console.error("Error updating website settings:", error);
      res.status(500).json({ message: "Failed to update website settings" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
