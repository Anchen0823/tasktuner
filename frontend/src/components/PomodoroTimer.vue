<template>
  <div class="pomodoro-timer">
    <div class="timer-container">
      <!-- 计时器显示 -->
      <div class="timer-display">
        <div class="timer-circle">
          <div class="timer-time">{{ formatTimerDisplay(timeLeft) }}</div>
          <div class="timer-label">{{ currentPhaseLabel }}</div>
        </div>
        
        <!-- 进度环 -->
        <svg class="progress-ring" width="300" height="300">
          <circle
            class="progress-ring-bg"
            stroke="#e0e0e0"
            stroke-width="8"
            fill="transparent"
            r="140"
            cx="150"
            cy="150"
          />
          <circle
            class="progress-ring-progress"
            :stroke="progressColor"
            stroke-width="8"
            fill="transparent"
            r="140"
            cx="150"
            cy="150"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            stroke-linecap="round"
            transform="rotate(-90 150 150)"
          />
        </svg>
      </div>

      <!-- 控制按钮 -->
      <div class="timer-controls">
        <button 
          v-if="!isRunning" 
          @click="startTimer" 
          class="btn btn-primary btn-large"
        >
          <span class="btn-icon">▶️</span>
          开始专注
        </button>
        <button 
          v-else 
          @click="pauseTimer" 
          class="btn btn-warning btn-large"
        >
          <span class="btn-icon">⏸️</span>
          暂停
        </button>
        <button 
          @click="resetTimer" 
          class="btn btn-secondary btn-large"
        >
          <span class="btn-icon">🔄</span>
          重置
        </button>
        <button 
          @click="skipPhase" 
          class="btn btn-info btn-large"
        >
          <span class="btn-icon">⏭️</span>
          跳过
        </button>
      </div>

      <!-- 阶段指示器 -->
      <div class="phase-indicator">
        <div 
          v-for="(phase, index) in phases" 
          :key="phase.type"
          :class="['phase-dot', { 
            active: currentPhaseIndex === index,
            completed: index < currentPhaseIndex 
          }]"
          :title="`${phase.label} (${phase.duration}分钟)`"
        >
          <span class="phase-icon">{{ phase.icon }}</span>
        </div>
      </div>
    </div>

    <!-- 设置面板 -->
    <div class="settings-panel">
      <h3>番茄钟设置</h3>
      <div class="settings-grid">
        <div class="setting-item">
          <label>专注时长 (分钟)</label>
          <input 
            v-model.number="settings.focusDuration" 
            type="number" 
            min="1" 
            max="120"
            step="1"
            class="form-control"
            placeholder="建议25-45分钟"
            title="专注时长建议在25-45分钟之间，不要超过120分钟"
            @input="ensureInteger('focusDuration', $event)"
          />
          <small class="setting-hint">建议25-45分钟，不要超过120分钟</small>
        </div>
        <div class="setting-item">
          <label>短休息时长 (分钟)</label>
          <input 
            v-model.number="settings.shortBreakDuration" 
            type="number" 
            min="1" 
            max="30"
            step="1"
            class="form-control"
            placeholder="建议3-10分钟"
            title="短休息时长建议在3-10分钟之间"
            @input="ensureInteger('shortBreakDuration', $event)"
          />
          <small class="setting-hint">建议3-10分钟</small>
        </div>
        <div class="setting-item">
          <label>长休息时长 (分钟)</label>
          <input 
            v-model.number="settings.longBreakDuration" 
            type="number" 
            min="1" 
            max="60"
            step="1"
            class="form-control"
            placeholder="建议15-30分钟"
            title="长休息时长建议在15-30分钟之间"
            @input="ensureInteger('longBreakDuration', $event)"
          />
          <small class="setting-hint">建议15-30分钟</small>
        </div>
        <div class="setting-item">
          <label>长休息间隔</label>
          <input 
            v-model.number="settings.longBreakInterval" 
            type="number" 
            min="1" 
            max="10"
            step="1"
            class="form-control"
            placeholder="建议3-5个番茄钟"
            title="长休息间隔建议在3-5个番茄钟之间"
            @input="ensureInteger('longBreakInterval', $event)"
          />
          <small class="setting-hint">建议3-5个番茄钟</small>
        </div>
      </div>
      <button @click="saveSettings" class="btn btn-primary">保存设置</button>
    </div>

    <!-- 统计信息 -->
    <div class="stats-panel">
      <h3>今日统计</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ todayStats.completedPomodoros }}</div>
          <div class="stat-label">完成番茄数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" v-html="formatTime(todayStats.totalFocusTime)"></div>
          <div class="stat-label">总专注时间</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ todayStats.totalBreaks }}</div>
          <div class="stat-label">休息次数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ todayStats.efficiency }}%</div>
          <div class="stat-label">效率</div>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="history-panel">
      <h3>专注记录</h3>
      <div class="history-list">
        <div 
          v-for="record in recentRecords" 
          :key="record.id"
          class="history-item"
        >
          <div class="history-info">
            <div class="history-time" v-html="formatTime(record.duration * 60)"></div>
            <div class="history-type">{{ record.type === 'focus' ? '专注' : '休息' }}</div>
          </div>
          <div class="history-date">{{ formatDateTime(record.completedAt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { pomodoroApi, pomodoroUtils } from '../api/pomodoroApi'

export default {
  name: 'PomodoroTimer',
  setup() {
    // 计时器状态
    const isRunning = ref(false)
    const timeLeft = ref(0)
    const currentPhaseIndex = ref(0)
    const timerInterval = ref(null)

    // 设置
    const settings = ref({
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4
    })

    // 统计数据
    const todayStats = ref({
      completedPomodoros: 0,
      totalFocusTime: 0,
      totalBreaks: 0,
      efficiency: 0
    })

    const recentRecords = ref([])

    // 阶段定义
    const phases = computed(() => {
      const focusPhase = {
        type: 'focus',
        label: '专注',
        icon: '🎯',
        duration: settings.value.focusDuration * 60
      }
      
      const shortBreakPhase = {
        type: 'shortBreak',
        label: '短休息',
        icon: '☕',
        duration: settings.value.shortBreakDuration * 60
      }
      
      const longBreakPhase = {
        type: 'longBreak',
        label: '长休息',
        icon: '🌴',
        duration: settings.value.longBreakDuration * 60
      }

      const phaseSequence = []
      
      // 添加专注和短休息循环
      for (let i = 0; i < settings.value.longBreakInterval; i++) {
        phaseSequence.push(focusPhase)
        if (i < settings.value.longBreakInterval - 1) {
          phaseSequence.push(shortBreakPhase)
        }
      }
      
      // 添加长休息
      phaseSequence.push(longBreakPhase)
      
      return phaseSequence
    })

    // 当前阶段
    const currentPhase = computed(() => phases.value[currentPhaseIndex.value])
    const currentPhaseLabel = computed(() => currentPhase.value?.label || '准备开始')

    // 监听设置变化，更新计时器时间
    watch(settings, () => {
      // 如果计时器没有运行，更新当前阶段的时间
      if (!isRunning.value) {
        timeLeft.value = currentPhase.value.duration
      }
    }, { deep: true })

    // 监听阶段变化，确保时间同步
    watch(currentPhase, (newPhase) => {
      if (newPhase && !isRunning.value) {
        timeLeft.value = newPhase.duration
      }
    })

    // 进度计算
    const circumference = 2 * Math.PI * 140
    const progress = computed(() => {
      if (!currentPhase.value) return 0
      const total = currentPhase.value.duration
      const remaining = timeLeft.value
      return Math.max(0, (total - remaining) / total)
    })
    
    const strokeDashoffset = computed(() => {
      return circumference * (1 - progress.value)
    })

    const progressColor = computed(() => {
      if (currentPhase.value?.type === 'focus') return '#ff6b6b'
      if (currentPhase.value?.type === 'shortBreak') return '#4ecdc4'
      return '#45b7d1'
    })

    // 加载数据
    const loadData = async () => {
      try {
        console.log('🔄 开始加载番茄钟数据...')
        
        // 加载设置
        console.log('📥 正在加载设置...')
        const settingsResponse = await pomodoroApi.getSettings()
        console.log('📨 设置API响应:', settingsResponse)
        
        if (settingsResponse.success && settingsResponse.data) {
          console.log('✅ 设置加载成功:', settingsResponse.data)
          console.log('🔧 当前设置:', settings.value)
          settings.value = { ...settings.value, ...settingsResponse.data }
          console.log('🔧 更新后设置:', settings.value)
        } else {
          console.log('⚠️ 设置响应无效或失败:', settingsResponse)
        }

        // 加载今日统计
        console.log('📊 正在加载统计...')
        const statsResponse = await pomodoroApi.getStatistics({ period: 'today' })
        console.log('📨 统计API响应:', statsResponse)
        
        if (statsResponse.success && statsResponse.data) {
          console.log('✅ 统计加载成功:', statsResponse.data)
          todayStats.value = { ...todayStats.value, ...statsResponse.data }
        } else {
          console.log('⚠️ 统计响应无效或失败:', statsResponse)
        }

        // 加载历史记录
        console.log('📝 正在加载记录...')
        const recordsResponse = await pomodoroApi.getRecords({ size: 10 })
        console.log('📨 记录API响应:', recordsResponse)
        
        if (recordsResponse.success && recordsResponse.data) {
          console.log('✅ 记录加载成功:', recordsResponse.data)
          recentRecords.value = recordsResponse.data.records || []
        } else {
          console.log('⚠️ 记录响应无效或失败:', recordsResponse)
        }
        
        console.log('✅ 番茄钟数据加载完成')
      } catch (error) {
        console.error('❌ 加载番茄钟数据失败:', error)
        console.error('❌ 错误详情:', error.response?.data || error.message)
      }
    }

    // 计时器方法
    const startTimer = () => {
      // 先清除任何现有的计时器，防止多个计时器同时运行
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }
      
      // 确保时间不为负数
      if (timeLeft.value <= 0) {
        timeLeft.value = currentPhase.value.duration
      }
      
      isRunning.value = true
      timerInterval.value = setInterval(() => {
        if (timeLeft.value > 0) {
          timeLeft.value--
        } else {
          completePhase()
        }
      }, 1000)
    }

    const pauseTimer = () => {
      isRunning.value = false
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }
    }

    const resetTimer = () => {
      console.log('🔄 重置计时器')
      pauseTimer()
      timeLeft.value = currentPhase.value.duration
      // 清除保存的状态
      clearTimerState()
      console.log('✅ 计时器重置完成')
    }

    const skipPhase = () => {
      completePhase(true)
    }

    const completePhase = async (isSkipped = false) => {
      pauseTimer()
      
      // 保存当前阶段信息（在切换之前）
      const completedPhase = currentPhase.value
      
      // 只有非跳过的情况下才记录
      if (!isSkipped) {
        // 记录完成 - 确保duration不为负数，并转换为分钟
        const actualDurationSeconds = Math.max(0, completedPhase.duration - timeLeft.value)
        const actualDurationMinutes = Math.ceil(actualDurationSeconds / 60) // 向上取整到分钟
        const recordData = {
          type: completedPhase.type,
          duration: actualDurationMinutes
        }
        
        // 保存到API
        try {
          await pomodoroApi.addRecord(recordData)
          
          // 重新加载统计和记录
          await loadData()
        } catch (error) {
          console.error('保存记录失败:', error)
        }
      }
      
      // 进入下一阶段
      currentPhaseIndex.value = (currentPhaseIndex.value + 1) % phases.value.length
      timeLeft.value = currentPhase.value.duration
      
      // 清除旧状态并保存新状态
      saveTimerState()
      
      // 播放通知音（如果有）- 只有非跳过时才通知，使用已完成的阶段信息
      if (!isSkipped && Notification.permission === 'granted') {
        new Notification('番茄钟完成', {
          body: `${completedPhase.label}阶段已完成！即将开始${currentPhase.value.label}`,
          icon: '/favicon.ico'
        })
      }
    }

    // 设置方法
    const saveSettings = async () => {
      try {
        // 确保所有设置都是数字类型
        const settingsToSave = {
          focusDuration: parseInt(settings.value.focusDuration) || 25,
          shortBreakDuration: parseInt(settings.value.shortBreakDuration) || 5,
          longBreakDuration: parseInt(settings.value.longBreakDuration) || 15,
          longBreakInterval: parseInt(settings.value.longBreakInterval) || 4
        }
        
        console.log('准备保存设置:', settingsToSave)
        
        // 保存到API
        const response = await pomodoroApi.saveSettings(settingsToSave)
        console.log('保存设置响应:', response)
        
        // 重新计算阶段并重置计时器
        currentPhaseIndex.value = 0
        timeLeft.value = currentPhase.value.duration
        
        console.log('设置保存成功')
        // 显示成功提示
        alert('设置保存成功！')
      } catch (error) {
        console.error('保存设置失败:', error)
        
        // 显示用户友好的错误信息
        let errorMessage = '保存设置失败，请重试'
        
        if (error.response && error.response.data && error.response.data.error) {
          const errorData = error.response.data.error
          
          // 根据错误类型显示不同的提示信息
          switch (errorData.code) {
            case 'INVALID_INPUT':
              if (errorData.message.includes('专注时长')) {
                errorMessage = '专注时长设置无效！\n\n建议：\n• 专注时长建议在 25-45 分钟之间\n• 不要超过 120 分钟，避免过度疲劳\n• 也不要少于 1 分钟'
              } else if (errorData.message.includes('短休息时长')) {
                errorMessage = '短休息时长设置无效！\n\n建议：\n• 短休息时长建议在 3-10 分钟之间\n• 不要超过 30 分钟\n• 也不要少于 1 分钟'
              } else if (errorData.message.includes('长休息时长')) {
                errorMessage = '长休息时长设置无效！\n\n建议：\n• 长休息时长建议在 15-30 分钟之间\n• 不要超过 60 分钟\n• 也不要少于 1 分钟'
              } else if (errorData.message.includes('长休息间隔')) {
                errorMessage = '长休息间隔设置无效！\n\n建议：\n• 长休息间隔建议在 3-5 个番茄钟之间\n• 不要超过 10 个番茄钟\n• 也不要少于 1 个番茄钟'
              } else {
                errorMessage = errorData.message
              }
              break
            case 'VALIDATION_ERROR':
              errorMessage = `数据验证失败：${errorData.message}\n\n请检查输入的数据格式是否正确`
              break
            case 'UNAUTHORIZED':
              errorMessage = '登录已过期，请重新登录'
              break
            default:
              errorMessage = errorData.message || errorMessage
          }
        }
        
        // 显示错误信息
        alert(errorMessage)
        
        // 显示更详细的错误信息
        if (error.response) {
          console.error('错误状态码:', error.response.status)
          console.error('错误响应数据:', error.response.data)
          console.error('错误响应头:', error.response.headers)
        } else if (error.request) {
          console.error('请求错误:', error.request)
        } else {
          console.error('其他错误:', error.message)
        }
      }
    }

    // 工具方法
    // 计时器显示格式（分:秒）
    const formatTimerDisplay = (seconds) => {
      // 确保seconds不为负数
      const safeSeconds = Math.max(0, seconds)
      const mins = Math.floor(safeSeconds / 60)
      const secs = safeSeconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    // 统计时间显示格式（10h24m）
    const formatTime = (seconds) => {
      // 确保seconds不为负数
      const safeSeconds = Math.max(0, seconds)
      const hours = Math.floor(safeSeconds / 3600)
      const minutes = Math.floor((safeSeconds % 3600) / 60)
      
      if (hours > 0) {
        return minutes > 0 
          ? `${hours}<span class="time-unit">h</span>${minutes}<span class="time-unit">m</span>` 
          : `${hours}<span class="time-unit">h</span>`
      }
      return minutes > 0 
        ? `${minutes}<span class="time-unit">m</span>` 
        : `0<span class="time-unit">m</span>`
    }

    const formatDateTime = (date) => {
      return new Date(date).toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 状态保存和恢复
    const saveTimerState = () => {
      if (!isInitialized.value) {
        console.log('⏳ 跳过状态保存 - 组件还未初始化完成')
        return
      }
      
      const state = {
        isRunning: isRunning.value,
        timeLeft: timeLeft.value,
        currentPhaseIndex: currentPhaseIndex.value,
        timestamp: Date.now(),
        version: '1.0' // 添加版本号用于状态兼容性检查
      }
      
      console.log('💾 保存计时器状态:', {
        isRunning: state.isRunning,
        timeLeft: state.timeLeft,
        currentPhase: currentPhase.value?.label,
        currentPhaseIndex: state.currentPhaseIndex
      })
      
      localStorage.setItem('pomodoroTimerState', JSON.stringify(state))
    }

    const restoreTimerState = () => {
      try {
        const savedState = localStorage.getItem('pomodoroTimerState')
        if (!savedState) {
          console.log('ℹ️ 没有找到保存的计时器状态')
          return false
        }

        const state = JSON.parse(savedState)
        console.log('📤 从本地存储恢复状态:', state)
        
        // 检查状态有效性
        if (typeof state.timeLeft !== 'number' || state.timeLeft < 0) {
          console.warn('⚠️ 保存的状态无效 - timeLeft异常:', state.timeLeft)
          return false
        }
        
        if (typeof state.currentPhaseIndex !== 'number' || state.currentPhaseIndex < 0) {
          console.warn('⚠️ 保存的状态无效 - currentPhaseIndex异常:', state.currentPhaseIndex)
          return false
        }

        const now = Date.now()
        const elapsed = Math.floor((now - state.timestamp) / 1000)
        console.log(`⏰ 自上次保存已过去 ${elapsed} 秒`)

        // 检查是否超出合理时间范围（比如超过24小时就认为过期）
        if (elapsed > 24 * 60 * 60) {
          console.log('⚠️ 保存的状态已过期（超过24小时），不恢复')
          return false
        }

        currentPhaseIndex.value = state.currentPhaseIndex
        console.log(`📍 恢复阶段: ${currentPhase.value?.label}`)

        if (state.isRunning) {
          // 如果之前在运行，计算已过时间
          const remainingTime = state.timeLeft - elapsed
          console.log(`⏳ 计算剩余时间: ${state.timeLeft} - ${elapsed} = ${remainingTime} 秒`)
          
          if (remainingTime > 0) {
            timeLeft.value = remainingTime
            // 只有当前没有运行时才自动恢复计时，避免重复启动
            if (!isRunning.value) {
              console.log('▶️ 自动恢复计时器运行')
              startTimer()
            }
          } else {
            console.log('⏰ 时间已到，完成当前阶段')
            // 时间已到，完成当前阶段
            completePhase()
          }
        } else {
          // 如果之前是暂停状态，直接恢复时间
          console.log('⏸️ 恢复暂停状态')
          timeLeft.value = state.timeLeft
          isRunning.value = false
        }

        console.log('✅ 计时器状态恢复成功')
        return true
        
      } catch (error) {
        console.error('❌ 恢复计时器状态失败:', error)
        // 清除损坏的状态
        localStorage.removeItem('pomodoroTimerState')
      }
      return false
    }

    const clearTimerState = () => {
      console.log('🗑️ 清除保存的计时器状态')
      localStorage.removeItem('pomodoroTimerState')
    }

    // 状态监听标志，防止初始化时误触发保存
    const isInitialized = ref(false)
    // 主题观察器
    const themeObserver = ref(null)

    // 监听计时器状态变化，自动保存（只在初始化完成后）
    watch([isRunning, timeLeft, currentPhaseIndex], () => {
      if (isInitialized.value) {
        saveTimerState()
      }
    })

    // 生命周期
    onMounted(async () => {
      console.log('🔄 番茄钟组件开始初始化...')
      
      // 加载数据
      await loadData()
      console.log('✅ 数据加载完成')
      
      // 尝试恢复计时器状态
      console.log('🔄 尝试恢复计时器状态...')
      const restored = restoreTimerState()
      
      if (restored) {
        console.log('✅ 计时器状态恢复成功')
      } else {
        console.log('ℹ️ 没有保存的状态，使用默认设置')
        // 如果没有恢复状态，初始化时间
        timeLeft.value = currentPhase.value.duration
      }
      
      // 标记初始化完成，开启状态监听
      isInitialized.value = true
      console.log('✅ 番茄钟初始化完成')
      
      // 请求通知权限
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
      
      // 监听页面可见性变化
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // 监听页面卸载
      window.addEventListener('beforeunload', saveTimerState)
      
      // 监听主题变化
      observeThemeChange()
    })

    onUnmounted(() => {
      // 保存状态
      saveTimerState()
      
      // 清除计时器
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
      }
      
      // 移除事件监听器
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', saveTimerState)
      
      // 清理主题观察器
      if (themeObserver.value) {
        themeObserver.value.disconnect()
      }
    })

    // 处理页面可见性变化
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时保存状态
        saveTimerState()
      } else {
        // 页面显示时只在计时器应该运行但当前没有运行时才恢复状态
        try {
          const savedState = localStorage.getItem('pomodoroTimerState')
          if (savedState) {
            const state = JSON.parse(savedState)
            // 只有保存的状态是运行中，但当前实际没有运行时，才需要恢复
            if (state.isRunning && !isRunning.value) {
              restoreTimerState()
            }
          }
        } catch (error) {
          console.error('检查计时器状态失败:', error)
        }
      }
    }

    // 监听主题变化
    const observeThemeChange = () => {
      // 创建一个观察器来监听主题变化
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            // 延迟触发，确保CSS已经应用
            setTimeout(() => {
              console.log('🎨 番茄钟组件检测到主题变化，触发重新渲染')
              // 对于番茄钟组件，主要是触发进度环颜色的更新
              // Vue的响应式系统会自动处理大部分样式更新
            }, 50)
          }
        })
      })

      // 开始观察document.documentElement的class属性变化
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      })

      // 保存observer引用以便后续清理
      themeObserver.value = observer
    }

    // 确保输入值为整数的方法
    const ensureInteger = (field, event) => {
      const value = event.target.value
      // 如果输入包含小数点或其他非整数字符，只保留整数部分
      const integerValue = Math.floor(Math.abs(parseFloat(value) || 0))
      
      // 根据字段设置合理的默认值和范围
      let validValue = integerValue
      if (field === 'focusDuration') {
        validValue = Math.max(1, Math.min(120, integerValue)) || 25
      } else if (field === 'shortBreakDuration') {
        validValue = Math.max(1, Math.min(30, integerValue)) || 5
      } else if (field === 'longBreakDuration') {
        validValue = Math.max(1, Math.min(60, integerValue)) || 15
      } else if (field === 'longBreakInterval') {
        validValue = Math.max(1, Math.min(10, integerValue)) || 4
      }
      
      // 更新设置值
      settings.value[field] = validValue
      
      // 如果用户输入的值被修正了，更新输入框显示
      if (event.target.value !== validValue.toString()) {
        event.target.value = validValue.toString()
      }
    }

    return {
      isRunning,
      timeLeft,
      currentPhaseIndex,
      settings,
      phases,
      currentPhase,
      currentPhaseLabel,
      circumference,
      strokeDashoffset,
      progressColor,
      todayStats,
      recentRecords,
      pomodoroUtils,
      isInitialized,
      startTimer,
      pauseTimer,
      resetTimer,
      skipPhase,
      saveSettings,
      formatTime,
      formatTimerDisplay,
      formatDateTime,
      saveTimerState,
      restoreTimerState,
      clearTimerState,
      ensureInteger
    }
  }
}
</script>

<style scoped>
.pomodoro-timer {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.timer-container {
  text-align: center;
  margin-bottom: 30px;
}

.timer-display {
  position: relative;
  display: inline-block;
  margin-bottom: 25px;
}

.timer-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
}

.timer-time {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.timer-label {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
}

.progress-ring {
  position: relative;
  z-index: 1;
}

.progress-ring-bg {
  opacity: 0.3;
}

.progress-ring-progress {
  transition: stroke-dashoffset 0.3s ease;
}

.timer-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.btn-large {
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
  justify-content: center;
}

.btn-icon {
  font-size: 1rem;
}

.phase-indicator {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 25px;
}

.phase-dot {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  border: 1px solid #e0e0e0;
}

.phase-dot.active {
  background: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.phase-dot.completed {
  background: #27ae60;
  color: white;
  border-color: #27ae60;
}

.phase-icon {
  font-size: 1.2rem;
}

.settings-panel,
.stats-panel,
.history-panel {
  background: white;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.settings-panel h3,
.stats-panel h3,
.history-panel h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.setting-hint {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 12px;
  font-style: italic;
}

.setting-item input:focus + .setting-hint {
  color: #3498db;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.stat-card {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: bold;
  color: #e74c3c;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;
}

.history-item:hover {
  background-color: #f8f9fa;
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-time {
  font-weight: bold;
  color: #333;
  font-size: 1rem;
}

.history-type {
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
}

.history-type:contains('专注') {
  background: #ffebee;
  color: #e74c3c;
}

.history-type:contains('休息') {
  background: #e8f5e8;
  color: #27ae60;
}

.history-date {
  color: #666;
  font-size: 14px;
}

@media (max-width: 768px) {
  .timer-time {
    font-size: 2rem;
  }
  
  .timer-controls {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-large {
    width: 100%;
    max-width: 200px;
  }
  
  .phase-indicator {
    gap: 8px;
  }
  
  .phase-dot {
    width: 35px;
    height: 35px;
  }
  
  .phase-icon {
    font-size: 1rem;
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

html.dark .pomodoro-timer {
  color: var(--dark-text-secondary);
  background: transparent;
}

html.dark .timer-container {
  background: transparent;
  color: var(--dark-text-secondary);
}

html.dark .timer-display {
  background: transparent;
}

html.dark .timer-circle {
  background: transparent;
}

html.dark .timer-time {
  color: var(--dark-text-primary);
}

html.dark .timer-label {
  color: var(--dark-text-tertiary);
}

html.dark .progress-ring-bg {
  stroke: var(--dark-border-secondary);
}

html.dark .btn-large {
  border: none;
}

html.dark .btn-primary {
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
}

html.dark .btn-primary:hover {
  background: var(--dark-accent-hover);
}

html.dark .btn-warning {
  background: var(--dark-warning);
  color: var(--dark-text-primary);
}

html.dark .btn-warning:hover {
  background: #d97706;
}

html.dark .btn-secondary {
  background: var(--dark-bg-surface);
  color: var(--dark-text-secondary);
  border: 1px solid var(--dark-border-primary);
}

html.dark .btn-secondary:hover {
  background: var(--dark-bg-tertiary);
  border-color: var(--dark-border-secondary);
}

html.dark .btn-info {
  background: #0ea5e9;
  color: var(--dark-text-primary);
}

html.dark .btn-info:hover {
  background: #0284c7;
}

html.dark .phase-dot {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-tertiary);
}

html.dark .phase-dot.active {
  background: var(--dark-error);
  color: var(--dark-text-primary);
  border-color: var(--dark-error);
}

html.dark .phase-dot.completed {
  background: var(--dark-success);
  color: var(--dark-text-primary);
  border-color: var(--dark-success);
}

html.dark .settings-panel,
html.dark .stats-panel,
html.dark .history-panel {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-primary);
  box-shadow: var(--dark-shadow-sm);
}

html.dark .settings-panel h3,
html.dark .stats-panel h3,
html.dark .history-panel h3 {
  color: var(--dark-text-primary);
}

html.dark .setting-item label {
  color: var(--dark-text-secondary);
}

html.dark .setting-hint {
  color: var(--dark-text-muted);
}

html.dark .setting-item input:focus + .setting-hint {
  color: var(--dark-accent-primary);
}

html.dark .form-control {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-primary);
}

html.dark .form-control:focus {
  border-color: var(--dark-accent-primary);
  background: var(--dark-bg-secondary);
  box-shadow: 0 0 0 2px var(--dark-accent-light);
}

html.dark .form-control::placeholder {
  color: var(--dark-text-muted);
}

html.dark .stat-card {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
}

html.dark .stat-number {
  color: var(--dark-error);
}

html.dark .stat-label {
  color: var(--dark-text-tertiary);
}

html.dark .history-item {
  background: transparent;
  border-bottom: 1px solid var(--dark-border-primary);
  color: var(--dark-text-secondary);
}

html.dark .history-item:hover {
  background: var(--dark-bg-surface);
}

html.dark .history-time {
  color: var(--dark-text-primary);
}

html.dark .history-type {
  background: var(--dark-bg-surface);
  color: var(--dark-text-secondary);
  border: 1px solid var(--dark-border-primary);
}

html.dark .history-date {
  color: var(--dark-text-tertiary);
}

@media (max-width: 768px) {
  html.dark .timer-time {
    color: var(--dark-text-primary);
  }
  
  html.dark .timer-label {
    color: var(--dark-text-tertiary);
  }
  
  html.dark .timer-display,
  html.dark .timer-container {
    background: transparent;
  }
  
  html.dark .settings-panel,
  html.dark .stats-panel,
  html.dark .history-panel {
    background: var(--dark-bg-secondary);
    border-color: var(--dark-border-primary);
  }
  
  html.dark .phase-dot {
    background: var(--dark-bg-surface);
    border-color: var(--dark-border-primary);
  }
  
  html.dark .stat-card {
    background: var(--dark-bg-surface);
    border-color: var(--dark-border-primary);
  }
}
</style> 