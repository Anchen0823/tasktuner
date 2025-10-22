<template>
  <div class="statistics-container">
    <!-- 时间范围选择器 -->
    <div class="range-selector">
      <button :class="{active: period==='today'}" @click="changePeriod('today')">今日</button>
      <button :class="{active: period==='week'}" @click="changePeriod('week')">近一周</button>
      <button :class="{active: period==='month'}" @click="changePeriod('month')">近一月</button>
      <button :class="{active: period==='quarter'}" @click="changePeriod('quarter')">近三月</button>
      <button :class="{active: period==='year'}" @click="changePeriod('year')">近一年</button>
    </div>

    <!-- 概览卡片 -->
    <div class="overview-cards">
      <div class="stats-card pomodoro-card">
        <div class="stats-icon">🍅</div>
        <div class="stats-content">
          <div class="stats-number">{{ overviewData.totalPomodoros || 0 }}</div>
          <div class="stats-label">完成番茄钟</div>
        </div>
      </div>
      <div class="stats-card focus-card">
        <div class="stats-icon">⏰</div>
        <div class="stats-content">
          <div class="stats-number" v-html="formatTime(overviewData.totalFocusTime || 0)"></div>
          <div class="stats-label">专注时间</div>
        </div>
      </div>
      <div class="stats-card task-card">
        <div class="stats-icon">✅</div>
        <div class="stats-content">
          <div class="stats-number">{{ overviewData.completedTasks || 0 }}</div>
          <div class="stats-label">已完成任务</div>
        </div>
      </div>
      <div class="stats-card completion-card">
        <div class="stats-icon">📊</div>
        <div class="stats-content">
          <div class="stats-number">{{ overviewData.completionRate || 0 }}%</div>
          <div class="stats-label">完成率</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
    <div class="chart-section">
        <h3>🍅 番茄钟专注趋势</h3>
      <div class="chart" ref="pomodoroChart"></div>
    </div>
    <div class="chart-section">
        <h3>📋 任务状态分布</h3>
      <div class="chart" ref="taskChart"></div>
      </div>
    </div>


  </div>
</template>

<script>
import * as echarts from 'echarts'
import { statisticsApi } from '../api/statisticsApi'

export default {
  name: 'StatisticsView',
  data() {
    return {
      pomodoroChart: null,
      taskChart: null,
      period: 'week',
      loading: false,
      refreshTimer: null,
      overviewData: {
        totalPomodoros: 0,
        totalFocusTime: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        efficiency: 0
      },
      pomodoroChartData: {
        dailyStats: [],
        summary: {}
      },
      taskChartData: {
        tasksByStatus: [],
        tasksByPriority: [],
        completionTrend: []
      }
    }
  },
  async mounted() {
    // 初始化图表
    this.pomodoroChart = echarts.init(this.$refs.pomodoroChart)
    this.taskChart = echarts.init(this.$refs.taskChart)
    
    // 获取数据并渲染图表
    await this.fetchData()
    this.renderCharts()

    // 响应式调整
    window.addEventListener('resize', this.handleResize)
    
    // 监听主题变化
    this.observeThemeChange()
    
    // 设置自动刷新，每5分钟刷新一次数据
    this.refreshTimer = setInterval(() => {
      this.fetchData()
    }, 5 * 60 * 1000)
  },
  methods: {
    // 优化的日期格式化方法，统一显示具体日期
    formatDate(dateStr) {
      // 确保日期字符串有效
      if (!dateStr) {
        return '无效日期'
      }
      
      try {
        // 处理不同格式的日期字符串
        let date
        if (typeof dateStr === 'string') {
          // 如果是 YYYY-MM-DD 格式，直接解析
          if (dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('-').map(Number)
            date = new Date(year, month - 1, day) // month-1 因为 JS 的月份从0开始
          } else {
            date = new Date(dateStr)
          }
        } else {
          date = new Date(dateStr)
        }
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          console.warn('无效的日期字符串:', dateStr)
          return '无效日期'
        }
        
        const month = date.getMonth() + 1
        const day = date.getDate()
        
        // 统一显示月/日格式，不显示"今天"、"昨天"
        return `${month}/${day}`
      } catch (error) {
        console.error('日期格式化错误:', error, dateStr)
        return '日期错误'
      }
    },

    // 生成动态的日期范围（用于确保数据包含最新日期）
    generateDateRange(period) {
      const today = new Date()
      const dates = []
      
      let days = 0
      switch (period) {
        case 'today':
          days = 1
          break
        case 'week':
          days = 7
          break
        case 'month':
          days = 30
          break
        case 'quarter':
          days = 90
          break
        case 'year':
          days = 365
          break
        default:
          days = 7
      }
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        // 使用标准的ISO日期格式，确保日期精确
        const dateStr = date.getFullYear() + '-' + 
                       String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(date.getDate()).padStart(2, '0')
        dates.push(dateStr)
      }
      
      return dates
    },

    async fetchData() {
      if (this.loading) return
      
      this.loading = true
      try {
        // 获取本地时区偏移（分钟）
        const timezoneOffset = new Date().getTimezoneOffset()
        const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        
        const params = { 
          period: this.period,
          timestamp: Date.now(),
          timezone: localTimezone,
          timezoneOffset: timezoneOffset,
          startDate: this.getStartDate(),
          endDate: this.getEndDate(),
          currentLocalTime: new Date().toISOString(),
          currentLocalDateOnly: this.getCurrentLocalDateString()
        }
        
        console.log('📊 请求统计数据', { period: this.period })
        
        // 并行获取统计数据
        const [overallResponse, pomodoroChartResponse, taskStatsResponse, correctPomodoroDataResponse] = await Promise.all([
          statisticsApi.getOverallStats(params),
          statisticsApi.getPomodoroChartData(params),
          statisticsApi.getTaskStats(params), // 任务统计API - 选项卡数据的主要来源
          import('../api/pomodoroApi').then(module => 
            module.pomodoroApi.getStatistics({ period: 'today' })
          ).catch(error => {
            console.warn('📍 获取番茄钟API数据失败:', error)
            return { success: false }
          })
        ])

        // 更新概览数据
        if (overallResponse.success) {
          this.overviewData = overallResponse.data.overview
        }

        // 更新番茄钟图表数据
        if (pomodoroChartResponse.success) {
          this.pomodoroChartData = pomodoroChartResponse.data
          
          if (correctPomodoroDataResponse.success && correctPomodoroDataResponse.data) {
            this.correctTodayDataFromPomodoroAPI(correctPomodoroDataResponse.data)
          }
          
          this.fixTimezoneDataGrouping()
          this.ensureLatestDates()
          this.updateOverviewDataFromChartData()
        }

        // 使用任务统计API的数据更新选项卡和饼状图
        if (taskStatsResponse.success && taskStatsResponse.data) {
          console.log('📋 使用任务统计API数据:', taskStatsResponse.data)
          
          const taskStats = taskStatsResponse.data
          this.overviewData.totalTasks = taskStats.totalTasks || 0
          this.overviewData.completedTasks = taskStats.completedTasks || 0
          this.overviewData.pendingTasks = taskStats.inProgressTasks || 0
          this.overviewData.overdueTasks = taskStats.overdueTasks || 0
          this.overviewData.completionRate = taskStats.completionRate || 0
          
          console.log('📋 任务数据已更新:', {
            总任务: this.overviewData.totalTasks,
            已完成: this.overviewData.completedTasks,
            进行中: this.overviewData.pendingTasks,
            已逾期: this.overviewData.overdueTasks,
            完成率: this.overviewData.completionRate + '%'
          })
        } else {
          console.error('❌ 获取任务统计数据失败:', taskStatsResponse)
        }

        // 渲染图表（饼状图将使用overviewData的数据）
        this.renderCharts()
        
        console.log('✅ 统计数据更新成功')
        
      } catch (error) {
        console.error('获取统计数据失败:', error)
      } finally {
        this.loading = false
      }
    },
    
    // 获取当前本地日期字符串
    getCurrentLocalDateString() {
      const now = new Date()
      return now.getFullYear() + '-' + 
             String(now.getMonth() + 1).padStart(2, '0') + '-' + 
             String(now.getDate()).padStart(2, '0')
    },
    
    // 获取本地时间的开始日期
    getStartDate() {
      const today = new Date()
      // 确保使用本地时间，设置为当天0点
      today.setHours(0, 0, 0, 0)
      
      let startDate = new Date(today)
      
      switch (this.period) {
        case 'today':
          // 今天开始就是今天0点
          break
        case 'week':
          startDate.setDate(today.getDate() - 6)
          break
        case 'month':
          startDate.setDate(today.getDate() - 29)
          break
        case 'quarter':
          startDate.setDate(today.getDate() - 89)
          break
        case 'year':
          startDate.setDate(today.getDate() - 364)
          break
      }
      
      // 确保设置为当天的开始时间
      startDate.setHours(0, 0, 0, 0)
      
      return startDate.getFullYear() + '-' + 
             String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
             String(startDate.getDate()).padStart(2, '0')
    },
    
    // 获取本地时间的结束日期（今天结束）
    getEndDate() {
      const today = new Date()
      // 设置为今天的23:59:59
      today.setHours(23, 59, 59, 999)
      
      return today.getFullYear() + '-' + 
             String(today.getMonth() + 1).padStart(2, '0') + '-' + 
             String(today.getDate()).padStart(2, '0')
    },
    
    // 修正时区数据分组问题 - 强制重新计算
    fixTimezoneDataGrouping() {
      if (!this.pomodoroChartData.dailyStats) {
        return
      }
      
      console.log('🔧 强制修正时区数据分组前:', {
        原始数据: this.pomodoroChartData.dailyStats,
        数据来源: '统计API',
        当前本地时间: new Date().toLocaleString()
      })
      
      // 如果原始数据有详细记录，按记录的实际完成时间重新分组
      const localGroupedData = new Map()
      const currentLocalDate = this.getCurrentLocalDateString()
      
      // 方案1: 如果有详细的记录数据，按记录的完成时间分组
      if (this.pomodoroChartData.records && Array.isArray(this.pomodoroChartData.records)) {
        console.log('📝 使用详细记录数据重新分组:', this.pomodoroChartData.records.length, '条记录')
        
        this.pomodoroChartData.records.forEach(record => {
          // 根据记录的完成时间计算本地日期
          let localDateStr = currentLocalDate
          
          if (record.completedAt || record.createdAt || record.timestamp) {
            const completionTime = new Date(record.completedAt || record.createdAt || record.timestamp)
            localDateStr = completionTime.getFullYear() + '-' + 
                          String(completionTime.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(completionTime.getDate()).padStart(2, '0')
          }
          
          // 按本地日期分组
          if (localGroupedData.has(localDateStr)) {
            const existing = localGroupedData.get(localDateStr)
            existing.count += 1
            existing.focusTime += (record.duration || 0)
          } else {
            localGroupedData.set(localDateStr, {
              date: localDateStr,
              count: 1,
              focusTime: record.duration || 0
            })
          }
        })
      } 
      // 方案2: 如果没有详细记录，对现有的dailyStats进行时区修正
      else {
        console.log('📊 使用现有统计数据进行时区修正')
        
        this.pomodoroChartData.dailyStats.forEach(item => {
          let localDateStr = item.date
          
          // 如果是UTC日期，可能需要调整到本地日期
          if (item.date) {
            try {
              // 尝试解析日期，如果是UTC格式则转换为本地日期
              const utcDate = new Date(item.date + 'T12:00:00Z') // 假设是UTC中午
              const localDate = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000))
              
              localDateStr = localDate.getFullYear() + '-' + 
                           String(localDate.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(localDate.getDate()).padStart(2, '0')
              
              // 如果转换后的日期与原日期不同，说明有时区问题
              if (localDateStr !== item.date) {
                console.log('🕐 时区转换:', {
                  原始日期: item.date,
                  转换后: localDateStr,
                  数据: { count: item.count, focusTime: item.focusTime }
                })
              }
            } catch (error) {
              // 如果解析失败，保持原日期
              console.warn('日期解析失败，保持原日期:', item.date)
              localDateStr = item.date
            }
          }
          
          // 按本地日期分组
          if (localGroupedData.has(localDateStr)) {
            const existing = localGroupedData.get(localDateStr)
            existing.count += (item.count || 0)
            existing.focusTime += (item.focusTime || 0)
          } else {
            localGroupedData.set(localDateStr, {
              date: localDateStr,
              count: item.count || 0,
              focusTime: item.focusTime || 0
            })
          }
        })
      }
      
      // 更新数据
      this.pomodoroChartData.dailyStats = Array.from(localGroupedData.values())
      
      // 按日期排序
      this.pomodoroChartData.dailyStats.sort((a, b) => new Date(a.date) - new Date(b.date))
      
      const todayData = this.pomodoroChartData.dailyStats.find(item => item.date === currentLocalDate)
      
      console.log('🔧 强制修正时区数据分组后:', {
        当前本地日期: currentLocalDate,
        总日期数: this.pomodoroChartData.dailyStats.length,
        今天的数据: todayData,
        所有数据: this.pomodoroChartData.dailyStats.map(item => ({
          日期: item.date,
          是否今天: item.date === currentLocalDate,
          番茄钟: item.count,
          专注时间: Math.round(item.focusTime / 60) + '分钟'
        }))
      })
      
      // 如果今天仍然没有数据，强制添加一条空数据确保显示
      if (!todayData && currentLocalDate) {
        console.log('⚠️ 今天没有数据，添加空数据占位')
        this.pomodoroChartData.dailyStats.push({
          date: currentLocalDate,
          count: 0,
          focusTime: 0
        })
        
        // 重新排序
        this.pomodoroChartData.dailyStats.sort((a, b) => new Date(a.date) - new Date(b.date))
      }
    },
    
    // 确保数据包含最新的日期并去重
    ensureLatestDates() {
      if (!this.pomodoroChartData.dailyStats) {
        this.pomodoroChartData.dailyStats = []
      }
      
      const expectedDates = this.generateDateRange(this.period)
      const existingData = new Map()
      
      // 将现有数据存入Map，避免重复
      this.pomodoroChartData.dailyStats.forEach(item => {
        if (item.date) {
          existingData.set(item.date, item)
        }
      })
      
      // 重新构建数据，确保每个日期只有一条记录
      this.pomodoroChartData.dailyStats = expectedDates.map(date => {
        return existingData.get(date) || {
          date: date,
          count: 0,
          focusTime: 0
        }
      })
      
      // 按日期排序（从早到晚）
      this.pomodoroChartData.dailyStats.sort((a, b) => new Date(a.date) - new Date(b.date))
      
      const currentLocalDate = this.getCurrentLocalDateString()
      const todayData = this.pomodoroChartData.dailyStats.find(item => item.date === currentLocalDate)
      
      console.log('📅 数据日期范围 (时区修复版):', {
        期间: this.period,
        日期数量: this.pomodoroChartData.dailyStats.length,
        开始日期: this.pomodoroChartData.dailyStats[0]?.date,
        结束日期: this.pomodoroChartData.dailyStats[this.pomodoroChartData.dailyStats.length - 1]?.date,
        当前本地日期: currentLocalDate,
        今天的数据: todayData ? `番茄钟${todayData.count}个, 专注${Math.round(todayData.focusTime/60)}分钟` : '无数据',
        所有日期: this.pomodoroChartData.dailyStats.map(item => item.date)
      })
    },
    
    changePeriod(period) {
      console.log('📅 切换时间周期:', period)
      this.period = period
      this.fetchData()
    },

    formatTime(seconds) {
      if (!seconds || seconds === 0) return '0<span class="time-unit">m</span>'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      
      if (hours > 0) {
        return minutes > 0 
          ? `${hours}<span class="time-unit">h</span>${minutes}<span class="time-unit">m</span>` 
          : `${hours}<span class="time-unit">h</span>`
      }
      return `${minutes}<span class="time-unit">m</span>`
    },
    
    renderCharts() {
      const isDark = document.documentElement.classList.contains('dark')
      const textColor = isDark ? '#f5f5f5' : '#333'
      const backgroundColor = isDark ? '#1a1a1a' : '#ffffff'
      
      this.renderPomodoroChart(textColor, backgroundColor, isDark)
      this.renderTaskChart(textColor, backgroundColor, isDark)
    },

    renderPomodoroChart(textColor, backgroundColor, isDark) {
      if (!this.pomodoroChartData?.dailyStats?.length) return
      
      const dailyStats = this.pomodoroChartData.dailyStats
      
      // 动态生成坐标轴标签，确保包含最新日期
      const dateLabels = dailyStats.map(item => this.formatDate(item.date))
      
      console.log('🎯 渲染番茄钟图表', {
        dateCount: dateLabels.length,
        firstDate: dailyStats[0]?.date,
        lastDate: dailyStats[dailyStats.length - 1]?.date,
        labels: dateLabels
      })
      
        const pomodoroOption = {
        backgroundColor: backgroundColor,
          textStyle: { color: textColor },
          title: {
          text: `${this.getPeriodLabel()}专注趋势`,
            left: 'center',
          textStyle: { color: textColor, fontSize: 16 }
          },
          tooltip: {
            trigger: 'axis',
          axisPointer: { type: 'cross' },
          formatter: function(params) {
            const date = params[0].axisValue
            const pomodoros = params[0].value
            const focusTime = params[1] ? params[1].value : 0
            return `${date}<br/>
                    🍅 番茄钟: ${pomodoros}个<br/>
                    ⏰ 专注时长: ${Math.round(focusTime/60)}分钟`
            }
          },
          legend: {
          data: ['番茄钟数量', '专注时长'],
            bottom: 0,
            textStyle: { color: textColor }
          },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dateLabels, // 使用动态生成的日期标签
          axisLabel: { 
            color: textColor,
            rotate: dateLabels.length > 7 ? 45 : 0 // 日期多时旋转标签
          },
          axisLine: { lineStyle: { color: textColor } }
        },
          yAxis: [
            {
              type: 'value',
              name: '番茄钟数量',
              axisLabel: { color: textColor },
            nameTextStyle: { color: textColor },
            axisLine: { lineStyle: { color: textColor } },
            splitLine: { lineStyle: { color: isDark ? '#333' : '#f0f0f0' } }
            },
            {
              type: 'value',
            name: '专注时长(分钟)',
              axisLabel: {
              formatter: '{value}分',
                color: textColor
              },
            nameTextStyle: { color: textColor },
            axisLine: { lineStyle: { color: textColor } },
            splitLine: { show: false }
            }
          ],
          series: [
            {
              name: '番茄钟数量',
              type: 'bar',
            data: dailyStats.map(item => item.count),
            itemStyle: {
              color: '#ff6b6b',
              borderRadius: [4, 4, 0, 0]
            }
            },
            {
            name: '专注时长',
              type: 'line',
              yAxisIndex: 1,
            data: dailyStats.map(item => Math.round(item.focusTime / 60)),
            lineStyle: { color: '#4ecdc4', width: 3 },
            symbolSize: 6,
            symbol: 'circle'
            }
          ]
        }
      
        this.pomodoroChart.setOption(pomodoroOption)
    },

    renderTaskChart(textColor, backgroundColor, isDark) {
      console.log('🥧 开始渲染任务饼状图')
      
      // 直接使用选项卡的数据源，确保一致性
      const tasksByStatus = [
        { name: '已完成', value: this.overviewData.completedTasks || 0, color: '#4CAF50' },
        { name: '进行中', value: this.overviewData.pendingTasks || 0, color: '#2196F3' },
        { name: '已逾期', value: this.overviewData.overdueTasks || 0, color: '#F44336' }
      ].filter(item => item.value > 0) // 只显示有数据的状态
      
      console.log('📊 使用选项卡数据渲染饼状图:', tasksByStatus)
      
      if (tasksByStatus.length === 0) {
        console.warn('⚠️ 无任务数据，显示空状态')
        const emptyOption = {
          backgroundColor: backgroundColor,
          textStyle: { color: textColor },
          title: {
            text: '暂无任务数据',
            left: 'center',
            top: 'center',
            textStyle: { color: textColor, fontSize: 16 }
          },
          series: []
        }
        this.taskChart.setOption(emptyOption)
        return
      }
      
      const taskOption = {
        backgroundColor: backgroundColor,
        textStyle: { color: textColor },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: '5%',
          left: 'center',
          textStyle: { color: textColor, fontSize: 12 },
          itemWidth: 14,
          itemHeight: 14
        },
        grid: {
          left: '5%',
          right: '5%',
          top: '5%',
          bottom: '20%',
          containLabel: true
        },
        series: [
          {
            name: '任务状态',
            type: 'pie',
            radius: ['20%', '60%'],
            center: ['50%', '45%'],
            data: tasksByStatus.map(item => ({
              name: item.name,
              value: item.value,
              itemStyle: { color: item.color }
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: {
              formatter: '{b}: {c}',
              color: textColor,
              position: 'outside',
              fontSize: 12
            },
            labelLine: {
              show: true,
              length: 20,
              length2: 10
            }
          }
        ]
      }
      
      this.taskChart.setOption(taskOption)
      console.log('✅ 任务饼状图渲染完成，数据来源：选项卡')
    },

    getPeriodLabel() {
      const labels = {
        today: '今日',
        week: '近7天',
        month: '近30天', 
        quarter: '近90天',
        year: '近一年'
      }
      return labels[this.period] || '近7天'
    },
    
    // 处理窗口大小变化
    handleResize() {
      if (this.pomodoroChart) {
        this.pomodoroChart.resize()
      }
      if (this.taskChart) {
        this.taskChart.resize()
      }
    },

    // 监听主题变化
    observeThemeChange() {
      // 创建一个观察器来监听主题变化
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            // 添加主题切换动画效果
            this.addThemeTransitionClass()
            
            // 延迟重新渲染图表，确保CSS已经应用
            setTimeout(() => {
              console.log('🎨 检测到主题变化，重新渲染图表')
              this.renderCharts()
            }, 100)
          }
        })
      })

      // 开始观察document.documentElement的class属性变化
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      })

      // 保存observer引用以便后续清理
      this.themeObserver = observer
    },

    // 添加主题切换动画类
    addThemeTransitionClass() {
      const container = this.$el
      if (container) {
        container.classList.add('theme-transitioning')
        
        // 300ms后移除动画类
        setTimeout(() => {
          container.classList.remove('theme-transitioning')
        }, 300)
      }
    },

    // 使用番茄钟API的正确数据修正今天的统计，并避免重复统计
    correctTodayDataFromPomodoroAPI(pomodoroApiData) {
      const currentLocalDate = this.getCurrentLocalDateString()
      const yesterdayDate = this.getYesterdayDateString()
      
      console.log('📍 使用番茄钟API修正今天数据并检查重复统计:', {
        当前本地日期: currentLocalDate,
        昨天日期: yesterdayDate,
        番茄钟API今天数据: pomodoroApiData,
        修正前图表数据: this.pomodoroChartData.dailyStats?.map(item => ({
          日期: item.date,
          番茄钟: item.count,
          专注时间: item.focusTime
        }))
      })
      
      // 从番茄钟API数据中提取今天的正确数据
      const correctTodayData = {
        date: currentLocalDate,
        count: pomodoroApiData.completedPomodoros || pomodoroApiData.totalPomodoros || 0,
        focusTime: pomodoroApiData.totalFocusTime || 0
      }
      
      if (!this.pomodoroChartData.dailyStats || !Array.isArray(this.pomodoroChartData.dailyStats)) {
        return
      }
      
      // 查找今天和昨天的数据
      const todayIndex = this.pomodoroChartData.dailyStats.findIndex(item => item.date === currentLocalDate)
      const yesterdayIndex = this.pomodoroChartData.dailyStats.findIndex(item => item.date === yesterdayDate)
      
      // 检查是否存在重复统计的情况
      let duplicateDetected = false
      let correctedYesterdayData = null
      
      if (yesterdayIndex >= 0) {
        const yesterdayOriginal = this.pomodoroChartData.dailyStats[yesterdayIndex]
        const todayOriginal = todayIndex >= 0 ? this.pomodoroChartData.dailyStats[todayIndex] : { count: 0, focusTime: 0 }
        
        // 计算当前图表显示的今天+昨天总数
        const totalFromChart = (todayOriginal.count || 0) + (yesterdayOriginal.count || 0)
        const todayCorrectCount = correctTodayData.count
        
        console.log('🔍 重复统计检测:', {
          图表中今天: todayOriginal.count || 0,
          图表中昨天: yesterdayOriginal.count || 0,
          图表总计: totalFromChart,
          番茄钟API今天正确数据: todayCorrectCount,
          疑似今天数据在昨天: totalFromChart > todayCorrectCount && todayCorrectCount > 0
        })
        
        // 如果图表总数大于今天的正确数据，且今天确实有数据，说明今天的数据可能被归到昨天了
        if (totalFromChart > todayCorrectCount && todayCorrectCount > 0) {
          duplicateDetected = true
          
          // 计算昨天应该有的数据：总数减去今天的正确数据
          const shouldBeYesterday = Math.max(0, totalFromChart - todayCorrectCount)
          
          console.log('⚠️ 检测到重复统计，重新分配数据:', {
            昨天原始: yesterdayOriginal.count,
            今天原始: todayOriginal.count || 0,
            今天正确: todayCorrectCount,
            昨天应该是: shouldBeYesterday,
            重复的部分: (yesterdayOriginal.count || 0) - shouldBeYesterday
          })
          
          // 修正昨天的数据
          correctedYesterdayData = {
            ...yesterdayOriginal,
            count: shouldBeYesterday,
            focusTime: Math.max(0, (yesterdayOriginal.focusTime || 0) - (correctTodayData.focusTime || 0))
          }
          
          this.pomodoroChartData.dailyStats[yesterdayIndex] = correctedYesterdayData
        }
      }
      
      // 设置今天的正确数据
      if (todayIndex >= 0) {
        // 替换现有的今天数据
        console.log('🔄 替换今天的数据:', {
          修正前: this.pomodoroChartData.dailyStats[todayIndex],
          修正后: correctTodayData,
          是否检测到重复: duplicateDetected
        })
        this.pomodoroChartData.dailyStats[todayIndex] = correctTodayData
      } else {
        // 添加今天的数据
        console.log('➕ 添加今天的数据:', correctTodayData)
        this.pomodoroChartData.dailyStats.push(correctTodayData)
      }
      
      // 重新排序
      this.pomodoroChartData.dailyStats.sort((a, b) => new Date(a.date) - new Date(b.date))
      
      // 验证修正结果
      const finalYesterdayData = this.pomodoroChartData.dailyStats.find(item => item.date === yesterdayDate)
      const finalTodayData = this.pomodoroChartData.dailyStats.find(item => item.date === currentLocalDate)
      const finalTotal = (finalYesterdayData?.count || 0) + (finalTodayData?.count || 0)
      
      console.log('✅ 数据修正完成（含重复检测）:', {
        昨天最终: finalYesterdayData ? `${finalYesterdayData.count}个番茄钟` : '无数据',
        今天最终: finalTodayData ? `${finalTodayData.count}个番茄钟` : '无数据',
        两日总计: finalTotal + '个番茄钟',
        番茄钟API今天: correctTodayData.count + '个番茄钟',
        检测到重复: duplicateDetected,
        数据一致性: duplicateDetected ? '已修正' : '正常',
        所有日期数据: this.pomodoroChartData.dailyStats.map(item => ({
          日期: item.date,
          番茄钟: item.count,
          专注分钟: Math.round((item.focusTime || 0) / 60)
        }))
      })
    },
    
    // 获取昨天的日期字符串
    getYesterdayDateString() {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return yesterday.getFullYear() + '-' + 
             String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
             String(yesterday.getDate()).padStart(2, '0')
    },

    // 根据修正后的图表数据更新概览数据，确保一致性
    updateOverviewDataFromChartData() {
      if (!this.pomodoroChartData.dailyStats || this.pomodoroChartData.dailyStats.length === 0) {
        return
      }
      
      // 根据当前选择的时间周期计算总数据
      let totalPomodoros = 0
      let totalFocusTime = 0
      
      if (this.period === 'today') {
        // 今日模式：只计算今天的数据
        const currentLocalDate = this.getCurrentLocalDateString()
        const todayData = this.pomodoroChartData.dailyStats.find(item => item.date === currentLocalDate)
        if (todayData) {
          totalPomodoros = todayData.count || 0
          totalFocusTime = todayData.focusTime || 0
        }
      } else {
        // 其他时间周期：计算所有天数的总和
        this.pomodoroChartData.dailyStats.forEach(dayData => {
          totalPomodoros += (dayData.count || 0)
          totalFocusTime += (dayData.focusTime || 0)
        })
      }
      
      console.log('🔄 根据图表数据更新概览数据:', {
        时间周期: this.period,
        图表天数: this.pomodoroChartData.dailyStats.length,
        计算前概览: {
          番茄钟: this.overviewData.totalPomodoros,
          专注时间: Math.round(this.overviewData.totalFocusTime / 60) + '分钟'
        },
        计算后概览: {
          番茄钟: totalPomodoros,
          专注时间: Math.round(totalFocusTime / 60) + '分钟'
        }
      })
      
      // 更新概览数据
      this.overviewData.totalPomodoros = totalPomodoros
      this.overviewData.totalFocusTime = totalFocusTime
    },

    // 根据任务图表数据更新任务概览统计
    updateTaskOverviewFromChartData() {
      if (!this.taskChartData?.tasksByStatus?.length) {
        return
      }
      
      console.log('📋 根据任务图表数据更新概览统计:', this.taskChartData.tasksByStatus)
      
      // 从图表数据中提取任务统计
      let totalTasks = 0
      let completedTasks = 0
      let pendingTasks = 0
      let overdueTasks = 0
      
      this.taskChartData.tasksByStatus.forEach(statusItem => {
        totalTasks += statusItem.value || 0
        
        if (statusItem.name === '已完成') {
          completedTasks = statusItem.value || 0
        } else if (statusItem.name === '进行中') {
          pendingTasks = statusItem.value || 0
        } else if (statusItem.name === '已逾期') {
          overdueTasks = statusItem.value || 0
        }
      })
      
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      
      // 更新概览数据
      this.overviewData.totalTasks = totalTasks
      this.overviewData.completedTasks = completedTasks
      this.overviewData.pendingTasks = pendingTasks
      this.overviewData.overdueTasks = overdueTasks
      this.overviewData.completionRate = completionRate
      
      console.log('📋 任务概览数据已更新:', {
        总任务: totalTasks,
        已完成: completedTasks,
        进行中: pendingTasks,
        已逾期: overdueTasks,
        完成率: completionRate + '%'
      })
    },
  },
  beforeDestroy() {
    // 清理定时器
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
    
    // 清理主题观察器
    if (this.themeObserver) {
      this.themeObserver.disconnect()
    }
    
    // 清理图表实例
    if (this.pomodoroChart) {
      this.pomodoroChart.dispose()
    }
    if (this.taskChart) {
      this.taskChart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style scoped>
.statistics-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 时间范围选择器 */
.range-selector {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.range-selector button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.range-selector button:hover {
  background: #f8f9fa;
  border-color: #007bff;
}

.range-selector button.active {
  background: #007bff;
  color: #fff;
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
}

/* 概览卡片 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }
}

.stats-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stats-card:hover::before {
  width: 6px;
}

.stats-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  margin-right: 4px;
  transition: background-color 0.3s ease;
}

.stats-content {
  flex: 1;
  text-align: left;
}

.stats-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
  line-height: 1.2;
  transition: color 0.3s ease;
}

.stats-label {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color 0.3s ease;
}

/* 不同卡片的主题色 */
.pomodoro-card::before {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
}

.pomodoro-card .stats-icon {
  background: rgba(255, 107, 107, 0.1);
}

.pomodoro-card .stats-number {
  color: #e74c3c;
}

.focus-card::before {
  background: linear-gradient(135deg, #4ecdc4 0%, #26de81 100%);
}

.focus-card .stats-icon {
  background: rgba(78, 205, 196, 0.1);
}

.focus-card .stats-number {
  color: #16a085;
}

.task-card::before {
  background: linear-gradient(135deg, #45b7d1 0%, #96CEB4 100%);
}

.task-card .stats-icon {
  background: rgba(69, 183, 209, 0.1);
}

.task-card .stats-number {
  color: #2980b9;
}



.completion-card::before {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.completion-card .stats-icon {
  background: rgba(240, 147, 251, 0.1);
}

.completion-card .stats-number {
  color: #8e44ad;
}

/* 图表容器 */
.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
}

.chart-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.chart-section h3 {
  margin-bottom: 15px;
  color: #333;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  transition: color 0.3s ease;
}

.chart {
  width: 100%;
  height: 400px;
}

/* === 主题切换动画 === */
.theme-transitioning * {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.theme-transitioning .stats-card {
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.theme-transitioning .chart-section {
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* === 深色主题样式 === */
html.dark .statistics-container {
  background: transparent;
  color: #e8e8e8;
}

/* 时间范围选择器深色主题 */
html.dark .range-selector button {
  background: #1a1a1a;
  color: #e8e8e8;
  border: 1px solid #2a2a2a;
}

html.dark .range-selector button:hover {
  background: #252525;
  border-color: #3b82f6;
  color: #3b82f6;
}

html.dark .range-selector button.active {
  background: #3b82f6;
  color: #ffffff;
  border-color: #3b82f6;
}

/* 统计卡片深色主题 - 使用更暗的背景 */
html.dark .stats-card {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

html.dark .stats-card:hover {
  background: #252525;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
}

html.dark .stats-number {
  color: #ffffff;
}

html.dark .stats-label {
  color: #b8b8b8;
}

/* 统计卡片图标区域深色优化 */
html.dark .stats-icon {
  background: rgba(255, 255, 255, 0.05);
}

/* 图表区域深色主题 */
html.dark .chart-section {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

html.dark .chart-section h3 {
  color: #ffffff;
}


/* === 响应式深色主题优化 === */
@media (max-width: 768px) {
  html.dark .statistics-container {
    padding: 16px;
    background: transparent;
  }
  
  html.dark .chart-section {
    background: #1a1a1a;
    border-color: #2a2a2a;
  }
  
  html.dark .stats-card {
    background: #1a1a1a;
    border-color: #2a2a2a;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .stats-card {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .statistics-container {
    padding: 10px;
  }

  .overview-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stats-card {
    padding: 16px;
    gap: 12px;
  }

  .stats-icon {
    font-size: 2rem;
    width: 50px;
    height: 50px;
  }

  .stats-number {
    font-size: 1.5rem;
  }

  .stats-label {
    font-size: 12px;
  }

  .chart {
    height: 300px;
  }

  .range-selector {
    gap: 4px;
  }

  .range-selector button {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style> 