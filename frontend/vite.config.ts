import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: env['HOST'] || '127.0.0.1',
      port: parseInt(env['PORT']!, 10) || 3000,
      proxy: {
        '/api': {
          target: env['PROXY_API'] || 'http://127.0.0.1:8000'
        }
      }
    }
  }
})
