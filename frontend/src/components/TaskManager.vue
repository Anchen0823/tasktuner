<template>
  <div class="task-manager">
    <!-- 搜索框 -->
    <div class="search-bar">
      <input
        v-model="searchKeyword"
        type="text"
        class="form-control"
        placeholder="搜索任务名..."
      />
    </div>
    <!-- 统计信息 -->
    <div class="stats">
      <div class="stat-item">
        <div class="stat-number">{{ stats.total }}</div>
        <div class="stat-label">总任务</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.pending }}</div>
        <div class="stat-label">待完成</div>
      </div>
    </div>

    <!-- 添加任务表单 -->
    <div class="add-task-form">
      <h3>添加新任务</h3>
      <div class="form-grid">
        <div class="form-item">
          <input
            v-model="newTask.title"
            type="text"
            class="form-control"
            placeholder="任务标题"
            @keyup.enter="addTask"
          />
        </div>
        <div class="form-item">
          <select v-model="newTask.priority" class="form-control">
            <option value="low">低优先级</option>
            <option value="medium">中优先级</option>
            <option value="high">高优先级</option>
          </select>
        </div>
        <div class="form-item">
          <input
            v-model="newTask.deadline"
            type="date"
            class="form-control"
            placeholder="设置截止日期"
          />
        </div>
        <div class="form-item">
          <textarea
            v-model="newTask.description"
            class="form-control"
            placeholder="准备做什么？"
            rows="1"
          ></textarea>
        </div>
      </div>
      <div class="form-actions">
        <button @click="addTask" class="btn btn-primary">
          添加任务
        </button>
      </div>
    </div>

    <!-- 过滤器 -->
    <div class="filters">
      <div class="filter-section">
        <label>筛选:</label>
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="setFilter(filter.value)"
          :class="['filter-btn', { active: currentFilter === filter.value }]"
        >
          {{ filter.label }}
        </button>
      </div>
      
      <div class="sort-section">
        <label>排序:</label>
        <select v-model="sortBy" class="form-control sort-select">
          <option value="createdAt-desc">创建时间 (最新)</option>
          <option value="createdAt-asc">创建时间 (最早)</option>
          <option value="deadline-desc">截止时间 (最晚)</option>
          <option value="deadline-asc">截止时间 (最早)</option>
        </select>
      </div>
    </div>

    <!-- 任务列表 -->
    <div v-if="filteredTasks.length > 0">
      <div
        v-for="task in filteredTasks"
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
          <span v-if="task.deadline">截止日期: {{ formatDate(task.deadline) }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <h3>暂无任务</h3>
      <p>开始添加您的第一个任务吧！</p>
    </div>

    <!-- 编辑任务模态框 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <h3>编辑任务</h3>
        <div class="form-grid">
          <div class="form-item">
            <input
              v-model="editingTask.title"
              type="text"
              class="form-control"
              placeholder="任务标题"
            />
          </div>
          <div class="form-item">
            <select v-model="editingTask.priority" class="form-control">
              <option value="low">低优先级</option>
              <option value="medium">中优先级</option>
              <option value="high">高优先级</option>
            </select>
          </div>
          <div class="form-item">
            <input
              v-model="editingTask.deadline"
              type="date"
              class="form-control"
            />
          </div>
          <div class="form-item">
            <textarea
              v-model="editingTask.description"
              class="form-control"
              placeholder="准备做什么？"
              rows="1"
            ></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="saveEditTask" class="btn btn-primary">保存</button>
          <button @click="closeEditModal" class="btn btn-warning">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { taskApi } from '../api/taskApi'

export default {
  name: 'TaskManager',
  props: {
    tasks: {
      type: Array,
      required: true
    }
  },
  emits: ['update:tasks'],
  setup(props, { emit }) {
    // 搜索关键字
    const searchKeyword = ref('')
    // 响应式数据
    const currentFilter = ref('all')
    const sortBy = ref('createdAt-desc') // 默认按创建时间降序
    const showEditModal = ref(false)
    const editingTask = ref({})
    
    // 参考CalendarView的方式，使用computed属性动态获取今天的日期
    const todayDateString = computed(() => {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })
    
    const newTask = reactive({
      title: '',
      description: '',
      priority: 'medium',
      deadline: ''
    })
    
    // 重置表单到默认值的方法
    const resetNewTaskForm = () => {
      newTask.title = ''
      newTask.description = ''
      newTask.priority = 'medium'
      newTask.deadline = todayDateString.value
    }

    // 过滤器选项
    const filters = [
      { label: '全部', value: 'all' },
      { label: '待完成', value: 'pending' },
      { label: '已完成', value: 'completed' },
      { label: '高优先级', value: 'high' }
    ]

    // 计算属性
    const filteredTasks = computed(() => {
      let result = props.tasks
      // 先按筛选器过滤
      switch (currentFilter.value) {
        case 'pending':
          result = result.filter(task => !task.completed)
          break
        case 'completed':
          result = result.filter(task => task.completed)
          break
        case 'high':
          result = result.filter(task => task.priority === 'high')
          break
      }
      // 再按搜索关键字过滤
      if (searchKeyword.value.trim()) {
        const keyword = searchKeyword.value.trim().toLowerCase()
        result = result.filter(task => task.title.toLowerCase().includes(keyword))
      }
      
      // 最后按选择的方式排序
      const [sortField, sortOrder] = sortBy.value.split('-')
      result.sort((a, b) => {
        let aValue, bValue
        
        if (sortField === 'createdAt') {
          aValue = new Date(a.createdAt || 0)
          bValue = new Date(b.createdAt || 0)
        } else if (sortField === 'deadline') {
          // 处理没有截止日期的任务：将其视为无限远的日期
          aValue = a.deadline ? new Date(a.deadline) : (sortOrder === 'asc' ? new Date('2099-12-31') : new Date('1900-01-01'))
          bValue = b.deadline ? new Date(b.deadline) : (sortOrder === 'asc' ? new Date('2099-12-31') : new Date('1900-01-01'))
        }
        
        if (sortOrder === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      })
      
      return result
    })

    const stats = computed(() => {
      const total = props.tasks.length
      const completed = props.tasks.filter(task => task.completed).length
      const pending = total - completed
      return { total, completed, pending }
    })

    // 任务相关方法
    const addTask = async () => {
      if (!newTask.title.trim()) {
        alert('请输入任务标题')
        return
      }

      try {
        const taskData = {
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          deadline: newTask.deadline,
          completed: false
        }

        const response = await taskApi.createTask(taskData)
        
        if (response.success) {
          // 添加到本地数据
          const updatedTasks = [response.data, ...props.tasks]
          emit('update:tasks', updatedTasks)

          // 重置表单
          resetNewTaskForm()
        }
      } catch (error) {
        console.error('添加任务失败:', error)
        alert('添加任务失败，请重试')
      }
    }

    const toggleTask = async (taskId) => {
      try {
        const response = await taskApi.toggleTaskStatus(taskId)
        
        if (response.success) {
          // 更新本地数据
          const updatedTasks = props.tasks.map(task => 
            task.id === taskId ? response.data : task
          )
          emit('update:tasks', updatedTasks)
        }
      } catch (error) {
        console.error('切换任务状态失败:', error)
        alert('切换任务状态失败，请重试')
      }
    }

    const editTask = (task) => {
      editingTask.value = { ...task }
      showEditModal.value = true
    }

    const saveEditTask = async () => {
      try {
        const response = await taskApi.updateTask(editingTask.value.id, editingTask.value)
        
        if (response.success) {
          // 更新本地数据
          const updatedTasks = props.tasks.map(task =>
            task.id === editingTask.value.id ? response.data : task
          )
          emit('update:tasks', updatedTasks)
          
          closeEditModal()
        }
      } catch (error) {
        console.error('更新任务失败:', error)
        alert('更新任务失败，请重试')
      }
    }

    const deleteTask = async (taskId) => {
      if (!confirm('确定要删除这个任务吗？')) {
        return
      }

      try {
        const response = await taskApi.deleteTask(taskId)
        
        if (response.success) {
          // 从本地数据中移除
          const updatedTasks = props.tasks.filter(task => task.id !== taskId)
          emit('update:tasks', updatedTasks)
        }
      } catch (error) {
        console.error('删除任务失败:', error)
        alert('删除任务失败，请重试')
      }
    }

    const setFilter = (filter) => {
      currentFilter.value = filter
    }

    const closeEditModal = () => {
      showEditModal.value = false
      editingTask.value = {}
    }

    const getPriorityLabel = (priority) => {
      const labels = {
        high: '高优先级',
        medium: '中优先级',
        low: '低优先级'
      }
      return labels[priority] || priority
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('zh-CN')
    }

    // 组件挂载时初始化默认截止日期
    onMounted(() => {
      resetNewTaskForm()
    })

    // 监听今天日期的变化（比如过了午夜），自动更新默认日期
    watch(todayDateString, (newDate) => {
      // 如果deadline为空，则设置为今天
      if (!newTask.deadline) {
        newTask.deadline = newDate
      }
    }, { immediate: true })

    return {
      searchKeyword,
      currentFilter,
      sortBy,
      showEditModal,
      editingTask,
      newTask,
      filters,
      filteredTasks,
      stats,
      addTask,
      toggleTask,
      editTask,
      saveEditTask,
      deleteTask,
      setFilter,
      closeEditModal,
      getPriorityLabel,
      formatDate,
      resetNewTaskForm,
      todayDateString
    }
  }
}
</script>

<style scoped>
.task-manager {
  max-width: 100%;
  padding: 24px;
  min-height: 100%;
}

.search-bar {
  margin-bottom: 16px;
}

.search-bar .form-control {
  width: 100%;
  max-width: 350px;
  display: block;
  margin: 0 auto;
  font-size: 0.875rem;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  box-sizing: border-box;
}

/* 添加任务表单样式 */
.add-task-form {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.add-task-form h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: #fff;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-control::placeholder {
  color: #999;
}

textarea.form-control {
  resize: vertical;
  min-height: 46px;
  font-family: inherit;
}

select.form-control {
  cursor: pointer;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
  appearance: none;
}

.form-actions {
  display: flex;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
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

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  min-width: auto;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: white;
  padding: 16px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2196f3;
  margin-bottom: 4px;
}

.stat-label {
  color: #666666;
  font-size: 0.8rem;
  font-weight: 500;
}

/* 过滤器样式 */
.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
  gap: 16px;
}

.filter-section,
.sort-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-section label,
.sort-section label {
  font-weight: 600;
  color: #555;
  font-size: 14px;
  white-space: nowrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.filter-btn:hover {
  background: #f8f9fa;
  border-color: #3498db;
  color: #3498db;
}

.filter-btn.active {
  background: #3498db;
  border-color: #3498db;
  color: white;
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
}

.sort-select {
  min-width: 160px;
  font-size: 14px;
  padding: 8px 12px;
  margin: 0;
  transition: all 0.2s ease;
}

.sort-select:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.15);
  outline: none;
}

.sort-select:hover {
  border-color: #3498db;
}

.task-item {
  background: white;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.task-item:hover {
  border-color: #2196f3;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: none;
}

.task-item.completed {
  background: #fafafa;
  border-color: #e0e0e0;
  opacity: 0.8;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-title {
  margin: 0;
  font-size: 1rem;
  color: #333333;
  font-weight: 600;
}

.task-description {
  color: #666666;
  margin-bottom: 12px;
  line-height: 1.5;
  font-size: 0.875rem;
}

.task-meta {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: #666666;
  align-items: center;
}

.task-priority {
  padding: 3px 6px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.7rem;
}

.priority-high {
  background: #ffebee;
  color: #f44336;
}

.priority-medium {
  background: #fff3e0;
  color: #ff9800;
}

.priority-low {
  background: #e8f5e8;
  color: #4caf50;
}

html.dark .priority-high {
  background: #ffebee;
  color: #f44336;
}
html.dark .priority-medium {
  background: #fff3e0;
  color: #ff9800;
}
html.dark .priority-low {
  background: #e8f5e8;
  color: #4caf50;
}

.empty-state {
  text-align: center;
  padding: 48px 20px;
  background: white;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.empty-state h3 {
  color: #333333;
  margin-bottom: 8px;
  font-size: 1.25rem;
}

.empty-state p {
  color: #666666;
  font-size: 0.9rem;
}

html.dark .empty-state {
  background: #1a1a1a;
  border-color: #333;
}
html.dark .empty-state h3 {
  color: #f5f5f5;
}
html.dark .empty-state p {
  color: #b5b5b5;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 6px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
}

.modal-content h3 {
  margin-bottom: 16px;
  color: #333333;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-manager {
    padding: 16px;
  }

  .filters {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
  }

  .filter-section,
  .sort-section {
    width: 100%;
    justify-content: space-between;
  }

  .filter-section {
    flex-wrap: wrap;
  }

  .sort-select {
    min-width: 140px;
    flex-shrink: 0;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .task-actions {
    flex-direction: column;
    gap: 8px;
  }

  .task-actions .btn {
    min-width: auto;
    width: 100%;
  }

  .modal-content {
    margin: 16px;
    padding: 24px;
  }

  .modal-actions {
    flex-direction: column;
    gap: 12px;
  }

  .modal-actions .btn {
    width: 100%;
  }
}

/* === 深色主题样式 === */
html.dark .task-manager {
  background: transparent;
  color: var(--dark-text-secondary);
}

html.dark .search-bar .form-control {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-primary);
}

html.dark .search-bar .form-control:focus {
  border-color: var(--dark-accent-primary);
  box-shadow: 0 0 0 2px var(--dark-accent-light);
  background: var(--dark-bg-secondary);
}

html.dark .search-bar .form-control::placeholder {
  color: var(--dark-text-muted);
}

/* === 添加任务表单深色主题 === */
html.dark .add-task-form {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-primary);
  box-shadow: var(--dark-shadow-sm);
}

html.dark .add-task-form h3 {
  color: var(--dark-text-primary);
}

html.dark .form-control {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-primary);
}

html.dark .form-control:focus {
  border-color: var(--dark-accent-primary);
  box-shadow: 0 0 0 2px var(--dark-accent-light);
  background: var(--dark-bg-secondary);
}

html.dark .form-control::placeholder {
  color: var(--dark-text-muted);
}

html.dark select.form-control {
  background: var(--dark-bg-surface);
  color: var(--dark-text-primary);
  border: 1px solid var(--dark-border-primary);
}

html.dark textarea.form-control {
  background: var(--dark-bg-surface);
  color: var(--dark-text-primary);
  border: 1px solid var(--dark-border-primary);
  resize: vertical;
}

/* === 按钮深色主题 === */
html.dark .btn-primary {
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
  border: none;
}

html.dark .btn-primary:hover {
  background: var(--dark-accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--dark-shadow-md);
}

html.dark .btn-success {
  background: var(--dark-success);
  color: var(--dark-text-primary);
}

html.dark .btn-success:hover {
  background: #16a34a;
}

html.dark .btn-warning {
  background: var(--dark-warning);
  color: var(--dark-text-primary);
}

html.dark .btn-warning:hover {
  background: #d97706;
}

html.dark .btn-danger {
  background: var(--dark-error);
  color: var(--dark-text-primary);
}

html.dark .btn-danger:hover {
  background: #dc2626;
}

/* === 统计卡片深色主题 === */
html.dark .stats {
  gap: 16px;
}

html.dark .stat-item {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-primary);
  box-shadow: var(--dark-shadow-sm);
}

html.dark .stat-item:hover {
  background: var(--dark-bg-elevated);
  box-shadow: var(--dark-shadow-md);
}

html.dark .stat-number {
  color: var(--dark-accent-primary);
}

html.dark .stat-label {
  color: var(--dark-text-tertiary);
}

/* === 过滤器按钮深色主题 === */
html.dark .filters {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-primary);
  box-shadow: var(--dark-shadow-sm);
}

html.dark .filter-section label,
html.dark .sort-section label {
  color: var(--dark-text-secondary);
}

html.dark .filter-btn {
  background: var(--dark-bg-surface);
  color: var(--dark-text-tertiary);
  border: 1px solid var(--dark-border-primary);
}

html.dark .filter-btn:hover {
  border-color: var(--dark-accent-primary);
  color: var(--dark-accent-primary);
  background: var(--dark-accent-light);
}

html.dark .filter-btn.active {
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
  border-color: var(--dark-accent-primary);
}

html.dark .sort-select {
  background: var(--dark-bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 140px;
}

html.dark .sort-select:focus {
  border-color: var(--dark-accent-primary);
  background: var(--dark-bg-secondary);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  outline: none;
}

html.dark .sort-select:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: var(--dark-bg-secondary);
}

html.dark .sort-select option {
  background: var(--dark-bg-surface);
  color: var(--dark-text-primary);
  border: none;
}

/* === 任务项深色主题 === */
html.dark .task-item {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-secondary);
  box-shadow: var(--dark-shadow-sm);
}

html.dark .task-item:hover {
  border-color: var(--dark-accent-primary);
  box-shadow: var(--dark-shadow-md);
  background: var(--dark-bg-elevated);
}

html.dark .task-item.completed {
  background: var(--dark-bg-tertiary);
  border-color: var(--dark-border-secondary);
  opacity: 0.7;
}

html.dark .task-title {
  color: var(--dark-text-primary);
}

html.dark .task-item.completed .task-title {
  color: var(--dark-text-muted);
}

html.dark .task-description {
  color: var(--dark-text-tertiary);
}

html.dark .task-meta {
  color: var(--dark-text-tertiary);
}

/* === 优先级标签深色主题 === */
html.dark .priority-high {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

html.dark .priority-medium {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

html.dark .priority-low {
  background: rgba(34, 197, 94, 0.15);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

/* === 空状态深色主题 === */
html.dark .empty-state {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-tertiary);
  box-shadow: var(--dark-shadow-sm);
}

html.dark .empty-state h3 {
  color: var(--dark-text-primary);
}

html.dark .empty-state p {
  color: var(--dark-text-tertiary);
}

/* === 模态框深色主题 === */
html.dark .modal-overlay {
  background: rgba(0, 0, 0, 0.7);
}

html.dark .modal-content {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-secondary);
  box-shadow: var(--dark-shadow-lg);
}

html.dark .modal-content h3 {
  color: var(--dark-text-primary);
}

/* === 响应式深色主题优化 === */
@media (max-width: 768px) {
  html.dark .add-task-form {
    padding: 20px;
    background: var(--dark-bg-secondary);
  }
  
  html.dark .task-manager {
    padding: 16px;
  }
  
  html.dark .filters {
    background: var(--dark-bg-secondary);
    border: 1px solid var(--dark-border-primary);
  }
  
  html.dark .sort-select {
    background: var(--dark-bg-surface);
    border: 1px solid var(--dark-border-primary);
    min-width: 140px;
  }
  
  html.dark .stats {
    grid-template-columns: 1fr;
  }
  
  html.dark .modal-content {
    background: var(--dark-bg-secondary);
    margin: 16px;
  }
}
</style> 