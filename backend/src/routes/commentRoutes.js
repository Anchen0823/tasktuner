const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// 获取笔记评论列表
router.get('/notes/:noteId/comments', commentController.getNoteComments);
// 创建评论
router.post('/notes/:noteId/comments', protect, commentController.createComment);
// 回复评论
router.post('/notes/:noteId/comments/:commentId/replies', protect, commentController.createReply);
// 删除评论（含所有回复）
router.delete('/notes/:noteId/comments/:commentId', protect, commentController.deleteComment);
// 删除回复
router.delete('/notes/:noteId/comments/:commentId/replies/:replyId', protect, commentController.deleteReply);

module.exports = router; 