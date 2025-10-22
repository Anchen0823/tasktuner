// 评论相关的API接口
import apiClient from './authApi'
import { API_BASE_URL } from './config'

export const commentApi = {
  // 获取笔记的评论列表
  getNoteComments: async (noteId) => {
    try {
      const response = await apiClient.get(`/notes/${noteId}/comments`)
      return response
    } catch (error) {
      console.error('获取评论列表失败:', error)
      throw error
    }
  },

  // 创建新评论
  createComment: async (data) => {
    console.log('commentApi.createComment called', data)
    try {
      const response = await apiClient.post(`/notes/${data.noteId}/comments`, {
        content: data.content,
        parentId: data.parentId,
        replyTo: data.replyTo
      })
      return response
    } catch (error) {
      console.error('创建评论失败:', error, error?.response, error?.message, error?.stack)
      throw error
    }
  },

  // 删除评论
  deleteComment: async (noteId, commentId) => {
    try {
      const response = await apiClient.delete(`/notes/${noteId}/comments/${commentId}`)
      return response
    } catch (error) {
      console.error('删除评论失败:', error)
      throw error
    }
  },

  // 创建回复
  createReply: async (data) => {
    try {
      const response = await apiClient.post(
        `/notes/${data.noteId}/comments/${data.commentId}/replies`,
        {
          content: data.content
        }
      )
      return response
    } catch (error) {
      console.error('创建回复失败:', error)
      throw error
    }
  },

  // 删除回复
  deleteReply: async (noteId, commentId, replyId) => {
    try {
      const response = await apiClient.delete(
        `/notes/${noteId}/comments/${commentId}/replies/${replyId}`
      )
      return response
    } catch (error) {
      console.error('删除回复失败:', error)
      throw error
    }
  }
} 