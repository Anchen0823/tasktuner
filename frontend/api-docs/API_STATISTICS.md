# 统计数据 API 文档

## 目录
- [统计数据 API 文档](#统计数据-api-文档)
  - [目录](#目录)
  - [番茄钟统计](#番茄钟统计)
    - [获取番茄钟统计数据](#获取番茄钟统计数据)
  - [任务统计](#任务统计)
    - [获取任务统计数据](#获取任务统计数据)

## 番茄钟统计

### 获取番茄钟统计数据

获取用户的番茄钟使用统计数据，包括每日统计和总体统计。

**请求URL：**
```
GET /api/pomodoro/stats
```

**请求参数：**
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| params | Object | 否 | 查询参数对象 |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "dailyStats": [
      {
        "date": "2024-01-15",
        "count": 8,
        "totalMinutes": 200
      },
      {
        "date": "2024-01-16",
        "count": 6,
        "totalMinutes": 150
      }
    ],
    "totalStats": {
      "totalPomodoros": 40,
      "totalMinutes": 1000,
      "averageDaily": 8
    }
  }
}
```

**响应参数说明：**
| 参数名 | 类型 | 描述 |
|--------|------|------|
| success | Boolean | 请求是否成功 |
| data.dailyStats | Array | 每日统计数据列表 |
| data.dailyStats[].date | String | 日期（YYYY-MM-DD格式） |
| data.dailyStats[].count | Number | 当日完成的番茄钟数量 |
| data.dailyStats[].totalMinutes | Number | 当日专注总分钟数 |
| data.totalStats | Object | 总体统计数据 |
| data.totalStats.totalPomodoros | Number | 总完成番茄钟数量 |
| data.totalStats.totalMinutes | Number | 总专注分钟数 |
| data.totalStats.averageDaily | Number | 日均完成番茄钟数量 |

## 任务统计

### 获取任务统计数据

获取用户的任务完成情况统计数据，包括任务状态分布和优先级分布。

**请求URL：**
```
GET /api/tasks/stats
```

**请求参数：**
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| params | Object | 否 | 查询参数对象 |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "tasksByStatus": [
      {
        "status": "已完成",
        "count": 15
      },
      {
        "status": "进行中",
        "count": 8
      },
      {
        "status": "待开始",
        "count": 5
      }
    ],
    "tasksByPriority": [
      {
        "priority": "高",
        "count": 10
      },
      {
        "priority": "中",
        "count": 12
      },
      {
        "priority": "低",
        "count": 6
      }
    ],
    "totalTasks": 28,
    "completionRate": 53.57
  }
}
```

**响应参数说明：**
| 参数名 | 类型 | 描述 |
|--------|------|------|
| success | Boolean | 请求是否成功 |
| data.tasksByStatus | Array | 按状态分类的任务统计 |
| data.tasksByStatus[].status | String | 任务状态（已完成/进行中/待开始） |
| data.tasksByStatus[].count | Number | 该状态的任务数量 |
| data.tasksByPriority | Array | 按优先级分类的任务统计 |
| data.tasksByPriority[].priority | String | 任务优先级（高/中/低） |
| data.tasksByPriority[].count | Number | 该优先级的任务数量 |
| data.totalTasks | Number | 总任务数量 |
| data.completionRate | Number | 任务完成率（百分比） 