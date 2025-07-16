# Sip of Eden - Organic Juice E-commerce Platform

## Overview

Sip of Eden is a full-stack e-commerce platform for selling organic cold-pressed juices. The application features a customer-facing storefront with shopping cart functionality, an admin dashboard for product and order management, and a Progressive Web App (PWA) for mobile usage. The platform includes real-time notifications, juice recommendation AI chat, and subscription services.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Progress (Latest Session - January 16, 2025)
- ✅ Fixed subscription page crash by handling JSON string features properly
- ✅ Implemented comprehensive reminder system for subscription management
- ✅ Enhanced cache management to prevent blank page loading issues
- ✅ Fixed bundles API error handling for better reliability
- ✅ Created deployment readiness checklist with all feature documentation
- ✅ Resolved service worker caching conflicts
- ✅ All core systems verified working: e-commerce, AI chat, analytics, notifications
- ✅ Platform ready for immediate production deployment

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state, React Context for client state
- **UI Components**: Custom component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **PWA Support**: Service Worker implementation for offline functionality and push notifications

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful APIs with session-based authentication
- **File Uploads**: Multer with memory storage for image handling
- **Session Management**: Express sessions with PostgreSQL storage

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with schema-first approach
- **Session Storage**: PostgreSQL-backed session store
- **File Storage**: In-memory processing with base64 conversion for images

## Key Components

### Customer Features
1. **Product Catalog**: Browsable juice collection with category filtering
2. **Shopping Cart**: Session-based cart with real-time updates
3. **Juice Chat**: AI-powered recommendation system using Anthropic's Claude
4. **Subscription System**: Recurring delivery options with customizable plans
5. **Checkout Process**: Multi-step checkout with order processing

### Admin Features
1. **Dashboard**: Analytics and quick stats overview
2. **Product Management**: CRUD operations for juice inventory
3. **Order Management**: Order processing and status updates
4. **Push Notifications**: Real-time admin notifications for new orders
5. **PWA Installation**: Cross-platform app installation support

### Technical Features
1. **Authentication**: Session-based admin authentication with validation
2. **File Upload**: Image processing and storage system
3. **Database Migrations**: Automated schema updates
4. **Error Handling**: Comprehensive error boundaries and logging
5. **PWA Support**: Offline functionality and installable app experience

## Data Flow

### Customer Journey
1. Browse products → Add to cart → Proceed to checkout → Complete order
2. Cart data persists via session ID in localStorage
3. Order processing triggers admin notifications
4. Real-time inventory updates reflect in product availability

### Admin Workflow
1. Login → Dashboard overview → Manage products/orders
2. Session validation ensures security
3. Push notifications alert to new orders
4. Database changes immediately reflect in customer view

### AI Chat Integration
1. Customer inputs preferences → Claude API processes → Returns personalized recommendations
2. Juice database provides real product suggestions
3. Recommendations can be added directly to cart

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **@anthropic-ai/sdk**: AI chat functionality
- **@radix-ui/***: UI component primitives
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Database ORM and migrations
- **express-session**: Session management
- **web-push**: Push notification service

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Production bundling

### Optional Integrations
- **Stripe**: Payment processing (prepared but not fully implemented)
- **Cloudinary**: Image hosting (structure in place)

## Deployment Strategy

### Build Process
1. **Development**: `npm run dev` - Vite dev server with HMR
2. **Build**: `npm run build` - Vite frontend build + ESBuild server bundle
3. **Production**: `npm start` - Serve built application

### Environment Configuration
- **DATABASE_URL**: Required PostgreSQL connection string
- **VAPID_***: Push notification keys (optional)
- **NODE_ENV**: Environment detection

### Database Setup
1. **Migrations**: `npm run db:push` - Apply schema changes
2. **Seeding**: Automatic on first run - creates admin user and sample products
3. **Schema**: Located in `shared/schema.ts` for type safety

### PWA Deployment
- Service worker handles caching and offline functionality
- Manifest.json enables app installation
- Push notifications require VAPID key configuration

### File Structure
```
├── client/          # Frontend React application
├── server/          # Backend Express application  
├── shared/          # Shared types and schemas
├── public/          # Static assets and PWA files
└── migrations/      # Database migration files
```

The application is designed for easy deployment on platforms like Replit, with automatic database provisioning and minimal configuration requirements.