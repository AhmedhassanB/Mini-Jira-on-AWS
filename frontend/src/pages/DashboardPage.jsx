import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  CheckSquare, Clock, AlertCircle, TrendingUp, Users, FolderKanban,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { tasksApi } from '@/api/tasks'
import { projectsApi } from '@/api/projects'
import { teamsApi } from '@/api/teams'
import useAuthStore from '@/store/authStore'
import { StatCardSkeleton, KanbanSkeleton } from '@/components/common/LoadingSkeleton.jsx'
import KanbanBoard from '@/components/kanban/KanbanBoard.jsx'
import TaskModal from '@/components/tasks/TaskModal.jsx'
import { TASK_STATUS, USER_ROLES } from '@/utils/constants'
import { timeAgo } from '@/utils/formatters'

const STATUS_CHART_COLORS = {
  'To Do': '#94a3b8',
  'In Progress': '#3b82f6',
  'In Review': '#f59e0b',
  Done: '#22c55e',
}

function StatCard({ icon: Icon, label, value, trend, color, loading }) {
  if (loading) return <StatCardSkeleton />
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [selectedTask, setSelectedTask] = useState(null)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isManager = user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.ADMIN

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll().then((r) => r.data),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll().then((r) => r.data),
  })

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll().then((r) => r.data),
  })

  // Stats
  const total = tasks.length
  const done = tasks.filter((t) => t.status === TASK_STATUS.DONE).length
  const inProgress = tasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS).length
  const highPriority = tasks.filter((t) => t.priority === 'High').length
  const completionRate = total ? Math.round((done / total) * 100) : 0

  // Chart data
  const statusData = Object.entries(TASK_STATUS).map(([, label]) => ({
    name: label,
    count: tasks.filter((t) => t.status === label).length,
  }))

  const teamData = teams.map((team) => ({
    name: team.name,
    tasks: tasks.filter((t) => t.teamId === team.teamId).length,
  }))

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={CheckSquare}
          label="Total Tasks"
          value={total}
          trend={`${completionRate}% complete`}
          color="bg-blue-500"
          loading={tasksLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="In Progress"
          value={inProgress}
          trend="Active work"
          color="bg-amber-500"
          loading={tasksLoading}
        />
        <StatCard
          icon={AlertCircle}
          label="High Priority"
          value={highPriority}
          trend="Need attention"
          color="bg-red-500"
          loading={tasksLoading}
        />
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={projects.length}
          trend={`${teams.length} team${teams.length !== 1 ? 's' : ''}`}
          color="bg-green-500"
          loading={tasksLoading}
        />
      </div>

      {/* Completion progress */}
      {!tasksLoading && total > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Overall Completion</p>
              <p className="text-sm font-bold text-primary">{completionRate}%</p>
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1.5">
              {done} of {total} tasks completed
            </p>
          </CardContent>
        </Card>
      )}

      {/* Charts + recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Tasks by status pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) =>
                    percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''
                  }
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_CHART_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks per team bar */}
        {isManager && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Tasks per Team</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={teamData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent activity */}
        <Card className={isManager ? '' : 'xl:col-span-2'}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {recentTasks.map((task) => (
              <button
                key={task.taskId}
                className="w-full flex items-start gap-3 text-left hover:bg-muted/50 rounded-lg p-2 transition-colors"
                onClick={() => setSelectedTask(task)}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    task.priority === 'High'
                      ? 'bg-red-500'
                      : task.priority === 'Medium'
                      ? 'bg-amber-500'
                      : 'bg-green-500'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(task.createdAt)}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Kanban board */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Kanban Board</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 overflow-x-auto">
          {tasksLoading ? (
            <KanbanSkeleton />
          ) : (
            <KanbanBoard
              tasks={tasks}
              onTaskClick={setSelectedTask}
              queryKey={['tasks']}
            />
          )}
        </CardContent>
      </Card>

      {/* Task modal */}
      <TaskModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  )
}
