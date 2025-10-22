const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const pomodoroRoutes = require('./routes/pomodoroRoutes');
const noteRoutes = require('./routes/noteRoutes');
const commentRoutes = require('./routes/commentRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const User = require('./models/User');
const Task = require('./models/Task');
const { PomodoroSettings, PomodoroRecord } = require('./models/Pomodoro');

// 加载环境变量
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);
// 确保 /api/tasks/stats 能被正确匹配
app.use('/api/tasks', taskRoutes);
app.use('/api/pomodoro', pomodoroRoutes);

// 用户笔记专用路由（必须在通用笔记路由之前）
const { protect } = require('./middleware/auth');
const noteController = require('./controllers/noteController');

// 获取当前用户的笔记
app.get('/api/users/me/notes', protect, noteController.getUserNotes);
// 创建当前用户的笔记
app.post('/api/users/me/notes', protect, noteController.createNote);
// 更新当前用户的笔记
app.put('/api/users/me/notes/:id', protect, noteController.updateNote);
// 删除当前用户的笔记
app.delete('/api/users/me/notes/:id', protect, noteController.deleteNote);
// 发布/取消发布当前用户的笔记
app.patch('/api/users/me/notes/:id/publish', protect, noteController.togglePublishStatus);

app.use('/api/notes', noteRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api', commentRoutes);

// 添加404处理
app.use((req, res, next) => {
  console.log('404 - 未找到路由:', req.method, req.url);
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '请求的资源不存在'
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('=== 错误详情 ===');
  console.error('请求URL:', req.url);
  console.error('请求方法:', req.method);
  console.error('请求体:', req.body);
  console.error('错误名称:', err.name);
  console.error('错误消息:', err.message);
  console.error('错误堆栈:', err.stack);
  console.error('================');

  // Sequelize验证错误
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.errors[0].message
      }
    });
  }

  // Sequelize唯一约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'UNIQUE_CONSTRAINT_ERROR',
        message: err.errors[0].message
      }
    });
  }

  // Sequelize连接错误
  if (err.name === 'SequelizeConnectionError') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: '数据库连接失败'
      }
    });
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '无效的认证令牌'
      }
    });
  }

  // 默认服务器错误
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: err.message || '服务器错误'
    }
  });
});

// 数据库连接和服务器启动
const PORT = process.env.PORT || 8081;

async function startServer() {
  try {
    // 先测试数据库连接
    console.log('测试数据库连接...');
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 同步数据库模型（不强制重建，避免外键问题）
    console.log('开始同步数据库模型...');
    await sequelize.sync({ 
      force: false, // 改为false，不强制重建表
      alter: true   // 使用alter模式，保留现有数据
    });
    console.log('数据库模型同步成功');

    // 检查表是否创建成功
    try {
      const userTableInfo = await sequelize.getQueryInterface().describeTable('Users');
      console.log('User表结构:', Object.keys(userTableInfo));
    } catch (error) {
      console.error('检查User表失败:', error.message);
    }

    try {
      const taskTableInfo = await sequelize.getQueryInterface().describeTable('Tasks');
      console.log('Task表结构:', Object.keys(taskTableInfo));
    } catch (error) {
      console.error('检查Task表失败:', error.message);
    }

    try {
      const pomodoroSettingsTableInfo = await sequelize.getQueryInterface().describeTable('PomodoroSettings');
      console.log('PomodoroSettings表结构:', Object.keys(pomodoroSettingsTableInfo));
    } catch (error) {
      console.error('检查PomodoroSettings表失败:', error.message);
    }

    try {
      const pomodoroRecordsTableInfo = await sequelize.getQueryInterface().describeTable('PomodoroRecords');
      console.log('PomodoroRecords表结构:', Object.keys(pomodoroRecordsTableInfo));
    } catch (error) {
      console.error('检查PomodoroRecords表失败:', error.message);
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`API地址: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('无法启动服务器:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    process.exit(1);
  }
}

startServer(); 