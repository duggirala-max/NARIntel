//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/news': {
        target: 'https://news.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, '')
      },
      '/api/necc': {
        target: 'https://e2necc.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/necc/, '')
      },
      '/api/indexmundi': {
        target: 'https://www.indexmundi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/indexmundi/, '')
      },
      '/api/numbeo': {
        target: 'https://www.numbeo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/numbeo/, '')
      },
      '/api/indiamart': {
        target: 'https://dir.indiamart.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/indiamart/, '')
      }
    }
  }
})
