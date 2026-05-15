import axiosInstance from './axios.js'

export const teamsApi = {
  getAll: () => axiosInstance.get('/api/teams'),
  getById: (id) => axiosInstance.get(`/api/teams/${id}`),
  create: (data) => axiosInstance.post('/api/teams', data),
  update: (id, data) => axiosInstance.put(`/api/teams/${id}`, data),
  delete: (id) => axiosInstance.delete(`/api/teams/${id}`),
}
