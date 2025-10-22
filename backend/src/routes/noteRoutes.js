const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

// 获取已发布笔记（必须在动态路由之前）
router.get('/published', noteController.getPublishedNotes);
// 搜索笔记
router.get('/search', noteController.searchNotes);
// 获取笔记统计信息
router.get('/stats', noteController.getNoteStats);
// 批量删除笔记
router.delete('/batch', protect, noteController.deleteMultipleNotes);

// 获取所有笔记
router.get('/', noteController.getAllNotes);
// 创建新笔记
router.post('/', protect, noteController.createNote);

// 点赞相关路由
router.get('/:id/likes', noteController.getNoteLikes);
router.post('/:id/like', protect, noteController.likeNote);
router.delete('/:id/like', protect, noteController.unlikeNote);

// 获取单个笔记
router.get('/:id', noteController.getNoteById);
// 更新笔记
router.put('/:id', protect, noteController.updateNote);
// 删除笔记
router.delete('/:id', protect, noteController.deleteNote);
// 发布/取消发布笔记
router.patch('/:id/publish', protect, noteController.togglePublishStatus);

module.exports = router; 
