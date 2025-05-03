import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import memorystore from 'memorystore';
import { runMigrations } from './migrations.ts';
import fs from 'fs';
import { registerRoutes } from './routes.ts';
import cors from 'cors';

// Load environment variables
dotenv.config();

// Basic Express App Setup
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

// Add CORS configuration - very important for API requests
app.use(cors({
  origin: ['http://localhost:3000', 'https://www.sipofeden.ng', 'https://sipofeden.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session Setup (Simplified)
const MemoryStore = memorystore(session);
const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-secure-secret-key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// --- Static File Serving & Fallback (Simplified) --- 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In development, Vite handles static serving and index.html
// In production, serve built client files
if (process.env.NODE_ENV === 'production') {
  const clientBuildDir = path.join(__dirname, '../../dist/client');
  
  // Check if build directory exists
  try {
    fs.accessSync(clientBuildDir);
    app.use(express.static(clientBuildDir));
    // Fallback for client-side routing in production
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildDir, 'index.html'));
    });
  } catch (error) {
    console.warn(`Production build directory not found at ${clientBuildDir}. Static files will not be served.`);
    // Fallback for cases where build is missing but env is production
     app.get('*', (req, res) => {
       res.status(503).send('Service Unavailable: Frontend build missing.');
     });
  }
} else {
  // In development, add a placeholder root route
  app.get('/', (req, res) => {
    res.send('Vite Dev Server should handle this route. Check console.');
  });
}

// --- Initialize Application ---
async function initializeApplication() {
  try {
    console.log('Attempting to run database migrations...');
    await runMigrations(); // Run migrations first
    console.log('Database migrations finished (or skipped if up-to-date).');

    // Register all API routes
    const server = await registerRoutes(app);
    
    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening at http://localhost:${PORT}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development mode: Vite should be serving the frontend.');
      }
    });

  } catch (error) {
    console.error('Critical error during application initialization:', error);
    // Log specific migration errors if possible
    if (error instanceof Error && error.message.includes('relation') || error instanceof Error && error.message.includes('syntax error')) {
      console.error('This might be a database migration issue. Check migrations.ts and your DB state.');
    }
    process.exit(1); // Exit if initialization fails
  }
}

// Start the application
initializeApplication();