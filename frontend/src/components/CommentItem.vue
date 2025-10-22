<template>
  <div class="comment-item">
    <div class="comment-main">
      <div class="comment-avatar">
        <span>{{ comment.authorName?.[0]?.toUpperCase() || '?' }}</span>
      </div>
      <div class="comment-content">
        <div class="comment-header">
          <div class="author-info">
            <span class="comment-author">{{ comment.authorName }}</span>
            <template v-if="comment.replyTo">
              <span class="reply-indicator">回复</span>
              <span class="reply-target">@{{ comment.replyTo }}</span>
            </template>
          </div>
          <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
        </div>
        <div class="comment-text">{{ comment.content }}</div>
        <div class="comment-actions">
          <button class="action-btn reply-btn" @click="$emit('toggleReply', comment)">
            <span class="action-icon">💬</span>
            回复
          </button>
          <button v-if="comment.authorId === currentUserId" class="action-btn delete-btn" @click="$emit('deleteComment', comment.id)">
            <span class="action-icon">🗑️</span>
            删除
          </button>
        </div>
      </div>
    </div>
    
    <!-- 回复输入框 -->
    <div v-if="replyingTo?.id === comment.id" class="reply-input-container">
      <div class="reply-wrapper">
        <div class="reply-avatar">
          <span>{{ getCurrentUserInitial() }}</span>
        </div>
        <div class="reply-content">
      <textarea
        :value="replyContent"
        @input="$emit('update:replyContent', $event.target.value)"
        class="reply-input"
        placeholder="写下你的回复..."
            :rows="3"
      ></textarea>
      <div class="reply-actions">
            <button class="btn btn-primary" @click="$emit('submitReply')">
              <span class="btn-icon">📝</span>
              发表回复
            </button>
            <button class="btn btn-secondary" @click="$emit('cancelReply')">取消</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 回复列表 -->
    <div class="replies-list" v-if="comment.replies && comment.replies.length">
      <div class="replies-header">
        <div class="replies-line"></div>
        <span class="replies-count">{{ getTotalRepliesCount(comment.replies) }} 条回复</span>
      </div>
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :currentUserId="currentUserId"
        :replyingTo="replyingTo"
        :replyContent="replyContent"
        @toggleReply="$emit('toggleReply', $event)"
        @submitReply="$emit('submitReply')"
        @cancelReply="$emit('cancelReply')"
        @deleteComment="$emit('deleteComment', $event)"
        @update:replyContent="$emit('update:replyContent', $event)"
        :formatDate="formatDate"
        class="reply-item"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'CommentItem',
  props: {
    comment: Object,
    currentUserId: [Number, String],
    replyingTo: Object,
    replyContent: String,
    formatDate: Function
  },
  emits: ['toggleReply', 'submitReply', 'cancelReply', 'deleteComment', 'update:replyContent'],
  methods: {
    getCurrentUserInitial() {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      return (currentUser?.username || '用户').charAt(0).toUpperCase()
    },
    // 递归统计所有后代回复总数
    getTotalRepliesCount(replies) {
      if (!replies || !Array.isArray(replies)) return 0
      
      let total = replies.length // 当前层级的回复数量
      
      // 递归统计每个回复的后代回复
      replies.forEach(reply => {
        if (reply.replies && reply.replies.length > 0) {
          total += this.getTotalRepliesCount(reply.replies)
        }
      })
      
      return total
    }
  }
}
</script>

<style scoped>
.comment-item {
  position: relative;
}

.comment-main {
  display: flex;
  gap: 10px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  background: #2196f3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
  font-size: 13px;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 8px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.comment-author {
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
}

.reply-indicator {
  font-size: 12px;
  color: #718096;
  font-weight: 400;
}

.reply-target {
  font-size: 12px;
  color: #667eea;
  font-weight: 500;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.comment-time {
  font-size: 12px;
  color: #a0aec0;
  white-space: nowrap;
  flex-shrink: 0;
}

.comment-text {
  color: #4a5568;
  line-height: 1.5;
  font-size: 14px;
  margin-bottom: 8px;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.action-icon {
  font-size: 14px;
}

.reply-btn {
  color: #718096;
}

.reply-btn:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.delete-btn {
  color: #e53e3e;
}

.delete-btn:hover {
  color: #c53030;
  background: rgba(229, 62, 62, 0.1);
}

/* 回复输入区域 */
.reply-input-container {
  margin-top: 12px;
  padding-left: 42px;
}

.reply-wrapper {
  display: flex;
  gap: 10px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

.reply-avatar {
  width: 28px;
  height: 28px;
  background: #2196f3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 11px;
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
}

.reply-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  resize: vertical;
  font-size: 14px;
  line-height: 1.5;
  min-height: 80px;
  max-height: 160px;
  transition: all 0.3s ease;
  background: #ffffff;
  font-family: inherit;
}

.reply-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.reply-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-icon {
  font-size: 14px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

/* 回复列表 */
.replies-list {
  margin-top: 16px;
  padding-left: 42px;
  position: relative;
}

.replies-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.replies-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, #e2e8f0, transparent);
}

.replies-count {
  font-size: 12px;
  color: #718096;
  font-weight: 500;
  background: #f8fafc;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.reply-item {
  background: rgba(248, 250, 252, 0.5);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  position: relative;
}

.reply-item::before {
  content: '';
  position: absolute;
  left: -24px;
  top: 20px;
  width: 16px;
  height: 1px;
  background: #e2e8f0;
}

.reply-item .comment-avatar {
  width: 28px;
  height: 28px;
  font-size: 12px;
}

.reply-item .comment-text {
  font-size: 13px;
}

.reply-item .reply-input-container {
  padding-left: 40px;
}

/* === 评论项深色主题完整适配 === */
html.dark .comment-item {
  color: var(--dark-text-secondary);
}

html.dark .comment-avatar {
  background: var(--dark-gradient-surface);
  box-shadow: var(--dark-shadow-light);
  border: 1px solid var(--dark-border-secondary);
}

html.dark .comment-author {
  color: var(--dark-text-primary);
}

html.dark .reply-indicator {
  color: var(--dark-text-muted);
}

html.dark .reply-target {
  color: var(--dark-accent-primary);
  background: var(--dark-accent-light);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

html.dark .comment-time {
  color: var(--dark-text-muted);
}

html.dark .comment-text {
  color: var(--dark-text-secondary);
}

html.dark .action-btn {
  color: var(--dark-text-tertiary);
  transition: all 0.3s ease;
}

html.dark .reply-btn:hover {
  color: var(--dark-accent-primary);
  background: var(--dark-accent-light);
}

html.dark .delete-btn {
  color: var(--dark-error);
}

html.dark .delete-btn:hover {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.1);
}

/* 回复输入区域深色主题 */
html.dark .reply-input-container {
  background: transparent;
}

html.dark .reply-wrapper {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-secondary);
  transition: all 0.3s ease;
}

html.dark .reply-wrapper:focus-within {
  border-color: var(--dark-accent-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

html.dark .reply-avatar {
  background: var(--dark-gradient-surface);
  box-shadow: var(--dark-shadow-light);
  border: 1px solid var(--dark-border-secondary);
}

html.dark .reply-input {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-secondary);
  color: var(--dark-text-primary);
  transition: all 0.3s ease;
}

html.dark .reply-input:focus {
  border-color: var(--dark-accent-primary);
  background: var(--dark-bg-tertiary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

html.dark .reply-input::placeholder {
  color: var(--dark-text-muted);
}

/* 按钮深色主题 */
html.dark .btn {
  transition: all 0.3s ease;
}

html.dark .btn-primary {
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

html.dark .btn-primary:hover {
  background: var(--dark-accent-hover);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

html.dark .btn-secondary {
  background: var(--dark-bg-surface);
  color: var(--dark-text-secondary);
  border: 1px solid var(--dark-border-secondary);
}

html.dark .btn-secondary:hover {
  background: var(--dark-bg-tertiary);
  color: var(--dark-text-primary);
}

/* 回复列表深色主题 */
html.dark .replies-list {
  background: transparent;
}

html.dark .replies-line {
  background: linear-gradient(to right, var(--dark-border-secondary), transparent);
}

html.dark .replies-count {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-secondary);
  color: var(--dark-text-tertiary);
}

html.dark .reply-item {
  background: rgba(42, 42, 42, 0.5);
  border: 1px solid var(--dark-border-secondary);
  transition: all 0.3s ease;
}

html.dark .reply-item:hover {
  background: var(--dark-bg-tertiary);
  border-color: var(--dark-accent-primary);
  box-shadow: var(--dark-shadow-light);
}

html.dark .reply-item::before {
  background: var(--dark-border-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-avatar {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .reply-input-container,
  .replies-list {
    padding-left: 30px;
  }

  .reply-avatar {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }

  .reply-item .reply-input-container {
    padding-left: 30px;
  }
}

@media (max-width: 480px) {
  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .comment-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .reply-wrapper {
    flex-direction: column;
    gap: 8px;
  }

  .reply-avatar {
    align-self: flex-start;
  }

  .reply-input-container,
.replies-list {
    padding-left: 20px;
  }

  .reply-item::before {
    left: -12px;
  }
}
</style> 