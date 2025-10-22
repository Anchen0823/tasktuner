const Note = require('../models/Note');
const User = require('../models/User');
const { Op } = require('sequelize');
const Comment = require('../models/Comment');
const NoteLike = require('../models/NoteLike');

// 获取所有笔记（支持分页、搜索）
exports.getAllNotes = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, q } = req.query;
    const currentUserId = req.user ? req.user.id : null;
    const where = {};
    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { content: { [Op.like]: `%${q}%` } }
      ];
    }
    const notes = await Note.findAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']]
    });
    const formattedNotes = await Promise.all(notes.map(note => formatNote(note, currentUserId)));
    res.json(formattedNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 获取当前用户的笔记
exports.getUserNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 10, q } = req.query;
    const where = { authorId: userId };
    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { content: { [Op.like]: `%${q}%` } }
      ];
    }
    const notes = await Note.findAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']]
    });
    const formattedNotes = await Promise.all(notes.map(note => formatNote(note, userId)));
    res.json(formattedNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 获取单个笔记详情
exports.getNoteById = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const note = await Note.findByPk(req.params.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'username'] }]
    });
    if (!note) return res.status(404).json({ error: '未找到笔记' });
    const formattedNote = await formatNote(note, currentUserId);
    res.json(formattedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 创建新笔记
exports.createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const authorId = req.user.id;
    const note = await Note.create({ title, content, authorId });
    const fullNote = await Note.findByPk(note.id, { include: [{ model: User, as: 'author', attributes: ['id', 'username'] }] });
    const formattedNote = await formatNote(fullNote, authorId);
    res.status(201).json(formattedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 为当前用户创建笔记（与 createNote 逻辑一致）
exports.createUserNote = async (req, res) => {
  return exports.createNote(req, res);
};

// 更新笔记
exports.updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const currentUserId = req.user.id;
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ error: '未找到笔记' });
    
    // 检查权限：只有笔记作者可以更新笔记
    if (note.authorId !== currentUserId) {
      return res.status(403).json({ error: '无权限修改此笔记' });
    }
    
    await note.update({ title, content });
    const fullNote = await Note.findByPk(note.id, { include: [{ model: User, as: 'author', attributes: ['id', 'username'] }] });
    const formattedNote = await formatNote(fullNote, currentUserId);
    res.json(formattedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 删除笔记（预留外键冲突检查）
exports.deleteNote = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ error: '未找到笔记' });
    
    // 检查权限：只有笔记作者可以删除笔记
    if (note.authorId !== currentUserId) {
      return res.status(403).json({ error: '无权限删除此笔记' });
    }
    
    // 检查评论外键引用，若有则禁止删除
    const commentCount = await Comment.count({ where: { noteId: note.id } });
    if (commentCount > 0) {
      return res.status(400).json({ success: false, error: '该笔记下有评论，禁止删除' });
    }
    await note.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 批量删除笔记
exports.deleteMultipleNotes = async (req, res) => {
  try {
    const { noteIds } = req.body;
    if (!Array.isArray(noteIds)) return res.status(400).json({ error: 'noteIds 必须为数组' });
    // TODO: 检查外键引用，若有则禁止删除
    const deletedCount = await Note.destroy({ where: { id: noteIds } });
    res.json({ success: true, deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 发布/取消发布笔记
exports.togglePublishStatus = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ error: '未找到笔记' });
    
    // 检查权限：只有笔记作者可以切换发布状态
    if (note.authorId !== currentUserId) {
      return res.status(403).json({ error: '无权限修改此笔记的发布状态' });
    }
    
    note.isPublished = !note.isPublished;
    await note.save();
    res.json({ id: note.id, isPublished: note.isPublished });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 获取已发布笔记
exports.getPublishedNotes = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const notes = await Note.findAll({
      where: { isPublished: true },
      include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
      order: [['createdAt', 'DESC']]
    });
    const formattedNotes = await Promise.all(notes.map(note => formatNote(note, currentUserId)));
    res.json(formattedNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 搜索笔记
exports.searchNotes = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const currentUserId = req.user ? req.user.id : null;
    const notes = await Note.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${q}%` } },
          { content: { [Op.like]: `%${q}%` } }
        ]
      },
      include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
      order: [['createdAt', 'DESC']]
    });
    const formattedNotes = await Promise.all(notes.map(note => formatNote(note, currentUserId)));
    res.json(formattedNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 获取笔记统计信息
exports.getNoteStats = async (req, res) => {
  try {
    const total = await Note.count();
    const published = await Note.count({ where: { isPublished: true } });
    const draft = total - published;
    res.json({ total, published, draft });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 格式化笔记返回结构
async function formatNote(note, currentUserId = null) {
  let isLiked = false;
  if (currentUserId) {
    const like = await NoteLike.findOne({
      where: { userId: currentUserId, noteId: note.id }
    });
    isLiked = !!like;
  }
  
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    authorName: note.author ? note.author.username : '',
    isPublished: note.isPublished,
    likeCount: note.likeCount || 0,
    isLiked: isLiked,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  };
}

// 获取笔记点赞数
exports.getNoteLikes = async (req, res) => {
  try {
    const noteId = req.params.id;
    const note = await Note.findByPk(noteId);
    if (!note) {
      return res.status(404).json({ error: '未找到笔记' });
    }
    
    // 获取点赞用户列表
    const likes = await NoteLike.findAll({
      where: { noteId },
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
    });
    
    const users = likes.map(like => ({
      id: like.user.id,
      username: like.user.username
    }));
    
    res.json({ 
      noteId: note.id,
      likeCount: note.likeCount || 0,
      count: likes.length,
      users: users
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 点赞笔记
exports.likeNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user.id;
    
    const note = await Note.findByPk(noteId);
    if (!note) {
      return res.status(404).json({ error: '未找到笔记' });
    }
    
    // 检查用户是否已经点赞
    const existingLike = await NoteLike.findOne({
      where: { userId, noteId }
    });
    
    if (existingLike) {
      return res.status(400).json({ 
        error: '您已经点赞过这篇笔记',
        isLiked: true 
      });
    }
    
    // 创建点赞记录
    await NoteLike.create({ userId, noteId });
    
    // 增加点赞计数
    note.likeCount = (note.likeCount || 0) + 1;
    await note.save();
    
    res.json({ 
      success: true,
      noteId: note.id,
      likeCount: note.likeCount,
      isLiked: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 取消点赞笔记
exports.unlikeNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user.id;
    
    const note = await Note.findByPk(noteId);
    if (!note) {
      return res.status(404).json({ error: '未找到笔记' });
    }
    
    // 检查用户是否已经点赞
    const existingLike = await NoteLike.findOne({
      where: { userId, noteId }
    });
    
    if (!existingLike) {
      return res.status(400).json({ 
        error: '您还没有点赞过这篇笔记',
        isLiked: false 
      });
    }
    
    // 删除点赞记录
    await existingLike.destroy();
    
    // 减少点赞计数（确保不小于0）
    note.likeCount = Math.max((note.likeCount || 0) - 1, 0);
    await note.save();
    
    res.json({ 
      success: true,
      noteId: note.id,
      likeCount: note.likeCount,
      isLiked: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 