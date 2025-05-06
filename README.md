# Sip of Eden

A Juice Bar e-commerce web application built with React, Express, and Postgres.

## Development Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/SIPOFEDEN.git
cd SIPOFEDEN
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
   - Copy `.env.example` to `.env`
   - Fill in your database URL and Cloudinary credentials

4. Start the development server
```bash
npm run dev
```
   - Frontend will run on http://localhost:3998
   - Backend will run on http://localhost:5999

## Deployment to Vercel

1. Push your code to GitHub

2. Connect your GitHub repository to Vercel

3. Configure the build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Add environment variables in Vercel:
   - `DATABASE_URL`: Your Postgres database URL
   - `SESSION_SECRET`: A secure random string
   - `CLOUDINARY_URL`: Your Cloudinary connection URL

5. Deploy!

## Technologies Used

- Frontend: React, TanStack Query, Tailwind CSS
- Backend: Express, PostgreSQL via Drizzle ORM
- Image Storage: Cloudinary
- Deployment: Vercel
