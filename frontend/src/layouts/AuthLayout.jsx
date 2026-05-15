import { Outlet, Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore.js'

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-xl mb-3">
            M
          </div>
          <h1 className="text-2xl font-bold text-foreground">Mini Jira</h1>
          <p className="text-sm text-muted-foreground mt-1">Task management for modern teams</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
