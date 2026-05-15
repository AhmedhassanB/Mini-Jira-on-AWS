import axiosInstance from './axios.js'

export const authApi = {
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  signup: (data) => axiosInstance.post('/auth/signup', data),
  confirmSignup: (data) => axiosInstance.post('/auth/confirm', data),
  resendCode: (email) => axiosInstance.post('/auth/resend', { email }),
  getMe: () => axiosInstance.get('/auth/me'),
}
