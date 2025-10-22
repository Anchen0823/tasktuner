<template>
  <div class="note-editor">
    <!-- 笔记列表和编辑器布局 -->
    <div class="note-layout">
      <!-- 左侧笔记列表 -->
      <div class="note-sidebar">
        <!-- 标签页切换 -->
        <div class="tab-switcher">
          <button 
            @click="currentTab = 'my-notes'" 
            :class="['tab-btn', { active: currentTab === 'my-notes' }]"
          >
            我的笔记
          </button>
          <button 
            @click="currentTab = 'note-hall'" 
            :class="['tab-btn', { active: currentTab === 'note-hall' }]"
          >
            笔记大厅
          </button>
        </div>

        <!-- 我的笔记标签页 -->
        <div v-if="currentTab === 'my-notes'" class="tab-content">
          <div class="sidebar-header">
            <h3>我的笔记</h3>
            <button @click="createNewNote" class="btn btn-primary btn-sm">
              ✏️ 新建笔记
            </button>
          </div>

          <!-- 搜索框 -->
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索笔记..."
              class="search-input"
            />
          </div>

          <!-- 笔记列表 -->
          <div class="note-list">
            <div
              v-for="note in filteredNotes"
              :key="note.id"
              @click="selectNote(note)"
              :class="['note-item', { active: selectedNote?.id === note.id }]"
            >
            
              <div class="note-item-header">
                <h4 class="note-title">{{ note.title || '无标题笔记' }}</h4>
                <div class="note-item-meta">
                  <span :class="['status', note.isPublished ? 'published' : 'draft']">
                    {{ note.isPublished ? '已发布' : '草稿' }}
                  </span>
                  <span v-if="note.isPublished" class="like-count">❤️ {{ note.likeCount || 0 }}</span>
                </div>
              </div>
              <p class="note-preview">{{ getNotePreview(note.content) }}</p>
              <div class="note-meta">
                <span>{{ formatDate(note.updatedAt || note.createdAt) }}</span>
                <button @click.stop="deleteNote(note.id)" class="btn-icon">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 笔记大厅标签页 -->
        <div v-else-if="currentTab === 'note-hall'" class="tab-content">
          <div class="sidebar-header">
            <h3>笔记大厅</h3>
            <span class="note-count">{{ publishedNotes.length }} 篇笔记</span>
          </div>
          
          <!-- 搜索框 -->
          <div class="search-box">
            <input
              v-model="hallSearchQuery"
              type="text"
              placeholder="搜索已发布笔记..."
              class="search-input"
            />
          </div>

          <!-- 已发布笔记列表 -->
          <div class="note-list">
            <div
              v-for="note in filteredPublishedNotes"
              :key="note.id"
              @click="viewPublishedNote(note)"
              :class="['note-item', { active: selectedNote?.id === note.id }]"
            >
              <div class="note-item-header">
                <h4 class="note-title">{{ note.title || '无标题笔记' }}</h4>
                <div class="note-item-meta">
                  <span class="author-name">{{ note.authorName || '匿名用户' }}</span>
                  <span class="like-count">❤️ {{ note.likeCount || 0 }}</span>
                </div>
              </div>
              <p class="note-preview">{{ getNotePreview(note.content) }}</p>
              <div class="note-meta">
                <span>{{ formatDate(note.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧编辑器/查看器 -->
      <div class="note-editor-main">
        <div v-if="selectedNote" class="editor-container">
          <!-- 编辑器头部 -->
          <div class="editor-header">
            <div class="editor-title-section">
              <input
                v-model="selectedNote.title"
                type="text"
                placeholder="笔记标题..."
                class="title-input"
                @input="autoSave"
                :readonly="currentTab === 'note-hall'"
              />
              <div class="editor-actions">
                <button 
                  v-if="currentTab === 'my-notes'"
                  @click="togglePublish" 
                  :class="['btn', selectedNote.isPublished ? 'btn-warning' : 'btn-success']"
                >
                  {{ selectedNote.isPublished ? '取消发布' : '发布' }}
                </button>
                <button 
                  v-if="currentTab === 'my-notes'"
                  @click="saveNote" 
                  class="btn btn-primary"
                >
                  保存
                </button>
                <button 
                  v-if="currentTab === 'note-hall'"
                  @click="likeNote" 
                  :class="['btn', selectedNote.isLiked ? 'btn-danger' : 'btn-secondary']"
                >
                  {{ selectedNote.isLiked ? '❤️ 已点赞' : '🤍 点赞' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 编辑器内容 -->
          <div class="editor-content">
            <textarea
              v-model="selectedNote.content"
              placeholder="开始撰写您的笔记..."
              class="content-textarea"
              @input="autoSave"
              ref="contentTextarea"
              :readonly="currentTab === 'note-hall'"
            ></textarea>
          </div>

          <!-- 编辑器底部 -->
          <div class="editor-footer">
            <div class="editor-info">
              <span class="char-count">{{ selectedNote.content?.length || 0 }} 字符</span>
              <span class="last-saved" v-if="lastSaved && currentTab === 'my-notes'">
                最后保存: {{ formatTime(lastSaved) }}
              </span>
              <span v-if="currentTab === 'note-hall'" class="note-stats">
                ❤️ {{ selectedNote.likeCount || 0 }} 个赞
              </span>
            </div>
          </div>

          <!-- 评论区域 -->
          <div class="comments-container">
            <h3 class="comments-title">评论区</h3>
            <CommentSection 
              :noteId="selectedNote.id"
              :currentUserId="currentUserId"
            />
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-icon">📝</div>
          <h3 v-if="currentTab === 'my-notes'">开始撰写笔记</h3>
          <h3 v-else>浏览精彩笔记</h3>
          <p v-if="currentTab === 'my-notes'">点击左侧的"新建笔记"按钮开始创建您的第一篇笔记</p>
          <p v-else>在左侧选择一篇笔记开始阅读</p>
          <button 
            v-if="currentTab === 'my-notes'"
            @click="createNewNote" 
            class="btn btn-primary"
          >
            创建第一篇笔记
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <h3>确认删除</h3>
        <p>确定要删除这篇笔记吗？此操作无法撤销。</p>
        <div class="modal-actions">
          <button @click="confirmDelete" class="btn btn-danger">删除</button>
          <button @click="cancelDelete" class="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { noteApi } from '../api/noteApi'
import CommentSection from './CommentSection.vue'
import { authUtils } from '../api/authApi'

export default {
  name: 'NoteEditor',
  components: {
    CommentSection
  },
  setup() {
    // 响应式数据
    const notes = ref([])
    const publishedNotes = ref([])
    const selectedNote = ref(null)
    const searchQuery = ref('')
    const showDeleteConfirm = ref(false)
    const noteToDelete = ref(null)
    const lastSaved = ref(null)
    const autoSaveTimer = ref(null)
    const contentTextarea = ref(null)
    const currentTab = ref('my-notes')
    const hallSearchQuery = ref('')
    const likeUsers = ref([])
    const likeCount = ref(0)
    const likeLoading = ref(false)

    // 获取当前用户
    const currentUser = ref(authUtils.getCurrentUser())
    const currentUserId = computed(() => currentUser.value?.id || '')

    // 计算属性
    const filteredNotes = computed(() => {
      if (!searchQuery.value) return notes.value
      const query = searchQuery.value.toLowerCase()
      return notes.value.filter(note => 
        note.title?.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query)
      )
    })

    const filteredPublishedNotes = computed(() => {
      if (!hallSearchQuery.value) return publishedNotes.value
      const query = hallSearchQuery.value.toLowerCase()
      return publishedNotes.value.filter(note => 
        note.title?.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query) ||
        note.authorName?.toLowerCase().includes(query)
      )
    })

    // 方法
    let loadNotesCallId = 0;
const loadNotes = async () => {
  const callId = ++loadNotesCallId;
  console.log(`[loadNotes] callId=${callId} start`);
  try {
    // 去掉分页限制，获取所有用户笔记
    const response = await noteApi.getUserNotes({ pageSize: 9999 });
    notes.value = response || [];
    console.log(`[loadNotes] callId=${callId} notes.value=`, notes.value);
  } catch (error) {
    console.error('加载笔记失败:', error);
  }
};

    const loadPublishedNotes = async () => {
      try {
        // 获取所有已发布笔记（虽然getPublishedNotes后端没有分页限制，但为了保持一致性）
        const response = await noteApi.getPublishedNotes({ pageSize: 9999 })
        publishedNotes.value = response|| []
      } catch (error) {
        console.error('加载已发布笔记失败:', error)
      }
    }

    const createNewNote = async () => {
      try {
        // 调用后端API创建新笔记，初始内容为空
        const response = await noteApi.createNote({
          title: '',
          content: ''
        })
        if (response && response.id) {
          // 用后端返回的真实ID和数据
          const newNote = {
            ...response,
            isPublished: false,
            likeCount: 0,
            createdAt: response.createdAt || new Date(),
            updatedAt: response.updatedAt || new Date()
          }
          notes.value.unshift(newNote)
          await loadNotes() // 新建后强制刷新
          // 自动选中最新一条（假设新建的在最前面）
          if (notes.value.length > 0) {
            selectNote(notes.value[0])
          }
        } else {
          alert('新建笔记失败，未获取到ID')
        }
      } catch (error) {
        alert('新建笔记失败')
        console.error('新建笔记失败:', error)
      }
    }

    const selectNote = (note) => {
      selectedNote.value = { ...note }
      nextTick(() => {
        if (contentTextarea.value) {
          contentTextarea.value.focus()
        }
      })
    }

    const saveNote = async () => {
      if (!selectedNote.value) return

      try {
        console.log('保存笔记:', selectedNote.value)
        await noteApi.updateNote(selectedNote.value.id, {
          title: selectedNote.value.title,
          content: selectedNote.value.content
        })
        await loadNotes() 
        // 更新本地数据
        const index = notes.value.findIndex(n => n.id === selectedNote.value.id)
        if (index !== -1) {
          notes.value[index] = { ...selectedNote.value, updatedAt: new Date() }
        }

        lastSaved.value = new Date()
      } catch (error) {
        console.error('保存笔记失败:', error)
      }
      console.log('保存笔记成功:', selectedNote.value)
    }

    const autoSave = () => {
      if (autoSaveTimer.value) {
        clearTimeout(autoSaveTimer.value)
      }
      autoSaveTimer.value = setTimeout(() => {
        saveNote()
      }, 2000) // 2秒后自动保存
    }

    const togglePublish = async () => {
      if (!selectedNote.value) return

      try {
        console.log('切换发布状态:', selectedNote.value.id)
        // 调用后端API切换发布状态
        const res = await noteApi.togglePublishStatus(selectedNote.value.id)
        selectedNote.value.isPublished = res.isPublished
        await saveNote()
        await loadPublishedNotes()
      } catch (error) {
        console.error('切换发布状态失败:', error)
      }
    }

    const deleteNote = (noteId) => {
      noteToDelete.value = noteId
      showDeleteConfirm.value = true
    }

    const confirmDelete = async () => {
      if (!noteToDelete.value) return

      try {
        console.log('删除笔记:', noteToDelete.value)
        // 调用后端API删除笔记
        await noteApi.deleteNote(noteToDelete.value)
        
        // 重新加载笔记列表，确保前后端数据同步
        await loadNotes()
        
        // 如果删除的是当前选中的笔记，清空选择
        if (selectedNote.value?.id === noteToDelete.value) {
          selectedNote.value = null
        }
        
        showDeleteConfirm.value = false
        noteToDelete.value = null
        
        console.log('删除笔记成功')
      } catch (error) {
        console.error('删除笔记失败:', error)
        alert('删除笔记失败，请稍后重试')
        showDeleteConfirm.value = false
        noteToDelete.value = null
      }
    }

    const cancelDelete = () => {
      showDeleteConfirm.value = false
      noteToDelete.value = null
    }

    const getNotePreview = (content) => {
      if (!content) return '暂无内容'
      return content.length > 100 ? content.substring(0, 100) + '...' : content
    }

    const formatDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      return d.toLocaleDateString('zh-CN')
    }

    const formatTime = (date) => {
      if (!date) return ''
      const d = new Date(date)
      return d.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }

    const fetchNoteLikes = async (noteId) => {
      try {
        const res = await noteApi.getNoteLikes(noteId)
        likeUsers.value = res.users || []
        likeCount.value = res.count || 0
      } catch (e) {
        likeUsers.value = []
        likeCount.value = 0
      }
    }

    const refreshSelectedNote = async (noteId) => {
      // 获取最新笔记详情
      const note = await noteApi.getNoteById(noteId)
      selectedNote.value = { ...note }
      // 获取点赞用户
      await fetchNoteLikes(noteId)
      // 判断当前用户是否已点赞
      const userId = currentUserId.value
      selectedNote.value.isLiked = likeUsers.value.some(u => u.id === userId)
    }

    const likeNote = async () => {
      if (!selectedNote.value) return
      likeLoading.value = true
      try {
        if (!selectedNote.value.isLiked) {
          // 点赞
          try {
            const response = await noteApi.likeNote(selectedNote.value.id)
            selectedNote.value.isLiked = true
            selectedNote.value.likeCount = response.likeCount
          } catch (error) {
            // 如果已经点赞过，后端会返回400错误
            if (error.response?.status === 400) {
              selectedNote.value.isLiked = true
              console.log('用户已经点赞过')
            } else {
              throw error
            }
          }
        } else {
          // 取消点赞
          try {
            const response = await noteApi.unlikeNote(selectedNote.value.id)
            selectedNote.value.isLiked = false
            selectedNote.value.likeCount = response.likeCount
          } catch (error) {
            // 如果没有点赞过，后端会返回400错误
            if (error.response?.status === 400) {
              selectedNote.value.isLiked = false
              console.log('用户没有点赞过')
            } else {
              throw error
            }
          }
        }
        await loadPublishedNotes()
        await loadNotes()
      } catch (error) {
        console.error('点赞笔记失败:', error)
        alert('操作失败，请稍后重试')
      } finally {
        likeLoading.value = false
      }
    }

    const viewPublishedNote = async (note) => {
      selectedNote.value = { ...note }
      await fetchNoteLikes(note.id)
      const userId = currentUserId.value
      selectedNote.value.isLiked = likeUsers.value.some(u => u.id === userId)
    }

    // 生命周期
    onMounted(() => {
      window._notes = notes;
      loadNotes()
      loadPublishedNotes()
    })

    return {
      notes,
      publishedNotes,
      selectedNote,
      searchQuery,
      showDeleteConfirm,
      lastSaved,
      contentTextarea,
      filteredNotes,
      filteredPublishedNotes,
      createNewNote,
      selectNote,
      saveNote,
      autoSave,
      togglePublish,
      deleteNote,
      confirmDelete,
      cancelDelete,
      getNotePreview,
      formatDate,
      formatTime,
      currentTab,
      hallSearchQuery,
      likeNote,
      viewPublishedNote,
      currentUserId,
      likeUsers,
      likeCount,
      likeLoading
    }
  }
}
</script>

<style scoped>
.note-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.note-layout {
  display: flex;
  height: 100%;
  background: #f5f5f5;
}

.note-sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.tab-switcher {
  display: flex;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
  background: transparent;
  color: #666;
  margin-right: 8px;
}

.tab-btn:hover {
  background: #f0f4ff;
}

.tab-btn.active {
  background: #e3f2fd;
  color: #3498db;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.search-box {
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.note-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.note-item {
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
  border: 1px solid transparent;
}

.note-item:hover {
  background: #f8f9fa;
  border-color: #e0e0e0;
}

.note-item.active {
  background: #e3f2fd;
  border-color: #3498db;
}

.note-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.note-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.status {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
}

.status.published {
  background: #e8f5e8;
  color: #2e7d32;
}

.status.draft {
  background: #fff3e0;
  color: #ef6c00;
}

.note-preview {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #f0f0f0;
}

.note-editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.editor-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.editor-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-input {
  flex: 1;
  font-size: 24px;
  font-weight: 600;
  border: none;
  background: transparent;
  color: #333;
  padding: 0;
  margin-right: 20px;
}

.title-input:focus {
  outline: none;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.editor-content {
  flex: 1;
  padding: 20px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.content-textarea {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
  resize: none;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.content-textarea:focus {
  outline: none;
}

.editor-footer {
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.editor-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.empty-state p {
  margin: 0 0 20px 0;
  max-width: 300px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 4px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.modal-content h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.modal-content p {
  margin: 0 0 20px 0;
  color: #666;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover {
  background: #229954;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover {
  background: #e67e22;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.icon {
  margin-right: 5px;
}

.note-count {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 3px;
}

.author-name {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
}

.note-stats {
  font-size: 12px;
  color: #666;
}

.comments-container {
  border-top: 1px solid #e0e0e0;
  margin-top: 15px;
  background: #fafafa;
  max-height: 400px;
  overflow-y: auto;
}

.comments-title {
  padding: 12px 15px 8px;
  margin: 0;
  font-size: 15px;
  color: #333;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
}

.note-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.like-count {
  font-size: 12px;
  color: #e74c3c;
  background: #fef2f2;
  padding: 2px 6px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  gap: 2px;
}

@media (max-width: 768px) {
  .note-layout {
    flex-direction: column;
  }
  
  .note-sidebar {
    width: 100%;
    height: 200px;
  }
  
  .editor-title-section {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .title-input {
    margin-right: 0;
  }
  
  .editor-actions {
    justify-content: flex-end;
  }
  
  .comments-container {
    margin-top: 10px;
    max-height: 300px;
  }
  
  .comments-title {
    padding: 10px 12px 6px;
    font-size: 14px;
  }

  .editor-content {
    min-height: 300px;
    padding: 15px;
  }

  .content-textarea {
    min-height: 300px;
  }
}

html.dark .sidebar-header h3 {
  color: #f5f5f5;
}

html.dark .empty-state h3 {
  color: #f5f5f5;
}

html.dark .modal-content h3 {
  color: #f5f5f5;
}

html.dark .tab-btn:hover {
  background: #3a4a66;
}

/* === 笔记编辑器深色主题完整适配 === */
html.dark .note-editor {
  background: var(--dark-bg-secondary);
  color: var(--dark-text-secondary);
}

html.dark .note-layout {
  background: var(--dark-bg-primary);
}

/* 侧边栏深色主题 */
html.dark .note-sidebar {
  background: var(--dark-bg-elevated);
  border-right: 1px solid var(--dark-border-primary);
}

html.dark .note-sidebar h3 {
  color: var(--dark-text-primary);
}

html.dark .tab-switcher {
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid var(--dark-border-primary);
  backdrop-filter: blur(10px);
}

html.dark .tab-btn {
  color: var(--dark-text-tertiary);
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

html.dark .tab-btn:hover {
  background: var(--dark-accent-light);
  color: var(--dark-accent-primary);
  border-color: var(--dark-accent-primary);
}

html.dark .tab-btn.active {
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
  border-color: var(--dark-accent-primary);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

html.dark .sidebar-header {
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid var(--dark-border-primary);
  backdrop-filter: blur(10px);
}

html.dark .search-box {
  background: rgba(30, 41, 59, 0.5);
  border-bottom: 1px solid var(--dark-border-primary);
}

html.dark .search-input {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-secondary);
  color: var(--dark-text-primary);
  transition: all 0.3s ease;
}

html.dark .search-input:focus {
  border-color: var(--dark-accent-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

html.dark .search-input::placeholder {
  color: var(--dark-text-muted);
}

/* 笔记列表深色主题 */
html.dark .note-list {
  background: transparent;
}

html.dark .note-item {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-secondary);
  transition: all 0.3s ease;
}

html.dark .note-item:hover {
  background: var(--dark-bg-tertiary);
  border-color: var(--dark-border-secondary);
  box-shadow: var(--dark-shadow-light);
  transform: translateX(4px);
}

html.dark .note-item.active {
  background: var(--dark-accent-light);
  border-color: var(--dark-accent-primary);
  color: var(--dark-accent-primary);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

html.dark .note-title {
  color: var(--dark-text-primary);
}

html.dark .note-item.active .note-title {
  color: var(--dark-accent-primary);
}

html.dark .note-preview {
  color: var(--dark-text-tertiary);
}

html.dark .note-meta {
  color: var(--dark-text-muted);
}

html.dark .note-stats {
  color: var(--dark-text-muted);
}

html.dark .author-name {
  background: rgba(59, 130, 246, 0.2);
  color: var(--dark-accent-primary);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

html.dark .note-count {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

html.dark .like-count {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* 状态标签深色主题 */
html.dark .status.published {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

html.dark .status.draft {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

html.dark .btn-icon {
  color: var(--dark-text-tertiary);
  transition: all 0.3s ease;
}

html.dark .btn-icon:hover {
  background: var(--dark-bg-tertiary);
  color: var(--dark-text-primary);
}

/* 编辑器主区域深色主题 */
html.dark .note-editor-main {
  background: var(--dark-bg-primary);
}

html.dark .editor-container {
  background: var(--dark-bg-primary);
}

html.dark .editor-header {
  background: var(--dark-bg-secondary);
  border-bottom: 1px solid var(--dark-border-primary);
}

html.dark .title-input {
  background: var(--dark-bg-surface);
  color: var(--dark-text-primary);
  border: 1px solid var(--dark-border-primary);
}

html.dark .title-input:focus {
  border-color: var(--dark-accent-primary);
  background: var(--dark-bg-secondary);
  box-shadow: 0 0 0 2px var(--dark-accent-light);
}

html.dark .title-input::placeholder {
  color: var(--dark-text-muted);
}

html.dark .editor-content {
  background: var(--dark-bg-primary);
}

html.dark .content-textarea {
  background: var(--dark-bg-primary);
  color: var(--dark-text-secondary);
  border: 1px solid var(--dark-border-primary);
}

html.dark .content-textarea:focus {
  border-color: var(--dark-accent-primary);
  background: var(--dark-bg-secondary);
  box-shadow: 0 0 0 2px var(--dark-accent-light);
}

html.dark .content-textarea::placeholder {
  color: var(--dark-text-muted);
}

html.dark .editor-footer {
  background: var(--dark-bg-secondary);
  border-top: 1px solid var(--dark-border-primary);
}

html.dark .editor-info {
  color: var(--dark-text-tertiary);
}

/* 空状态深色主题 */
html.dark .empty-state {
  color: var(--dark-text-tertiary);
}

html.dark .empty-state h3 {
  color: var(--dark-text-primary);
}

html.dark .empty-icon {
  opacity: 0.3;
}

/* 模态框深色主题 */
html.dark .modal-overlay {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
}

html.dark .modal-content {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-secondary);
  box-shadow: var(--dark-shadow-heavy);
}

html.dark .modal-content h3 {
  color: var(--dark-text-primary);
}

html.dark .modal-content p {
  color: var(--dark-text-secondary);
}

/* 按钮深色主题 */
html.dark .btn-primary {
  background: var(--dark-accent-primary);
  color: var(--dark-text-primary);
}

html.dark .btn-primary:hover {
  background: var(--dark-accent-hover);
}

html.dark .btn-success {
  background: var(--dark-success);
  color: var(--dark-text-primary);
}

html.dark .btn-success:hover {
  background: #059669;
}

html.dark .btn-warning {
  background: var(--dark-warning);
  color: var(--dark-text-primary);
}

html.dark .btn-warning:hover {
  background: #d97706;
}

html.dark .btn-danger {
  background: var(--dark-error);
  color: var(--dark-text-primary);
}

html.dark .btn-danger:hover {
  background: #dc2626;
}

html.dark .btn-secondary {
  background: var(--dark-bg-surface);
  color: var(--dark-text-secondary);
  border: 1px solid var(--dark-border-primary);
}

html.dark .btn-secondary:hover {
  background: var(--dark-bg-tertiary);
  border-color: var(--dark-border-secondary);
}

/* 评论区深色主题 */
html.dark .comments-container {
  background: var(--dark-bg-secondary);
  border-top: 1px solid var(--dark-border-primary);
}

html.dark .comments-title {
  color: var(--dark-text-primary);
}

html.dark .comment-input {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
  color: var(--dark-text-primary);
}

html.dark .comment-input:focus {
  border-color: var(--dark-accent-primary);
  background: var(--dark-bg-secondary);
  box-shadow: 0 0 0 2px var(--dark-accent-light);
}

html.dark .comment-input::placeholder {
  color: var(--dark-text-muted);
}

html.dark .comment-item {
  background: var(--dark-bg-surface);
  border: 1px solid var(--dark-border-primary);
}

html.dark .comment-item:hover {
  background: var(--dark-bg-tertiary);
  border-color: var(--dark-border-secondary);
}

html.dark .comment-author {
  color: var(--dark-text-primary);
}

html.dark .comment-text {
  color: var(--dark-text-secondary);
}

html.dark .comment-meta {
  color: var(--dark-text-muted);
}

/* === 响应式深色主题优化 === */
@media (max-width: 768px) {
  html.dark .note-editor {
    background: var(--dark-bg-secondary);
  }
  
  html.dark .note-sidebar {
    background: var(--dark-bg-elevated);
    border-bottom: 1px solid var(--dark-border-primary);
  }
  
  html.dark .note-editor-main {
    background: var(--dark-bg-primary);
  }
  
  html.dark .editor-container {
    background: var(--dark-bg-primary);
  }
}
</style> 