# 任务相关 API 文档

## 基础信息

- **基础URL**: `http://localhost:/api`
- **内容类型**: `application/json`
- **认证方式**: Bearer Token (JWT)

## 任务管理接口

### 1. 获取任务列表

**接口**: `GET /api/tasks`

**描述**: 获取任务列表，支持分页和过滤

**请求头**: 需要携带认证token

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| size | Integer | 否 | 每页数量，默认10 |
| status | String | 否 | 任务状态：'all', 'completed', 'pending' |
| priority | String | 否 | 优先级：'all', 'high', 'medium', 'low' |
| keyword | String | 否 | 搜索关键词 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "title": "完成项目文档",
        "description": "编写项目技术文档和用户手册",
        "priority": "high",
        "completed": false,
        "userId": 1,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z",
        "deadline": "2024-01-20"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 2. 获取单个任务

**接口**: `GET /api/tasks/{id}`

**描述**: 根据ID获取任务详情

**请求头**: 需要携带认证token

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | Integer | 是 | 任务ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "完成项目文档",
    "description": "编写项目技术文档和用户手册",
    "priority": "high",
    "completed": false,
    "userId": 1,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "deadline": "2024-01-20"
  }
}
```

### 3. 创建任务

**接口**: `POST /api/tasks`

**描述**: 创建新任务

**请求头**: 需要携带认证token

**请求体**:
```json
{
  "title": "任务标题",
  "description": "任务描述（可选）",
  "priority": "high|medium|low",
  "completed": false,
  "deadline": "2024-01-20"
}
```

**字段说明**:
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| title | String | 是 | 任务标题，长度1-100字符 |
| description | String | 否 | 任务描述，长度0-500字符 |
| priority | String | 是 | 优先级：'high', 'medium', 'low' |
| completed | Boolean | 否 | 是否完成，默认false |
| deadline | String | 否 | 截止日期，格式'YYYY-MM-DD' |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "完成项目文档",
    "description": "编写项目技术文档和用户手册",
    "priority": "high",
    "completed": false,
    "userId": 1,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "deadline": "2024-01-20"
  },
  "message": "任务创建成功"
}
```

### 4. 更新任务

**接口**: `PUT /api/tasks/{id}`

**描述**: 更新任务信息

**请求头**: 需要携带认证token

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | Integer | 是 | 任务ID |

**请求体**: 同创建任务

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "更新后的任务标题",
    "description": "更新后的任务描述",
    "priority": "medium",
    "completed": true,
    "userId": 1,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T11:30:00Z",
    "deadline": "2024-01-22"
  },
  "message": "任务更新成功"
}
```

### 5. 删除任务

**接口**: `DELETE /api/tasks/{id}`

**描述**: 删除指定任务

**请求头**: 需要携带认证token

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | Integer | 是 | 任务ID |

**响应示例**:
```json
{
  "success": true,
  "message": "任务删除成功"
}
```

### 6. 切换任务状态

**接口**: `PATCH /api/tasks/{id}/toggle`

**描述**: 切换任务的完成状态

**请求头**: 需要携带认证token

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | Integer | 是 | 任务ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "completed": true,
    "updatedAt": "2024-01-15T11:30:00Z"
  },
  "message": "任务状态更新成功"
}
```

### 7. 批量删除任务

**接口**: `DELETE /api/tasks/batch`

**描述**: 批量删除多个任务

**请求头**: 需要携带认证token

**请求体**:
```json
{
  "taskIds": [1, 2, 3, 4, 5]
}
```

**字段说明**:
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| taskIds | Array | 是 | 要删除的任务ID数组 |

**响应示例**:
```json
{
  "success": true,
  "message": "批量删除成功，共删除5个任务"
}
```

### 8. 获取任务统计信息

**接口**: `GET /api/tasks/stats`

**描述**: 获取当前用户的任务统计信息

**请求头**: 需要携带认证token

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total": 25,
    "completed": 15,
    "pending": 10,
    "highPriority": 5,
    "mediumPriority": 12,
    "lowPriority": 8
  }
}
```

### 9. 获取用户的任务

**接口**: `GET /api/users/me/tasks`

**描述**: 获取当前用户的所有任务

**请求头**: 需要携带认证token

**请求参数**: 同获取任务列表

**响应示例**: 同获取任务列表

### 10. 为用户创建任务

**接口**: `POST /api/users/me/tasks`

**描述**: 为当前用户创建新任务

**请求头**: 需要携带认证token

**请求体**: 同创建任务

**响应示例**: 同创建任务

## 数据模型

### Task对象
```json
{
  "id": "Integer - 任务ID，自动生成",
  "title": "String - 任务标题，必填，1-100字符",
  "description": "String - 任务描述，可选，0-500字符",
  "priority": "String - 优先级，必填，枚举值：high|medium|low",
  "completed": "Boolean - 是否完成，默认false",
  "createdAt": "DateTime - 创建时间，自动生成",
  "updatedAt": "DateTime - 更新时间，自动更新",
  "deadline": "String - 截止日期，格式YYYY-MM-DD，可选"
}
```

## 任务管理功能说明

## 概述

任务管理模块提供任务的创建、编辑、删除和状态管理功能。目前所有功能都在前端实现，使用 Vue 的响应式状态管理。

## 功能特性

### 1. 任务管理
- 创建新任务
- 编辑任务
- 删除任务
- 切换任务状态（完成/未完成）
- 设置任务优先级
- 设置任务截止日期

### 2. 任务过滤
- 全部任务
- 待完成任务
- 已完成任务
- 高优先级任务

### 3. 任务统计
- 总任务数
- 已完成任务数
- 待完成任务数

## 数据结构

### Task 对象
```javascript
{
  id: Number,           // 任务ID（自动生成）
  title: String,        // 任务标题（必填）
  description: String,  // 任务描述（可选）
  priority: String,     // 优先级（high/medium/low）
  completed: Boolean,   // 完成状态
  createdAt: Date,      // 创建时间
  deadline: String      // 截止日期（YYYY-MM-DD格式）
}
```

## 组件使用说明

### 主要功能

1. 添加任务
```javascript
const addTask = async () => {
  if (!newTask.value.title.trim()) {
    alert('请输入任务标题')
    return
  }

  const taskData = {
    title: newTask.value.title,
    description: newTask.value.description,
    priority: newTask.value.priority,
    deadline: newTask.value.deadline,
    completed: false,
    createdAt: new Date()
  }

  // 添加到本地数据
  const newId = Math.max(...tasks.value.map(t => t.id), 0) + 1
  tasks.value.unshift({
    id: newId,
    ...taskData
  })
}
```

2. 切换任务状态
```javascript
const toggleTask = async (taskId) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    task.completed = !task.completed
  }
}
```

3. 编辑任务
```javascript
const saveEditTask = async () => {
  const index = tasks.value.findIndex(t => t.id === editingTask.value.id)
  if (index !== -1) {
    tasks.value[index] = { ...editingTask.value }
  }
}
```

4. 删除任务
```javascript
const deleteTask = async (taskId) => {
  if (!confirm('确定要删除这个任务吗？')) {
    return
  }
  tasks.value = tasks.value.filter(t => t.id !== taskId)
}
```

### 过滤器实现
```javascript
const filteredTasks = computed(() => {
  switch (currentFilter.value) {
    case 'pending':
      return tasks.value.filter(task => !task.completed)
    case 'completed':
      return tasks.value.filter(task => task.completed)
    case 'high':
      return tasks.value.filter(task => task.priority === 'high')
    default:
      return tasks.value
  }
})
```

### 统计信息实现
```javascript
const stats = computed(() => {
  const total = tasks.value.length
  const completed = tasks.value.filter(task => task.completed).length
  const pending = total - completed
  return { total, completed, pending }
})
```

## 视图组件

### 1. 列表视图
- 显示所有任务的列表
- 支持任务的增删改查
- 支持任务状态切换
- 支持任务过滤

### 2. 日历视图
- 按日期显示任务
- 支持任务的基本操作
- 直观展示任务截止日期

## 样式说明

1. 任务项
   - 标题和描述
   - 优先级标识
   - 完成状态切换
   - 操作按钮

2. 过滤器
   - 按钮组样式
   - 激活状态高亮

3. 表单控件
   - 输入框样式
   - 下拉选择框
   - 日期选择器

4. 统计面板
   - 卡片式布局
   - 数字突出显示

## 注意事项

1. 所有数据都保存在内存中，页面刷新会丢失
2. 任务 ID 基于当前最大 ID 自增
3. 删除操作需要二次确认
4. 表单输入需要验证
5. 未来可以添加本地存储或后端 API 支持 