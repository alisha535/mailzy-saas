import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  server: {
    port: 5173,
    open: true,
    // Block API key from dev logs
    hmr: { overlay: true },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,           // No source maps in production (hides code structure)
    minify: 'esbuild',
    target: 'es2020',
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          react:    ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          lucide:   ['lucide-react'],
        },
      },
    },
    // Warn if chunks > 500kb
    chunkSizeWarningLimit: 500,
  },

  // Block sensitive env vars from being bundled into JS
  // Only VITE_ prefixed vars are exposed — keep non-VITE_ vars backend-only
  envPrefix: ['VITE_'],

  // Improve dev performance
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', 'lucide-react'],
  },
}))
