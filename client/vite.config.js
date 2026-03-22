import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  preview: {
    allowedHosts: [
      'meditrack-production-9615.up.railway.app', 
      'meditrack-production-58a7.up.railway.app'
    ]
  }
})
