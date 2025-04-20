import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./initializeDb";
import { runMigrations } from "./migrations";
import session from "express-session";
import { storage } from "./storage";
import path from "path";
import multer from "multer";
import fs from "fs";

// Ensure the upload directory exists
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage for multer to keep files in memory
const memStorage = multer.memoryStorage();

const upload = multer({ 
  storage: memStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit - increased to handle iPhone photos
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Extend the session interface to include adminId
declare module 'express-session' {
  interface SessionData {
    adminId?: number;
  }
}

// Create Express app
const app = express();
// Increase JSON body parser limit to handle large base64 images (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve static files from the public directory
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Image upload endpoint is now defined in routes.ts to avoid duplication

// Session middleware with enhanced cross-tab persistence
// Use a well-defined session secret to ensure cookies are consistently signed
const SESSION_SECRET = process.env.SESSION_SECRET || 'sip-of-eden-secret-key-for-session-persistence';
app.use(session({
  store: storage.sessionStore,
  secret: SESSION_SECRET,
  name: 'sip_eden_sid', // Custom session ID name for easier identification
  resave: true, // IMPORTANT: Must be true for cross-tab persistence
  rolling: true, // Reset cookie expiration on each request
  saveUninitialized: false, // Don't save empty sessions
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only use secure in production
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    sameSite: 'lax', // For better CSRF protection but still allowing links
    path: '/', // Ensure cookies are sent with every request
    httpOnly: true, // For security - prevents JavaScript access
    domain: undefined // Allow the browser to determine the domain (improves cross-subdomain support)
  }
}));

// Add session regeneration middleware to reduce session fixation risks
// while maintaining persistence
app.use((req, res, next) => {
  // Only regenerate after a certain period to avoid constant regeneration
  // that could cause session loss
  const hour = 60 * 60 * 1000;
  if (req.session.cookie.maxAge && req.session.adminId && 
      req.session.cookie.maxAge <= (6 * 24 * hour)) { // Regenerate when 1 day left
    req.session.regenerate((err) => {
      if (err) {
        console.error("Error regenerating session:", err);
        // Continue anyway to avoid blocking the request
      }
      // Restore admin ID after regeneration
      req.session.adminId = req.session.adminId;
      next();
    });
  } else {
    next();
  }
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize the application
(async () => {
  try {
    // Run database migrations
    await runMigrations();
    
    // Seed the database with initial data
    await seedDatabase();
    
    // Register API routes
    const server = await registerRoutes(app);

    // Setup development or production environment
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the server
    const port = Number(process.env.PORT || 5000);
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize application:", error);
    
    // Provide more helpful error message but continue with application startup
    if (error && typeof error === 'object' && 'code' in error && 'constraint' in error && 
        error.code === '23505' && error.constraint === 'admins_username_unique') {
      console.log("Admin user already exists. Continuing with application startup...");
      
      // Register API routes
      const server = await registerRoutes(app);

      // Setup development or production environment
      if (process.env.NODE_ENV === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }

      // Start the server
      const port = Number(process.env.PORT || 5000);
      server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
      });
    } else {
      // For other errors, exit the process
      process.exit(1);
    }
  }
})();

// Global error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Log the full error for server-side debugging
  console.error("Server error:", err);
  
  // Determine appropriate error response
  let statusCode = 500;
  let errorMessage = "Internal server error";
  
  // Handle specific error types
  if (err.type === 'entity.too.large') {
    // Request entity too large error
    statusCode = 413;
    errorMessage = "The request is too large. Please reduce the size of any uploaded files.";
  } else if (err.name === 'UnauthorizedError') {
    // Authentication error
    statusCode = 401;
    errorMessage = "Authentication failed. Please log in again.";
  }
  
  // Send the error response with appropriate status
  res.status(statusCode).json({ 
    error: errorMessage,
    // Include request path to help with debugging
    path: _req.path,
    // Include a timestamp
    timestamp: new Date().toISOString()
  });
});