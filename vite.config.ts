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
        target: 'http://javacloud-app.duckdns.org:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
    },
  },
})
