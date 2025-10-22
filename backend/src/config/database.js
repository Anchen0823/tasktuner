const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('正在配置数据库连接...');
console.log('数据库名称:', process.env.DB_NAME);
console.log('数据库主机:', process.env.DB_HOST);
console.log('数据库端口:', process.env.DB_PORT);
console.log('数据库用户:', process.env.DB_USER);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: console.log, // 启用SQL查询日志
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // 添加更多连接选项
    dialectOptions: {
      charset: 'utf8mb4',
      // 处理时区问题
      timezone: '+08:00',
      // 处理连接超时
      connectTimeout: 60000,
      // 处理SSL
      ssl: false,
      // 处理外键约束
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    // 时区设置
    timezone: '+08:00',
    // 字符集设置
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    // 外键约束设置
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      // 禁用外键约束检查，避免循环依赖问题
      foreignKeyConstraint: false
    }
  }
);

// 测试数据库连接
sequelize.authenticate()
  .then(() => {
    console.log('数据库连接测试成功');
  })
  .catch(err => {
    console.error('数据库连接测试失败:', err);
    console.error('错误详情:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    });
  });

module.exports = sequelize; 