import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9200,
   allowedHosts: ['*','sustainability-ellis-caps-learn.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'https://23ae-123-201-171-91.ngrok-free.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
