import axios from 'axios'
import { API_BASE_URL } from './config'

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 从localStorage获取token并添加到请求头
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('发送请求:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('收到响应:', response.status, response.data)
    return response.data
  },
  (error) => {
    console.error('API请求错误:', error)
    // 如果是401错误，清除token并跳转到登录页
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 番茄钟相关的API接口
export const pomodoroApi = {
  // 获取番茄钟设置
  // GET /api/pomodoro/settings
  getSettings: async () => {
    try {
      const response = await apiClient.get('/pomodoro/settings')
      return response
    } catch (error) {
      console.error('获取番茄钟设置失败:', error)
      throw error
    }
  },

  // 保存番茄钟设置
  // POST /api/pomodoro/settings
  saveSettings: async (settings) => {
    try {
      const response = await apiClient.post('/pomodoro/settings', settings)
      return response
    } catch (error) {
      console.error('保存番茄钟设置失败:', error)
      throw error
    }
  },

  // 添加番茄钟记录
  // POST /api/pomodoro/records
  addRecord: async (recordData) => {
    try {
      const response = await apiClient.post('/pomodoro/records', recordData)
      return response
    } catch (error) {
      console.error('添加番茄钟记录失败:', error)
      throw error
    }
  },

  // 获取番茄钟记录
  // GET /api/pomodoro/records
  getRecords: async (params = {}) => {
    try {
      const response = await apiClient.get('/pomodoro/records', { params })
      return response
    } catch (error) {
      console.error('获取番茄钟记录失败:', error)
      throw error
    }
  },

  // 删除番茄钟记录
  // DELETE /api/pomodoro/records/{id}
  deleteRecord: async (id) => {
    try {
      const response = await apiClient.delete(`/pomodoro/records/${id}`)
      return response
    } catch (error) {
      console.error('删除番茄钟记录失败:', error)
      throw error
    }
  },

  // 获取番茄钟统计
  // GET /api/pomodoro/statistics
  getStatistics: async (params = {}) => {
    try {
      const response = await apiClient.get('/pomodoro/statistics', { params })
      return response
    } catch (error) {
      console.error('获取番茄钟统计失败:', error)
      throw error
    }
  }
}

// 番茄钟工具函数
export const pomodoroUtils = {
  // 格式化时间（秒转分:秒）
  formatTime: (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  // 格式化持续时间（秒转可读格式）
  formatDuration: (seconds) => {
    if (seconds < 60) {
      return `${seconds}秒`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      return `${minutes}分钟`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}小时${minutes}分钟`
    }
  },

  // 获取记录类型的中文名称
  getRecordTypeName: (type) => {
    const typeNames = {
      focus: '专注',
      shortBreak: '短休息',
      longBreak: '长休息'
    }
    return typeNames[type] || type
  },

  // 获取记录类型的图标
  getRecordTypeIcon: (type) => {
    const typeIcons = {
      focus: '🎯',
      shortBreak: '☕',
      longBreak: '🌴'
    }
    return typeIcons[type] || '⏱️'
  }
}

// 导出默认的API客户端实例
export default apiClient 