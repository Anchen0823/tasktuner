const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

// 番茄钟设置模型
const PomodoroSettings = sequelize.define('PomodoroSettings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    focusDuration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 25,
        validate: {
            min: {
                args: [1],
                msg: '专注时长不能少于1分钟'
            },
            max: {
                args: [120],
                msg: '专注时长不能超过120分钟'
            }
        }
    },
    shortBreakDuration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
            min: {
                args: [1],
                msg: '短休息时长不能少于1分钟'
            },
            max: {
                args: [30],
                msg: '短休息时长不能超过30分钟'
            }
        }
    },
    longBreakDuration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 15,
        validate: {
            min: {
                args: [1],
                msg: '长休息时长不能少于1分钟'
            },
            max: {
                args: [60],
                msg: '长休息时长不能超过60分钟'
            }
        }
    },
    longBreakInterval: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4,
        validate: {
            min: {
                args: [1],
                msg: '长休息间隔不能少于1个番茄钟'
            },
            max: {
                args: [10],
                msg: '长休息间隔不能超过10个番茄钟'
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
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId']
        }
    ]
});

// 番茄钟记录模型
const PomodoroRecord = sequelize.define('PomodoroRecord', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.ENUM('focus', 'shortBreak', 'longBreak'),
        allowNull: false,
        validate: {
            isIn: {
                args: [['focus', 'shortBreak', 'longBreak']],
                msg: '记录类型必须是 focus、shortBreak 或 longBreak'
            }
        }
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: {
                args: [1],
                msg: '持续时间不能少于1分钟'
            },
            max: {
                args: [600],
                msg: '持续时间不能超过600分钟'
            }
        }
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
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
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['type']
        },
        {
            fields: ['completedAt']
        }
    ]
});

// 建立关联关系
PomodoroSettings.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

User.hasOne(PomodoroSettings, {
    foreignKey: 'userId',
    as: 'pomodoroSettings'
});

PomodoroRecord.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

User.hasMany(PomodoroRecord, {
    foreignKey: 'userId',
    as: 'pomodoroRecords'
});

module.exports = {
    PomodoroSettings,
    PomodoroRecord
}; 