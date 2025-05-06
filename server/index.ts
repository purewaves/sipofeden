import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { registerRoutes } from './routes';
import { DatabaseStorage } from './storage';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('[SERVER] Starting server...');
console.log('[SERVER] Environment:', process.env.NODE_ENV);
console.log('[SERVER] Port:', process.env.PORT);

const app = express();
const PORT = process.env.PORT || 5999;

// Configure CORS based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://sipofeden.vercel.app', 
      'https://www.sipofeden.com', 
      'https://sipofeden.com',
      // Add Vercel preview domains
      ...((process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []))
    ]
  : [
      'http://localhost:3998', 
      'http://localhost:3999', 
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://localhost:3002', 
      'http://localhost:3003', 
      'http://localhost:3004', 
      'http://localhost:3005'
    ];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.warn(`[SERVER] Origin not allowed by CORS: ${origin}`);
      // Still allow the request but log it
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
console.log('[SERVER] CORS ORIGINS:', allowedOrigins);

app.use(cors(corsOptions));
app.use(express.json());

// Initialize storage
const storage = new DatabaseStorage();

// Configure session middleware
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'local-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const
  },
  store: storage.sessionStore
};

console.log('[SERVER] Session config:', { 
  secure: sessionConfig.cookie.secure,
  maxAge: sessionConfig.cookie.maxAge,
  secret: sessionConfig.secret ? 'Set (hidden)' : 'Missing'
});

app.use(session(sessionConfig));

// Register routes
console.log('[SERVER] Registering routes...');
registerRoutes(app).then(server => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Session store initialized:', !!sessionConfig.store);
  });
}).catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});