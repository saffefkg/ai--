import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // 开发环境：/api 转发到本地后端代理（默认 3001，可用 VITE_API_PROXY_TARGET 覆盖，
      // 例如后端端口被占用时：VITE_API_PROXY_TARGET=http://localhost:3100 npm run dev）
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
