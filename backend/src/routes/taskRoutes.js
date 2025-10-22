const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// 所有任务路由都需要认证
router.use(protect);

// 任务统计（必须在具体ID路由之前）
router.get('/stats', taskController.getTaskStats);

// 获取任务列表
router.get('/', taskController.getTasks);

// 创建新任务
router.post('/', taskController.createTask);

// 获取单个任务
router.get('/:id', taskController.getTask);

// 更新任务
router.put('/:id', taskController.updateTask);

// 删除任务
router.delete('/:id', taskController.deleteTask);

// 切换任务状态
router.patch('/:id/toggle', taskController.toggleTaskStatus);

module.exports = router; 