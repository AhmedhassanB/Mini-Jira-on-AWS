import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import PrivateRoute from '@/routes/PrivateRoute'
import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ConfirmEmail from '@/pages/auth/ConfirmEmail'
import Dashboard from '@/pages/Dashboard'
import KanbanPage from '@/pages/KanbanPage'
import ProjectsPage from '@/pages/ProjectsPage'
import TeamsPage from '@/pages/TeamsPage'
import ProfilePage from '@/pages/ProfilePage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import ActivityLogPage from '@/pages/ActivityLogPage'

export default function App() {
  const { theme } = useAuthStore()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
    }
  }, [theme])

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirm" element={<ConfirmEmail />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/activity" element={<ActivityLogPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
