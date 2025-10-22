<template>
  <div class="calendar-view">
    <!-- 日历头部 -->
    <div class="calendar-header">
      <div class="calendar-nav">
        <button @click="previousPeriod" class="nav-btn">
          <span>&lt;</span>
        </button>
        <h2 class="current-month">{{ currentPeriodTitle }}</h2>
        <button @click="nextPeriod" class="nav-btn">
          <span>&gt;</span>
        </button>
      </div>
      <div class="view-toggle">
        <button 
          @click="setView('month')" 
          :class="['toggle-btn', { active: currentView === 'month' }]"
        >
          月视图
        </button>
        <button 
          @click="setView('week')" 
          :class="['toggle-btn', { active: currentView === 'week' }]"
        >
          周视图
        </button>
      </div>
    </div>

    <!-- 星期标题 -->
    <div class="weekdays">
      <div v-for="day in weekdays" :key="day" class="weekday">
        {{ day }}
      </div>
    </div>

    <!-- 日历网格 -->
    <div class="calendar-grid">
      <div
        v-for="date in calendarDates"
        :key="date.key"
        :class="[
          'calendar-day',
          {
            'other-month': !date.isCurrentMonth,
            'today': date.isToday,
            'selected': date.isSelected,
            'has-tasks': date.taskCount > 0
          }
        ]"
        @click="selectDate(date)"
      >
        <div class="day-number">{{ date.day }}</div>
        <div v-if="date.taskCount > 0" class="task-indicator">
          <span class="task-count">{{ date.taskCount }}</span>
        </div>
      </div>
    </div>

    <!-- 选中日期的任务列表 -->
    <div v-if="selectedDate && selectedDateTasks.length > 0" class="selected-date-tasks">
      <h3>{{ formatSelectedDate(selectedDate) }} 的任务</h3>
      <div class="task-list">
        <div
          v-for="task in selectedDateTasks"
          :key="task.id"
          :class="['task-item', { completed: task.completed }]"
        >
          <div class="task-header">
            <h4 class="task-title">{{ task.title }}</h4>
            <div class="task-actions">
              <button
                @click="toggleTask(task.id)"
                :class="['btn', 'btn-sm', task.completed ? 'btn-warning' : 'btn-success']"
              >
                {{ task.completed ? '取消完成' : '标记完成' }}
              </button>
              <button @click="editTask(task)" class="btn btn-sm btn-warning">
                编辑
              </button>
              <button @click="deleteTask(task.id)" class="btn btn-sm btn-danger">
                删除
              </button>
            </div>
          </div>
          <p v-if="task.description" class="task-description">
            {{ task.description }}
          </p>
          <div class="task-meta">
            <span :class="['task-priority', `priority-${task.priority}`]">
              {{ getPriorityLabel(task.priority) }}
            </span>
            <span>创建时间: {{ formatDate(task.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中日期无任务提示 -->
    <div v-else-if="selectedDate" class="no-tasks">
      <h3>{{ formatSelectedDate(selectedDate) }}</h3>
      <p>该日期暂无任务</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'

export default {
  name: 'CalendarView',
  props: {
    tasks: {
      type: Array,
      default: () => []
    }
  },
  emits: ['toggle-task', 'edit-task', 'delete-task'],
  setup(props, { emit }) {
    // 响应式数据
    const currentDate = ref(new Date())
    const selectedDate = ref(null)
    const currentView = ref('month')

    // 星期标题
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']

    // 计算属性
    const currentPeriodTitle = computed(() => {
      if (currentView.value === 'week') {
        // 周视图显示周的日期范围
        const weekStart = new Date(currentDate.value)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // 周日作为一周开始
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        // 如果周的开始和结束在同一个月
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getDate()}日`
        } else {
          // 跨月的情况
          return `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getFullYear()}年${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`
        }
      } else {
        // 月视图显示月份
        return currentDate.value.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long'
        })
      }
    })

    const calendarDates = computed(() => {
      // 如果为周视图，仅生成 7 天
      if (currentView.value === 'week') {
        const weekStart = new Date(currentDate.value)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // 周日作为一周开始

        const dates = []
        const today = new Date()

        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart)
          date.setDate(weekStart.getDate() + i)
          dates.push({
            date,
            day: date.getDate(),
            key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
            isCurrentMonth: date.getMonth() === currentDate.value.getMonth(),
            isToday: isSameDay(date, today),
            isSelected: selectedDate.value ? isSameDay(date, selectedDate.value) : false,
            taskCount: getTaskCountForDate(date)
          })
        }

        return dates
      }

      // 月视图逻辑
      const year = currentDate.value.getFullYear()
      const month = currentDate.value.getMonth()
      
      // 获取当月第一天和最后一天
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      
      // 获取当月第一天是星期几
      const firstDayWeekday = firstDay.getDay()
      
      // 获取上个月的最后几天
      const prevMonthLastDay = new Date(year, month, 0)
      const prevMonthDays = firstDayWeekday
      
      const dates = []
      const today = new Date()
      
      // 添加上个月的日期
      for (let i = prevMonthDays - 1; i >= 0; i--) {
        const day = prevMonthLastDay.getDate() - i
        const date = new Date(year, month - 1, day)
        dates.push({
          date,
          day,
          key: `${year}-${month - 1}-${day}`,
          isCurrentMonth: false,
          isToday: isSameDay(date, today),
          isSelected: selectedDate.value ? isSameDay(date, selectedDate.value) : false,
          taskCount: getTaskCountForDate(date)
        })
      }
      
      // 添加当月的日期
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day)
        dates.push({
          date,
          day,
          key: `${year}-${month}-${day}`,
          isCurrentMonth: true,
          isToday: isSameDay(date, today),
          isSelected: selectedDate.value ? isSameDay(date, selectedDate.value) : false,
          taskCount: getTaskCountForDate(date)
        })
      }
      
      // 添加下个月的日期
      const remainingDays = 42 - dates.length // 保持6行
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day)
        dates.push({
          date,
          day,
          key: `${year}-${month + 1}-${day}`,
          isCurrentMonth: false,
          isToday: isSameDay(date, today),
          isSelected: selectedDate.value ? isSameDay(date, selectedDate.value) : false,
          taskCount: getTaskCountForDate(date)
        })
      }
      
      return dates
    })

    const selectedDateTasks = computed(() => {
      if (!selectedDate.value) return []
      
      return props.tasks.filter(task => {
        if (!task.deadline) return false
        return isSameDay(new Date(task.deadline), selectedDate.value)
      })
    })

    // 方法
    const isSameDay = (date1, date2) => {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate()
    }

    const getTaskCountForDate = (date) => {
      return props.tasks.filter(task => {
        if (!task.deadline) return false
        return isSameDay(new Date(task.deadline), date)
      }).length
    }

    const selectDate = (dateInfo) => {
      selectedDate.value = dateInfo.date
    }

    const previousPeriod = () => {
      if (currentView.value === 'week') {
        // 周视图：向前移动一周
        const newDate = new Date(currentDate.value)
        newDate.setDate(newDate.getDate() - 7)
        currentDate.value = newDate
      } else {
        // 月视图：向前移动一个月，设置为月的第一天
        const newDate = new Date(currentDate.value)
        newDate.setMonth(newDate.getMonth() - 1)
        newDate.setDate(1)
        currentDate.value = newDate
      }
    }

    const nextPeriod = () => {
      if (currentView.value === 'week') {
        // 周视图：向后移动一周
        const newDate = new Date(currentDate.value)
        newDate.setDate(newDate.getDate() + 7)
        currentDate.value = newDate
      } else {
        // 月视图：向后移动一个月，设置为月的第一天
        const newDate = new Date(currentDate.value)
        newDate.setMonth(newDate.getMonth() + 1)
        newDate.setDate(1)
        currentDate.value = newDate
      }
    }

    const setView = (view) => {
      if (view !== currentView.value) {
        currentView.value = view
        
        // 如果有选中的日期，切换视图时以选中日期为基准
        if (selectedDate.value && view === 'week') {
          currentDate.value = new Date(selectedDate.value)
        }
        // 切换到月视图时，如果当前日期不在当前月，则调整到当前月
        else if (view === 'month') {
          const today = new Date()
          if (currentDate.value.getMonth() !== today.getMonth() || 
              currentDate.value.getFullYear() !== today.getFullYear()) {
            // 保持当前的年月，但确保是有效的日期
            const newDate = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1)
            currentDate.value = newDate
          }
        }
      }
    }

    const formatSelectedDate = (date) => {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('zh-CN')
    }

    const getPriorityLabel = (priority) => {
      const labels = {
        high: '高优先级',
        medium: '中优先级',
        low: '低优先级'
      }
      return labels[priority] || priority
    }

    const toggleTask = (taskId) => {
      emit('toggle-task', taskId)
    }

    const editTask = (task) => {
      emit('edit-task', task)
    }

    const deleteTask = (taskId) => {
      emit('delete-task', taskId)
    }

    // 监听任务变化，重新计算任务数量
    watch(() => props.tasks, () => {
      // 触发重新计算
    }, { deep: true })

    // 生命周期
    onMounted(() => {
      // 默认选中今天
      const today = new Date()
      selectedDate.value = today
      
      // 如果是月视图，确保 currentDate 设置为当月第一天
      if (currentView.value === 'month') {
        currentDate.value = new Date(today.getFullYear(), today.getMonth(), 1)
      } else {
        // 如果是周视图，使用今天作为基准
        currentDate.value = today
      }
    })

    return {
      currentDate,
      selectedDate,
      currentView,
      weekdays,
      currentPeriodTitle,
      calendarDates,
      selectedDateTasks,
      selectDate,
      previousPeriod,
      nextPeriod,
      setView,
      formatSelectedDate,
      formatDate,
      getPriorityLabel,
      toggleTask,
      editTask,
      deleteTask
    }
  }
}
</script>

<style scoped>
.calendar-view {
  background: white;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.nav-btn:hover {
  background: #2980b9;
}

.current-month {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.view-toggle {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.toggle-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.toggle-btn:hover {
  border-color: #3498db;
  color: #3498db;
}

.toggle-btn.active:hover {
  color: white;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 12px;
}

.weekday {
  text-align: center;
  font-weight: 600;
  color: #666;
  padding: 6px 4px;
  font-size: 13px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 16px;
}

.calendar-day {
  min-height: 60px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  transition: border-color 0.2s;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.calendar-day:hover {
  border-color: #3498db;
}

.calendar-day.other-month {
  background: #f8f9fa;
  color: #ccc;
}

.calendar-day.today {
  border-color: #3498db;
  background: #f0f8ff;
}

.calendar-day.selected {
  border-color: #3498db;
  background: #3498db;
  color: white;
}

.calendar-day.has-tasks {
  border-color: #27ae60;
}

.day-number {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
}

.task-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
}

.task-count {
  background: #27ae60;
  color: white;
  border-radius: 3px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
}

.calendar-day.selected .task-count {
  background: white;
  color: #3498db;
}

.selected-date-tasks {
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
}

.selected-date-tasks h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 18px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 15px;
  transition: border-color 0.2s;
}

.task-item:hover {
  border-color: #3498db;
}

.task-item.completed {
  background: #f8f9fa;
  border-color: #dee2e6;
  opacity: 0.8;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #666;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.task-actions {
  display: flex;
  gap: 6px;
}

.task-description {
  color: #666;
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.task-priority {
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.priority-high {
  background: #ffebee;
  color: #c62828;
}

.priority-medium {
  background: #fff3e0;
  color: #ef6c00;
}

.priority-low {
  background: #e8f5e8;
  color: #2e7d32;
}

html.dark .priority-high {
  background: #ffebee;
  color: #c62828;
}
html.dark .priority-medium {
  background: #fff3e0;
  color: #ef6c00;
}
html.dark .priority-low {
  background: #e8f5e8;
  color: #2e7d32;
}

.no-tasks {
  text-align: center;
  padding: 30px 20px;
  color: #666;
}

.no-tasks h3 {
  margin-bottom: 8px;
  color: #333;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .calendar-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .calendar-view {
    padding: 15px;
  }
  
  .calendar-day {
    padding: 4px;
  }
  
  .day-number {
    font-size: 12px;
  }
  
  .task-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .task-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

/* === 深色主题样式 === */
html.dark .calendar-view {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-primary);
  box-shadow: var(--dark-shadow-sm);
  color: var(--dark-text-secondary);
}

/* === 日历头部深色主题 === */
html.dark .calendar-header {
  border-bottom: 1px solid var(--dark-border-primary);
}

html.dark .nav-btn {
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
  border: none;
}

html.dark .nav-btn:hover {
  background: var(--dark-accent-hover);
}

html.dark .current-month {
  color: var(--dark-text-primary);
}

html.dark .toggle-btn {
  background: var(--dark-bg-surface);
  color: var(--dark-text-tertiary);
  border: 1px solid var(--dark-border-primary);
}

html.dark .toggle-btn:hover {
  border-color: var(--dark-accent-primary);
  color: var(--dark-accent-primary);
  background: var(--dark-accent-light);
}

html.dark .toggle-btn.active {
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
  border-color: var(--dark-accent-primary);
}

html.dark .toggle-btn.active:hover {
  color: var(--dark-text-primary);
  background: var(--dark-accent-hover);
}

/* === 星期标题深色主题 === */
html.dark .weekday {
  color: var(--dark-text-tertiary);
}

/* === 日历网格深色主题 === */
html.dark .calendar-day {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-secondary);
}

html.dark .calendar-day:hover {
  border-color: var(--dark-accent-primary);
  background: var(--dark-bg-elevated);
}

html.dark .calendar-day.other-month {
  background: var(--dark-bg-tertiary);
  color: var(--dark-text-muted);
}

html.dark .calendar-day.today {
  border-color: var(--dark-accent-primary);
  background: var(--dark-accent-light);
  color: var(--dark-accent-primary);
}

html.dark .calendar-day.selected {
  border-color: var(--dark-accent-primary);
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
}

html.dark .calendar-day.has-tasks {
  border-color: var(--dark-success);
}

html.dark .day-number {
  color: inherit;
}

/* === 任务指示器深色主题 === */
html.dark .task-count {
  background: var(--dark-success);
  color: var(--dark-text-primary);
}

html.dark .calendar-day.selected .task-count {
  background: var(--dark-text-primary);
  color: var(--dark-accent-primary);
}

/* === 选中日期任务列表深色主题 === */
html.dark .selected-date-tasks {
  border-top: 1px solid var(--dark-border-primary);
}

html.dark .selected-date-tasks h3 {
  color: var(--dark-text-primary);
}

html.dark .task-list .task-item {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-secondary);
}

html.dark .task-list .task-item:hover {
  border-color: var(--dark-accent-primary);
  background: var(--dark-bg-tertiary);
}

html.dark .task-list .task-item.completed {
  background: var(--dark-bg-tertiary);
  border-color: var(--dark-border-secondary);
  opacity: 0.7;
}

html.dark .task-list .task-item.completed .task-title {
  color: var(--dark-text-muted);
}

html.dark .task-list .task-title {
  color: var(--dark-text-primary);
}

html.dark .task-list .task-description {
  color: var(--dark-text-tertiary);
}

html.dark .task-list .task-meta {
  color: var(--dark-text-tertiary);
}

/* === 优先级标签深色主题 === */
html.dark .task-list .priority-high {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

html.dark .task-list .priority-medium {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

html.dark .task-list .priority-low {
  background: rgba(34, 197, 94, 0.15);
  color: #86efac;
}

/* === 无任务提示深色主题 === */
html.dark .no-tasks {
  color: var(--dark-text-tertiary);
}

html.dark .no-tasks h3 {
  color: var(--dark-text-primary);
}

html.dark .no-tasks p {
  color: var(--dark-text-tertiary);
}

/* === 按钮深色主题 === */
html.dark .btn {
  border: none;
}

html.dark .btn-success {
  background: var(--dark-success);
  color: var(--dark-text-primary);
}

html.dark .btn-warning {
  background: var(--dark-warning);
  color: var(--dark-text-primary);
}

html.dark .btn-danger {
  background: var(--dark-error);
  color: var(--dark-text-primary);
}

html.dark .btn:hover {
  opacity: 0.9;
}

/* === 响应式深色主题优化 === */
@media (max-width: 768px) {
  html.dark .calendar-view {
    padding: 15px;
    background: var(--dark-bg-secondary);
  }
  
  html.dark .calendar-header {
    background: transparent;
  }
  
  html.dark .calendar-day {
    background: var(--dark-bg-surface);
  }
  
  html.dark .task-header {
    background: transparent;
  }
}
</style> 