const { PomodoroSettings, PomodoroRecord } = require('../models/Pomodoro');
const { Op } = require('sequelize');

// 获取番茄钟设置
exports.getSettings = async (req, res) => {
    try {
        let settings = await PomodoroSettings.findOne({
            where: { userId: req.user.id }
        });

        // 如果用户没有设置，创建默认设置
        if (!settings) {
            settings = await PomodoroSettings.create({
                userId: req.user.id,
                focusDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                longBreakInterval: 4
            });
        }

        res.json({
            success: true,
            data: {
                focusDuration: settings.focusDuration,
                shortBreakDuration: settings.shortBreakDuration,
                longBreakDuration: settings.longBreakDuration,
                longBreakInterval: settings.longBreakInterval
            }
        });
    } catch (error) {
        console.error('获取番茄钟设置失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '获取番茄钟设置失败'
            }
        });
    }
};

// 保存番茄钟设置
exports.saveSettings = async (req, res) => {
    try {
        console.log('收到保存番茄钟设置请求:', req.body);
        console.log('当前用户ID:', req.user.id);
        
        const { focusDuration, shortBreakDuration, longBreakDuration, longBreakInterval } = req.body;

        // 验证请求数据
        if (!focusDuration || !shortBreakDuration || !longBreakDuration || !longBreakInterval) {
            console.log('数据验证失败，缺少必要参数');
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: '请提供完整的设置参数'
                }
            });
        }

        // 确保数据类型正确
        const settingsData = {
            focusDuration: parseInt(focusDuration),
            shortBreakDuration: parseInt(shortBreakDuration),
            longBreakDuration: parseInt(longBreakDuration),
            longBreakInterval: parseInt(longBreakInterval)
        };

        console.log('处理后的设置数据:', settingsData);

        // 验证数值范围
        if (settingsData.focusDuration < 1 || settingsData.focusDuration > 120) {
            console.log('专注时长验证失败:', settingsData.focusDuration);
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: `专注时长设置无效！当前值：${settingsData.focusDuration}分钟。专注时长必须在1-120分钟之间，建议设置为25-45分钟以获得最佳效果。`
                }
            });
        }

        if (settingsData.shortBreakDuration < 1 || settingsData.shortBreakDuration > 30) {
            console.log('短休息时长验证失败:', settingsData.shortBreakDuration);
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: `短休息时长设置无效！当前值：${settingsData.shortBreakDuration}分钟。短休息时长必须在1-30分钟之间，建议设置为3-10分钟。`
                }
            });
        }

        if (settingsData.longBreakDuration < 1 || settingsData.longBreakDuration > 60) {
            console.log('长休息时长验证失败:', settingsData.longBreakDuration);
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: `长休息时长设置无效！当前值：${settingsData.longBreakDuration}分钟。长休息时长必须在1-60分钟之间，建议设置为15-30分钟。`
                }
            });
        }

        if (settingsData.longBreakInterval < 1 || settingsData.longBreakInterval > 10) {
            console.log('长休息间隔验证失败:', settingsData.longBreakInterval);
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: `长休息间隔设置无效！当前值：${settingsData.longBreakInterval}个番茄钟。长休息间隔必须在1-10个番茄钟之间，建议设置为3-5个番茄钟。`
                }
            });
        }

        console.log('开始查询现有设置...');
        let settings = await PomodoroSettings.findOne({
            where: { userId: req.user.id }
        });

        if (settings) {
            console.log('更新现有设置...');
            // 更新现有设置
            await settings.update(settingsData);
        } else {
            console.log('创建新设置...');
            // 创建新设置
            settings = await PomodoroSettings.create({
                userId: req.user.id,
                ...settingsData
            });
        }

        console.log('设置保存成功:', settings.toJSON());

        res.json({
            success: true,
            data: {
                focusDuration: settings.focusDuration,
                shortBreakDuration: settings.shortBreakDuration,
                longBreakDuration: settings.longBreakDuration,
                longBreakInterval: settings.longBreakInterval
            },
            message: '设置保存成功'
        });
    } catch (error) {
        console.error('保存番茄钟设置失败:', error);
        console.error('错误堆栈:', error.stack);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.errors[0].message
                }
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '保存番茄钟设置失败'
            }
        });
    }
};

// 添加番茄钟记录
exports.addRecord = async (req, res) => {
    try {
        const { type, duration } = req.body;

        // 验证请求数据
        if (!type || !duration) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: '请提供记录类型和持续时间'
                }
            });
        }

        const record = await PomodoroRecord.create({
            type,
            duration,
            completedAt: new Date(),
            userId: req.user.id
        });

        res.status(201).json({
            success: true,
            data: record,
            message: '记录添加成功'
        });
    } catch (error) {
        console.error('添加番茄钟记录失败:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.errors[0].message
                }
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '添加番茄钟记录失败'
            }
        });
    }
};

// 获取番茄钟记录
exports.getRecords = async (req, res) => {
    try {
        const { page = 1, size = 10, type } = req.query;

        // 构建查询条件
        const where = {
            userId: req.user.id
        };

        if (type && type !== 'all') {
            where.type = type;
        }

        // 计算分页
        const offset = (page - 1) * size;
        const limit = parseInt(size);

        // 查询记录
        const { count, rows: records } = await PomodoroRecord.findAndCountAll({
            where,
            offset,
            limit,
            order: [['completedAt', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                records,
                pagination: {
                    page: parseInt(page),
                    size: limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取番茄钟记录失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '获取番茄钟记录失败'
            }
        });
    }
};

// 获取番茄钟统计
exports.getStatistics = async (req, res) => {
    try {
        const { period = 'all' } = req.query;

        // 构建时间范围条件
        let dateCondition = {};
        if (period === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dateCondition = {
                completedAt: {
                    [Op.gte]: today
                }
            };
        } else if (period === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            dateCondition = {
                completedAt: {
                    [Op.gte]: weekAgo
                }
            };
        } else if (period === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            dateCondition = {
                completedAt: {
                    [Op.gte]: monthAgo
                }
            };
        }

        // 查询统计数据
        const where = {
            userId: req.user.id,
            ...dateCondition
        };

        const records = await PomodoroRecord.findAll({ where });

        // 计算统计数据（duration现在是分钟，需要转换为秒供前端使用）
        const completedPomodoros = records.filter(r => r.type === 'focus').length;
        const totalFocusTime = records
            .filter(r => r.type === 'focus')
            .reduce((sum, r) => sum + (r.duration * 60), 0); // 转换为秒
        const totalBreaks = records.filter(r => r.type !== 'focus').length;
        
        // 计算效率（完成的专注时间 / 总时间）
        const totalTime = records.reduce((sum, r) => sum + (r.duration * 60), 0); // 转换为秒
        const efficiency = totalTime > 0 ? Math.round((totalFocusTime / totalTime) * 100) : 0;

        res.json({
            success: true,
            data: {
                completedPomodoros,
                totalFocusTime,
                totalBreaks,
                efficiency,
                period
            }
        });
    } catch (error) {
        console.error('获取番茄钟统计失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '获取番茄钟统计失败'
            }
        });
    }
};

// 删除番茄钟记录
exports.deleteRecord = async (req, res) => {
    try {
        const recordId = req.params.id;

        const record = await PomodoroRecord.findOne({
            where: {
                id: recordId,
                userId: req.user.id
            }
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'RECORD_NOT_FOUND',
                    message: '记录不存在'
                }
            });
        }

        await record.destroy();

        res.json({
            success: true,
            message: '记录删除成功'
        });
    } catch (error) {
        console.error('删除番茄钟记录失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '删除番茄钟记录失败'
            }
        });
    }
}; 