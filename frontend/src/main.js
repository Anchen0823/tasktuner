import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// 读取主题偏好并在挂载前应用
const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
}

createApp(App).mount('#app') 