import axiosInstance from './axios.js'

export const tasksApi = {
  getAll: () => axiosInstance.get('/api/tasks'),
  getById: (id) => axiosInstance.get(`/api/tasks/${id}`),
  getByTeam: (teamId) => axiosInstance.get(`/api/tasks/team/${teamId}`),
  getByAssignee: (assigneeId) => axiosInstance.get(`/api/tasks/assignee/${assigneeId}`),
  getByProject: (projectId) => axiosInstance.get(`/api/tasks/project/${projectId}`),
  create: (data) => axiosInstance.post('/api/tasks', data),
  update: (id, data) => axiosInstance.put(`/api/tasks/${id}`, data),
  delete: (id) => axiosInstance.delete(`/api/tasks/${id}`),
  uploadImage: (id, formData) =>
    axiosInstance.post(`/api/tasks/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}
