const Task = require('../models/Task');
const { Op } = require('sequelize');

// 获取任务列表
exports.getTasks = async (req, res) => {
    try {
        const {
            page = 1,
            size = 10,
            status = 'all',
            priority = 'all',
            keyword = ''
        } = req.query;

        // 构建查询条件
        const where = {
            userId: req.user.id
        };

        // 根据状态筛选
        if (status !== 'all') {
            where.completed = status === 'completed';
        }

        // 根据优先级筛选
        if (priority !== 'all') {
            where.priority = priority;
        }

        // 根据关键词搜索
        if (keyword) {
            where[Op.or] = [
                { title: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } }
            ];
        }

        // 计算分页
        const offset = (page - 1) * size;
        const limit = parseInt(size);

        // 查询任务
        const { count, rows: tasks } = await Task.findAndCountAll({
            where,
            offset,
            limit,
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['userId'] }
        });

        res.json({
            success: true,
            data: {
                tasks,
                pagination: {
                    page: parseInt(page),
                    size: limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取任务列表失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '获取任务列表失败'
            }
        });
    }
};

// 获取单个任务
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TASK_NOT_FOUND',
                    message: '任务不存在'
                }
            });
        }

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('获取任务详情失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '获取任务详情失败'
            }
        });
    }
};

// 创建任务
exports.createTask = async (req, res) => {
    try {
        const { title, description, priority, completed, deadline } = req.body;

        const task = await Task.create({
            title,
            description,
            priority,
            completed: completed || false,
            deadline,
            userId: req.user.id
        });

        res.status(201).json({
            success: true,
            data: task,
            message: '任务创建成功'
        });
    } catch (error) {
        console.error('创建任务失败:', error);
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
                message: '创建任务失败'
            }
        });
    }
};

// 更新任务
exports.updateTask = async (req, res) => {
    try {
        const { title, description, priority, completed, deadline } = req.body;
        const taskId = req.params.id;

        const task = await Task.findOne({
            where: {
                id: taskId,
                userId: req.user.id
            }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TASK_NOT_FOUND',
                    message: '任务不存在'
                }
            });
        }

        await task.update({
            title,
            description,
            priority,
            completed,
            deadline
        });

        res.json({
            success: true,
            data: task,
            message: '任务更新成功'
        });
    } catch (error) {
        console.error('更新任务失败:', error);
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
                message: '更新任务失败'
            }
        });
    }
};

// 删除任务
exports.deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const task = await Task.findOne({
            where: {
                id: taskId,
                userId: req.user.id
            }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TASK_NOT_FOUND',
                    message: '任务不存在'
                }
            });
        }

        await task.destroy();

        res.json({
            success: true,
            message: '任务删除成功'
        });
    } catch (error) {
        console.error('删除任务失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '删除任务失败'
            }
        });
    }
};

// 切换任务状态
exports.toggleTaskStatus = async (req, res) => {
    try {
        const taskId = req.params.id;
        const task = await Task.findOne({
            where: {
                id: taskId,
                userId: req.user.id
            }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TASK_NOT_FOUND',
                    message: '任务不存在'
                }
            });
        }

        await task.update({
            completed: !task.completed
        });

        res.json({
            success: true,
            data: task,
            message: `任务已${task.completed ? '完成' : '取消完成'}`
        });
    } catch (error) {
        console.error('切换任务状态失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: '切换任务状态失败'
            }
        });
    }
};

// 任务统计接口
exports.getTaskStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { range = 'week' } = req.query;
        
        // 计算时间范围
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let startDate = new Date(today);
        
        switch(range) {
            case 'today':
                // 今天：从今天0点开始
                break;
            case 'week':
                startDate.setDate(today.getDate() - 6); // 近7天
                break;
            case 'month':
                startDate.setDate(today.getDate() - 29); // 近30天
                break;
            case 'quarter':
                startDate.setDate(today.getDate() - 89); // 近90天
                break;
            case 'year':
                startDate.setDate(today.getDate() - 364); // 近365天
                break;
        }

        // 查询指定时间范围内创建的任务
        const tasks = await Task.findAll({ 
            where: { 
                userId,
                createdAt: { [Op.gte]: startDate }
            } 
        });

        // 辅助函数：判断任务是否逾期
        const isOverdue = (task) => {
            if (!task.deadline) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0); // 设置为今天的开始时间（00:00:00）
            const taskDeadline = new Date(task.deadline);
            taskDeadline.setHours(0, 0, 0, 0); // 设置为截止日期的开始时间
            // 只有截止日期在今天之前才算逾期，今天截止的不算逾期
            return taskDeadline < today && !task.completed;
        };

        // 按状态统计（基于创建时间范围内的任务）
        const completedTasks = tasks.filter(t => t.completed);
        const overdueTasks = tasks.filter(t => isOverdue(t));
        const inProgressTasks = tasks.filter(t => !t.completed && !isOverdue(t));

        const tasksByStatus = [
            { status: '已完成', count: completedTasks.length },
            { status: '进行中', count: inProgressTasks.length },
            { status: '已逾期', count: overdueTasks.length }
        ];

        // 按优先级统计
        const priorities = ['high', 'medium', 'low'];
        const priorityLabels = {
            'high': '高',
            'medium': '中',
            'low': '低'
        };
        const tasksByPriority = priorities.map(priority => ({
            priority: priorityLabels[priority],
            count: tasks.filter(t => t.priority === priority).length
        }));

        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks * 100).toFixed(2) : 0;

        console.log('📋 任务统计数据:', {
            时间范围: range,
            开始日期: startDate.toISOString().split('T')[0],
            结束日期: today.toISOString().split('T')[0],
            总任务: totalTasks,
            已完成: completedTasks.length,
            进行中: inProgressTasks.length,
            已逾期: overdueTasks.length,
            完成率: completionRate + '%'
        });

        res.json({
            success: true,
            data: {
                tasksByStatus,
                tasksByPriority,
                totalTasks,
                completedTasks: completedTasks.length,
                inProgressTasks: inProgressTasks.length,
                overdueTasks: overdueTasks.length,
                completionRate: parseFloat(completionRate)
            }
        });
    } catch (error) {
        console.error('获取任务统计失败:', error);
        res.status(500).json({ 
            success: false, 
            error: {
                code: 'SERVER_ERROR',
                message: '获取任务统计失败'
            }
        });
    }
}; 