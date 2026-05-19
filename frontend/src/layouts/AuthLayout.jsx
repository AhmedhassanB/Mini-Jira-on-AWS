import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const token = useAuthStore((s) => s.token)

  if (isAuthenticated && token) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}
