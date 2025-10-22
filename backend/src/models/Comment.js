const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Note = require('./Note');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  replyTo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  noteId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'comments'
});

// 只建立模型关联，不生成数据库外键约束
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author', constraints: false });
User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments', constraints: false });

Comment.belongsTo(Note, { foreignKey: 'noteId', as: 'note', constraints: false });
Note.hasMany(Comment, { foreignKey: 'noteId', as: 'comments', constraints: false });

// 父子评论自关联
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies', constraints: false });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent', constraints: false });

module.exports = Comment; 