const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// 公开路由
router.post('/register', authController.register);
router.post('/login', authController.login);

// 需要认证的路由
router.use(protect);
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.put('/password', authController.updatePassword);

module.exports = router; 