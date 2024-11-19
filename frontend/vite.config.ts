import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env['HOST'] || '127.0.0.1',
    port: parseInt(process.env['PORT']!, 10) || 3000,
    proxy: {
      '/api': {
        target: process.env['PROXY_API'] || 'http://127.0.0.1:8000'
      }
    }
  }
})
