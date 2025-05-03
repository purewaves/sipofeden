# Deployment Guide for Sip of Eden 

This guide outlines the steps to deploy the Sip of Eden application to production.

## Prerequisites

- Node.js 18.x or later
- PostgreSQL database (or [Neon](https://neon.tech) serverless PostgreSQL account)
- [Vercel](https://vercel.com) account (recommended deployment platform)
- GitHub account for version control

## Deployment Steps

### 1. Prepare the Application

1. Ensure all code changes are committed to your repository:
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push
   ```

2. Create a production build locally to verify it works:
   ```bash
   npm run build
   ```

### 2. Set Up the Database

#### Option A: Using Neon (Recommended)

1. Create a Neon account at https://neon.tech
2. Create a new project and database
3. Obtain your connection string from the Neon dashboard (will look like `postgresql://neondb_owner:password@ep-falling-lab-pooler.neon.tech/neondb?sslmode=require`)

#### Option B: Using Self-hosted PostgreSQL

1. Set up a PostgreSQL server (version 14 or higher)
2. Create a database user with appropriate permissions
3. Create a new database for the application
4. Note your connection string: `postgresql://username:password@host:port/database`

### 3. Deploy to Vercel

1. **Connect Your Repository to Vercel**:
   - Log in to your Vercel account
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Configure the following settings:

2. **Set Build Configuration**:
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Configure Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string from step 2
   - `SESSION_SECRET`: A long random string (use a generator for security)
   - `NODE_ENV`: `production`
   - `PORT`: Leave this blank (Vercel will assign a port)

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your application

### 4. Run Database Migrations

After deployment, you need to initialize the database:

1. **Option A: Using Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel login
   vercel env pull .env.production
   DATABASE_URL=<your-db-url> NODE_ENV=production npx tsx create-tables.ts
   ```

2. **Option B: Using Vercel Dashboard**:
   - Navigate to the "Functions" tab
   - Create a new function that runs `npx tsx create-tables.ts`
   - Trigger the function manually

### 5. Post-Deployment Verification

1. **Test the Live Application**:
   - Visit your Vercel deployment URL
   - Verify that all pages load correctly
   - Test the login functionality
   - Test adding items to cart and checkout flow

2. **Check Database Connection**:
   - Verify that data is being saved and retrieved correctly
   - Test admin functionality to ensure database writes are working

### 6. Performance Optimization

The following optimizations are already implemented:

- **Vite Build Optimizations**:
  - Code splitting based on routes
  - Asset optimization and compression
  - Tree-shaking to remove unused code

- **Backend Optimizations**:
  - Proper connection pooling for database
  - Environment-specific configurations

### 7. Monitoring and Maintenance

1. **Set up Logging**:
   - Consider adding a service like Sentry for error tracking
   - Set up Vercel Analytics for usage insights

2. **Regular Maintenance**:
   - Keep dependencies updated with `npm audit` and `npm update`
   - Monitor database performance
   - Regularly backup your database

### 8. Custom Domain (Optional)

1. Purchase a domain name if you don't have one
2. In Vercel dashboard, go to Project → Settings → Domains
3. Add your custom domain and follow the instructions to configure DNS

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify your connection string is correct
   - Check that the database server is accessible from Vercel
   - Ensure the database user has the correct permissions

2. **Build Failures**:
   - Check Vercel build logs for specific errors
   - Verify that dependencies are correctly specified in package.json
   - Test the build locally before deploying

3. **Runtime Errors**:
   - Check browser console for client-side errors
   - Check Vercel logs for server-side errors
   - Verify environment variables are set correctly

### Getting Help

If you encounter issues not covered in this guide, please:
1. Check the GitHub repository issues section
2. Consult the documentation for the specific technology causing issues
3. Contact our development team at support@sipofeden.com

## Security Considerations

- Regularly update dependencies to patch security vulnerabilities
- Use strong, unique passwords for database and admin users
- Ensure SESSION_SECRET is complex and kept private
- Configure CORS settings appropriately for your domain

---

This guide is maintained by the Sip of Eden development team. Last updated: June 2023. 