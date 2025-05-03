import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from 'url';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicit path definitions for clarity
const CLIENT_DIR = path.resolve(__dirname, './client');
const CLIENT_SRC_DIR = path.resolve(CLIENT_DIR, './src');
const DIST_DIR = path.resolve(__dirname, './dist');

export default defineConfig(({ command, mode }) => {
  // Load env files based on mode
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  
  return {
    plugins: [
      // Use the default React plugin configuration without customization
      react(),
      !isProd && runtimeErrorOverlay(),
      themePlugin(),
      // PWA Plugin for offline capabilities
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'Sip of Eden',
          short_name: 'SipOfEden',
          description: 'Premium juice e-commerce platform',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            }
          ]
        }
      }),
    ],
    server: {
      port: 3000,
      host: true,
      proxy: {
        // Forward all /api requests to the backend server
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true
        },
        // Forward uploads requests
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
      hmr: {
        // Simplify HMR configuration
        clientPort: 3000,
        overlay: true
      },
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },
    resolve: {
      alias: {
        "@": CLIENT_SRC_DIR,
        "@shared": path.resolve(__dirname, "./shared"),
        "@assets": path.resolve(__dirname, "./attached_assets"),
      },
    },
    // Root should point to where index.html is located
    root: CLIENT_DIR,
    publicDir: path.resolve(CLIENT_DIR, './public'),
    build: {
      outDir: path.resolve(DIST_DIR, './client'),
      sourcemap: !isProd,
      rollupOptions: {
        input: path.resolve(CLIENT_DIR, './index.html'),
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          },
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        },
      },
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
    },
    css: {
      devSourcemap: true,
    },
  };
});
