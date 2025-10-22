const Task = require('../models/Task');
const { PomodoroRecord } = require('../models/Pomodoro');
const Note = require('../models/Note');
const { Op } = require('sequelize');

// 获取综合统计数据
exports.getOverallStats = async (req, res) => {
    try {
        const { period = 'week', startDate, endDate } = req.query;
        const userId = req.user.id;

        // 构建时间范围条件
        const dateCondition = buildDateCondition(period, startDate, endDate);

        // 并行获取各项统计数据
        const [pomodoroStats, taskStats, noteStats, chartData] = await Promise.all([
            getPomodoroStatistics(userId, dateCondition),
            getTaskStatistics(userId, dateCondition),
            getNoteStatistics(userId, dateCondition),
            getChartData(userId, dateCondition, period)
        ]);

        res.json({
            success: true,
            data: {
                period,
                dateRange: getDateRange(period, startDate, endDate),
                overview: {
                    totalPomodoros: pomodoroStats.completedPomodoros,
                    totalFocusTime: pomodoroStats.totalFocusTime,
                    totalTasks: taskStats.totalTasks,
                    completedTasks: taskStats.completedTasks,
                    completionRate: taskStats.completionRate,
                    totalNotes: noteStats.totalNotes,
                    efficiency: pomodoroStats.efficiency
                },
                pomodoroStats,
                taskStats,
                noteStats,
                charts: chartData
            }
        });
    } catch (error) {
        console.error('获取综合统计数据失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '获取统计数据失败'
            }
        });
    }
};

// 获取番茄钟图表数据
exports.getPomodoroChartData = async (req, res) => {
    try {
        const { period = 'week', startDate, endDate } = req.query;
        const userId = req.user.id;
        const dateCondition = buildDateCondition(period, startDate, endDate);

        const chartData = await getPomodoroTrendData(userId, dateCondition, period);

        res.json({
            success: true,
            data: {
                period,
                dailyStats: chartData.dailyStats,
                summary: chartData.summary
            }
        });
    } catch (error) {
        console.error('获取番茄钟图表数据失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '获取番茄钟图表数据失败'
            }
        });
    }
};

// 获取任务图表数据
exports.getTaskChartData = async (req, res) => {
    try {
        const { period = 'week', startDate, endDate } = req.query;
        const userId = req.user.id;
        const dateCondition = buildDateCondition(period, startDate, endDate);

        const chartData = await getTaskDistributionData(userId, dateCondition);

        res.json({
            success: true,
            data: {
                period,
                tasksByStatus: chartData.tasksByStatus,
                tasksByPriority: chartData.tasksByPriority,
                completionTrend: chartData.completionTrend
            }
        });
    } catch (error) {
        console.error('获取任务图表数据失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '获取任务图表数据失败'
            }
        });
    }
};

// 获取效率分析数据
exports.getEfficiencyAnalysis = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const userId = req.user.id;

        const analysis = await getEfficiencyData(userId, period);

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('获取效率分析失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '获取效率分析失败'
            }
        });
    }
};

// 构建日期条件
function buildDateCondition(period, startDate, endDate) {
    if (startDate && endDate) {
        return {
            createdAt: {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            }
        };
    }

    const now = new Date();
    let start = new Date();

    switch (period) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;
        case 'week':
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            break;
        case 'month':
            start.setDate(now.getDate() - 29); // 近30天
            start.setHours(0, 0, 0, 0);
            break;
        case 'quarter':
            start.setDate(now.getDate() - 89); // 近90天
            start.setHours(0, 0, 0, 0);
            break;
        case 'year':
            start.setDate(now.getDate() - 364); // 近365天
            start.setHours(0, 0, 0, 0);
            break;
        default:
            return {};
    }

    return {
        createdAt: {
            [Op.gte]: start
        }
    };
}

// 获取番茄钟统计数据
async function getPomodoroStatistics(userId, dateCondition) {
    const where = { userId, ...dateCondition };
    
    // 如果是查询completedAt字段，需要调整
    if (dateCondition.createdAt) {
        where.completedAt = dateCondition.createdAt;
        delete where.createdAt;
    }

    const records = await PomodoroRecord.findAll({ where });

    const focusRecords = records.filter(r => r.type === 'focus');
    const breakRecords = records.filter(r => r.type !== 'focus');

    const completedPomodoros = focusRecords.length;
    const totalFocusTime = focusRecords.reduce((sum, r) => sum + (r.duration * 60), 0); // 转换为秒
    const totalBreaks = breakRecords.length;
    const totalTime = records.reduce((sum, r) => sum + (r.duration * 60), 0); // 转换为秒
    const efficiency = totalTime > 0 ? Math.round((totalFocusTime / totalTime) * 100) : 0;

    return {
        completedPomodoros,
        totalFocusTime,
        totalBreaks,
        efficiency,
        averageFocusTime: completedPomodoros > 0 ? Math.round(totalFocusTime / completedPomodoros) : 0,
        totalSessions: records.length
    };
}

// 获取任务统计数据
async function getTaskStatistics(userId, dateCondition) {
    const where = { userId, ...dateCondition };
    
    const tasks = await Task.findAll({ where });
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 按优先级统计
    const priorityStats = {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
    };

    // 按状态统计
    const statusStats = {
        completed: completedTasks,
        pending: pendingTasks
    };

    return {
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate,
        priorityStats,
        statusStats
    };
}

// 获取笔记统计数据
async function getNoteStatistics(userId, dateCondition) {
    const where = { authorId: userId, ...dateCondition };
    
    const notes = await Note.findAll({ where });
    
    const totalNotes = notes.length;
    const publishedNotes = notes.filter(n => n.isPublished).length;
    const draftNotes = totalNotes - publishedNotes;
    
    return {
        totalNotes,
        publishedNotes,
        draftNotes,
        totalWords: notes.reduce((sum, n) => sum + (n.content?.length || 0), 0)
    };
}

// 获取图表数据
async function getChartData(userId, dateCondition, period) {
    const pomodoroTrend = await getPomodoroTrendData(userId, dateCondition, period);
    const taskDistribution = await getTaskDistributionData(userId, dateCondition);
    
    return {
        pomodoroTrend: pomodoroTrend.dailyStats,
        taskDistribution: taskDistribution.tasksByStatus
    };
}

// 获取番茄钟趋势数据
async function getPomodoroTrendData(userId, dateCondition, period) {
    const where = { userId };
    
    if (dateCondition.createdAt) {
        where.completedAt = dateCondition.createdAt;
    }

    const records = await PomodoroRecord.findAll({ 
        where,
        order: [['completedAt', 'ASC']]
    });

    // 按日期分组统计
    const dailyStats = {};
    const dates = generateDateRange(period);

    // 初始化所有日期
    dates.forEach(date => {
        dailyStats[date] = {
            date,
            count: 0,
            focusTime: 0,
            breakTime: 0,
            sessions: 0
        };
    });

    // 填充实际数据
    records.forEach(record => {
        const date = new Date(record.completedAt).toISOString().split('T')[0];
        if (dailyStats[date]) {
            dailyStats[date].sessions++;
            if (record.type === 'focus') {
                dailyStats[date].count++;
                dailyStats[date].focusTime += (record.duration * 60); // 转换为秒
            } else {
                dailyStats[date].breakTime += (record.duration * 60); // 转换为秒
            }
        }
    });

    const dailyArray = Object.values(dailyStats);
    
    return {
        dailyStats: dailyArray,
        summary: {
            totalSessions: records.length,
            totalFocusTime: records.filter(r => r.type === 'focus').reduce((sum, r) => sum + (r.duration * 60), 0), // 转换为秒
            averageDaily: dailyArray.length > 0 ? Math.round(dailyArray.reduce((sum, d) => sum + d.count, 0) / dailyArray.length) : 0
        }
    };
}

// 获取任务分布数据
async function getTaskDistributionData(userId, dateCondition) {
    const where = { userId, ...dateCondition };
    
    const tasks = await Task.findAll({ where });
    
    // 辅助函数：判断任务是否逾期
    const isTaskOverdue = (task) => {
        if (!task.deadline) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 设置为今天的开始时间（00:00:00）
        const taskDeadline = new Date(task.deadline);
        taskDeadline.setHours(0, 0, 0, 0); // 设置为截止日期的开始时间
        // 只有截止日期在今天之前才算逾期，今天截止的不算逾期
        return taskDeadline < today && !task.completed;
    };

    // 按状态分布（基于创建时间范围内的任务）
    const completedTasks = tasks.filter(t => t.completed);
    const overdueTasks = tasks.filter(t => isTaskOverdue(t));
    const inProgressTasks = tasks.filter(t => !t.completed && !isTaskOverdue(t));

    const tasksByStatus = [
        { name: '已完成', value: completedTasks.length, color: '#4CAF50' },
        { name: '进行中', value: inProgressTasks.length, color: '#2196F3' },
        { name: '已逾期', value: overdueTasks.length, color: '#F44336' }
    ];

    // 按优先级分布
    const tasksByPriority = [
        { name: '高优先级', value: tasks.filter(t => t.priority === 'high').length, color: '#F44336' },
        { name: '中优先级', value: tasks.filter(t => t.priority === 'medium').length, color: '#FF9800' },
        { name: '低优先级', value: tasks.filter(t => t.priority === 'low').length, color: '#4CAF50' }
    ];

    // 完成趋势（按日期）
    const completionTrend = getCompletionTrend(tasks);

    console.log('📊 任务分布数据:', {
        总任务: tasks.length,
        已完成: completedTasks.length,
        进行中: inProgressTasks.length,
        已逾期: overdueTasks.length,
        状态分布: tasksByStatus
    });

    return {
        tasksByStatus,
        tasksByPriority,
        completionTrend
    };
}

// 获取效率数据
async function getEfficiencyData(userId, period) {
    const dateCondition = buildDateCondition(period);
    const where = { userId };
    
    if (dateCondition.createdAt) {
        where.completedAt = dateCondition.createdAt;
    }

    const pomodoroRecords = await PomodoroRecord.findAll({ where });
    const taskWhere = { userId, ...dateCondition };
    const tasks = await Task.findAll({ where: taskWhere });

    // 计算各项效率指标
    const focusRecords = pomodoroRecords.filter(r => r.type === 'focus');
    const totalFocusTime = focusRecords.reduce((sum, r) => sum + (r.duration * 60), 0); // 转换为秒
    const completedTasks = tasks.filter(t => t.completed);
    
    // 效率指标
    const efficiency = {
        focusEfficiency: calculateFocusEfficiency(pomodoroRecords),
        taskCompletionRate: tasks.length > 0 ? (completedTasks.length / tasks.length * 100) : 0,
        averageTaskTime: completedTasks.length > 0 ? (totalFocusTime / completedTasks.length) : 0,
        productivityScore: calculateProductivityScore(pomodoroRecords, tasks),
        weeklyTrend: await getWeeklyEfficiencyTrend(userId)
    };

    return efficiency;
}

// 辅助函数
function isOverdue(task) {
    if (!task.deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 设置为今天的开始时间（00:00:00）
    const taskDeadline = new Date(task.deadline);
    taskDeadline.setHours(0, 0, 0, 0); // 设置为截止日期的开始时间
    // 只有截止日期在今天之前才算逾期，今天截止的不算逾期
    return taskDeadline < today && !task.completed;
}

function generateDateRange(period) {
    const dates = [];
    const end = new Date();
    const start = new Date();
    
    switch (period) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;
        case 'week':
            start.setDate(end.getDate() - 6);
            break;
        case 'month':
            start.setDate(end.getDate() - 29); // 近30天
            break;
        case 'quarter':
            start.setDate(end.getDate() - 89); // 近90天
            break;
        case 'year':
            start.setDate(end.getDate() - 364); // 近365天
            break;
        default:
            start.setDate(end.getDate() - 6);
    }

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
    }
    
    return dates;
}

function getCompletionTrend(tasks) {
    const completedTasks = tasks.filter(t => t.completed);
    const trendData = {};
    
    completedTasks.forEach(task => {
        const date = new Date(task.updatedAt).toISOString().split('T')[0];
        trendData[date] = (trendData[date] || 0) + 1;
    });
    
    return Object.entries(trendData).map(([date, count]) => ({ date, count }));
}

function calculateFocusEfficiency(records) {
    const focusTime = records.filter(r => r.type === 'focus').reduce((sum, r) => sum + (r.duration * 60), 0); // 转换为秒
    const totalTime = records.reduce((sum, r) => sum + (r.duration * 60), 0); // 转换为秒
    return totalTime > 0 ? (focusTime / totalTime * 100) : 0;
}

function calculateProductivityScore(pomodoroRecords, tasks) {
    const focusHours = pomodoroRecords.filter(r => r.type === 'focus').reduce((sum, r) => sum + (r.duration * 60), 0) / 3600; // 转换为秒再计算小时
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    
    if (focusHours === 0 && totalTasks === 0) return 0;
    
    // 综合评分：专注时长 * 0.6 + 完成率 * 0.4
    const focusScore = Math.min(focusHours * 10, 100); // 每小时10分，最高100分
    const completionScore = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;
    
    return Math.round(focusScore * 0.6 + completionScore * 0.4);
}

async function getWeeklyEfficiencyTrend(userId) {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
        const end = new Date();
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        
        const dateCondition = {
            completedAt: {
                [Op.between]: [start, end]
            }
        };
        
        const records = await PomodoroRecord.findAll({
            where: { userId, ...dateCondition }
        });
        
        weeks.push({
            week: `第${4-i}周`,
            efficiency: calculateFocusEfficiency(records)
        });
    }
    
    return weeks;
}

function getDateRange(period, startDate, endDate) {
    if (startDate && endDate) {
        return {
            start: startDate,
            end: endDate
        };
    }
    
    const end = new Date();
    const start = new Date();
    
    switch (period) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;
        case 'week':
            start.setDate(end.getDate() - 6);
            break;
        case 'month':
            start.setDate(end.getDate() - 29); // 近30天
            break;
        case 'quarter':
            start.setDate(end.getDate() - 89); // 近90天
            break;
        case 'year':
            start.setDate(end.getDate() - 364); // 近365天
            break;
    }
    
    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
} 