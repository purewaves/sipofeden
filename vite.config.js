"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
var path_1 = __importDefault(require("path"));
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    root: './client',
    base: '/',
    resolve: {
        alias: {
            '@': path_1.default.resolve(__dirname, './client/src'),
            '@shared': path_1.default.resolve(__dirname, './shared'),
            '@assets': path_1.default.resolve(__dirname, './client/src/assets'),
            '@pages': path_1.default.resolve(__dirname, './client/src/pages'),
            '@components': path_1.default.resolve(__dirname, './client/src/components'),
            '@hooks': path_1.default.resolve(__dirname, './client/src/hooks'),
            '@lib': path_1.default.resolve(__dirname, './client/src/lib'),
            '@utils': path_1.default.resolve(__dirname, './client/src/utils')
        }
    },
    server: {
        port: 3999,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false
            }
        }
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true
    },
    // Ensure compatible with Vercel deployment
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        }
    }
});
