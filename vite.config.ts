import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-charts', test: /node_modules[\\/](recharts|d3-|victory-vendor|decimal\.js|es-toolkit|immer|reselect|@reduxjs|react-redux|redux)/ },
            { name: 'vendor-ui', test: /node_modules[\\/](@radix-ui|@floating-ui|sonner|lucide-react)/ },
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|zustand|@tanstack)[\\/]/ },
          ],
        },
      },
    },
  },
})
