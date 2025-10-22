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

// 笔记相关的API接口
export const noteApi = {
  // 获取所有笔记
  // GET /api/notes
  getAllNotes: async (params = {}) => {
    try {
      const response = await apiClient.get('/notes', { params })
      return response
    } catch (error) {
      console.error('获取笔记列表失败:', error)
      throw error
    }
  },

  // 根据ID获取单个笔记
  // GET /api/notes/{id}
  getNoteById: async (id) => {
    try {
      const response = await apiClient.get(`/users/me/notes/${id}`)
      return response
    } catch (error) {
      console.error('获取笔记详情失败:', error)
      throw error
    }
  },

  // 创建新笔记
  // POST /api/notes
  createNote: async (noteData) => {
    try {
      const response = await apiClient.post('/users/me/notes', noteData)
      return response
    } catch (error) {
      console.error('创建笔记失败:', error)
      throw error
    }
  },

  // 更新笔记
  // PUT /api/notes/{id}
  updateNote: async (id, noteData) => {
    try {
      const response = await apiClient.put(`/users/me/notes/${id}`, noteData)
      return response
    } catch (error) {
      console.error('更新笔记失败:', error)
      throw error
    }
  },

  // 删除笔记
  // DELETE /api/notes/{id}
  deleteNote: async (id) => {
    try {
      const response = await apiClient.delete(`/users/me/notes/${id}`)
      return response
    } catch (error) {
      console.error('删除笔记失败:', error)
      throw error
    }
  },

  // 发布/取消发布笔记
  // PATCH /api/notes/{id}/publish
  togglePublishStatus: async (id) => {
    try {
      const response = await apiClient.patch(`/users/me/notes/${id}/publish`)
      return response
    } catch (error) {
      console.error('切换笔记发布状态失败:', error)
      throw error
    }
  },

  // 批量删除笔记
  // DELETE /api/notes/batch
  deleteMultipleNotes: async (noteIds) => {
    try {
      const response = await apiClient.delete('/users/me/notes/batch', {
        data: { noteIds }
      })
      return response
    } catch (error) {
      console.error('批量删除笔记失败:', error)
      throw error
    }
  },

  // 获取笔记统计信息
  // GET /api/notes/stats
  getNoteStats: async () => {
    try {
      const response = await apiClient.get('/users/me/notes/stats')
      return response
    } catch (error) {
      console.error('获取笔记统计失败:', error)
      throw error
    }
  },

  // 获取用户的笔记
  // GET /api/users/me/notes
  getUserNotes: async (params = {}) => {
    try {
      const response = await apiClient.get('/users/me/notes', { params })
      return response
    } catch (error) {
      console.error('获取用户笔记失败:', error)
      throw error
    }
  },

  // 为用户创建笔记
  // POST /api/users/me/notes
  createUserNote: async (noteData) => {
    try {
      const response = await apiClient.post('/users/me/notes', noteData)
      return response
    } catch (error) {
      console.error('创建用户笔记失败:', error)
      throw error
    }
  },

  // 搜索笔记
  // GET /api/notes/search
  searchNotes: async (query, params = {}) => {
    try {
      const response = await apiClient.get('/notes/search', {
        params: { q: query, ...params }
      })
      return response
    } catch (error) {
      console.error('搜索笔记失败:', error)
      throw error
    }
  },

  // 获取已发布的笔记
  // GET /api/notes/published
  getPublishedNotes: async (params = {}) => {
    try {
      const response = await apiClient.get('/notes/published', { params })
      return response
    } catch (error) {
      console.error('获取已发布笔记失败:', error)
      throw error
    }
  },

  // 点赞笔记
  // POST /api/notes/{id}/like
  likeNote: async (id) => {
    try {
      const response = await apiClient.post(`/notes/${id}/like`)
      return response
    } catch (error) {
      console.error('点赞笔记失败:', error)
      throw error
    }
  },

  // 取消点赞笔记
  // DELETE /api/notes/{id}/like
  unlikeNote: async (id) => {
    try {
      const response = await apiClient.delete(`/notes/${id}/like`)
      return response
    } catch (error) {
      console.error('取消点赞失败:', error)
      throw error
    }
  },

  // 获取笔记点赞数
  // GET /api/notes/{id}/likes
  getNoteLikes: async (id) => {
    try {
      const response = await apiClient.get(`/notes/${id}/likes`)
      return response
    } catch (error) {
      console.error('获取笔记点赞数失败:', error)
      throw error
    }
  }
} 