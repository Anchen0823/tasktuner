# 笔记功能 API 文档

## 基础说明
- 所有接口前缀：`/api/notes` 或 `/api/users/me/notes`
- 需要认证（token）
- 返回格式：JSON
- 当前使用模拟数据，API接口已预留

---

## 1. 获取所有笔记
- **GET** `/api/notes`
- **描述**：获取所有笔记（管理员/调试用）
- **参数**：可选，分页、搜索等
- **返回示例**：
```json
[
  {
    "id": 101,
    "title": "前端开发最佳实践",
    "content": "在现代前端开发中，我们需要关注以下几个方面...",
    "authorName": "张三",
    "isPublished": true,
    "likeCount": 23,
    "isLiked": false,
    "createdAt": "2024-01-10T09:00:00Z",
    "updatedAt": "2024-01-12T14:30:00Z"
  }
]
```

---

## 2. 获取当前用户的笔记
- **GET** `/api/users/me/notes`
- **描述**：获取当前登录用户的所有笔记
- **参数**：可选，分页、搜索等
- **返回示例**：
```json
[
  {
    "id": 101,
    "title": "前端开发最佳实践",
    "content": "在现代前端开发中，我们需要关注以下几个方面...",
    "authorName": "张三",
    "isPublished": true,
    "likeCount": 23,
    "isLiked": false,
    "createdAt": "2024-01-10T09:00:00Z",
    "updatedAt": "2024-01-12T14:30:00Z"
  }
]
```

---

## 3. 获取单个笔记
- **GET** `/api/notes/{id}`
- **描述**：根据ID获取笔记详情
- **返回**：
```json
{
  "id": 101,
  "title": "前端开发最佳实践",
  "content": "在现代前端开发中，我们需要关注以下几个方面...",
  "authorName": "张三",
  "isPublished": true,
  "likeCount": 23,
  "isLiked": false,
  "createdAt": "2024-01-10T09:00:00Z",
  "updatedAt": "2024-01-12T14:30:00Z"
}
```

---

## 4. 创建新笔记
- **POST** `/api/notes`
- **描述**：创建一条新笔记
- **Body**：
```json
{
  "title": "string",
  "content": "string"
}
```
- **返回**：创建后的完整笔记对象

---

## 5. 为用户创建笔记
- **POST** `/api/users/me/notes`
- **描述**：为当前用户创建一条新笔记
- **Body**：
```json
{
  "title": "string",
  "content": "string"
}
```
- **返回**：创建后的完整笔记对象

---

## 6. 更新笔记
- **PUT** `/api/notes/{id}`
- **描述**：修改指定ID的笔记
- **Body**：
```json
{
  "title": "string",
  "content": "string"
}
```
- **返回**：修改后的完整笔记对象

---

## 7. 删除笔记
- **DELETE** `/api/notes/{id}`
- **描述**：删除指定ID的笔记
- **返回**：
```json
{ "success": true }
```

---

## 8. 批量删除笔记
- **DELETE** `/api/notes/batch`
- **描述**：批量删除多个笔记
- **Body**：
```json
{
  "noteIds": [1, 2, 3]
}
```
- **返回**：
```json
{ "success": true, "deletedCount": 3 }
```

---

## 9. 发布/取消发布笔记
- **PATCH** `/api/notes/{id}/publish`
- **描述**：切换笔记的发布状态（已发布/草稿）
- **返回**：
```json
{
  "id": 101,
  "isPublished": true
}
```

---

## 10. 获取已发布的笔记
- **GET** `/api/notes/published`
- **描述**：获取所有已发布的笔记
- **返回**：笔记列表

---

## 11. 搜索笔记
- **GET** `/api/notes/search`
- **描述**：搜索笔记
- **参数**：
  - `q`: 搜索关键词
  - 其他可选参数
- **返回**：匹配的笔记列表

---

## 12. 获取笔记统计信息
- **GET** `/api/notes/stats`
- **描述**：获取笔记数量、发布数等统计信息
- **返回**：
```json
{
  "total": 10,
  "published": 6,
  "draft": 4
}
```

---

## 数据结构说明

### 笔记对象结构
```json
{
  "id": "number",           // 笔记ID
  "title": "string",        // 笔记标题
  "content": "string",      // 笔记内容
  "authorName": "string",   // 作者姓名
  "isPublished": "boolean", // 是否已发布
  "likeCount": "number",    // 点赞数
  "isLiked": "boolean",     // 当前用户是否已点赞
  "createdAt": "string",    // 创建时间
  "updatedAt": "string"     // 更新时间
}
```

### 创建/更新笔记请求结构
```json
{
  "title": "string",    // 笔记标题（必填）
  "content": "string"   // 笔记内容（必填）
}
```

---

## 功能特性

### 已实现功能
- ✅ 笔记的创建、编辑、删除
- ✅ 自动保存（2秒延迟）
- ✅ 发布/取消发布功能
- ✅ 搜索功能
- ✅ 删除确认对话框
- ✅ 字符计数显示
- ✅ 最后保存时间显示
- ✅ 点赞功能（笔记大厅）

### 技术实现
- 使用 Vue 3 Composition API
- 响应式数据管理
- 模拟数据（可随时切换为真实API）
- 自动保存机制
- 搜索过滤功能 