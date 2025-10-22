<template>
  <div class="login-container">
    <!-- 主题切换按钮 -->
    <button class="theme-toggle" @click="toggleTheme">
      <span v-if="!isDark">🌞</span>
      <span v-else>🌙</span>
    </button>
    
    <!-- 主滑动容器 -->
    <div
      class="auth-container"
      :class="{ 'right-panel-active': isSignUpActive }"
    >
      <!-- 注册表单 -->
      <div class="auth-container__form auth-container--signup">
        <form @submit.prevent="handleRegister" class="form" id="registerForm">
          <h1 class="form__title">TaskTuner</h1>
          <h2 class="form__title">欢迎加入</h2>
          <p class="subtitle">创建您的 TaskTuner 账户</p>

          <div class="form-group">
            <input
              id="register-username"
              v-model="registerForm.username"
              type="text"
              class="input"
              placeholder="用户名"
              required
            />
          </div>
          <div class="form-group">
            <input
              id="register-email"
              v-model="registerForm.email"
              type="email"
              class="input"
              placeholder="邮箱"
              required
            />
          </div>
          <div class="form-group">
            <input
              id="register-password"
              v-model="registerForm.password"
              type="password"
              class="input"
              placeholder="密码（至少6位）"
              required
              minlength="6"
            />
          </div>
          <div class="form-group">
            <input
              id="register-confirm-password"
              v-model="registerForm.confirmPassword"
              type="password"
              class="input"
              placeholder="确认密码"
              required
            />
          </div>
          
          <!-- 同意条款 -->
          <div class="form-group" style="text-align: left; width: 100%;">
            <label class="checkbox-label">
              <input type="checkbox" v-model="registerForm.agreeTerms" required />
              <span>
                我同意 <a href="#" @click.prevent="showTerms = true" class="terms-link">服务条款</a>
                和 <a href="#" @click.prevent="showPrivacy = true" class="terms-link">隐私政策</a>
              </span>
            </label>
          </div>

          <button type="submit" class="btn" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>
      </div>

      <!-- 登录表单 -->
      <div class="auth-container__form auth-container--signin">
        <form @submit.prevent="handleLogin" class="form" id="loginForm">
          <h1 class="form__title">TaskTuner</h1>
          <h2 class="form__title">欢迎回来</h2>
          <p class="subtitle">登录您的 TaskTuner 账户</p>

          <div class="form-group">
            <input
              id="login-email"
              v-model="loginForm.email"
              type="email"
              class="input"
              placeholder="邮箱"
              required
            />
          </div>
          <div class="form-group">
            <input
              id="login-password"
              v-model="loginForm.password"
              type="password"
              class="input"
              placeholder="密码"
              required
            />
          </div>

          <!-- 旧忘记密码链接替换为灰色文本按钮 -->
          <span class="forgot-text" @click="showForgotPassword = true">忘记密码？</span>

          <button type="submit" class="btn" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
      </div>

      <!-- 覆盖层 -->
      <div class="auth-container__overlay">
        <div class="overlay">
          <div class="overlay__panel overlay--left">
            <button class="btn" @click="toggleToSignIn">已有账号，直接登录</button>
          </div>
          <div class="overlay__panel overlay--right">
            <button class="btn" @click="toggleToSignUp">没有账号，点击注册</button> 
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message" style="margin-top: 20px; max-width: 450px; width: 100%;">
      {{ error }}
    </div>

    <!-- 下面保留原有弹窗等内容 -->
    <!-- 忘记密码模态框 -->
    <div v-if="showForgotPassword" class="modal-overlay" @click="showForgotPassword = false">
      <div class="modal-content" @click.stop>
        <h3>重置密码</h3>
        <p>请输入您的邮箱地址，我们将发送重置密码的链接给您。</p>

        <form @submit.prevent="handleForgotPassword">
          <div class="form-group">
            <input
              v-model="forgotPasswordEmail"
              type="email"
              class="form-control"
              placeholder="请输入邮箱地址"
              required
            />
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? '发送中...' : '发送重置链接' }}
            </button>
            <button type="button" @click="showForgotPassword = false" class="btn btn-secondary">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 服务条款弹窗 -->
    <div v-if="showTerms" class="modal-overlay" @click="showTerms = false">
      <div class="modal-content" @click.stop>
        <h3>服务条款</h3>
        <div class="modal-body">
          <p>这里是服务条款占位内容。请根据实际需求补充完整的服务条款说明。</p>
        </div>
        <div class="modal-actions">
          <button type="button" @click="showTerms = false" class="btn btn-primary">关闭</button>
        </div>
      </div>
    </div>

    <!-- 隐私政策弹窗 -->
    <div v-if="showPrivacy" class="modal-overlay" @click="showPrivacy = false">
      <div class="modal-content" @click.stop>
        <h3>隐私政策</h3>
        <div class="modal-body">
          <p>这里是隐私政策占位内容。请根据实际需求补充完整的隐私政策说明。</p>
        </div>
        <div class="modal-actions">
          <button type="button" @click="showPrivacy = false" class="btn btn-primary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch, onMounted } from 'vue'
import { authApi } from '../api/authApi'

export default {
  name: 'LoginPage',
  emits: ['login-success'],
  setup(props, { emit }) {
    // 滑动面板状态
    const isSignUpActive = ref(false)
    const toggleToSignUp = () => (isSignUpActive.value = true)
    const toggleToSignIn = () => (isSignUpActive.value = false)

    const loading = ref(false)
    const error = ref('')
    const showForgotPassword = ref(false)
    const forgotPasswordEmail = ref('')
    const showTerms = ref(false)
    const showPrivacy = ref(false)

    // 登录表单
    const loginForm = reactive({
      email: '',
      password: ''
    })

    // 注册表单
    const registerForm = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false
    })

    // 深色模式状态
    const isDark = ref(localStorage.getItem('theme') === 'dark')
    const toggleTheme = () => {
      isDark.value = !isDark.value
    }
    // 同步 html 类与本地存储
    watch(isDark,(val)=>{
      if(val){
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme','dark')
      }else{
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme','light')
      }
    },{immediate:true})

    // 处理登录
    const handleLogin = async () => {
      if (loading.value) return
      
      loading.value = true
      error.value = ''
      
      try {
        // 测试用快速登录
        if (loginForm.email === 'test@123' && loginForm.password === '123456') {
          console.log('使用测试账户登录成功')
          
          // 模拟登录成功响应
          const mockUser = {
            id: 1,
            username: 'test',
            email: 'test@123',
            avatar: null,
            createdAt: new Date().toISOString()
          }
          
          // 保存用户信息到localStorage
          localStorage.setItem('userInfo', JSON.stringify(mockUser))
          localStorage.setItem('authToken', 'test-token-' + Date.now())
          // 登录成功后
          localStorage.setItem('token', 'test-token-' + Date.now())
          // 触发登录成功事件
          emit('login-success', mockUser)
          return
        }
        
        // 正常登录流程
        const response = await authApi.login({
          email: loginForm.email,
          password: loginForm.password
        })
        // 强制存储token和用户信息
        if (response.success && response.data && response.data.token) {
          localStorage.setItem('authToken', response.data.token)
          localStorage.setItem('userInfo', JSON.stringify(response.data.user))
        }
        // 触发登录成功事件
        emit('login-success', response.data.user)
        // 登录成功后强制刷新页面，确保token生效
        setTimeout(() => { window.location.reload() }, 100)
        
      } catch (err) {
        console.error('登录失败:', err)
        error.value = err.response?.data?.error?.message || '登录失败，请检查邮箱和密码'
      } finally {
        loading.value = false
      }
    }

    // 处理注册
    const handleRegister = async () => {
      if (loading.value) return
      
      // 验证密码
      if (registerForm.password !== registerForm.confirmPassword) {
        error.value = '两次输入的密码不一致'
        return
      }
      
      if (registerForm.password.length < 6) {
        error.value = '密码长度至少6位'
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        const response = await authApi.register({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })
        
        // 触发登录成功事件
        emit('login-success', response.data.user)
        
      } catch (err) {
        console.error('注册失败:', err)
        error.value = err.response?.data?.error?.message || '注册失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    // 处理忘记密码
    const handleForgotPassword = async () => {
      if (loading.value) return
      
      loading.value = true
      error.value = ''
      
      try {
        await authApi.forgotPassword(forgotPasswordEmail.value)
        alert('重置密码链接已发送到您的邮箱，请查收')
        showForgotPassword.value = false
        forgotPasswordEmail.value = ''
        
      } catch (err) {
        console.error('忘记密码请求失败:', err)
        error.value = err.response?.data?.error?.message || '发送失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    return {
      isSignUpActive,
      toggleToSignUp,
      toggleToSignIn,
      loading,
      error,
      showForgotPassword,
      forgotPasswordEmail,
      showTerms,
      showPrivacy,
      loginForm,
      registerForm,
      handleLogin,
      handleRegister,
      handleForgotPassword,
      isDark,
      toggleTheme
    }
  }
}
</script>

<style>
:root {
  /* 全局颜色与尺寸变量 */
  --white: #e9e9e9;
  --gray: #333;
  --blue: #0367a6;
  --lightblue: #008997;
  --button-radius: 0.7rem;
  --max-width: 900px;
  --max-height: 520px;
}
</style>

<style scoped>
/***** 新增滑动面板样式 *****/
.auth-container {
  background-color: var(--white);
  border-radius: var(--button-radius);
  box-shadow: 0 0.9rem 1.7rem rgba(0, 0, 0, 0.25), 0 0.7rem 0.7rem rgba(0, 0, 0, 0.22);
  height: var(--max-height);
  max-width: var(--max-width);
  overflow: hidden;
  position: relative;
  width: 100%;
}

.auth-container__form {
  height: 100%;
  position: absolute;
  top: 0;
  transition: all 0.6s ease-in-out;
}

.auth-container--signin {
  left: 0;
  width: 50%;
  z-index: 2;
  opacity: 1 !important;
}
.auth-container.right-panel-active .auth-container--signin {
  opacity: 0.2;
}
.auth-container:not(.right-panel-active) .auth-container--signin {
  opacity: 1;
}
.auth-container--signup {
  left: 0;
  width: 50%;
  z-index: 1;
  opacity: 0;
  pointer-events: none;
}
.auth-container.right-panel-active .auth-container--signup {
  animation: show 0.6s;
  opacity: 1;
  transform: translateX(100%);
  z-index: 5;
  pointer-events: auto;
}

.auth-container__overlay {
  height: 100%;
  left: 50%;
  overflow: hidden;
  position: absolute;
  top: 0;
  transition: transform 0.6s ease-in-out;
  width: 50%;
  z-index: 100;
}

.auth-container.right-panel-active .auth-container__overlay {
  transform: translateX(-100%);
}

.overlay {
  background-color: var(--lightblue);
  background: url('/images/mountain-bg.jpg') center/cover no-repeat fixed, 
              linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
  height: 100%;
  left: -100%;
  position: relative;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
  width: 200%;
}

.auth-container.right-panel-active .overlay {
  transform: translateX(50%);
}

.overlay__panel {
  align-items: center;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  position: absolute;
  text-align: center;
  top: 0;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
  width: 50%;
}

.overlay--left {
  transform: translateX(-20%);
}

.auth-container.right-panel-active .overlay--left {
  transform: translateX(0);
}

.overlay--right {
  right: 0;
  transform: translateX(0);
}

.auth-container.right-panel-active .overlay--right {
  transform: translateX(20%);
}

.btn {
  background-color: var(--blue);
  background-image: linear-gradient(90deg, var(--blue) 0%, var(--lightblue) 74%);
  border-radius: 20px;
  border: 1px solid var(--blue);
  color: var(--white);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  letter-spacing: 0.1rem;
  padding: 0.9rem 4rem;
  text-transform: uppercase;
  transition: transform 80ms ease-in;
}

.form > .btn {
  margin-top: 1.5rem;
  width: 100%;
}

.btn:active {
  transform: scale(0.95);
}

.form {
  background-color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 3rem;
  height: 100%;
  text-align: center;
}

.input {
  background-color: #fff;
  border: 1px solid #ddd;
  padding: 0.5rem;
  margin: 0.2rem 0;
  width: 100%;
  border-radius: 4px;
}

@keyframes show {
  0%,
  49.99% {
    opacity: 0;
    z-index: 1;
  }

  50%,
  100% {
    opacity: 1;
    z-index: 5;
  }
}

/***** 继承并保留原有样式（包括弹窗等） *****/
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('/images/mountain-bg.jpg') center/cover no-repeat fixed, 
              linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
  max-width: 450px;
  border: 1px solid #e0e0e0;
}

.tab-container {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.tab-btn {
  flex: 1;
  padding: 15px 20px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #666;
}

.tab-btn.active {
  background: white;
  color: #3498db;
  border-bottom: 2px solid #3498db;
}

.tab-btn:hover:not(.active) {
  background: #e9ecef;
  color: #3498db;
}

.form-container {
  padding: 30px;
}

.form-container h2 {
  text-align: center;
  margin-bottom: 8px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 25px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #666;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 8px;
  width: 16px;
  height: 16px;
}

.forgot-link {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.forgot-link:hover {
  text-decoration: underline;
}

.terms-link {
  color: #3498db;
  text-decoration: none;
}

.terms-link:hover {
  text-decoration: underline;
}

.btn {
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 4px;
  margin: 0 30px 30px 30px;
  font-size: 14px;
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
  padding: 25px;
  border-radius: 4px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.modal-content h3 {
  margin-bottom: 12px;
  color: #333;
  font-size: 18px;
}

.modal-content p {
  margin-bottom: 20px;
  color: #666;
  line-height: 1.5;
  font-size: 14px;
}

.modal-body {
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.modal-actions .btn {
  flex: 1;
}

@media (max-width: 480px) {
  .login-card {
    margin: 10px;
    border-radius: 4px;
  }
  
  .form-container {
    padding: 20px;
  }
  
  .form-container h2 {
    font-size: 20px;
  }
  
  .modal-content {
    margin: 20px;
    padding: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}

/* ===== 深色主题样式 ==== */
html.dark .login-container {
  background: url('/images/mountain-bg.jpg') center/cover no-repeat fixed,
              linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

html.dark .login-card {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-primary);
  box-shadow: var(--dark-shadow-lg);
  color: var(--dark-text-secondary);
}

/* === 选项卡深色主题 === */
html.dark .tab-container {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
}

html.dark .tab-btn {
  background: transparent;
  color: var(--dark-text-tertiary);
  border: none;
}

html.dark .tab-btn:hover {
  color: var(--dark-text-secondary);
  background: var(--dark-bg-tertiary);
}

html.dark .tab-btn.active {
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
}

/* === 表单深色主题 === */
html.dark .form-container h2 {
  color: var(--dark-text-primary);
}

html.dark .subtitle {
  color: var(--dark-text-tertiary);
}

html.dark .form-group label {
  color: var(--dark-text-secondary);
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

/* === 错误消息深色主题 === */
html.dark .error-message {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
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

html.dark .btn-primary:disabled {
  background: var(--dark-bg-surface);
  color: var(--dark-text-muted);
  opacity: 0.6;
}

/* === 响应式深色主题优化 === */
@media (max-width: 768px) {
  html.dark .login-container {
    background: var(--dark-bg-primary);
  }
  
  html.dark .login-card {
    background: var(--dark-bg-secondary);
    border-color: var(--dark-border-primary);
  }
  
  html.dark .tab-container {
    background: var(--dark-bg-surface);
  }
}

/* 调整切换按钮大小 */
.overlay__panel .btn {
  padding: 0.4rem 2.1rem;
  font-size: 0.8rem;
  letter-spacing: 0;
  width: auto;
  min-width: initial;
  white-space: nowrap;
}

/* 收紧注册表单排版 */
.auth-container--signup .form {
  padding: 0 2rem; /* 原 3rem */
}
.auth-container--signup .form-group {
  margin-bottom: 14px; /* 原 20px */
}

/* 让输入框更长一些（占满可用宽度） */
.input {
  width: 100%; /* 已经100%，若容器变宽即可 */
}

/* 新增样式 */
.forgot-text {
  color: #999;
  font-size: 0.85rem;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: color 0.2s;
}
.forgot-text:hover {
  color: #666;
}

html.dark .auth-container {
  background: #2b2b2b;
  border-color: #444;
}

html.dark .form {
  background: transparent;
}

html.dark .input {
  background: #3c3c3c;
  border-color: #555;
  color: #e0e0e0;
}

.theme-toggle {
  position: absolute;
  top: 12px;
  right: 16px;
  background: transparent;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  z-index: 999;
}
.theme-toggle:focus{outline:none;}

html.dark .modal-content h3 {
  color: #f5f5f5; /* 柔和白色 */
}

/* 添加备用的深色模式背景 */
html.dark .login-container {
  background: url('/images/mountain-bg.jpg') center/cover no-repeat fixed,
              linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

html.dark .overlay {
  background: url('/images/mountain-bg.jpg') center/cover no-repeat fixed,
              linear-gradient(135deg, rgba(44, 62, 80, 0.9) 0%, rgba(52, 73, 94, 0.9) 100%);
}
</style> 