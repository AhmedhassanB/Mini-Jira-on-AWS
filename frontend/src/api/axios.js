import axios from 'axios'
import useAuthStore from '../store/authStore.js'

// Empty string → relative URLs → requests go through the Vite dev proxy.
// Set VITE_API_URL=https://your-api.com only for production builds.
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach Cognito Bearer token from Zustand store on every request
axiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// On 401 clear auth state and redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
