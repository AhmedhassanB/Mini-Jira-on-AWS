import api from './api'

export const userService = {
  getAll: () => api.get('/api/users'),
  assignToTeam: (userId, teamId) => api.patch(`/api/users/${userId}/team`, { teamId }),
}
