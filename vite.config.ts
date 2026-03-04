import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,
    proxy: {
      // 拦截所有以 /api 开头的请求
      '/api': {
        target: 'http://7df03ca4.r26.cpolar.top', // 师兄的 cpolar 穿透地址
        changeOrigin: true, // 必须开启，欺骗服务器这是同源请求
        // 如果师兄的接口本身没有 /api 前缀，可以开启下面这行进行重写：
        // rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  }
})