# Sip of Eden Development Documentation

## Current Status
- Server is running on port 5008 (changed from 5000 due to port conflicts)
- Frontend is running on port 3000 (Vite default port)
- Database connection is configured with Neon PostgreSQL
- Image upload functionality is preserved using base64 encoding
- Production deployment on Vercel

## Recent Changes Made
1. Fixed import path issues:
   - Updated `@shared/schema` imports to use relative paths (`../shared/schema`)
   - Modified files:
     - `server/routes.ts`
     - `server/notifications.ts`

2. Resolved port conflicts:
   - Changed server port from 5000 to 5008 in:
     - `.env` file
     - `server/index.ts`
   - Updated client API configuration in `client/src/lib/queryClient.ts`

3. Updated CORS configuration:
   - Added support for Vercel deployment
   - Configured in `server/index.ts`

## Current Issues
1. Health check endpoint shows "pool is not defined" error
2. Database connection needs to be properly configured with Neon credentials

## Next Steps
1. Database Configuration:
   - [ ] Update Neon database credentials in `.env`
   - [ ] Test database connection
   - [ ] Run database migrations if needed

2. Server Health:
   - [ ] Fix health check endpoint
   - [ ] Implement proper error handling for database connection

3. Frontend:
   - [ ] Test all API endpoints with new port configuration
   - [ ] Verify image upload functionality
   - [ ] Test admin dashboard features

## How to Start Development

To get the development environment running:

1.  **Ensure Environment Variables are Set:** Copy `.env.example` to `.env` and fill in your Neon database URL and Cloudinary URL.

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run Database Migrations (if needed):**
    ```bash
    npm run db:push
    ```

4.  **Start the Backend Server (Terminal 1):**
    Open a terminal window and run:
    ```bash
    npm run dev:backend
    ```
    The backend will typically run on `http://localhost:5999` (or the port specified in your `.env` file).

5.  **Start the Frontend Development Server (Terminal 2):**
    Open a *new, separate* terminal window and run:
    ```bash
    npm run dev:frontend
    ```
    The frontend will typically run on `http://localhost:3999` (Vite will show the exact port).

6.  **Access the Application:**
    Open your browser and navigate to `http://localhost:3999` (or the port Vite is using).

*Note: Using separate terminals for backend and frontend is recommended for more stable development and clearer logs.*

## Environment Variables
Required environment variables in `.env`:
```