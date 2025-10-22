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

// 任务相关的API接口
export const taskApi = {
  // 获取所有任务
  // GET /api/tasks
  getAllTasks: async (params = {}) => {
    try {
      const response = await apiClient.get('/tasks', { params })
      return response
    } catch (error) {
      console.error('获取任务列表失败:', error)
      throw error
    }
  },

  // 根据ID获取单个任务
  // GET /api/tasks/{id}
  getTaskById: async (id) => {
    try {
      const response = await apiClient.get(`/tasks/${id}`)
      return response
    } catch (error) {
      console.error('获取任务详情失败:', error)
      throw error
    }
  },

  // 创建新任务
  // POST /api/tasks
  createTask: async (taskData) => {
    try {
      const response = await apiClient.post('/tasks', taskData)
      return response
    } catch (error) {
      console.error('创建任务失败:', error)
      throw error
    }
  },

  // 更新任务
  // PUT /api/tasks/{id}
  updateTask: async (id, taskData) => {
    try {
      const response = await apiClient.put(`/tasks/${id}`, taskData)
      return response
    } catch (error) {
      console.error('更新任务失败:', error)
      throw error
    }
  },

  // 删除任务
  // DELETE /api/tasks/{id}
  deleteTask: async (id) => {
    try {
      const response = await apiClient.delete(`/tasks/${id}`)
      return response
    } catch (error) {
      console.error('删除任务失败:', error)
      throw error
    }
  },

  // 标记任务为完成/未完成
  // PATCH /api/tasks/{id}/toggle
  toggleTaskStatus: async (id) => {
    try {
      const response = await apiClient.patch(`/tasks/${id}/toggle`)
      return response
    } catch (error) {
      console.error('切换任务状态失败:', error)
      throw error
    }
  },

  // 批量删除任务
  // DELETE /api/tasks/batch
  deleteMultipleTasks: async (taskIds) => {
    try {
      const response = await apiClient.delete('/tasks/batch', {
        data: { taskIds }
      })
      return response
    } catch (error) {
      console.error('批量删除任务失败:', error)
      throw error
    }
  },

  // 获取任务统计信息
  // GET /api/tasks/stats
  getTaskStats: async () => {
    try {
      const response = await apiClient.get('/tasks/stats')
      return response
    } catch (error) {
      console.error('获取任务统计失败:', error)
      throw error
    }
  },

  // 获取用户的任务
  // GET /api/users/me/tasks
  getUserTasks: async (params = {}) => {
    try {
      const response = await apiClient.get('/users/me/tasks', { params })
      return response
    } catch (error) {
      console.error('获取用户任务失败:', error)
      throw error
    }
  },

  // 为用户创建任务
  // POST /api/users/me/tasks
  createUserTask: async (taskData) => {
    try {
      const response = await apiClient.post('/users/me/tasks', taskData)
      return response
    } catch (error) {
      console.error('创建用户任务失败:', error)
      throw error
    }
  },

  // ========== 日历视图相关API ==========

  // 获取指定日期的任务
  // GET /api/tasks/by-date/{date}
  getTasksByDate: async (date) => {
    try {
      const response = await apiClient.get(`/tasks/by-date/${date}`)
      return response
    } catch (error) {
      console.error('获取指定日期任务失败:', error)
      throw error
    }
  },

  // 获取日期范围内的任务
  // GET /api/tasks/by-date-range
  getTasksByDateRange: async (startDate, endDate) => {
    try {
      const response = await apiClient.get('/tasks/by-date-range', {
        params: { startDate, endDate }
      })
      return response
    } catch (error) {
      console.error('获取日期范围任务失败:', error)
      throw error
    }
  },

  // 获取日历统计数据
  // GET /api/tasks/calendar-stats/{year}/{month}
  getCalendarStats: async (year, month) => {
    try {
      const response = await apiClient.get(`/tasks/calendar-stats/${year}/${month}`)
      return response
    } catch (error) {
      console.error('获取日历统计失败:', error)
      throw error
    }
  },

  // 批量更新任务截止日期
  // PUT /api/tasks/batch-update-deadline
  batchUpdateDeadline: async (tasks) => {
    try {
      const response = await apiClient.put('/tasks/batch-update-deadline', { tasks })
      return response
    } catch (error) {
      console.error('批量更新截止日期失败:', error)
      throw error
    }
  },

  // 获取即将到期的任务
  // GET /api/tasks/upcoming
  getUpcomingTasks: async (days = 7) => {
    try {
      const response = await apiClient.get('/tasks/upcoming', {
        params: { days }
      })
      return response
    } catch (error) {
      console.error('获取即将到期任务失败:', error)
      throw error
    }
  },

  // 获取本月任务概览
  // GET /api/tasks/month-overview/{year}/{month}
  getMonthOverview: async (year, month) => {
    try {
      const response = await apiClient.get(`/tasks/month-overview/${year}/${month}`)
      return response
    } catch (error) {
      console.error('获取本月概览失败:', error)
      throw error
    }
  },

  // 拖拽更新任务截止日期
  // PATCH /api/tasks/{id}/move
  moveTask: async (taskId, newDeadline) => {
    try {
      const response = await apiClient.patch(`/tasks/${taskId}/move`, {
        deadline: newDeadline
      })
      return response
    } catch (error) {
      console.error('移动任务失败:', error)
      throw error
    }
  }
}

// 导出默认的API客户端实例
export default apiClient 