const express = require('express');
const router = express.Router();
const pomodoroController = require('../controllers/pomodoroController');
const { protect } = require('../middleware/auth');

// 所有番茄钟路由都需要认证
router.use(protect);

// 设置相关路由
router.get('/settings', pomodoroController.getSettings);
router.post('/settings', pomodoroController.saveSettings);

// 记录相关路由
router.post('/records', pomodoroController.addRecord);
router.get('/records', pomodoroController.getRecords);
router.delete('/records/:id', pomodoroController.deleteRecord);

// 统计相关路由
router.get('/statistics', pomodoroController.getStatistics);

module.exports = router; 