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
        target: 'https://e86b-123-201-175-18.ngrok-free.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
