import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal Vite configuration for testing
export default defineConfig({
  plugins: [react()],
  root: './client',
  server: {
    port: 3999,
    strictPort: true
  },
  optimizeDeps: {
    force: true // Force dependency pre-bundling
  },
  // Override main.tsx entry with our test file
  define: {
    'process.env.VITE_TEST_MODE': JSON.stringify('true')
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
}); 