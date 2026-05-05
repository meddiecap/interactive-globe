import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/interactive-globe/',
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      '/wb-api': {
        target: 'https://api.worldbank.org/v2/country',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wb-api/, ''),
      },
    },
  },
})
