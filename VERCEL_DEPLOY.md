# Deploying Sip of Eden to Vercel

This guide explains how to deploy the Sip of Eden application to Vercel for production use.

## Prerequisites

1. [Vercel account](https://vercel.com) (free to sign up)
2. [GitHub account](https://github.com) with the project code pushed to a repository
3. [Neon Database](https://neon.tech) account (for the PostgreSQL database)

## Setting Up the Database

1. **Create a Neon account** at https://neon.tech if you don't already have one.
2. **Create a new project** and note the connection string.
3. **Create a new dedicated database** named `sipofeden` for this project:
   - In your Neon dashboard, select your project
   - Navigate to the "Databases" tab
   - Click "Create New Database"
   - Enter "sipofeden" as the name
   - Click "Create"
4. **Save your database connection string** which should look like:
   ```
   postgresql://neondb_owner:password@ep-falling-lab-pooler.neon.tech/sipofeden?sslmode=require
   ```

## Deploying to Vercel

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Connect to Vercel**:
   - Sign in to [Vercel](https://vercel.com)
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Select the Sip of Eden project

3. **Configure the project**:
   - **Framework Preset**: Select "Other"
   - **Build and Output Settings**:
     - Build Command: `npm run vercel-build`
     - Output Directory: `dist`
     - Install Command: `npm install`

4. **Add environment variables**:
   Click on "Environment Variables" and add the following:
   
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `postgresql://neondb_owner:password@ep-falling-lab-pooler.neon.tech/sipofeden?sslmode=require` |
   | `SESSION_SECRET` | `your-secure-random-string` |
   | `NODE_ENV` | `production` |

5. **Deploy**:
   - Click "Deploy"
   - Wait for the build and deployment to complete

## Post-Deployment Verification

1. **Check the deployment logs** to ensure there are no errors
2. **Visit your deployed site** at the URL provided by Vercel (e.g., `https://sip-of-eden.vercel.app`)
3. **Test key functionality**:
   - Browse products
   - Add items to cart
   - Complete checkout process

## Troubleshooting

### Database Connection Issues

If you see database connection errors, verify:
- The `DATABASE_URL` is correctly set in Vercel environment variables
- The database user has the necessary permissions
- The Neon database is active and accessible

### Missing Dependencies

If you see errors about missing dependencies during build:
1. Check the build logs to identify the missing dependency
2. Add it to your project:
   ```bash
   npm install missing-dependency
   git add .
   git commit -m "Add missing dependency"
   git push
   ```
3. Redeploy on Vercel

### Deployment Fails

If the deployment fails:
1. Check the Vercel build logs for specific errors
2. Fix any issues in your local environment
3. Push changes to GitHub
4. Redeploy on Vercel

## Recommended Production Settings

For production, consider:
1. **Setting up a custom domain** in Vercel settings
2. **Enabling automatic HTTPS** (enabled by default on Vercel)
3. **Setting up monitoring** tools like Sentry for error tracking

## Regular Maintenance

Keep your deployment healthy by:
1. **Updating dependencies** regularly
2. **Monitoring error logs** in the Vercel dashboard
3. **Checking database performance** in the Neon dashboard 