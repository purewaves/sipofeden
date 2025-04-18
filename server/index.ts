import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./initializeDb";
import session from "express-session";
import { storage } from "./storage";

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the public directory
app.use(express.static('public'));

// Session middleware
app.use(session({
  store: storage.sessionStore,
  secret: process.env.SESSION_SECRET || 'sip-of-eden-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  }
}));

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
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});