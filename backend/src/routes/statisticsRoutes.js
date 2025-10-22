const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { protect } = require('../middleware/auth');

// 获取综合统计数据
// GET /api/statistics/overview?period=week&startDate=2024-01-01&endDate=2024-01-31
router.get('/overview', protect, statisticsController.getOverallStats);

// 获取番茄钟图表数据
// GET /api/statistics/pomodoro/chart?period=week
router.get('/pomodoro/chart', protect, statisticsController.getPomodoroChartData);

// 获取任务图表数据
// GET /api/statistics/task/chart?period=week
router.get('/task/chart', protect, statisticsController.getTaskChartData);

// 获取效率分析数据
// GET /api/statistics/efficiency?period=month
router.get('/efficiency', protect, statisticsController.getEfficiencyAnalysis);

module.exports = router; 