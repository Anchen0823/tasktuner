import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: '0.0.0.0', // 重要：必须添加这行
    open: false,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'www.tasktuner.top',
      'tasktuner.top'
    ]
  },
  build: {
    outDir: 'dist'
  }
})