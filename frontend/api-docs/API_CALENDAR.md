# 日历视图功能说明

## 概述

日历视图提供了按日期查看和管理任务的功能，支持按截止日期筛选任务，并提供日历网格显示。目前所有功能都在前端实现，不依赖后端 API。

## 功能特性

### 1. 日历导航
- 查看当前月份任务
- 切换上一月/下一月
- 支持月视图和周视图切换

### 2. 日期显示
- 显示当前月份的所有日期
- 高亮显示今天
- 显示上月和下月的部分日期
- 标记有任务的日期

### 3. 任务管理
- 查看选定日期的任务列表
- 显示任务详细信息（标题、描述、优先级等）
- 支持任务的完成状态切换
- 支持任务的编辑和删除

## 组件使用说明

### CalendarView 组件

**属性 (Props)**:
```javascript
{
  tasks: {
    type: Array,
    default: () => []
  }
}
```

**事件 (Events)**:
```javascript
{
  'toggle-task': (taskId) => void,
  'edit-task': (task) => void,
  'delete-task': (taskId) => void
}
```

### 示例代码

```vue
<template>
  <CalendarView 
    :tasks="tasks"
    @toggle-task="handleToggleTask"
    @edit-task="handleEditTask"
    @delete-task="handleDeleteTask"
  />
</template>

<script>
import { ref } from 'vue'
import CalendarView from './components/CalendarView.vue'

export default {
  components: {
    CalendarView
  },
  setup() {
    const tasks = ref([
      {
        id: 1,
        title: '完成项目文档',
        description: '编写项目技术文档和用户手册',
        priority: 'high',
        completed: false,
        createdAt: '2024-01-15T00:00:00.000Z',
        deadline: '2024-01-20T00:00:00.000Z'
      }
    ])

    const handleToggleTask = (taskId) => {
      // 处理任务状态切换
    }

    const handleEditTask = (task) => {
      // 处理任务编辑
    }

    const handleDeleteTask = (taskId) => {
      // 处理任务删除
    }

    return {
      tasks,
      handleToggleTask,
      handleEditTask,
      handleDeleteTask
    }
  }
}
</script>
```

## 样式说明

组件使用了响应式设计，主要样式特点：

1. 日历网格布局
   - 使用 CSS Grid 实现 7x6 的日历网格
   - 自适应宽度，保持正方形日期格子

2. 视觉效果
   - 渐变色按钮和选中效果
   - 任务数量指示器
   - 悬浮动画效果

3. 响应式设计
   - 适配移动设备
   - 在小屏幕上优化布局和间距

4. 任务展示
   - 不同优先级使用不同颜色标识
   - 已完成任务特殊样式
   - 任务卡片悬浮效果

## 注意事项

1. 所有数据操作都在前端进行，需要父组件管理任务数据
2. 日期使用本地时区
3. 任务数据需要包含必要的字段（id, title, description, priority, completed, createdAt, deadline）
4. 组件会触发相应事件，需要父组件处理具体的数据更新逻辑 