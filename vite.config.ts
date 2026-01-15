import { defineConfig } from 'vite';

export default defineConfig({
  // Vite automatically loads .env files and exposes variables prefixed with VITE_
  server: {
    port: 5173,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild', // Use esbuild (built-in) instead of terser
    sourcemap: false,
  },
});
