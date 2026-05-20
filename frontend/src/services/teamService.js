import api from './api'

export const teamService = {
  getAll: () => api.get('/api/teams'),
  getById: (id) => api.get(`/api/teams/${id}`),
  create: (data) => api.post('/api/teams', data),
  update: (id, data) => api.put(`/api/teams/${id}`, data),
  delete: (id) => api.delete(`/api/teams/${id}`),
}
