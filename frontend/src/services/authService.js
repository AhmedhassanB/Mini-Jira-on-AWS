import api from './api'

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  signup: (data) =>
    api.post('/auth/signup', data),

  confirm: (email, confirmationCode) =>
    api.post('/auth/confirm', { email, confirmationCode }),

  me: () =>
    api.get('/auth/me'),

  updateProfile: (name) =>
    api.patch('/auth/me', { name }),
}
