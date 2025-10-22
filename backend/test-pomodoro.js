const { PomodoroSettings } = require('./src/models/Pomodoro');
const sequelize = require('./src/config/database');

async function testPomodoroSettings() {
    try {
        console.log('开始测试番茄钟设置...');
        
        // 测试数据库连接
        await sequelize.authenticate();
        console.log('✅ 数据库连接成功');
        
        // 同步表结构
        await sequelize.sync();
        console.log('✅ 表结构同步成功');
        
        // 检查表是否存在
        const tableExists = await sequelize.getQueryInterface().showAllTables();
        console.log('📋 现有表:', tableExists);
        
        // 检查PomodoroSettings表结构
        const attributes = await sequelize.getQueryInterface().describeTable('PomodoroSettings');
        console.log('📊 PomodoroSettings表结构:', attributes);
        
        // 测试创建设置
        console.log('\n🧪 测试创建设置...');
        const testUserId = 1; // 假设用户ID为1
        
        // 删除已存在的测试数据
        await PomodoroSettings.destroy({
            where: { userId: testUserId }
        });
        
        // 创建新设置
        const newSettings = await PomodoroSettings.create({
            userId: testUserId,
            focusDuration: 30,
            shortBreakDuration: 8,
            longBreakDuration: 20,
            longBreakInterval: 5
        });
        
        console.log('✅ 创建设置成功:', newSettings.toJSON());
        
        // 测试查询设置
        console.log('\n🔍 测试查询设置...');
        const foundSettings = await PomodoroSettings.findOne({
            where: { userId: testUserId }
        });
        
        if (foundSettings) {
            console.log('✅ 查询设置成功:', foundSettings.toJSON());
        } else {
            console.log('❌ 查询设置失败');
        }
        
        // 测试更新设置
        console.log('\n🔄 测试更新设置...');
        await foundSettings.update({
            focusDuration: 45,
            shortBreakDuration: 10
        });
        
        const updatedSettings = await PomodoroSettings.findOne({
            where: { userId: testUserId }
        });
        
        console.log('✅ 更新设置成功:', updatedSettings.toJSON());
        
        // 清理测试数据
        await PomodoroSettings.destroy({
            where: { userId: testUserId }
        });
        console.log('🗑️ 清理测试数据完成');
        
        console.log('\n✅ 所有测试通过！番茄钟设置功能正常');
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
        console.error('错误堆栈:', error.stack);
    } finally {
        await sequelize.close();
    }
}

// 运行测试
testPomodoroSettings(); 