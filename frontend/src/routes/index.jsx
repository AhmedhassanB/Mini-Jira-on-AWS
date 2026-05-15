import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/common/ProtectedRoute.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'

import LoginPage from '../pages/LoginPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import TeamTasksPage from '../pages/TeamTasksPage.jsx'
import TaskDetailsPage from '../pages/TaskDetailsPage.jsx'
import ProjectsPage from '../pages/ProjectsPage.jsx'
import TeamsPage from '../pages/TeamsPage.jsx'
import ProfilePage from '../pages/ProfilePage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TeamTasksPage />} />
            <Route path="/tasks/:id" element={<TaskDetailsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
