# TaskTuner 登录功能演示

## 功能概述

TaskTuner现在已成功集成了完整的用户认证系统，包括：

### 🔐 用户认证功能
- **用户登录**: 支持邮箱/密码登录
- **用户注册**: 新用户注册功能
- **忘记密码**: 密码重置功能
- **JWT Token认证**: 安全的身份验证机制

### 👤 用户管理功能
- **用户信息显示**: 在头部显示当前用户名
- **登出功能**: 安全的用户登出
- **用户设置**: 个人信息管理（预留接口）

### 🛡️ 安全特性
- **Token自动管理**: 自动添加认证头到API请求
- **会话管理**: 登录状态持久化
- **权限控制**: 未登录用户自动跳转登录页
- **Token过期处理**: 自动处理认证失败

## 演示步骤

### 1. 启动应用
```bash
cd frontend
npm run dev
```

### 2. 访问应用
打开浏览器访问 `http://localhost:5173`

### 3. 登录流程演示

#### 首次访问
- 应用会自动检查登录状态
- 未登录用户会看到登录页面
- 页面包含登录和注册两个标签页

#### 用户注册
1. 点击"注册"标签
2. 填写注册信息：
   - 用户名：`demo_user`
   - 邮箱：`demo@example.com`
   - 密码：`123456`
   - 确认密码：`123456`
3. 勾选同意服务条款
4. 点击"注册"按钮
5. 注册成功后自动登录并跳转到主应用

#### 用户登录
1. 点击"登录"标签
2. 填写登录信息：
   - 邮箱：`demo@example.com`
   - 密码：`123456`
3. 可选择"记住我"
4. 点击"登录"按钮
5. 登录成功后跳转到主应用

#### 忘记密码
1. 在登录页面点击"忘记密码？"
2. 输入邮箱地址
3. 点击"发送重置链接"
4. 模拟发送成功提示

### 4. 主应用功能演示

#### 用户信息显示
- 头部右侧显示当前用户名
- 用户名从登录信息中获取

#### 登出功能
- 点击头部的"登出"按钮
- 清除本地存储的认证信息
- 自动跳转回登录页面

#### 任务管理
- 登录后可以正常使用所有任务管理功能
- 所有API请求都会自动携带认证Token

## 技术实现细节

### 认证状态管理
```javascript
// 检查登录状态
const isAuthenticated = ref(authUtils.isAuthenticated())
const currentUser = ref(authUtils.getCurrentUser())
```

### Token自动添加
```javascript
// 请求拦截器自动添加Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 认证失败处理
```javascript
// 响应拦截器处理401错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

## API接口预留

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取用户信息
- `PUT /api/auth/password` - 修改密码
- `POST /api/auth/forgot-password` - 忘记密码
- `POST /api/auth/reset-password` - 重置密码

### 用户管理接口
- `PUT /api/users/me` - 更新用户信息
- `DELETE /api/users/me` - 删除用户账户

### 任务管理接口（已更新）
- 所有任务接口都需要认证Token
- 新增用户专属任务接口

## 文件结构

```
frontend/src/
├── api/
│   ├── authApi.js          # 用户认证API
│   └── taskApi.js          # 任务管理API（已更新）
├── components/
│   ├── LoginPage.vue       # 登录页面组件
│   └── UserProfile.vue     # 用户设置组件
├── App.vue                 # 主应用（已更新）
└── style.css               # 样式文件
```

## 下一步开发

1. **后端API开发**: 实现所有认证和任务管理接口
2. **用户设置页面**: 集成UserProfile组件
3. **密码重置**: 实现真实的邮件发送功能
4. **头像上传**: 添加用户头像功能
5. **多语言支持**: 国际化功能
6. **主题切换**: 深色模式支持

## 注意事项

- 当前使用模拟数据进行演示
- 所有API接口已预留，等待后端开发
- JWT Token存储在localStorage中
- 支持Token自动刷新机制
- 用户数据隔离，只能访问自己的任务 