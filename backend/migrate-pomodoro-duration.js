const { PomodoroRecord } = require('./src/models/Pomodoro');
const sequelize = require('./src/config/database');

async function migratePomodoroRecords() {
    try {
        console.log('开始迁移番茄钟记录...');
        
        // 连接数据库
        await sequelize.authenticate();
        console.log('数据库连接成功');
        
        // 查询所有需要迁移的记录（duration > 600 说明是以秒为单位存储的）
        const records = await PomodoroRecord.findAll({
            where: {
                duration: {
                    [require('sequelize').Op.gt]: 600  // 大于600的duration应该是以秒为单位的
                }
            }
        });
        
        console.log(`找到 ${records.length} 条需要迁移的记录`);
        
        if (records.length === 0) {
            console.log('没有需要迁移的记录');
            return;
        }
        
        // 批量更新
        for (const record of records) {
            const newDuration = Math.ceil(record.duration / 60); // 转换为分钟并向上取整
            await record.update({ duration: newDuration });
            console.log(`记录 ${record.id}: ${record.duration}秒 -> ${newDuration}分钟`);
        }
        
        console.log('迁移完成！');
        
    } catch (error) {
        console.error('迁移失败:', error);
    } finally {
        await sequelize.close();
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    migratePomodoroRecords();
}

module.exports = migratePomodoroRecords; 