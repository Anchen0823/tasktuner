import axios from 'axios'
import { API_BASE_URL } from './config'

// 添加请求拦截器，自动添加token
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 时区工具函数
const timezoneUtils = {
  // 获取当前时区信息
  getCurrentTimezoneInfo() {
    const now = new Date()
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: now.getTimezoneOffset(),
      currentLocalTime: now.toISOString(),
      currentLocalDate: now.toISOString().split('T')[0],
      timestamp: now.getTime()
    }
  },
  
  // 为API参数添加时区信息
  addTimezoneToParams(params = {}) {
    const timezoneInfo = this.getCurrentTimezoneInfo()
    return {
      ...params,
      ...timezoneInfo,
      // 添加用户友好的时区标识
      userTimezone: `UTC${timezoneInfo.timezoneOffset > 0 ? '-' : '+'}${Math.abs(timezoneInfo.timezoneOffset/60)}`
    }
  }
}

export const statisticsApi = {
  // 获取综合统计数据
  async getOverallStats(params = {}) {
    try {
      const enhancedParams = timezoneUtils.addTimezoneToParams(params)
      
      console.log('📊 [API] 请求综合统计数据:', {
        原始参数: params,
        增强参数: enhancedParams,
        时区信息: {
          本地时区: enhancedParams.timezone,
          时区偏移: enhancedParams.userTimezone,
          当前本地时间: new Date().toLocaleString()
        }
      })
      
      const response = await axios.get(`${API_BASE_URL}/statistics/overview`, { 
        params: enhancedParams,
        timeout: 15000 // 增加超时时间
      })
      
      console.log('📊 [API] 综合统计数据响应:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [API] 获取综合统计数据失败:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        params: params
      })
      throw error
    }
  },

  // 获取番茄钟统计数据
  async getPomodoroStats(params = {}) {
    try {
      const enhancedParams = timezoneUtils.addTimezoneToParams(params)
      
      console.log('🍅 [API] 请求番茄钟统计数据:', {
        原始参数: params,
        增强参数: enhancedParams
      })
      
      const response = await axios.get(`${API_BASE_URL}/pomodoro/statistics`, { 
        params: enhancedParams,
        timeout: 15000
      })
      
      console.log('🍅 [API] 番茄钟统计数据响应:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [API] 获取番茄钟统计数据失败:', error)
      throw error
    }
  },

  // 获取番茄钟图表数据
  async getPomodoroChartData(params = {}) {
    try {
      const enhancedParams = timezoneUtils.addTimezoneToParams(params)
      
      console.log('📈 [API] 请求番茄钟图表数据:', {
        原始参数: params,
        增强参数: enhancedParams,
        请求时间: new Date().toLocaleString()
      })
      
      const response = await axios.get(`${API_BASE_URL}/statistics/pomodoro/chart`, { 
        params: enhancedParams,
        timeout: 15000
      })
      
      console.log('📈 [API] 番茄钟图表数据响应:', {
        success: response.data?.success,
        dataCount: response.data?.data?.dailyStats?.length || 0,
        dateRange: response.data?.data?.dailyStats?.map(item => item.date) || [],
        今天数据: response.data?.data?.dailyStats?.find(item => {
          const today = new Date().toISOString().split('T')[0]
          return item.date === today
        }),
        完整响应: response.data
      })
      
      return response.data
    } catch (error) {
      console.error('❌ [API] 获取番茄钟图表数据失败:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        params: params
      })
      throw error
    }
  },

  // 获取任务统计数据
  async getTaskStats(params = {}) {
    try {
      const enhancedParams = timezoneUtils.addTimezoneToParams(params)
      
      console.log('📋 [API] 请求任务统计数据:', {
        原始参数: params,
        增强参数: enhancedParams
      })
      
      const token = localStorage.getItem('authToken');
      console.log('🔑 [API] 当前token:', token ? '已存在' : '不存在');
      
      // 将period参数转换为range参数，因为后端任务统计API使用range
      const requestParams = {
        ...enhancedParams,
        range: enhancedParams.period || 'week'
      }
      delete requestParams.period // 删除period参数，避免冲突
      
      const response = await axios.get(`${API_BASE_URL}/tasks/stats`, {
        params: requestParams,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 15000
      });
      
      console.log('📋 [API] 任务统计数据响应:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [API] 获取任务统计数据失败:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        params: params
      });
      throw error;
    }
  },

  // 获取任务图表数据
  async getTaskChartData(params = {}) {
    try {
      const enhancedParams = timezoneUtils.addTimezoneToParams(params)
      
      console.log('📊 [API] 请求任务图表数据:', {
        原始参数: params,
        增强参数: enhancedParams
      })
      
      const response = await axios.get(`${API_BASE_URL}/statistics/task/chart`, { 
        params: enhancedParams,
        timeout: 15000
      })
      
      console.log('📊 [API] 任务图表数据响应:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [API] 获取任务图表数据失败:', error)
      throw error
    }
  },

  // 获取效率分析数据
  async getEfficiencyAnalysis(params = {}) {
    try {
      const enhancedParams = timezoneUtils.addTimezoneToParams(params)
      
      console.log('⚡ [API] 请求效率分析数据:', {
        原始参数: params,
        增强参数: enhancedParams
      })
      
      const response = await axios.get(`${API_BASE_URL}/statistics/efficiency`, { 
        params: enhancedParams,
        timeout: 15000
      })
      
      console.log('⚡ [API] 效率分析数据响应:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [API] 获取效率分析数据失败:', error)
      throw error
    }
  }
}

// 导出时区工具，供其他模块使用
export { timezoneUtils }