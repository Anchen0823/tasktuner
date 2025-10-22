# TaskTuner 前端应用

一个基于Vue 3的现代化任务管理应用，提供完整的用户认证、任务管理和番茄钟专注功能。

## 功能特性

- ✅ 用户注册和登录
- ✅ JWT Token认证
- ✅ 用户信息管理
- ✅ 任务增删改查
- ✅ 任务优先级管理（高/中/低）
- ✅ 任务状态切换（完成/未完成）
- ✅ 任务过滤和搜索
- ✅ 日历视图展示
- ✅ 番茄钟专注计时器
- ✅ 专注时长统计和分析
- ✅ 自定义番茄钟设置
- ✅ 专注历史记录
- ✅ 效率分析和建议
- ✅ 响应式设计，支持移动端
- ✅ 现代化UI设计
- ✅ RESTful API接口预留

## 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **Vite** - 快速构建工具
- **Axios** - HTTP客户端
- **CSS3** - 现代化样式
- **JWT** - 用户认证

## 项目结构

```
frontend/
├── src/
│   ├── api/
│   │   ├── authApi.js          # 用户认证API接口
│   │   ├── taskApi.js          # 任务管理API接口
│   │   └── pomodoroApi.js      # 番茄钟API接口
│   ├── components/
│   │   ├── LoginPage.vue       # 登录页面组件
│   │   ├── UserProfile.vue     # 用户设置组件
│   │   ├── CalendarView.vue    # 日历视图组件
│   │   └── PomodoroTimer.vue   # 番茄钟组件
│   ├── App.vue                 # 主应用组件
│   ├── main.js                 # 应用入口
│   └── style.css               # 全局样式
├── api-docs/
│   ├── API_USER.md             # 用户API文档
│   ├── API_TASK.md             # 任务API文档
│   └── API_POMODORO.md         # 番茄钟API文档
├── index.html                  # HTML模板
├── package.json                # 项目配置
├── vite.config.js             # Vite配置
└── README.md                   # 项目说明
```

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

4. 预览生产版本：
```bash
npm run preview
```

## 用户认证功能

### 登录页面
- 支持邮箱/密码登录
- 支持新用户注册
- 忘记密码功能
- 记住登录状态

### 用户管理
- 用户信息编辑
- 密码修改
- 应用设置管理
- 账户删除（危险操作）

### 认证流程
1. 用户访问应用时检查登录状态
2. 未登录用户自动跳转到登录页面
3. 登录成功后获取JWT Token
4. 后续请求自动携带Token进行认证
5. Token过期自动跳转登录页面

## API接口设计

### 用户认证接口

#### 用户登录
- **POST** `/api/auth/login`
- **请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 用户注册
- **POST** `/api/auth/register`
- **请求体**:
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123",
  "nickname": "用户昵称"
}
```

#### 用户登出
- **POST** `/api/auth/logout`
- **请求头**: `Authorization: Bearer <token>`

#### 获取用户信息
- **GET** `/api/auth/me`
- **请求头**: `Authorization: Bearer <token>`

#### 修改密码
- **PUT** `/api/auth/password`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

#### 忘记密码
- **POST** `/api/auth/forgot-password`
- **请求体**:
```json
{
  "email": "user@example.com"
}
```

#### 重置密码
- **POST** `/api/auth/reset-password`
- **请求体**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123"
}
```

### 用户管理接口

#### 更新用户信息
- **PUT** `/api/users/me`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "nickname": "新昵称"
}
```

#### 删除用户账户
- **DELETE** `/api/users/me`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
```json
{
  "password": "userpassword123"
}
```

### 任务管理接口

#### 获取任务列表
- **GET** `/api/tasks`
- **请求头**: `Authorization: Bearer <token>`
- **参数**: 
  - `status` (可选): 任务状态过滤
  - `priority` (可选): 优先级过滤
  - `page` (可选): 页码
  - `size` (可选): 每页数量

#### 获取单个任务
- **GET** `/api/tasks/{id}`
- **请求头**: `Authorization: Bearer <token>`

#### 创建任务
- **POST** `/api/tasks`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
```json
{
  "title": "任务标题",
  "description": "任务描述",
  "priority": "high|medium|low",
  "completed": false,
  "deadline": "2024-01-20"
}
```

#### 更新任务
- **PUT** `/api/tasks/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: 同创建任务

#### 删除任务
- **DELETE** `/api/tasks/{id}`
- **请求头**: `Authorization: Bearer <token>`

#### 切换任务状态
- **PATCH** `/api/tasks/{id}/toggle`
- **请求头**: `Authorization: Bearer <token>`

#### 批量删除任务
- **DELETE** `/api/tasks/batch`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
```json
{
  "taskIds": [1, 2, 3]
}
```

#### 获取任务统计
- **GET** `/api/tasks/stats`
- **请求头**: `Authorization: Bearer <token>`
- **响应**:
```json
{
  "total": 10,
  "completed": 5,
  "pending": 5,
  "highPriority": 2,
  "mediumPriority": 5,
  "lowPriority": 3
}
```

#### 获取用户的任务
- **GET** `/api/users/me/tasks`
- **请求头**: `Authorization: Bearer <token>`

#### 为用户创建任务
- **POST** `/api/users/me/tasks`
- **请求头**: `Authorization: Bearer <token>`

## 数据模型

### User对象
```javascript
{
  id: Number,           // 用户ID
  username: String,     // 用户名
  email: String,        // 邮箱地址
  nickname: String,     // 昵称
  updatedAt: Date       // 更新时间
}
```

### Task对象
```javascript
{
  id: Number,           // 任务ID
  title: String,        // 任务标题
  description: String,  // 任务描述
  priority: String,     // 优先级: 'high' | 'medium' | 'low'
  completed: Boolean,   // 是否完成
  userId: Number,       // 所属用户ID
  createdAt: Date,      // 创建时间
  updatedAt: Date,      // 更新时间
  deadline: String      // 截止日期，格式YYYY-MM-DD，可选
}
```

### AuthResponse对象
```javascript
{
  token: String,        // JWT访问令牌
  user: User           // 用户信息
}
```

## 开发说明

### 当前状态
- 前端界面已完成，包含用户认证和任务管理功能
- API接口已定义，但使用模拟数据
- JWT Token认证机制已实现
- 后端API接口预留，等待后端开发

### 连接后端
要连接真实的后端API，请：

1. 修改 `src/api/authApi.js` 和 `src/api/taskApi.js` 中的 `API_BASE_URL`
2. 取消注释组件中的API调用代码
3. 注释掉模拟数据代码

### 认证配置
- JWT Token存储在localStorage中
- Token自动添加到所有API请求头
- Token过期自动跳转登录页面
- 支持Token刷新机制

### 自定义配置
- 修改 `vite.config.js` 调整开发服务器配置
- 修改 `src/style.css` 自定义样式
- 修改API配置文件调整接口地址

## 安全说明

- 所有敏感操作都需要用户认证
- 密码在传输前进行加密
- JWT Token有过期时间
- 支持密码重置功能
- 用户只能访问自己的数据

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 许可证

MIT License 