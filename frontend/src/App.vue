<template>
  <div id="app">
    <!-- 登录页面 -->
    <LoginPage 
      v-if="!isAuthenticated" 
      @login-success="handleLoginSuccess"
    />
    
    <!-- 主应用页面 -->
    <div v-else class="app-layout">
      <!-- 侧边导航栏 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 class="logo">TaskTuner</h1>
          <p class="logo-subtitle">高效管理您的任务</p>
          
          <!-- 用户信息移到顶部 -->
          <div class="user-info">
            <div class="user-avatar">
              <span>{{ (currentUser?.username || '用户').charAt(0).toUpperCase() }}</span>
            </div>
            <div class="user-details">
              <span class="username">{{ currentUser?.username || '用户' }}</span>
              <button @click="showProfile = true" class="btn-settings">
                <span class="settings-icon">⚙️</span>
                设置
              </button>
            </div>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <button 
            @click="setCurrentView('list')" 
            :class="['nav-item', { active: currentView === 'list' }]"
          >
            <span class="nav-icon">📋</span>
            <span class="nav-text">任务列表</span>
          </button>
          
          <button 
            @click="setCurrentView('calendar')" 
            :class="['nav-item', { active: currentView === 'calendar' }]"
          >
            <span class="nav-icon">📅</span>
            <span class="nav-text">日历视图</span>
          </button>
          
          <button 
            @click="setCurrentView('pomodoro')" 
            :class="['nav-item', { active: currentView === 'pomodoro' }]"
          >
            <span class="nav-icon">⏰</span>
            <span class="nav-text">番茄钟</span>
          </button>
          
          <button 
            @click="setCurrentView('statistics')" 
            :class="['nav-item', { active: currentView === 'statistics' }]"
          >
            <span class="nav-icon">📊</span>
            <span class="nav-text">统计</span>
          </button>
          
          <button 
            @click="setCurrentView('note')" 
            :class="['nav-item', { active: currentView === 'note' }]"
          >
            <span class="nav-icon">📝</span>
            <span class="nav-text">笔记</span>
          </button>
        </nav>
        
        <div class="sidebar-footer">
          <button @click="handleLogout" class="btn-logout">
            <span class="logout-icon">🚪</span>
            登出
          </button>
        </div>
      </aside>

      <!-- 主内容区域 -->
      <main class="main-content">
        <!-- 顶部栏 -->
        <header class="top-bar">
          <div class="breadcrumb">
            <span class="current-view">{{ getCurrentViewTitle() }}</span>
          </div>
          <div class="top-bar-actions">
            <button @click="toggleTheme" class="btn btn-sm btn-theme">
              <span v-if="!isDark">🌞</span>
              <span v-else>🌙</span>
            </button>
            <button @click="showProfile = true" class="btn btn-sm btn-profile">
              <span class="btn-icon">⚙️</span>
              设置
            </button>
          </div>
        </header>

        <!-- 内容区域 -->
        <div class="content-area">
          <!-- 番茄钟视图 - 始终保持挂载，只控制显示隐藏 -->
          <div v-show="currentView === 'pomodoro'">
            <PomodoroTimer />
          </div>

          <!-- 其他视图 - 按需加载 -->
          <template v-if="currentView !== 'pomodoro'">
          <!-- 列表视图 -->
          <div v-if="currentView === 'list'">
            <TaskManager v-model:tasks="tasks" />
          </div>

          <!-- 日历视图 -->
          <div v-else-if="currentView === 'calendar'">
            <CalendarView 
              :tasks="tasks"
              @toggle-task="toggleTask"
              @edit-task="editTask"
              @delete-task="deleteTask"
            />
          </div>

          <!-- 统计视图 -->
          <div v-else-if="currentView === 'statistics'">
            <StatisticsView />
          </div>

          <!-- 笔记视图 -->
          <div v-else-if="currentView === 'note'">
            <NoteEditor />
          </div>
          </template>
        </div>
      </main>
    </div>

    <!-- 编辑任务模态框 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <h3>编辑任务</h3>
        <div class="form-group">
          <input
            v-model="editingTask.title"
            type="text"
            class="form-control"
            placeholder="任务标题"
          />
        </div>
        <div class="form-group">
          <textarea
            v-model="editingTask.description"
            class="form-control"
            placeholder="任务描述"
            rows="3"
          ></textarea>
        </div>
        <div class="form-group">
          <select v-model="editingTask.priority" class="form-control">
            <option value="low">低优先级</option>
            <option value="medium">中优先级</option>
            <option value="high">高优先级</option>
          </select>
        </div>
        <div class="form-group">
          <input
            v-model="editingTask.deadline"
            type="date"
            class="form-control"
          />
        </div>
        <div class="modal-actions">
          <button @click="saveEditTask" class="btn btn-primary">保存</button>
          <button @click="closeEditModal" class="btn btn-warning">取消</button>
        </div>
      </div>
    </div>
    
    <!-- 用户信息弹窗 -->
    <div v-if="showProfile" class="modal-overlay" @click="closeProfile">
      <div class="modal-content profile-modal" @click.stop>
        <button class="modal-close-btn" @click="closeProfile">×</button>
        <UserProfile @account-deleted="handleLogout" @profile-updated="onProfileUpdated" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { taskApi } from './api/taskApi'
import { authApi, authUtils } from './api/authApi'
import LoginPage from './components/LoginPage.vue'
import CalendarView from './components/CalendarView.vue'
import PomodoroTimer from './components/PomodoroTimer.vue'
import UserProfile from './components/UserProfile.vue'
import TaskManager from './components/TaskManager.vue'
import StatisticsView from './components/StatisticsView.vue'
import NoteEditor from './components/NoteEditor.vue'

export default {
  name: 'App',
  components: {
    LoginPage,
    CalendarView,
    PomodoroTimer,
    UserProfile,
    TaskManager,
    StatisticsView,
    NoteEditor
  },
  setup() {
    // 认证状态
    const isAuthenticated = ref(authUtils.isAuthenticated())
    const currentUser = ref(authUtils.getCurrentUser())

    // 响应式数据
    const tasks = ref([])
    const currentView = ref('list')
    const showProfile = ref(false)
    const showEditModal = ref(false)
    const editingTask = ref({})
    const newTask = ref({
      title: '',
      description: '',
      priority: 'medium',
      deadline: ''
    })

    // 主题切换状态
    const isDark = ref(localStorage.getItem('theme') === 'dark')

    const toggleTheme = () => {
      isDark.value = !isDark.value
    }

    watch(isDark, (val) => {
      if (val) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    })

    // 认证相关方法
    const handleLoginSuccess = (user) => {
      isAuthenticated.value = true
      currentUser.value = user
      loadTasks()
    }

    const handleLogout = async () => {
      try {
        // 调用登出API
        await authApi.logout()
      } catch (error) {
        console.error('登出失败:', error)
      } finally {
        // 清除本地状态
        isAuthenticated.value = false
        currentUser.value = null
        tasks.value = []
      }
    }

    // 视图切换方法
    const setCurrentView = (view) => {
      currentView.value = view
    }

    // 获取当前视图标题
    const getCurrentViewTitle = () => {
      const titles = {
        list: '任务列表',
        calendar: '日历视图',
        pomodoro: '番茄钟',
        statistics: '统计',
        note: '笔记'
      }
      return titles[currentView.value] || '任务列表'
    }

    // 加载任务列表
    const loadTasks = async () => {
      try {
        // 去掉分页限制，获取所有任务
        const response = await taskApi.getAllTasks({ size: 9999 })
        if (response.success && response.data) {
          tasks.value = response.data.tasks || []
        }
      } catch (error) {
        console.error('加载任务失败:', error)
        // 使用空数组作为默认值
        tasks.value = []
      }
    }

    const addTask = async () => {
      if (!newTask.value.title.trim()) {
        alert('请输入任务标题')
        return
      }

      try {
        const taskData = {
          title: newTask.value.title,
          description: newTask.value.description,
          priority: newTask.value.priority,
          deadline: newTask.value.deadline,
          completed: false
        }

        const response = await taskApi.createTask(taskData)
        
        if (response.success) {
          // 重新加载任务列表
          await loadTasks()
        }

        // 重置表单
        newTask.value = {
          title: '',
          description: '',
          priority: 'medium',
          deadline: ''
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
          // 重新加载任务列表
          await loadTasks()
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
          // 重新加载任务列表
          await loadTasks()
        }
        
        closeEditModal()
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
          // 重新加载任务列表
          await loadTasks()
        }
      } catch (error) {
        console.error('删除任务失败:', error)
        alert('删除任务失败，请重试')
      }
    }

    const closeEditModal = () => {
      showEditModal.value = false
      editingTask.value = {}
    }

    const closeProfile = () => {
      showProfile.value = false
    }

    const onProfileUpdated = (userInfo) => {
      if (userInfo && currentUser.value) {
        currentUser.value = { ...currentUser.value, ...userInfo }
      }
    }

    // 生命周期
    onMounted(() => {
      if (isAuthenticated.value) {
        loadTasks()
      }
    })

    return {
      isAuthenticated,
      currentUser,
      tasks,
      currentView,
      showProfile,
      showEditModal,
      editingTask,
      newTask,
      isDark,
      toggleTheme,
      handleLoginSuccess,
      handleLogout,
      setCurrentView,
      getCurrentViewTitle,
      addTask,
      toggleTask,
      editTask,
      saveEditTask,
      deleteTask,
      closeEditModal,
      closeProfile,
      onProfileUpdated
    }
  }
}
</script>

<style scoped>
/* 应用布局 */
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #fafafa;
}

/* 侧边栏样式 - 扁平化设计 */
.sidebar {
  width: 260px;
  background: #ffffff;
  color: #333333;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
  position: fixed;
  height: 100vh;
  z-index: 100;
  box-shadow: none;
}

.sidebar-header {
  padding: 24px 20px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.logo {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: #2196f3;
  letter-spacing: -0.5px;
}

.logo-subtitle {
  font-size: 0.8rem;
  color: #666666;
  margin: 0 0 20px 0;
  font-weight: 400;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: #2196f3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  margin-right: 12px;
  color: white;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  display: block;
  font-weight: 500;
  font-size: 0.85rem;
  color: #333333;
  margin: 0;
}

.btn-settings {
  background: none;
  border: none;
  color: #666666;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 2px 0;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 400;
}

.btn-settings:hover {
  color: #2196f3;
  transform: none;
}

.settings-icon {
  font-size: 0.7rem;
}

.btn-logout {
  width: 100%;
  background: #f5f5f5;
  color: #666666;
  border: 1px solid #e0e0e0;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-logout:hover {
  background: #ffebee;
  color: #f44336;
  border-color: #ffcdd2;
  transform: none;
}

.logout-icon {
  font-size: 0.9rem;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  width: 100%;
  background: none;
  border: none;
  color: #666666;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  border-radius: 0;
  margin: 0;
  position: relative;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #333333;
  transform: none;
}

.nav-item.active {
  background: #e3f2fd;
  color: #2196f3;
  border-right: 3px solid #2196f3;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #2196f3;
}

.nav-icon {
  font-size: 1.1rem;
  margin-right: 12px;
  width: 20px;
  text-align: center;
}

.nav-text {
  font-weight: 500;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-bar {
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: none;
}

.breadcrumb {
  display: flex;
  align-items: center;
}

.current-view {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333333;
}

.top-bar-actions {
  display: flex;
  gap: 8px;
}

.content-area {
  flex: 1;
  background: #ffffff;
  overflow-y: auto;
}

/* 按钮样式 - 扁平化设计 */
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: none;
}

.btn-primary {
  background: #2196f3;
  color: white;
}

.btn-primary:hover {
  background: #1976d2;
  transform: none;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-success:hover {
  background: #388e3c;
}

.btn-warning {
  background: #ff9800;
  color: white;
}

.btn-warning:hover {
  background: #f57c00;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #d32f2f;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.btn-profile {
  background: #757575;
  color: white;
}

.btn-profile:hover {
  background: #616161;
}

.btn-icon {
  font-size: 0.9rem;
}

/* 表单样式 - 扁平化设计 */
.form-group {
  margin-bottom: 16px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

/* 模态框样式 - 扁平化设计 */
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
  border-radius: 8px;
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

.profile-modal {
  position: relative;
  padding: 0 0 20px 0;
  max-width: 520px;
  width: 96vw;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid #e0e0e0;
  margin: 0 8px;
  animation: modal-pop 0.25s ease-out;
}

@keyframes modal-pop {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.profile-modal .modal-close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  color: #999999;
  cursor: pointer;
  transition: color 0.2s;
  z-index: 10;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
}

.profile-modal .modal-close-btn:hover {
  color: #666666;
  background: #f5f5f5;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }
  
  .main-content {
    margin-left: 240px;
  }
  
  .content-area {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .sidebar-nav {
    display: flex;
    overflow-x: auto;
    padding: 12px;
  }
  
  .nav-item {
    flex-shrink: 0;
    padding: 10px 14px;
    margin: 0 2px;
    border-radius: 6px;
    border-right: none;
  }
  
  .nav-item:hover {
    transform: none;
  }
  
  .nav-item.active {
    border-right: none;
    background: #e3f2fd;
  }
  
  .nav-item.active::before {
    display: none;
  }
  
  .top-bar {
    padding: 12px 16px;
  }
  
  .content-area {
    padding: 16px;
  }
}

@media (max-width: 600px) {
  .profile-modal {
    max-width: 98vw;
    padding: 0 0 16px 0;
    border-radius: 6px;
  }
  
  .profile-modal .modal-close-btn {
    top: 8px;
    right: 8px;
    font-size: 20px;
    width: 28px;
    height: 28px;
    line-height: 28px;
  }
}

/* === 深色主题样式 === */
html.dark .app-layout {
  background: var(--dark-bg-primary);
}

/* === 侧边栏深色主题 === */
html.dark .sidebar {
  background: var(--dark-bg-sidebar);
  border-right: 1px solid var(--dark-border-primary);
  color: var(--dark-text-secondary);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
}

html.dark .sidebar-header {
  background: var(--dark-bg-elevated);
  border-bottom: 1px solid var(--dark-border-primary);
}

html.dark .logo {
  color: var(--dark-accent-primary);
}

html.dark .logo-subtitle {
  color: var(--dark-text-muted);
}

html.dark .user-info {
  border-top: 1px solid var(--dark-border-primary);
}

html.dark .user-avatar {
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
}

html.dark .username {
  color: var(--dark-text-primary);
}

html.dark .btn-settings {
  color: var(--dark-text-tertiary);
}

html.dark .btn-settings:hover {
  color: var(--dark-accent-primary);
}

html.dark .nav-item {
  color: var(--dark-text-tertiary);
  background: transparent;
}

html.dark .nav-item:hover {
  background: var(--dark-bg-tertiary);
  color: var(--dark-text-secondary);
}

html.dark .nav-item.active {
  background: var(--dark-accent-light);
  color: var(--dark-accent-primary);
  border-right: 3px solid var(--dark-accent-primary);
}

html.dark .nav-item.active::before {
  background: var(--dark-accent-primary);
}

html.dark .sidebar-footer {
  background: var(--dark-bg-elevated);
  border-top: 1px solid var(--dark-border-primary);
}

html.dark .btn-logout {
  background: var(--dark-bg-surface);
  color: var(--dark-text-tertiary);
  border: 1px solid var(--dark-border-primary);
}

html.dark .btn-logout:hover {
  background: var(--dark-error);
  color: var(--dark-text-primary);
  border-color: var(--dark-error);
}

/* === 主内容区域深色主题 === */
html.dark .main-content {
  background: var(--dark-bg-primary);
}

html.dark .top-bar {
  background: var(--dark-bg-secondary);
  border-bottom: 1px solid var(--dark-border-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

html.dark .current-view {
  color: var(--dark-text-primary);
}

html.dark .content-area {
  background: var(--dark-bg-primary);
}

/* === 按钮深色主题优化 === */
html.dark .btn-theme {
  background: var(--dark-bg-surface);
  color: var(--dark-text-tertiary);
  border: 1px solid var(--dark-border-primary);
}

html.dark .btn-theme:hover {
  background: var(--dark-bg-tertiary);
  color: var(--dark-text-secondary);
  border-color: var(--dark-border-secondary);
}

html.dark .btn-profile {
  background: var(--dark-bg-surface);
  color: var(--dark-text-tertiary);
  border: 1px solid var(--dark-border-primary);
}

html.dark .btn-profile:hover {
  background: var(--dark-bg-tertiary);
  color: var(--dark-text-secondary);
  border-color: var(--dark-border-secondary);
}

/* === 响应式深色主题优化 === */
@media (max-width: 768px) {
  html.dark .sidebar {
    background: var(--dark-bg-secondary);
    border-bottom: 1px solid var(--dark-border-primary);
  }
  
  html.dark .nav-item {
    background: var(--dark-bg-surface);
    border: 1px solid var(--dark-border-primary);
    border-radius: 6px;
    margin: 0 2px;
  }
  
  html.dark .nav-item:hover {
    background: var(--dark-bg-tertiary);
    border-color: var(--dark-border-secondary);
  }
  
  html.dark .nav-item.active {
    background: var(--dark-accent-primary);
    color: var(--dark-text-primary);
    border-color: var(--dark-accent-primary);
    border-right: none;
  }
  
  html.dark .nav-item.active::before {
    display: none;
  }
  
  html.dark .top-bar {
    background: var(--dark-bg-secondary);
    border-bottom: 1px solid var(--dark-border-primary);
  }
}
</style> 