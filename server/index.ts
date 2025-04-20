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

// Extend the session data interface to include our custom fields
declare module 'express-session' {
  interface SessionData {
    adminId?: number;
    adminUsername?: string;
    loginTime?: string;
    lastActive?: string;
    userAgent?: string;
  }
}

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

// This comment just marks where the previous duplicate declaration was removed

// Create Express app
const app = express();
// Increase JSON body parser limit to handle large base64 images (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve static files from the public directory
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Image upload endpoint is now defined in routes.ts to avoid duplication

// Session middleware with enhanced cross-tab persistence and stability
// Use a well-defined session secret to ensure cookies are consistently signed
const SESSION_SECRET = process.env.SESSION_SECRET || 'sip-of-eden-secret-key-for-session-persistence';

// Create session middleware with specific options for reliable cross-environment persistence
app.use(session({
  store: storage.sessionStore,
  secret: SESSION_SECRET,
  name: 'sip_eden_sid', // Custom session ID name for easier identification
  
  // CRITICAL: Set resave to true for production to ensure sessions persist between requests
  // This is especially important in deployed environments where session store may behave differently
  resave: true,
  
  rolling: true, // Reset cookie expiration on each request
  saveUninitialized: false, // Don't save empty sessions
  
  cookie: {
    // Critical - Don't enforce secure flag automatically, let proxy handle it
    // This fixes issues with session persistence behind proxies like Replit's
    secure: false,
    
    // Increase cookie lifetime to reduce expiration issues
    maxAge: 1000 * 60 * 60 * 24 * 14, // 2 weeks
    
    // Allow session to work through iframe and when coming from external sites
    sameSite: 'none',
    
    path: '/', // Ensure cookies are sent with every request
    httpOnly: true, // For security - prevents JavaScript access
    
    // Don't set domain explicitly to allow for cross-subdomain operation
    domain: undefined
  }
}));

// Enhanced session persistence middleware with robust fallback mechanisms
app.use((req, res, next) => {
  const isApiRequest = req.path.startsWith('/api');
  const isAdminRequest = req.path.startsWith('/api/admin');
  
  // Check for backup authentication cookie as fallback
  const hasBackupAuthCookie = req.headers.cookie && 
    req.headers.cookie.includes('admin_authenticated=true');
  
  // DEBUG: Log session info on admin API requests 
  if (isAdminRequest) {
    console.log("Checking admin authentication...");
    console.log("Session ID:", req.sessionID);
    console.log("Admin ID in session:", req.session?.adminId);
    console.log("Admin cookie present:", hasBackupAuthCookie);
    
    if (req.session?.adminUsername) {
      console.log("Admin authentication success:", req.session.adminUsername);
    }
  }
  
  // FALLBACK: Restore session from backup cookie if session expired but backup cookie exists
  if (isAdminRequest && !req.session?.adminId && hasBackupAuthCookie) {
    console.log("⚠️ FALLBACK: Using backup authentication cookie to restore session");
    
    // Attempt to restore session - set a temp flag to indicate session restoration
    req.session.adminId = 1; // Default admin ID
    req.session.adminUsername = "admin"; // Default admin username
    req.session.restoredFromFallback = true;
    req.session.loginTime = new Date().toISOString();
    req.session.lastActive = new Date().toISOString();
    
    // Force save session immediately to ensure it persists
    req.session.save((err) => {
      if (err) {
        console.error("Error saving restored session:", err);
      } else {
        console.log("✓ Session restored successfully via fallback mechanism");
      }
    });
  }
  
  // For authenticated sessions, maintain and reinforce the session
  if (req.session && req.session.adminId) {
    // Update lastActive timestamp for monitoring
    req.session.lastActive = new Date().toISOString();
    
    // Set auth headers for debugging/monitoring
    res.setHeader('X-Admin-Auth', 'true');
    res.setHeader('X-Session-ID', req.sessionID);
    
    // Set multiple backup authentication cookies with various compatibility settings
    // to maximize cross-browser compatibility and session persistence
    const cookieMaxAge = 60*60*24*14; // 2 weeks in seconds
    const cookies = [
      // Primary backup cookie - most compatible default
      `admin_authenticated=true; Path=/; HttpOnly; Max-Age=${cookieMaxAge}`,
      
      // Secondary cookie for fingerprinting
      `admin_sid=${req.sessionID}; Path=/; HttpOnly; Max-Age=${cookieMaxAge}`
    ];
    
    // Set cookies with various compatibility settings
    res.setHeader('Set-Cookie', cookies);
  }
  
  // Continue processing the request
  next();
  
  // After sending the response, ensure session is properly saved (non-blocking)
  if (req.session && req.session.adminId) {
    // Touch the session to update its expiry
    req.session.touch();
    
    // After response is sent, explicitly save the session
    req.session.save((err) => {
      if (err && isApiRequest) {
        console.error("Error saving session (non-blocking):", err);
      }
    });
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