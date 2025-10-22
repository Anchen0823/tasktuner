const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op } = require('sequelize');

// 生成JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// 用户注册
exports.register = async (req, res) => {
  try {
    console.log('收到注册请求，请求体:', req.body);
    const { username, email, password } = req.body;

    // 验证请求数据
    if (!username || !email || !password) {
      console.log('注册数据不完整:', { username, email, password: '***' });
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '请提供用户名、邮箱和密码'
        }
      });
    }

    // 检查用户是否已存在
    console.log('检查用户是否存在...');
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      console.log('用户已存在:', existingUser.email);
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: '用户名或邮箱已被使用'
        }
      });
    }

    console.log('开始创建新用户...');
    // 创建新用户
    const user = await User.create({
      username,
      email,
      password
    });

    console.log('用户创建成功:', user.email);

    // 生成token
    const token = generateToken(user);

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    console.log('注册成功，返回响应');
    res.status(201).json({
      success: true,
      data: {
        token,
        user: userResponse
      },
      message: '注册成功'
    });
  } catch (error) {
    console.error('注册过程中发生错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || '服务器错误'
      }
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 支持用户名或邮箱登录
    const loginField = email || username;
    if (!loginField || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '请提供用户名/邮箱和密码'
        }
      });
    }

    // 查找用户（支持用户名或邮箱）
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: loginField },
          { username: loginField }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '用户名/邮箱或密码错误'
        }
      });
    }

    // 验证密码
    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '用户名/邮箱或密码错误'
        }
      });
    }

    // 生成token
    const token = generateToken(user);

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    res.json({
      success: true,
      data: {
        token,
        user: userResponse
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
};

// 用户登出
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
};

// 修改密码
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 验证请求数据
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '请提供当前密码和新密码'
        }
      });
    }

    // 获取用户
    const user = await User.findByPk(req.user.id);

    // 验证当前密码
    const isPasswordValid = await user.validatePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: '当前密码错误'
        }
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '修改密码失败'
      }
    });
  }
}; 