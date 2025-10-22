const Comment = require('../models/Comment');
const Note = require('../models/Note');
const User = require('../models/User');

// 获取笔记评论列表（含回复，分页）
exports.getNoteComments = async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 20;
    const offset = (page - 1) * size;

    // 查询所有该笔记的评论
    const allComments = await Comment.findAll({
      where: { noteId },
          include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
      order: [['createdAt', 'ASC']]
    });

    // 构建嵌套的评论树结构
    const commentTree = buildCommentTree(allComments.map(formatComment));
    
    // 分页只针对顶级评论
    const topLevelComments = commentTree;
    const total = topLevelComments.length;
    const paginatedComments = topLevelComments.slice(offset, offset + size);

    res.json({
      success: true,
      data: {
        comments: paginatedComments,
        pagination: {
          page,
          size,
          total,
          totalPages: Math.ceil(total / size)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 创建评论（或顶级回复）
exports.createComment = async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const { content, parentId } = req.body;
    const authorId = req.user.id;
    if (!content || content.length < 1 || content.length > 500) {
      return res.status(400).json({ success: false, message: '评论内容长度需在1-500字符' });
    }
    // 检查笔记是否存在
    const note = await Note.findByPk(noteId);
    if (!note) return res.status(404).json({ success: false, message: '笔记不存在' });
    // parentId 可选
    let replyTo = null;
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId, { include: [{ model: User, as: 'author' }] });
      if (!parentComment) return res.status(404).json({ success: false, message: '父评论不存在' });
      replyTo = parentComment.author ? parentComment.author.username : null;
    }
    const comment = await Comment.create({ content, authorId, noteId, parentId: parentId || null, replyTo });
    const fullComment = await Comment.findByPk(comment.id, { include: [{ model: User, as: 'author', attributes: ['id', 'username'] }] });
    res.status(201).json({
      success: true,
      data: formatComment(fullComment),
      message: parentId ? '回复发表成功' : '评论发表成功'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 回复评论（专用接口）
exports.createReply = async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const parentId = req.params.commentId;
    const { content, replyTo } = req.body;
    const authorId = req.user.id;
    if (!content || content.length < 1 || content.length > 500) {
      return res.status(400).json({ success: false, message: '回复内容长度需在1-500字符' });
    }
    // 检查父评论是否存在
    const parentComment = await Comment.findByPk(parentId, { include: [{ model: User, as: 'author' }] });
    if (!parentComment) return res.status(404).json({ success: false, message: '父评论不存在' });
    // replyTo 必须有
    const replyToName = replyTo || (parentComment.author ? parentComment.author.username : null);
    const comment = await Comment.create({ content, authorId, noteId, parentId, replyTo: replyToName });
    const fullComment = await Comment.findByPk(comment.id, { include: [{ model: User, as: 'author', attributes: ['id', 'username'] }] });
    res.status(201).json({
      success: true,
      data: formatComment(fullComment),
      message: '回复发表成功'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 删除评论（含所有回复）
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    // 先删除所有子回复
    await Comment.destroy({ where: { parentId: commentId } });
    // 再删除本评论
    await Comment.destroy({ where: { id: commentId } });
    res.json({ success: true, message: '评论删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 删除回复
exports.deleteReply = async (req, res) => {
  try {
    const replyId = req.params.replyId;
    await Comment.destroy({ where: { id: replyId } });
    res.json({ success: true, message: '回复删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 工具函数：格式化评论（无replies）
function formatComment(comment) {
  return {
    id: comment.id,
    content: comment.content,
    authorId: comment.authorId,
    authorName: comment.author ? comment.author.username : '',
    parentId: comment.parentId,
    replyTo: comment.replyTo,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt
  };
}

// 工具函数：构建嵌套的评论树结构
function buildCommentTree(flatComments) {
  const commentMap = {};
  const topLevelComments = [];
  
  // 首先创建所有评论的映射，并初始化 replies 数组
  flatComments.forEach(comment => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });
  
  // 然后构建树结构
  flatComments.forEach(comment => {
    if (comment.parentId) {
      // 这是一个回复，将其添加到父评论的 replies 数组中
      if (commentMap[comment.parentId]) {
        commentMap[comment.parentId].replies.push(commentMap[comment.id]);
      }
    } else {
      // 这是顶级评论
      topLevelComments.push(commentMap[comment.id]);
    }
  });
  
  return topLevelComments;
}

// 工具函数：格式化评论（含replies）- 保留用于向后兼容
function formatCommentWithReplies(comment) {
  return {
    ...formatComment(comment),
    replies: comment.replies ? comment.replies.map(formatComment) : []
  };
} 