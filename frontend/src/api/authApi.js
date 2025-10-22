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

// 用户认证相关的API接口
export const authApi = {
  // 用户登录
  // POST /api/auth/login
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials)
      // 保存token和用户信息到localStorage
      if (response.success && response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('userInfo', JSON.stringify(response.data.user))
        console.log('Token已保存到localStorage:', response.data.token)
      } else {
        console.error('登录响应格式错误:', response)
      }
      return response
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  },

  // 用户注册
  // POST /api/auth/register
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData)
      // 注册成功后自动登录
      if (response.success && response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('userInfo', JSON.stringify(response.data.user))
        console.log('注册成功，Token已保存到localStorage:', response.data.token)
      } else {
        console.error('注册响应格式错误:', response)
      }
      return response
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  },

  // 用户登出
  // POST /api/auth/logout
  logout: async () => {
    try {
      const response = await apiClient.post('/auth/logout')
      // 清除本地存储的认证信息
      localStorage.removeItem('authToken')
      localStorage.removeItem('userInfo')
      return response
    } catch (error) {
      console.error('登出失败:', error)
      // 即使API调用失败，也要清除本地存储
      localStorage.removeItem('authToken')
      localStorage.removeItem('userInfo')
      throw error
    }
  },

  // 获取当前用户信息
  // GET /api/auth/me
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me')
      return response
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  },

  // 刷新token
  // POST /api/auth/refresh
  refreshToken: async () => {
    try {
      const response = await apiClient.post('/auth/refresh')
      if (response.success && response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token)
      }
      return response
    } catch (error) {
      console.error('刷新token失败:', error)
      throw error
    }
  },

  // 修改密码
  // PUT /api/auth/password
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.put('/auth/password', passwordData)
      return response
    } catch (error) {
      console.error('修改密码失败:', error)
      throw error
    }
  },

  // 忘记密码
  // POST /api/auth/forgot-password
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email })
      return response
    } catch (error) {
      console.error('忘记密码请求失败:', error)
      throw error
    }
  },

  // 重置密码
  // POST /api/auth/reset-password
  resetPassword: async (resetData) => {
    try {
      const response = await apiClient.post('/auth/reset-password', resetData)
      return response
    } catch (error) {
      console.error('重置密码失败:', error)
      throw error
    }
  }
}

// 认证工具函数
export const authUtils = {
  // 检查用户是否已登录
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken')
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    const userInfo = localStorage.getItem('userInfo')
    return userInfo ? JSON.parse(userInfo) : null
  },

  // 获取token
  getToken: () => {
    return localStorage.getItem('authToken')
  },

  // 清除认证信息
  clearAuth: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userInfo')
  }
}

// 导出默认的API客户端实例
export default apiClient 