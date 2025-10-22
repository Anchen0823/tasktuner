# 用户相关 API 文档

## 认证说明

- **基础URL**: `http://localhost:8080/api`
- **内容类型**: `application/json`
- **认证方式**: Bearer Token (JWT)

### Token格式
```
Authorization: Bearer <jwt_token>
```

### Token获取
通过登录接口获取token，后续请求需要在请求头中携带token。

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

### 认证错误响应 (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "认证失败，请重新登录"
  }
}
```

## 用户认证接口

### 1. 用户登录

**接口**: `POST /api/auth/login`

**描述**: 用户登录获取访问令牌

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**字段说明**:
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| email | String | 是 | 用户邮箱地址 |
| password | String | 是 | 用户密码，长度6-50字符 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "user123",
      "email": "user@example.com"
    }
  },
  "message": "登录成功"
}
```

### 2. 用户注册

**接口**: `POST /api/auth/register`

**描述**: 新用户注册

**请求体**:
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123"
}
```

**字段说明**:
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| username | String | 是 | 用户名，长度3-20字符，只能包含字母、数字、下划线 |
| email | String | 是 | 邮箱地址，必须是有效的邮箱格式 |
| password | String | 是 | 密码，长度6-50字符 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "user123",
      "email": "user@example.com"
    }
  },
  "message": "注册成功"
}
```

### 3. 用户登出

**接口**: `POST /api/auth/logout`

**描述**: 用户登出，清除服务器端token

**请求头**: 需要携带认证token

**响应示例**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 4. 获取当前用户信息

**接口**: `GET /api/auth/me`

**描述**: 获取当前登录用户的详细信息

**请求头**: 需要携带认证token

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### 5. 修改密码

**接口**: `PUT /api/auth/password`

**描述**: 修改用户密码

**请求头**: 需要携带认证token

**请求体**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**字段说明**:
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| currentPassword | String | 是 | 当前密码 |
| newPassword | String | 是 | 新密码，长度6-50字符 |

**响应示例**:
```json
{
  "success": true,
  "message": "密码修改成功"
}
``` 