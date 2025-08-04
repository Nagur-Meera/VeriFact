import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Make environment variables available at build time
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://verifact.onrender.com')
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
