# Local Setup Guide - Sip of Eden E-commerce Platform

This guide will help you set up the Sip of Eden e-commerce platform on your local machine with the new email/OTP authentication system.

## Prerequisites

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)
- **Email Service** (for OTP delivery)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repository-url>
cd sip-of-eden

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database (SQLite - automatically created)
DATABASE_URL=./data/sip-of-eden.db

# Session Security
SESSION_SECRET=your-super-secret-session-key-here

# Email Configuration (Required for OTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@sipofeden.com

# Optional: Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=admin@sipofeden.com

# Development
NODE_ENV=development
```

### 3. Email Setup (Critical for Authentication)

The platform uses email OTP authentication. You have two options:

#### Option A: Gmail Setup (Recommended for Development)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use this app password as `EMAIL_PASSWORD` in your `.env`

#### Option B: Development Mode (Emails logged to console)
- The system will automatically use ethereal email for development
- OTP codes will be logged to the console
- Check terminal output for login codes

### 4. Start the Application

```bash
# Start development server
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin
- **API**: http://localhost:5000/api

### 5. Initial Setup

#### Customer Authentication
1. Go to http://localhost:5000/auth
2. Enter your email address
3. Check your email (or console) for the OTP code
4. Enter the 6-digit code to login/register

#### Admin Access
1. Go to http://localhost:5000/admin
2. Use default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
3. Change password after first login

## Database

The platform uses SQLite for local development:
- Database file: `./data/sip-of-eden.db`
- Automatically created on first run
- Sample data is seeded automatically

### Database Commands

```bash
# Push schema changes
npm run db:push

# Reset database (careful - deletes all data)
rm -rf ./data/sip-of-eden.db
npm run dev  # Will recreate with sample data
```

## Features Available

### Customer Features
- ✅ Email/OTP Authentication
- ✅ Product Browsing
- ✅ Shopping Cart
- ✅ AI-Powered Juice Chat
- ✅ Subscription Plans
- ✅ Order Checkout

### Admin Features
- ✅ Admin Dashboard
- ✅ Product Management
- ✅ Order Management
- ✅ Analytics Dashboard
- ✅ Push Notifications
- ✅ PWA Support

## Authentication System

### How It Works
1. **User enters email** → OTP sent to email
2. **User enters OTP** → Account created/logged in
3. **Session created** → User stays logged in
4. **Logout** → Session destroyed

### Key Files
- `server/auth.ts` - Authentication logic
- `client/src/hooks/useAuth.tsx` - Frontend auth state
- `client/src/pages/auth-page.tsx` - Login/register UI
- `shared/schema.ts` - User and OTP database models

## Troubleshooting

### Email Issues
```bash
# Check if emails are being sent
# Look for console output like:
# "OTP email sent: <message-id>"
# "Preview URL: https://ethereal.email/message/..."
```

### Database Issues
```bash
# If database errors occur:
rm -rf ./data/sip-of-eden.db
npm run dev
```

### Session Issues
```bash
# Clear browser data and restart server
# Or delete session store:
rm -rf ./data/sessions/
```

### Port Issues
```bash
# If port 5000 is taken:
export PORT=3000
npm run dev
```

## Development Workflow

### Making Changes
1. **Backend**: Edit files in `server/`
2. **Frontend**: Edit files in `client/src/`
3. **Database**: Modify `shared/schema.ts` then run `npm run db:push`
4. **Styling**: Update `theme.json` or Tailwind classes

### Hot Reload
- Frontend changes reload automatically
- Backend changes restart the server
- Database schema changes require `npm run db:push`

## Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=your-production-database-url
SESSION_SECRET=very-secure-random-string
EMAIL_USER=your-production-email
EMAIL_PASSWORD=your-production-email-password
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

## Support

### Common Issues
1. **OTP not received**: Check spam folder, verify email configuration
2. **Session not persisting**: Check SESSION_SECRET in .env
3. **Database errors**: Delete `./data/sip-of-eden.db` and restart
4. **Admin login fails**: Use `admin`/`admin123` credentials

### Getting Help
- Check console logs for detailed error messages
- Verify all environment variables are set
- Ensure email service is properly configured

---

**Note**: This platform is now completely self-contained with email/OTP authentication. No external authentication services are required for local development.