<template>
  <div class="comment-section">
    <!-- 评论统计头部 -->
    <div class="comment-header">
      <div class="comment-title">
        <span class="comment-icon">💬</span>
        <h3>评论 <span class="comment-count">({{ comments.length }})</span></h3>
      </div>
    </div>

    <!-- 评论输入框 -->
    <div class="comment-input-container">
      <div class="input-wrapper">
        <div class="current-user-avatar">
          <span>{{ getCurrentUserInitial() }}</span>
        </div>
        <div class="input-content">
      <textarea
        v-model="newComment"
        class="comment-input"
            placeholder="写下你的想法，参与讨论..."
            :rows="3"
        :disabled="!isValidNoteId"
            @focus="onInputFocus"
            @blur="onInputBlur"
      ></textarea>
          <div class="input-actions" :class="{ active: inputFocused || newComment.trim() }">
            <div class="input-tools">
              <span class="char-count">{{ newComment.length }}/500</span>
            </div>
            <button 
              @click="submitComment" 
              class="submit-btn" 
              :disabled="!isValidNoteId || !newComment.trim()"
              :class="{ active: newComment.trim() }"
            >
              <span class="btn-icon">📝</span>
        发表评论
      </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div class="comments-container">
      <div v-if="comments.length === 0" class="empty-comments">
        <div class="empty-icon">💭</div>
        <p>还没有评论，来发表第一条评论吧！</p>
      </div>
      <div v-else class="comments-list">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :currentUserId="currentUserId"
        :replyingTo="replyingTo"
        v-model:replyContent="replyContent"
        @toggleReply="toggleReply"
        @submitReply="submitReply"
        @cancelReply="cancelReply"
        @deleteComment="deleteComment"
        :formatDate="formatDate"
      />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, defineComponent } from 'vue'
import { commentApi } from '../api/commentApi'
import CommentItem from './CommentItem.vue'

function buildCommentTree(flatComments) {
  const map = {};
  const roots = [];
  flatComments.forEach(c => { map[c.id] = { ...c, replies: [] }; });
  flatComments.forEach(c => {
    if (c.parentId) {
      map[c.parentId]?.replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

export default {
  name: 'CommentSection',
  components: { CommentItem },
  props: {
    noteId: {
      type: [Number, String],
      required: true
    },
    currentUserId: {
      type: [Number, String],
      required: true
    }
  },
  setup(props) {
    console.log('commentApi in setup:', commentApi)
    const comments = ref([])
    const newComment = ref('')
    const replyContent = ref('')
    const replyingTo = ref(null)
    const inputFocused = ref(false)

    // 判断noteId是否为有效数字且大于0
    const isValidNoteId = computed(() => {
      const id = Number(props.noteId)
      return Number.isInteger(id) && id > 0
    })

    // 加载评论列表
    const loadComments = async () => {
      if (!isValidNoteId.value) {
        comments.value = buildFlatCommentList(response.data.comments)
        return
    }
      try {
        const response = await commentApi.getNoteComments(props.noteId)
        // 兼容后端返回结构：{ success, data: { comments, pagination } }
        if (response.success && response.data && Array.isArray(response.data.comments)) {
          comments.value = response.data.comments
        } else {
          comments.value = response || [];
          if (response.error) {
            alert('评论加载失败：' + response.error)
          }
        }
      } catch (error) {
        comments.value = []
        console.error('加载评论失败:', error)
      }
    }

    // 提交评论
    const submitComment = async () => {
      if (!isValidNoteId.value || !newComment.value.trim()) return
      try {
        const response = await commentApi.createComment({
          noteId: props.noteId,
          content: newComment.value
        })
        await loadComments()
        newComment.value = ''
      } catch (error) {
        console.error('提交评论失败:', error)
      }
    }

    // 切换回复框显示状态
    const toggleReply = (comment) => {
      replyingTo.value = replyingTo.value?.id === comment.id ? null : comment
      replyContent.value = ''
    }

    // 提交回复
    const submitReply = async () => {
      if (!isValidNoteId.value || !replyContent.value.trim() || !replyingTo.value) {
        console.log('submitReply failed', isValidNoteId.value, replyContent.value.trim(), replyingTo.value)
        return
      }
      const replyingToRaw = JSON.parse(JSON.stringify(replyingTo.value));
      try {
        let response;
        if (replyingToRaw) {
          // 回复评论，调用 createReply
          response = await commentApi.createReply({
            noteId: props.noteId,
            commentId: replyingToRaw.id,
            content: replyContent.value.trim(),
            replyTo: replyingToRaw.authorName
          });
        } else {
          // 顶级评论，调用 createComment
          response = await commentApi.createComment({
            noteId: props.noteId,
            content: replyContent.value.trim()
          });
        }
        console.log('API响应', response);
        await loadComments();
        replyContent.value = '';
        replyingTo.value = null;
      } catch (error) {
        console.error('提交回复失败:', error, error?.response, error?.message, error?.stack);
      }
    }

    const cancelReply = () => {
      replyingTo.value = null
      replyContent.value = ''
    }

    // 删除评论
    const deleteComment = async (commentId) => {
      if (!confirm('确定要删除这条评论吗？')) return
      try {
        await commentApi.deleteComment(props.noteId, commentId)
        await loadComments()
      } catch (error) {
        console.error('删除评论失败:', error)
      }
    }

    const formatDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 输入框焦点控制
    const onInputFocus = () => {
      inputFocused.value = true
    }

    const onInputBlur = () => {
      inputFocused.value = false
    }

    // 获取当前用户首字母
    const getCurrentUserInitial = () => {
      // 从props或者全局状态获取当前用户信息，这里先用默认值
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      return (currentUser?.username || '用户').charAt(0).toUpperCase()
    }

    // 监听noteId变化，重新加载评论
    watch(() => props.noteId, (newNoteId, oldNoteId) => {
      if (newNoteId !== oldNoteId) {
        // 清空当前评论
        comments.value = []
        // 重置回复状态
        replyingTo.value = null
        replyContent.value = ''
        newComment.value = ''
        // 加载新笔记的评论
        loadComments()
      }
    })

    // 初始加载
    loadComments()

    return {
      comments,
      newComment,
      replyContent,
      replyingTo,
      inputFocused,
      submitComment,
      toggleReply,
      submitReply,
      cancelReply,
      deleteComment,
      formatDate,
      onInputFocus,
      onInputBlur,
      getCurrentUserInitial,
      isValidNoteId
    }
  }
}
</script>

<style scoped>
.comment-section {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f2f5;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 评论头部 */
.comment-header {
  padding: 16px 20px 0;
  border-bottom: 1px solid #f0f2f5;
  margin-bottom: 16px;
}

.comment-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-icon {
  font-size: 1.5rem;
}

.comment-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.comment-count {
  color: #718096;
  font-weight: 400;
  font-size: 1rem;
}

/* 输入区域 */
.comment-input-container {
  padding: 0 20px 16px;
}

.input-wrapper {
  display: flex;
  gap: 10px;
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.current-user-avatar {
  width: 36px;
  height: 36px;
  background: #2196f3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.input-content {
  flex: 1;
}

.comment-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  resize: vertical;
  font-size: 14px;
  line-height: 1.5;
  min-height: 80px;
  max-height: 200px;
  transition: all 0.3s ease;
  background: #ffffff;
  font-family: inherit;
}

.comment-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.comment-input::placeholder {
  color: #a0aec0;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  pointer-events: none;
}

.input-actions.active {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.input-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.char-count {
  font-size: 12px;
  color: #718096;
}

.submit-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #e2e8f0;
  color: #718096;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.submit-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  font-size: 16px;
}

/* 评论列表区域 */
.comments-container {
  padding: 0 20px 20px;
}

.empty-comments {
  text-align: center;
  padding: 40px 20px;
  color: #718096;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-comments p {
  margin: 0;
  font-size: 16px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 评论项美化 */
.comment-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.comment-item:hover {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-color: #cbd5e0;
}

.comment-main {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(66, 153, 225, 0.3);
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
}

.comment-time {
  font-size: 12px;
  color: #718096;
}

.comment-text {
  margin: 0 0 12px 0;
  color: #4a5568;
  line-height: 1.6;
  font-size: 14px;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.btn-text {
  background: none;
  border: none;
  padding: 4px 8px;
  font-size: 12px;
  color: #718096;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.btn-text:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.text-danger {
  color: #e53e3e;
}

.text-danger:hover {
  color: #c53030;
  background: rgba(229, 62, 62, 0.1);
}

.reply-input-container {
  margin: 16px 0 0 48px;
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

.reply-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  resize: vertical;
  font-size: 14px;
  min-height: 60px;
  max-height: 120px;
  transition: border-color 0.2s ease;
  background: #f8fafc;
  font-family: inherit;
}

.reply-input:focus {
  outline: none;
  border-color: #667eea;
  background: #ffffff;
}

.reply-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}

.btn {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.replies-list {
  margin: 16px 0 0 48px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* === 评论区深色主题完整适配 === */
html.dark .comment-section {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-secondary);
  box-shadow: var(--dark-shadow-medium);
}

html.dark .comment-header {
  background: var(--dark-bg-elevated);
  border-bottom: 1px solid var(--dark-border-primary);
  backdrop-filter: blur(10px);
}

html.dark .comment-title h3 {
  color: var(--dark-text-primary);
}

html.dark .comment-count {
  color: var(--dark-text-tertiary);
}

html.dark .comment-icon {
  color: var(--dark-accent-primary);
}

/* 输入区域深色主题 */
html.dark .comment-input-container {
  background: rgba(30, 41, 59, 0.5);
}

html.dark .input-wrapper {
  background: var(--dark-bg-surface);
  border: 2px solid var(--dark-border-secondary);
  transition: all 0.3s ease;
}

html.dark .input-wrapper:focus-within {
  background: var(--dark-bg-tertiary);
  border-color: var(--dark-accent-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

html.dark .current-user-avatar {
  background: var(--dark-gradient-surface);
  box-shadow: var(--dark-shadow-light);
  border: 1px solid var(--dark-border-secondary);
}

html.dark .comment-input {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-secondary);
  color: var(--dark-text-primary);
  transition: all 0.3s ease;
}

html.dark .comment-input:focus {
  border-color: var(--dark-accent-primary);
  background: var(--dark-bg-tertiary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

html.dark .comment-input::placeholder {
  color: var(--dark-text-muted);
}

html.dark .char-count {
  color: var(--dark-text-muted);
}

html.dark .submit-btn {
  background: var(--dark-bg-surface);
  color: var(--dark-text-tertiary);
  border: 1px solid var(--dark-border-secondary);
  transition: all 0.3s ease;
}

html.dark .submit-btn.active {
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
  border-color: var(--dark-accent-primary);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

html.dark .submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 评论列表深色主题 */
html.dark .comments-container {
  background: transparent;
}

html.dark .empty-comments {
  color: var(--dark-text-tertiary);
}

html.dark .empty-icon {
  color: var(--dark-text-muted);
}

/* 评论项深色主题 */
html.dark .comment-item {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-secondary);
  color: var(--dark-text-secondary);
  transition: all 0.3s ease;
}

html.dark .comment-item:hover {
  background: var(--dark-bg-tertiary);
  border-color: var(--dark-accent-primary);
  box-shadow: var(--dark-shadow-light);
  transform: translateY(-2px);
}

html.dark .comment-avatar {
  background: var(--dark-gradient-surface);
  box-shadow: var(--dark-shadow-light);
  border: 1px solid var(--dark-border-secondary);
}

html.dark .comment-author {
  color: var(--dark-text-primary);
  font-weight: 600;
}

html.dark .comment-time {
  color: var(--dark-text-muted);
}

html.dark .comment-text {
  color: var(--dark-text-secondary);
}

html.dark .btn-text {
  color: var(--dark-text-tertiary);
  transition: all 0.3s ease;
}

html.dark .btn-text:hover {
  color: var(--dark-accent-primary);
  background: var(--dark-accent-light);
}

html.dark .text-danger {
  color: var(--dark-error);
}

html.dark .text-danger:hover {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.1);
}

/* 回复区域深色主题 */
html.dark .reply-input-container {
  background: var(--dark-bg-tertiary);
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

html.dark .replies-list {
  background: transparent;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-section {
    border-radius: 10px;
  }

  .comment-header,
  .comment-input-container,
  .comments-container {
    padding-left: 14px;
    padding-right: 14px;
  }

  .input-wrapper {
    padding: 10px;
  }

  .current-user-avatar {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .comment-item {
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .comment-header,
  .comment-input-container,
  .comments-container {
    padding-left: 10px;
    padding-right: 10px;
  }

  .input-wrapper {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }

  .current-user-avatar {
    align-self: flex-start;
  }

  .input-actions {
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
}
</style> 