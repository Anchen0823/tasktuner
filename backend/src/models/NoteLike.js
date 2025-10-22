const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Note = require('./Note');

const NoteLike = sequelize.define('NoteLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  noteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Note,
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'note_likes',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'noteId'] // 确保一个用户只能对一个笔记点赞一次
    }
  ]
});

// 建立关联关系
NoteLike.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });
NoteLike.belongsTo(Note, { foreignKey: 'noteId', as: 'note', constraints: false });

module.exports = NoteLike; 