const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: {
      msg: '该用户名已被使用'
    },
    validate: {
      len: {
        args: [3, 20],
        msg: '用户名长度必须在3-20个字符之间'
      },
      is: {
        args: /^[a-zA-Z0-9_]+$/,
        msg: '用户名只能包含字母、数字和下划线'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: '该邮箱已被注册'
    },
    validate: {
      isEmail: {
        msg: '请输入有效的邮箱地址'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255), // 增加字段长度以容纳加密后的密码
    allowNull: false,
    validate: {
      // 只在创建和更新时验证原始密码长度
      isValidPassword(value) {
        // 如果值以 $2a$ 或 $2b$ 开头，说明是已加密的密码，跳过长度验证
        if (value && (value.startsWith('$2a$') || value.startsWith('$2b$'))) {
          return;
        }
        // 对原始密码进行长度验证
        if (!value || value.length < 6 || value.length > 50) {
          throw new Error('密码长度必须在6-50个字符之间');
        }
      }
    }
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// 实例方法：验证密码
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User; 