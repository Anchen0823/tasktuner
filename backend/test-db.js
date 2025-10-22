const sequelize = require('./src/config/database');
const User = require('./src/models/User');

async function testDatabase() {
  try {
    console.log('测试数据库连接...');
    
    // 测试连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 测试表是否存在
    const userTableInfo = await sequelize.getQueryInterface().describeTable('Users');
    console.log('✅ Users表存在，字段:', Object.keys(userTableInfo));
    
    // 测试查询
    const userCount = await User.count();
    console.log('✅ 数据库查询正常，用户数量:', userCount);
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error.message);
    console.error('错误详情:', {
      name: error.name,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  } finally {
    process.exit(0);
  }
}

testDatabase(); 