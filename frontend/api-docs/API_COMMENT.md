# 评论系统 API 文档

## 基础信息

- **基础URL**: `http://localhost:8081/api`
- **内容类型**: `application/json`
- **认证方式**: Bearer Token (JWT)

## 评论管理接口

### 1. 获取笔记评论列表

**接口**: `GET /api/notes/{noteId}/comments`

**描述**: 获取指定笔记的评论列表，包括评论和回复

**请求头**: 需要携带认证token

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| noteId | Integer | 是 | 笔记ID |

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| size | Integer | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 1,
        "content": "这篇笔记写得很好!",
        "authorId": 101,
        "authorName": "张三",
        "createdAt": "2024-01-20T10:30:00Z",
        "updatedAt": "2024-01-20T10:30:00Z",
        "replies": [
          {
            "id": 2,
            "content": "感谢支持!",
            "authorId": 102,
            "authorName": "李四",
            "parentId": 1,
            "createdAt": "2024-01-20T11:00:00Z",
            "updatedAt": "2024-01-20T11:00:00Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 2. 创建评论

**接口**: `POST /api/notes/{noteId}/comments`

**描述**: 在指定笔记下创建新评论

**请求头**: 需要携带认证token

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| noteId | Integer | 是 | 笔记ID |

**请求体**:
```json
{
  "content": "评论内容",
  "parentId": null
}
```

**字段说明**:
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| content | String | 是 | 评论内容，长度1-500字符 |
| parentId | Integer | 否 | 父评论ID，用于回复评论 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "评论内容",
    "authorId": 101,
    "authorName": "张三",
    "parentId": null,
    "createdAt": "2024-01-20T10:30:00Z",
    "updatedAt": "2024-01-20T10:30:00Z"
  },
  "message": "评论发表成功"
}
```

### 3. 回复评论

**接口**: `POST /api/notes/{noteId}/comments/{commentId}/replies`

**描述**: 回复指定评论

**请求头**: 需要携带认证token

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| noteId | Integer | 是 | 笔记ID |
| commentId | Integer | 是 | 评论ID |

**请求体**:
```json
{
  "content": "回复内容",
  "replyTo": "用户名"
}
```

**字段说明**:
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| content | String | 是 | 回复内容，长度1-500字符 |
| replyTo | String | 是 | 被回复的用户名 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "content": "回复内容",
    "authorId": 102,
    "authorName": "李四",
    "parentId": 1,
    "replyTo": "张三",
    "createdAt": "2024-01-20T11:00:00Z",
    "updatedAt": "2024-01-20T11:00:00Z"
  },
  "message": "回复发表成功"
}
```

### 4. 删除评论

**接口**: `DELETE /api/notes/{noteId}/comments/{commentId}`

**描述**: 删除指定评论（包括其下的所有回复）

**请求头**: 需要携带认证token

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| noteId | Integer | 是 | 笔记ID |
| commentId | Integer | 是 | 评论ID |

**响应示例**:
```json
{
  "success": true,
  "message": "评论删除成功"
}
```

### 5. 删除回复

**接口**: `DELETE /api/notes/{noteId}/comments/{commentId}/replies/{replyId}`

**描述**: 删除指定回复

**请求头**: 需要携带认证token

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| noteId | Integer | 是 | 笔记ID |
| commentId | Integer | 是 | 评论ID |
| replyId | Integer | 是 | 回复ID |

**响应示例**:
```json
{
  "success": true,
  "message": "回复删除成功"
}
```

## 数据模型

### Comment对象
```json
{
  "id": "Integer - 评论ID，自动生成",
  "content": "String - 评论内容，1-500字符",
  "authorId": "Integer - 作者ID",
  "authorName": "String - 作者名称",
  "parentId": "Integer - 父评论ID，可选",
  "replyTo": "String - 被回复用户名，可选",
  "noteId": "Integer - 所属笔记ID",
  "createdAt": "DateTime - 创建时间，自动生成",
  "updatedAt": "DateTime - 更新时间，自动更新"
}
```

## 评论系统功能说明

### 1. 评论结构
- 两层结构设计
- 第一层为主评论
- 第二层为回复，包含@用户名

### 2. 评论功能
- 发表主评论
- 回复评论
- 删除评论/回复
- 分页加载

### 3. 权限控制
- 需要登录才能评论
- 只能删除自己的评论/回复
- 笔记作者可删除任何评论/回复

### 4. 展示功能
- 按时间倒序排列
- 显示作者信息
- 显示发布时间
- 支持回复层级展示 