const { PomodoroSettings, PomodoroRecord } = require('./src/models/Pomodoro');
const User = require('./src/models/User');
const sequelize = require('./src/config/database');

async function generateTestData() {
    try {
        console.log('🔄 开始生成番茄钟测试数据...');
        
        // 连接数据库
        await sequelize.authenticate();
        console.log('✅ 数据库连接成功');
        
        // 查找用户
        const userEmail = 'anchen0823@qq.com';
        const user = await User.findOne({ where: { email: userEmail } });
        
        if (!user) {
            console.error('❌ 未找到用户:', userEmail);
            console.log('请确保该用户已注册，或者先注册该账号');
            return;
        }
        
        console.log('👤 找到用户:', user.email, '(ID:', user.id, ')');
        
        // 清空现有的番茄钟数据
        console.log('🗑️ 清空现有番茄钟数据...');
        await PomodoroRecord.destroy({ where: { userId: user.id } });
        await PomodoroSettings.destroy({ where: { userId: user.id } });
        console.log('✅ 清空完成');
        
        // 创建番茄钟设置
        console.log('⚙️ 创建番茄钟设置...');
        const settings = await PomodoroSettings.create({
            userId: user.id,
            focusDuration: 25,      // 25分钟
            shortBreakDuration: 5,  // 5分钟
            longBreakDuration: 15,  // 15分钟
            longBreakInterval: 4    // 4个番茄钟后长休息
        });
        console.log('✅ 设置创建完成');
        
        // 生成测试记录
        console.log('📊 生成测试记录...');
        const testRecords = [];
        
        // 生成最近7天的数据
        for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
            const baseDate = new Date();
            baseDate.setDate(baseDate.getDate() - dayOffset);
            baseDate.setHours(9, 0, 0, 0); // 从早上9点开始
            
            // 每天生成3-6个番茄钟
            const dailyPomodoros = Math.floor(Math.random() * 4) + 3; // 3-6个
            
            for (let i = 0; i < dailyPomodoros; i++) {
                // 专注时间 (20-30分钟)
                const focusDuration = Math.floor(Math.random() * 11) + 20; // 20-30分钟
                const focusTime = new Date(baseDate);
                focusTime.setMinutes(focusTime.getMinutes() + i * 40); // 每40分钟一个周期
                
                testRecords.push({
                    type: 'focus',
                    duration: focusDuration,
                    completedAt: focusTime,
                    userId: user.id
                });
                
                // 短休息 (3-8分钟)
                if (i < dailyPomodoros - 1) { // 最后一个番茄钟后不加休息
                    const breakDuration = Math.floor(Math.random() * 6) + 3; // 3-8分钟
                    const breakTime = new Date(focusTime);
                    breakTime.setMinutes(breakTime.getMinutes() + focusDuration + 1);
                    
                    // 每4个番茄钟后是长休息
                    const isLongBreak = (i + 1) % 4 === 0;
                    
                    testRecords.push({
                        type: isLongBreak ? 'longBreak' : 'shortBreak',
                        duration: isLongBreak ? Math.floor(Math.random() * 6) + 12 : breakDuration, // 长休息12-17分钟
                        completedAt: breakTime,
                        userId: user.id
                    });
                }
            }
        }
        
        // 批量创建记录
        await PomodoroRecord.bulkCreate(testRecords);
        console.log(`✅ 创建了 ${testRecords.length} 条记录`);
        
        // 统计生成的数据
        const focusRecords = testRecords.filter(r => r.type === 'focus');
        const totalFocusMinutes = focusRecords.reduce((sum, r) => sum + r.duration, 0);
        const totalFocusHours = Math.floor(totalFocusMinutes / 60);
        const remainingMinutes = totalFocusMinutes % 60;
        
        console.log('\n📈 测试数据统计:');
        console.log(`👤 用户: ${user.email}`);
        console.log(`🍅 总番茄钟数: ${focusRecords.length}`);
        console.log(`⏰ 总专注时间: ${totalFocusHours}小时${remainingMinutes}分`);
        console.log(`📅 时间跨度: 最近7天`);
        console.log(`🔧 设置: 专注${settings.focusDuration}分钟, 短休息${settings.shortBreakDuration}分钟, 长休息${settings.longBreakDuration}分钟`);
        
        console.log('\n🎉 测试数据生成完成！');
        console.log('💡 提示: 您现在可以登录系统查看番茄钟统计和历史记录');
        
    } catch (error) {
        console.error('❌ 生成测试数据失败:', error);
        console.error('错误详情:', error.message);
    } finally {
        await sequelize.close();
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    generateTestData();
}

module.exports = generateTestData; 