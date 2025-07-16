# Sip of Eden - Complete Local Setup Guide

## 📋 Overview

This guide provides complete instructions for setting up and running the Sip of Eden organic juice e-commerce platform locally. The platform is a full-stack application with React frontend, Node.js backend, SQLite database, and advanced features including AI chat assistance, push notifications, and analytics.

## 🔧 System Requirements

### Minimum Requirements
- **Node.js**: Version 18.0 or higher
- **NPM**: Version 8.0 or higher (comes with Node.js)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **OS**: Windows 10/11, macOS 10.14+, or Linux (Ubuntu 18.04+)

### Recommended Development Environment
- **Code Editor**: VSCode with TypeScript and React extensions
- **Browser**: Chrome, Firefox, or Safari (latest versions)
- **Terminal**: Command prompt, PowerShell, or Terminal app

## 📦 Installation Guide

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd sip-of-eden

# Install dependencies
npm install

# Verify installation
node --version  # Should be 18.0+
npm --version   # Should be 8.0+
```

### Step 2: Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
NODE_ENV=development
DATABASE_URL=sqlite:./data/sip-of-eden.db

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here

# Push Notifications (Optional)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=your-email@example.com

# AI Chat Assistant (Optional)
OPENAI_API_KEY=your-openai-api-key

# File Upload Configuration
MAX_FILE_SIZE=10MB
UPLOAD_DIR=./uploads

# Admin Configuration
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=adminpass
```

### Step 3: Database Setup

```bash
# Initialize and seed database
npm run db:push

# Start the application
npm run dev
```

### Step 4: Verify Installation

1. **Open your browser** and navigate to `http://localhost:5000`
2. **Customer Interface**: Browse products, add to cart, test checkout
3. **Admin Dashboard**: Go to `http://localhost:5000/admin`
   - Username: `admin`
   - Password: `adminpass`
4. **API Testing**: Verify APIs are working at `http://localhost:5000/api/juices`

## 🛠️ Development Workflow

### Starting Development

```bash
# Start development server with hot reload
npm run dev

# The server will start on port 5000
# Frontend: http://localhost:5000
# Admin: http://localhost:5000/admin
# API: http://localhost:5000/api/*
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server

# Database Management
npm run db:push     # Apply schema changes to database
npm run db:studio   # Open database management interface

# Code Quality
npm run type-check  # TypeScript type checking
npm run lint        # ESLint code linting
npm run format      # Prettier code formatting
```

### Project Structure

```
sip-of-eden/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utility functions
│   │   └── hooks/         # Custom React hooks
│   └── public/            # Static assets
├── server/                # Node.js backend application
│   ├── routes.ts          # API route handlers
│   ├── storage.ts         # Database operations
│   ├── analytics.ts       # Analytics service
│   ├── ai-chat.ts         # AI chat assistant
│   ├── notifications.ts   # Push notification service
│   └── db.ts             # Database configuration
├── shared/                # Shared types and schemas
│   └── schema.ts         # Database schema definitions
├── data/                  # SQLite database files
├── public/               # Public assets and PWA files
├── package.json          # Dependencies and scripts
└── vite.config.ts       # Build configuration
```

## 🔌 Feature Configuration

### 1. Push Notifications Setup

To enable admin push notifications when customers add items to cart:

```bash
# Generate VAPID keys
npx web-push generate-vapid-keys

# Add keys to .env file
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_EMAIL=your-email@example.com
```

**Testing Push Notifications:**
1. Login to admin dashboard
2. Allow notifications when prompted
3. Add items to cart from another browser/tab
4. Admin should receive push notifications

### 2. AI Chat Assistant Setup

The platform includes an intelligent chat assistant powered by a local AI system:

**Features:**
- 24/7 customer support
- Product information queries
- Health and nutrition advice
- Recipe suggestions
- Order status checking
- Subscription guidance

**Usage:**
- Chat widget appears on all customer pages
- Responds to natural language queries
- Provides product recommendations
- Suggests health-focused juice combinations

### 3. Analytics Dashboard Setup

Comprehensive admin analytics with charts and insights:

**Available Metrics:**
- Sales revenue and trends
- Top-selling products
- Customer behavior analysis
- Inventory status monitoring
- Conversion rate tracking

**Access:** Navigate to `/admin` and view the Analytics section

## 📊 Database Management

### Schema Overview

The application uses SQLite with the following main tables:

```sql
-- Core E-commerce Tables
juices              # Product catalog
cart_items          # Shopping cart data
orders              # Customer orders
order_items         # Order line items
subscriptions       # Subscription services

-- Admin & Management
admins              # Admin user accounts
website_settings    # Site configuration

-- Advanced Features
subscription_plans  # Available subscription plans
bundles            # Product bundles
admin_notification_subscriptions  # Push notification management
```

### Common Database Tasks

```bash
# View database content
sqlite3 data/sip-of-eden.db ".tables"
sqlite3 data/sip-of-eden.db "SELECT * FROM juices;"

# Reset database (Development only)
rm data/sip-of-eden.db
npm run db:push

# Backup database
cp data/sip-of-eden.db data/backup-$(date +%Y%m%d).db
```

## 🚀 Production Deployment

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=sqlite:./data/sip-of-eden.db
SESSION_SECRET=strong-random-session-secret
VAPID_PUBLIC_KEY=production-vapid-public-key
VAPID_PRIVATE_KEY=production-vapid-private-key
VAPID_EMAIL=admin@yourdomain.com
```

### Deployment Platforms

**Recommended Platforms:**
- **Replit**: Zero-config deployment with automatic HTTPS
- **Vercel**: Frontend hosting with serverless functions
- **Railway**: Full-stack deployment with databases
- **DigitalOcean**: VPS deployment for full control

### Production Checklist

- [ ] Set strong session secrets
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up database backups
- [ ] Configure error monitoring
- [ ] Set up analytics tracking
- [ ] Test all features in production environment
- [ ] Configure domain and DNS
- [ ] Set up monitoring and alerts

## 🔒 Security Configuration

### Admin Account Security

```bash
# Change default admin credentials
# Navigate to /admin → Profile → Change Password
```

### Session Security

```javascript
// Recommended session configuration
SESSION_SECRET=crypto-random-64-character-string
SESSION_TIMEOUT=24h
SECURE_COOKIES=true (production only)
```

### File Upload Security

```javascript
// Configured limits
MAX_FILE_SIZE=10MB
ALLOWED_TYPES=image/jpeg,image/png,image/webp
UPLOAD_SANITIZATION=enabled
```

## 🧪 Testing Guide

### Manual Testing Checklist

**Customer Features:**
- [ ] Browse product catalog
- [ ] Add/remove items from cart
- [ ] Complete checkout process
- [ ] Test subscription signup
- [ ] Use AI chat assistant
- [ ] Verify responsive design

**Admin Features:**
- [ ] Login to admin dashboard
- [ ] Add/edit/delete products
- [ ] Manage orders and status updates
- [ ] View analytics and reports
- [ ] Test push notifications
- [ ] Configure website settings

**Technical Testing:**
- [ ] API endpoints respond correctly
- [ ] Database operations work
- [ ] File upload functionality
- [ ] PWA installation
- [ ] Offline functionality

### Performance Testing

```bash
# Check application performance
npm run build
npm start

# Test API response times
curl -w "@curl-format.txt" http://localhost:5000/api/juices

# Monitor memory usage
node --inspect server/index.js
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Errors

```bash
# Error: Database locked or corrupted
rm data/sip-of-eden.db
npm run db:push

# Error: Permission denied
chmod 755 data/
chmod 644 data/sip-of-eden.db
```

#### 2. Port Already in Use

```bash
# Kill process on port 5000
npx kill-port 5000

# Or use different port
PORT=3000 npm run dev
```

#### 3. Node.js Version Issues

```bash
# Check Node.js version
node --version

# Install Node.js 18+ using nvm
nvm install 18
nvm use 18
```

#### 4. Package Installation Errors

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 5. TypeScript Compilation Errors

```bash
# Check TypeScript configuration
npx tsc --noEmit

# Fix common path issues
npm run type-check
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Database debug mode
DB_DEBUG=true npm run dev
```

## 📞 Support and Resources

### Getting Help

1. **Check the logs**: Look at console output for error messages
2. **Verify environment**: Ensure all required environment variables are set
3. **Database state**: Check if database has been properly initialized
4. **Network issues**: Verify ports are available and not blocked

### Documentation References

- **React**: https://react.dev/
- **Node.js**: https://nodejs.org/docs/
- **SQLite**: https://sqlite.org/docs.html
- **Drizzle ORM**: https://orm.drizzle.team/
- **Vite**: https://vitejs.dev/guide/

### Project-Specific Features

- **Admin Dashboard**: Full product and order management
- **PWA Support**: Installable web app with offline functionality
- **Push Notifications**: Real-time admin alerts
- **AI Chat**: Intelligent customer support assistant
- **Analytics**: Comprehensive business intelligence dashboard
- **Subscription System**: Recurring delivery management

---

## 🎯 Quick Start Summary

For experienced developers who want to get started quickly:

```bash
# 1. Install and setup
git clone <repository-url> && cd sip-of-eden
npm install

# 2. Environment setup
cp .env.example .env  # Edit with your values

# 3. Database setup
npm run db:push

# 4. Start development
npm run dev

# 5. Access application
# Customer: http://localhost:5000
# Admin: http://localhost:5000/admin (admin/adminpass)
```

Your Sip of Eden e-commerce platform is now ready for development and customization!