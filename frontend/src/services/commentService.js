import api from './api'

export const commentService = {
  getByTask: (taskId) => api.get(`/api/tasks/${taskId}/comments`),
  create: (taskId, data) => api.post(`/api/tasks/${taskId}/comments`, data),
  update: (taskId, commentId, data) =>
    api.put(`/api/tasks/${taskId}/comments/${commentId}`, data),
  delete: (taskId, commentId) =>
    api.delete(`/api/tasks/${taskId}/comments/${commentId}`),
}
