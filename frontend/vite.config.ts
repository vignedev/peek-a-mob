import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

let commitHash: string = ''
let commitMessage: string = ''

try {
  commitHash = execSync('git rev-parse --short HEAD').toString()
  commitMessage = execSync('git log --format=%B -n 1').toString()
} catch (err) {
  console.error('Failed to get git information, is it installed?', err)
}

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
    },
    define: {
      __BUILD_INFO__: {
        hash: commitHash,
        message: commitMessage,
        date: new Date().toISOString()
      }
    }
  }
})
