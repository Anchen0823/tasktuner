# 番茄钟 API 文档

## 概述

番茄钟模块提供专注计时、休息提醒、统计分析和效率追踪功能。支持自定义时长设置和详细的数据记录。目前所有功能都在前端实现，使用本地存储保存数据。

## 功能特性

### 1. 番茄钟设置
- 专注时长（默认25分钟）
- 短休息时长（默认5分钟）
- 长休息时长（默认15分钟）
- 长休息间隔（默认4个番茄钟）

### 2. 计时功能
- 专注计时
- 短休息计时
- 长休息计时
- 可暂停、重置和跳过
- 进度环显示
- 阶段指示器

### 3. 统计功能
- 完成的番茄钟数量
- 总专注时间
- 休息次数
- 效率百分比

### 4. 历史记录
- 记录类型（专注/休息）
- 持续时间
- 完成时间
- 最近10条记录显示

## 本地存储结构

### 设置数据
```javascript
{
  "focusDuration": 25,      // 专注时长（分钟）
  "shortBreakDuration": 5,  // 短休息时长（分钟）
  "longBreakDuration": 15,  // 长休息时长（分钟）
  "longBreakInterval": 4    // 长休息间隔（次数）
}
```

### 记录数据
```javascript
{
  "id": 123,                            // 记录ID（时间戳）
  "type": "focus",                      // 类型：focus/shortBreak/longBreak
  "duration": 1500,                     // 实际完成时长（秒）
  "completedAt": "2024-01-15T10:30:00Z" // 完成时间
}
```

### 统计数据
```javascript
{
  "completedPomodoros": 6,  // 完成的番茄钟数量
  "totalFocusTime": 9000,   // 总专注时间（秒）
  "totalBreaks": 5,         // 休息次数
  "efficiency": 75          // 效率百分比
}
```

## 组件使用说明

### PomodoroTimer 组件

组件不需要任何 props，完全自包含，内部管理所有状态。

### 示例代码

```vue
<template>
  <PomodoroTimer />
</template>

<script>
import PomodoroTimer from './components/PomodoroTimer.vue'

export default {
  components: {
    PomodoroTimer
  }
}
</script>
```

## 通知功能

组件支持浏览器通知：
- 在组件挂载时请求通知权限
- 每个阶段完成时发送通知
- 通知包含阶段名称和完成信息

## 样式说明

1. 计时器显示
   - 大型数字显示
   - 环形进度条
   - 当前阶段标签

2. 控制按钮
   - 开始/暂停
   - 重置
   - 跳过

3. 阶段指示器
   - 专注阶段：🎯
   - 短休息：☕
   - 长休息：🌴

4. 统计面板
   - 网格布局
   - 数字突出显示
   - 响应式设计

5. 历史记录
   - 列表视图
   - 时间和类型标识
   - 滚动显示

## 注意事项

1. 所有数据保存在浏览器的 localStorage 中
2. 页面刷新不会丢失设置和历史记录
3. 不同浏览器的数据相互独立
4. 清除浏览器数据会导致记录丢失
5. 建议定期备份重要的专注记录

## 基础信息

- **基础URL**: `http://localhost:3000/api/pomodoro`
- **认证方式**: Bearer Token
- **数据格式**: JSON

## 接口列表

### 1. 获取番茄钟设置

获取用户的番茄钟配置设置。

**请求**
```
GET /pomodoro/settings
```

**请求头**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**响应**
```json
{
  "success": true,
  "data": {
    "focusDuration": 25,
    "shortBreakDuration": 5,
    "longBreakDuration": 15,
    "longBreakInterval": 4
  }
}
```

**字段说明**
- `focusDuration`: 专注时长（分钟）
- `shortBreakDuration`: 短休息时长（分钟）
- `longBreakDuration`: 长休息时长（分钟）
- `longBreakInterval`: 长休息间隔（专注次数）

### 2. 保存番茄钟设置

保存用户的番茄钟配置设置。

**请求**
```
POST /pomodoro/settings
```

**请求头**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**
```json
{
  "focusDuration": 25,
  "shortBreakDuration": 5,
  "longBreakDuration": 15,
  "longBreakInterval": 4
}
```

**响应**
```json
{
  "success": true,
  "message": "设置保存成功"
}
```

### 3. 记录番茄钟完成

记录一个番茄钟阶段的完成情况。

**请求**
```
POST /pomodoro/records
```

**请求头**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**
```json
{
  "type": "focus",
  "duration": 1500,
  "completedAt": "2024-01-15T10:30:00Z",
  "interrupted": false,
  "notes": "完成了项目文档编写"
}
```

**字段说明**
- `type`: 阶段类型（focus/shortBreak/longBreak）
- `duration`: 实际完成时长（秒）
- `completedAt`: 完成时间
- `interrupted`: 是否被中断
- `notes`: 备注信息（可选）

**响应**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "type": "focus",
    "duration": 1500,
    "completedAt": "2024-01-15T10:30:00Z",
    "interrupted": false,
    "notes": "完成了项目文档编写",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 4. 获取今日统计

获取用户今日的番茄钟统计数据。

**请求**
```
GET /pomodoro/stats/today
```

**请求头**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**响应**
```json
{
  "success": true,
  "data": {
    "completedPomodoros": 6,
    "totalFocusTime": 9000,
    "totalBreaks": 5,
    "efficiency": 75,
    "interruptedCount": 1,
    "averageSessionLength": 1500
  }
}
```

**字段说明**
- `completedPomodoros`: 完成的番茄钟数量
- `totalFocusTime`: 总专注时间（秒）
- `totalBreaks`: 休息次数
- `efficiency`: 效率百分比
- `interruptedCount`: 中断次数
- `averageSessionLength`: 平均专注时长（秒）

### 5. 获取历史记录

获取用户的番茄钟历史记录。

**请求**
```
GET /pomodoro/records?limit=20&offset=0&type=all&startDate=2024-01-01&endDate=2024-01-31
```

**请求头**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**查询参数**
- `limit`: 每页记录数（默认20）
- `offset`: 偏移量（默认0）
- `type`: 记录类型过滤（all/focus/break，默认all）
- `startDate`: 开始日期（可选）
- `endDate`: 结束日期（可选）

**响应**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 123,
        "type": "focus",
        "duration": 1500,
        "completedAt": "2024-01-15T10:30:00Z",
        "interrupted": false,
        "notes": "完成了项目文档编写"
      }
    ],
    "total": 150,
    "hasMore": true
  }
}
```

### 6. 获取专注时长统计

获取指定日期范围内的专注时长统计。

**请求**
```
GET /pomodoro/stats/focus-time?startDate=2024-01-01&endDate=2024-01-31&groupBy=day
```

**请求头**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**查询参数**
- `startDate`: 开始日期（必填）
- `endDate`: 结束日期（必填）
- `groupBy`: 分组方式（day/week/month，默认day）

**响应**
```json
{
  "success": true,
  "data": {
    "dailyStats": [
      {
        "date": "2024-01-15",
        "focusTime": 7200,
        "pomodoros": 4,
        "breaks": 3,
        "efficiency": 80
      }
    ],
    "totalFocusTime": 36000,
    "totalPomodoros": 22,
    "averageEfficiency": 75
  }
}
```

### 7. 获取效率分析

获取用户的专注效率分析报告。

**请求**
```
GET /pomodoro/stats/efficiency?days=7
```

**请求头**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**查询参数**
- `days`: 分析天数（默认7天）

**响应**
```json
{
  "success": true,
  "data": {
    "averageEfficiency": 75,
    "bestDay": "2024-01-17",
    "bestEfficiency": 85,
    "weeklyTrend": [70, 72, 75, 78, 80, 82, 85],
    "peakHours": [9, 10, 14, 15],
    "recommendations": [
      "建议在上午9-11点进行深度专注",
      "每完成4个番茄钟后适当延长休息时间",
      "保持规律的作息有助于提高专注效率"
    ]
  }
}
```

## 错误响应

所有接口在发生错误时都会返回统一的错误格式：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": {
      "focusDuration": "专注时长必须在1-60分钟之间"
    }
  }
}
```

**常见错误代码**
- `UNAUTHORIZED`: 未授权访问
- `VALIDATION_ERROR`: 参数验证失败
- `NOT_FOUND`: 资源不存在
- `INTERNAL_ERROR`: 服务器内部错误

## 数据模型

### PomodoroRecord
```json
{
  "id": "number",
  "userId": "number",
  "type": "string", // focus, shortBreak, longBreak
  "duration": "number", // 秒
  "completedAt": "string", // ISO 8601
  "interrupted": "boolean",
  "notes": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### PomodoroSettings
```json
{
  "id": "number",
  "userId": "number",
  "focusDuration": "number", // 分钟
  "shortBreakDuration": "number", // 分钟
  "longBreakDuration": "number", // 分钟
  "longBreakInterval": "number",
  "autoStartBreaks": "boolean",
  "autoStartPomodoros": "boolean",
  "soundEnabled": "boolean",
  "notificationsEnabled": "boolean",
  "createdAt": "string",
  "updatedAt": "string"
}
```

## 使用示例

### JavaScript 示例

```javascript
// 获取设置
const settings = await fetch('/api/pomodoro/settings', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(res => res.json())

// 记录完成
const record = await fetch('/api/pomodoro/records', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'focus',
    duration: 1500,
    completedAt: new Date().toISOString()
  })
}).then(res => res.json())

// 获取今日统计
const stats = await fetch('/api/pomodoro/stats/today', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(res => res.json())
```

## 注意事项

1. 所有时间相关的字段都使用ISO 8601格式
2. 时长字段统一使用秒为单位
3. 设置中的时长字段使用分钟为单位
4. 建议在客户端实现本地缓存以提高性能
5. 专注记录建议实时保存，避免数据丢失 