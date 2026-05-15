import axiosInstance from './axios.js'

export const projectsApi = {
  getAll: () => axiosInstance.get('/api/projects'),
  getById: (id) => axiosInstance.get(`/api/projects/${id}`),
  getByTeam: (teamId) => axiosInstance.get(`/api/projects/team/${teamId}`),
  create: (data) => axiosInstance.post('/api/projects', data),
  update: (id, data) => axiosInstance.put(`/api/projects/${id}`, data),
  delete: (id) => axiosInstance.delete(`/api/projects/${id}`),
}
