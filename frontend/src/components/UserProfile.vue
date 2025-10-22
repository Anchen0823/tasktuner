<template>
  <div class="profile-card">
    <div class="profile-header">
      <h2><i class="fas fa-user-cog"></i> 账户设置</h2>
    </div>
    <div class="profile-content-row">
      <!-- 修改密码 -->
      <div class="profile-section left-section card-section">
        <h3><i class="fas fa-key"></i> 修改密码</h3>
        <form @submit.prevent="changePassword" class="password-form">
          <div class="form-group">
            <label for="current-password">当前密码</label>
            <input
              id="current-password"
              v-model="passwordForm.currentPassword"
              type="password"
              class="form-control modern-input"
              placeholder="当前密码"
              required
            />
          </div>
          <div class="form-group">
            <label for="new-password">新密码</label>
            <input
              id="new-password"
              v-model="passwordForm.newPassword"
              type="password"
              class="form-control modern-input"
              placeholder="新密码"
              required
              minlength="6"
            />
          </div>
          <div class="form-group">
            <label for="confirm-password">确认新密码</label>
            <input
              id="confirm-password"
              v-model="passwordForm.confirmPassword"
              type="password"
              class="form-control modern-input"
              placeholder="确认新密码"
              required
            />
          </div>
          <button type="submit" class="btn btn-warning btn-sm modern-btn" :disabled="loading">
            {{ loading ? '修改中...' : '修改密码' }}
          </button>
        </form>
      </div>
      <!-- 删除账户 -->
      <div class="profile-section right-section danger-zone card-section">
        <h3><i class="fas fa-exclamation-triangle"></i> 危险操作</h3>
        <div class="danger-item">
          <div class="danger-info">
            <h4>删除账户</h4>
            <p>永久删除您的账户和所有数据，此操作不可撤销</p>
          </div>
          <button @click="showDeleteConfirm = true" class="btn btn-danger btn-sm modern-btn">
            删除账户
          </button>
        </div>
      </div>
    </div>
    <!-- 成功/错误提示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
    <!-- 删除确认模态框 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="warning-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>确认删除账户</h3>
        </div>
        <div class="modal-body">
          <p>此操作将<strong>永久删除</strong>您的账户和所有相关数据，包括：</p>
          <ul class="delete-list">
            <li><i class="fas fa-tasks"></i> 所有任务记录</li>
            <li><i class="fas fa-history"></i> 历史数据</li>
            <li><i class="fas fa-user-cog"></i> 个人设置</li>
          </ul>
          <div class="confirmation-box">
            <label for="delete-confirm">
              请输入 "<span class="delete-text">DELETE</span>" 确认删除
            </label>
            <input
              id="delete-confirm"
              v-model="deleteConfirmText"
              type="text"
              class="form-control delete-confirm-input"
              placeholder="DELETE"
            />
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showDeleteConfirm = false" class="btn btn-secondary">
            <i class="fas fa-times"></i>
            取消
          </button>
          <button 
            @click="deleteAccount" 
            class="btn btn-danger" 
            :disabled="deleteConfirmText !== 'DELETE' || loading"
          >
            <i class="fas fa-trash-alt"></i>
            {{ loading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { authApi } from '../api/authApi'

export default {
  name: 'UserProfile',
  emits: ['profile-updated', 'account-deleted'],
  setup(props, { emit }) {
    const loading = ref(false)
    const message = ref('')
    const messageType = ref('success')
    const showDeleteConfirm = ref(false)
    const deleteConfirmText = ref('')

    // 基本信息表单
    const profileForm = reactive({
      username: '',
      email: '',
      nickname: ''
    })

    // 密码表单
    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    // 显示消息
    const showMessage = (text, type = 'success') => {
      message.value = text
      messageType.value = type
      setTimeout(() => {
        message.value = ''
      }, 3000)
    }

    // 加载用户信息
    const loadUserInfo = async () => {
      try {
        const response = await authApi.getCurrentUser()
        if (response.success && response.data) {
          profileForm.username = response.data.username || ''
          profileForm.email = response.data.email || ''
          profileForm.nickname = response.data.nickname || ''
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
        // 从本地存储加载作为备选
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        profileForm.username = userInfo.username || ''
        profileForm.email = userInfo.email || ''
        profileForm.nickname = userInfo.nickname || ''
      }
    }

    // 更新用户信息
    const updateProfile = async () => {
      if (loading.value) return
      
      loading.value = true
      
      try {
        // 这里可以添加更新用户信息的API调用
        // const response = await authApi.updateProfile(profileForm)
        
        // 更新本地存储
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const updatedUserInfo = { ...userInfo, ...profileForm }
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
        
        showMessage('用户信息更新成功')
        emit('profile-updated', updatedUserInfo)
        
      } catch (error) {
        showMessage(error.message || '更新失败，请稍后重试', 'error')
      } finally {
        loading.value = false
      }
    }

    // 修改密码
    const changePassword = async () => {
      if (loading.value) return
      
      // 验证输入
      if (!passwordForm.currentPassword.trim()) {
        showMessage('请输入当前密码', 'error')
        return
      }
      
      if (!passwordForm.newPassword.trim()) {
        showMessage('请输入新密码', 'error')
        return
      }
      
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        showMessage('两次输入的新密码不一致', 'error')
        return
      }
      
      if (passwordForm.newPassword.length < 6) {
        showMessage('新密码长度至少6位', 'error')
        return
      }
      
      if (passwordForm.currentPassword === passwordForm.newPassword) {
        showMessage('新密码不能与当前密码相同', 'error')
        return
      }
      
      loading.value = true
      
      try {
        console.log('开始修改密码...')
        const response = await authApi.changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
        
        console.log('修改密码响应:', response)
        
        if (response && response.success) {
          showMessage('密码修改成功')
          
          // 重置表单
          passwordForm.currentPassword = ''
          passwordForm.newPassword = ''
          passwordForm.confirmPassword = ''
        } else {
          const errorMsg = response?.error?.message || response?.message || '密码修改失败'
          showMessage(errorMsg, 'error')
        }
        
      } catch (error) {
        console.error('密码修改失败:', error)
        
        // 优化错误处理
        let errorMessage = '密码修改失败，请稍后重试'
        
        if (error.response?.data) {
          const errorData = error.response.data
          if (errorData.error?.message) {
            errorMessage = errorData.error.message
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } else if (error.message) {
          errorMessage = error.message
        }
        
        showMessage(errorMessage, 'error')
      } finally {
        loading.value = false
      }
    }

    // 删除账户
    const deleteAccount = async () => {
      if (loading.value) return
      
      loading.value = true
      
      try {
        // 这里可以添加删除账户的API调用
        // const response = await authApi.deleteAccount()
        
        // 清除本地存储
        localStorage.removeItem('authToken')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('userSettings')
        
        showDeleteConfirm.value = false
        deleteConfirmText.value = ''
        
        emit('account-deleted')
        
      } catch (error) {
        showMessage(error.message || '删除失败，请稍后重试', 'error')
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadUserInfo()
    })

    return {
      loading,
      message,
      messageType,
      showDeleteConfirm,
      deleteConfirmText,
      profileForm,
      passwordForm,
      updateProfile,
      changePassword,
      deleteAccount
    }
  }
}
</script>

<style scoped>
.profile-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  box-sizing: border-box;
}

.profile-header {
  padding: 20px 0 10px 0;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.profile-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.profile-content-row {
  display: flex;
  flex-direction: row;
  gap: 15px;
  flex: 1;
  padding: 20px 15px 0 15px;
  box-sizing: border-box;
}

.card-section {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px 15px 15px 15px;
  margin-bottom: 0;
  border: 1px solid #e0e0e0;
  min-width: 0;
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.profile-section h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #333;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  margin-bottom: 5px;
  color: #333;
}

.modern-input {
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 4px;
  min-height: 28px;
  border: 1px solid #ddd;
  background: #fff;
  transition: border-color 0.2s;
}
.modern-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  outline: none;
}

.modern-btn {
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.2s;
}
.modern-btn:active {
  transform: scale(0.98);
}

.danger-zone {
  background: #fff5f5;
  border: 1px solid #fed7d7;
}
.danger-zone h3 {
  color: #e74c3c;
}
.danger-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.danger-info h4 {
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 5px;
}
.danger-info p {
  color: #666;
  font-size: 12px;
  margin: 0;
}

.message {
  margin: 15px 20px 0 20px;
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 4px;
  width: 95%;
  max-width: 480px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.modal-header {
  background: #fff5f5;
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #fed7d7;
}

.warning-icon {
  color: #e74c3c;
  font-size: 36px;
  margin-bottom: 10px;
}

.modal-header h3 {
  margin: 0;
  color: #e74c3c;
  font-size: 18px;
  font-weight: 600;
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  margin: 0 0 15px;
  color: #333;
  line-height: 1.5;
  font-size: 14px;
  text-align: center;
}

.modal-body strong {
  color: #e74c3c;
  font-weight: 600;
}

.delete-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.delete-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  color: #333;
  font-size: 14px;
}

.delete-list li i {
  color: #e74c3c;
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.confirmation-box {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.confirmation-box label {
  display: block;
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
  text-align: center;
}

.delete-text {
  font-family: monospace;
  background: #fff5f5;
  padding: 3px 8px;
  border-radius: 3px;
  color: #e74c3c;
  font-weight: 600;
  border: 1px solid #fed7d7;
}

.delete-confirm-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  font-family: monospace;
  transition: border-color 0.2s;
  background: white;
}

.delete-confirm-input:focus {
  border-color: #e74c3c;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
  outline: none;
}

.modal-actions {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.modal-actions .btn {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.btn-danger:disabled {
  background: #feb2b2;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #ddd;
}

@media (max-width: 600px) {
  .profile-content-row {
    flex-direction: column;
    gap: 10px;
    padding: 10px 5px 0 5px;
  }
  .card-section {
    padding: 15px 10px 10px 10px;
    border-radius: 4px;
  }
  .profile-header {
    padding: 15px 0 8px 0;
  }
  .message {
    margin: 10px 10px 0 10px;
  }
}

/* === 深色主题样式 === */
html.dark .profile-header {
  background: var(--dark-bg-elevated);
  border-bottom: 1px solid var(--dark-border-primary);
}

html.dark .profile-header h2 {
  color: var(--dark-text-primary);
}

html.dark .profile-header h2 i {
  color: var(--dark-text-primary);
}

html.dark .card-section {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-primary);
  box-shadow: var(--dark-shadow-sm);
}

html.dark .profile-section h3 {
  color: var(--dark-text-primary);
}

html.dark .modern-input {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-primary);
}

html.dark .modern-input:focus {
  border-color: var(--dark-accent-primary);
  box-shadow: 0 0 0 2px var(--dark-accent-light);
  background: var(--dark-bg-secondary);
}

html.dark .modern-input::placeholder {
  color: var(--dark-text-muted);
}

html.dark .form-group label {
  color: var(--dark-text-secondary);
}

/* === 按钮深色主题 === */
html.dark .btn-primary {
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
  border: none;
}

html.dark .btn-primary:hover {
  background: var(--dark-accent-hover);
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

html.dark .btn-danger {
  background: var(--dark-error);
  color: var(--dark-text-primary);
  border: none;
}

html.dark .btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

html.dark .btn-danger:disabled {
  background: var(--dark-bg-surface);
  color: var(--dark-text-muted);
  opacity: 0.6;
}

/* === 危险区域深色主题 === */
html.dark .danger-zone {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

html.dark .danger-zone h3 {
  color: var(--dark-error);
}

html.dark .danger-info p {
  color: #fca5a5;
}

html.dark .danger-info h4 {
  color: var(--dark-error);
}

/* === 消息提示深色主题 === */
html.dark .message.success {
  background: rgba(34, 197, 94, 0.15);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

html.dark .message.error {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
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

html.dark .modal-header {
  background: var(--dark-bg-elevated);
  border-bottom: 1px solid var(--dark-border-primary);
}

html.dark .modal-header h3 {
  color: var(--dark-text-primary);
}

html.dark .modal-body p {
  color: var(--dark-text-secondary);
}

html.dark .modal-body strong {
  color: var(--dark-error);
}

/* === 删除列表深色主题 === */
html.dark .delete-list li {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-secondary);
}

html.dark .delete-list li i {
  color: var(--dark-error);
}

/* === 确认框深色主题 === */
html.dark .confirmation-box {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
}

html.dark .confirmation-box label {
  color: var(--dark-text-secondary);
}

html.dark .delete-text {
  background: rgba(239, 68, 68, 0.15);
  color: var(--dark-error);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

html.dark .delete-confirm-input {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-primary);
}

html.dark .delete-confirm-input:focus {
  border-color: var(--dark-error);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  background: var(--dark-bg-secondary);
}

html.dark .modal-actions {
  background: var(--dark-bg-elevated);
  border-top: 1px solid var(--dark-border-primary);
}
</style> 