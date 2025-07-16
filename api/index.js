// Vercel serverless function entry point
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import the built server
const { default: app } = await import('../dist/index.js');

// Export for Vercel
export default app;