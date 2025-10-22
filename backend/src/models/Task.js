const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: '任务标题不能为空'
            },
            len: {
                args: [1, 100],
                msg: '任务标题长度必须在1-100个字符之间'
            }
        }
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: {
                args: [0, 500],
                msg: '任务描述长度不能超过500个字符'
            }
        }
    },
    priority: {
        type: DataTypes.ENUM('high', 'medium', 'low'),
        allowNull: false,
        defaultValue: 'medium',
        validate: {
            isIn: {
                args: [['high', 'medium', 'low']],
                msg: '优先级必须是 high、medium 或 low'
            }
        }
    },
    completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: {
                msg: '截止日期格式不正确'
            }
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    }
}, {
    timestamps: true, // 启用 createdAt 和 updatedAt
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['completed']
        },
        {
            fields: ['priority']
        }
    ]
});

// 建立与User模型的关联关系
Task.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

User.hasMany(Task, {
    foreignKey: 'userId',
    as: 'tasks'
});

module.exports = Task; 