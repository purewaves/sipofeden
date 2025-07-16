# Deployment Setup Guide - Sip of Eden

This guide covers deploying the Sip of Eden platform with the new email/OTP authentication system to various hosting platforms.

## Overview

The platform is now completely self-contained with:
- ✅ Email/OTP authentication (no external auth providers needed)
- ✅ SQLite database for local development
- ✅ PostgreSQL support for production
- ✅ Session-based authentication
- ✅ Email delivery system
- ✅ PWA capabilities

## Environment Variables

### Required for All Deployments

```env
# Database
DATABASE_URL=your-database-connection-string

# Session Security (CRITICAL)
SESSION_SECRET=generate-a-very-secure-random-string-here

# Email Configuration (REQUIRED for authentication)
EMAIL_USER=your-smtp-email@example.com
EMAIL_PASSWORD=your-smtp-password-or-app-password
EMAIL_FROM=noreply@yourdomain.com

# Application
NODE_ENV=production
```

### Optional (for enhanced features)

```env
# Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=admin@yourdomain.com

# Custom Port
PORT=5000
```

## Platform-Specific Deployment

### 1. Vercel Deployment

#### Automatic Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

#### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add SESSION_SECRET
vercel env add EMAIL_USER
vercel env add EMAIL_PASSWORD
# ... add all required variables

# Deploy with environment
vercel --prod
```

#### Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Add environment variables
railway variables set SESSION_SECRET=your-secret
railway variables set EMAIL_USER=your-email
railway variables set EMAIL_PASSWORD=your-password
```

### 3. Render Deployment

1. Connect GitHub repository
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Add environment variables in dashboard

### 4. Digital Ocean App Platform

1. Create new app from GitHub
2. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`
3. Add environment variables
4. Deploy

## Database Setup

### Development (SQLite)
- Automatically created in `./data/sip-of-eden.db`
- No additional setup required

### Production (PostgreSQL)

#### Option 1: Neon Database (Recommended)
1. Create account at https://neon.tech
2. Create new database
3. Copy connection string
4. Set `DATABASE_URL` environment variable

#### Option 2: Railway PostgreSQL
```bash
# Add PostgreSQL service
railway add postgresql

# Get connection string
railway variables
```

#### Option 3: Supabase
1. Create project at https://supabase.com
2. Go to Settings → Database
3. Copy connection string
4. Update DATABASE_URL

## Email Service Setup

### Option 1: Gmail (Development/Small Scale)
1. Enable 2-factor authentication
2. Generate App Password
3. Use Gmail credentials:
   ```env
   EMAIL_USER=youremail@gmail.com
   EMAIL_PASSWORD=your-16-digit-app-password
   ```

### Option 2: SendGrid (Production)
1. Create SendGrid account
2. Get API key
3. Configure:
   ```env
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your-sendgrid-api-key
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Option 3: Mailgun
1. Create Mailgun account
2. Get SMTP credentials
3. Configure:
   ```env
   EMAIL_USER=your-mailgun-username
   EMAIL_PASSWORD=your-mailgun-password
   EMAIL_FROM=noreply@yourdomain.com
   ```

## Security Considerations

### Session Secret
```bash
# Generate secure session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### HTTPS Setup
- Enable HTTPS on your hosting platform
- Update session configuration for secure cookies in production

### Rate Limiting
Consider adding rate limiting for OTP endpoints:
```javascript
// In production, add rate limiting
app.use('/api/send-otp', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
}));
```

## Post-Deployment Checklist

### 1. Test Authentication Flow
- [ ] Visit `/auth` page
- [ ] Enter email address
- [ ] Receive OTP email
- [ ] Successfully login/register
- [ ] Session persists across page reloads

### 2. Test Admin Access
- [ ] Visit `/admin`
- [ ] Login with admin credentials
- [ ] Access admin dashboard
- [ ] Test admin functions

### 3. Test Core Features
- [ ] Browse products
- [ ] Add items to cart
- [ ] Test AI chat
- [ ] Complete checkout process
- [ ] Test PWA installation

### 4. Monitor Logs
- [ ] Check email delivery logs
- [ ] Monitor authentication errors
- [ ] Watch database connections
- [ ] Verify session persistence

## Troubleshooting

### Common Deployment Issues

#### Email Not Sending
```bash
# Check environment variables
echo $EMAIL_USER
echo $EMAIL_PASSWORD

# Test email configuration locally first
```

#### Session Issues
```bash
# Verify SESSION_SECRET is set
echo $SESSION_SECRET

# Check cookie settings in production
```

#### Database Connection
```bash
# Test database connection
echo $DATABASE_URL

# Check database migrations ran successfully
```

### Environment-Specific Issues

#### Vercel
- Ensure `vercel.json` is configured correctly
- Check function timeout limits
- Verify environment variables are set

#### Railway
- Check service logs for errors
- Verify database connection string
- Monitor resource usage

#### Render
- Check build logs for errors
- Verify start command is correct
- Monitor application logs

## Monitoring and Maintenance

### Health Checks
Add health check endpoint:
```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version 
  });
});
```

### Logging
Monitor key metrics:
- Authentication success/failure rates
- Email delivery success rates
- Session creation/destruction
- Database query performance

### Regular Maintenance
- Monitor email quota usage
- Clean up expired OTP codes
- Review session storage usage
- Update dependencies regularly

---

**Note**: This platform is now completely independent and can be deployed to any hosting platform that supports Node.js applications.