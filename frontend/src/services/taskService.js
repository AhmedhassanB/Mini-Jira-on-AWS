import api from './api'

export const taskService = {
  getAll: () => api.get('/api/tasks'),
  getById: (id) => api.get(`/api/tasks/${id}`),
  create: (data) => api.post('/api/tasks', data),
  update: (id, data) => api.put(`/api/tasks/${id}`, data),
  delete: (id) => api.delete(`/api/tasks/${id}`),
  getByTeam: (teamId) => api.get(`/api/tasks/team/${teamId}`),
  getByAssignee: (assigneeId) => api.get(`/api/tasks/assignee/${assigneeId}`),
  getByProject: (projectId) => api.get(`/api/tasks/project/${projectId}`),
}
