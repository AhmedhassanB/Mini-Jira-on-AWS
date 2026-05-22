import { motion } from 'framer-motion'
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp, Plus, ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import PageHeader from '@/components/common/PageHeader'
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton'
import StatusBadge from '@/components/common/StatusBadge'
import PriorityBadge from '@/components/common/PriorityBadge'
import TaskStatusChart from '@/components/charts/TaskStatusChart'
import TasksCreatedChart from '@/components/charts/TasksCreatedChart'
import { useTasks } from '@/hooks/useTasks'
import { useAuthStore } from '@/store/authStore'
import { isOverdue, isDueToday, formatDate, displayName } from '@/utils/helpers'

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
            <div className={`p-1.5 rounded-lg ${color}`}>
              <Icon size={14} className="text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const role = user?.role?.toLowerCase()
  const isManager = role === 'manager' || role === 'admin'
  const { data: tasks = [], isLoading } = useTasks()

  if (isLoading) return <DashboardSkeleton />

  const totalTasks = tasks.length
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length
  const done = tasks.filter((t) => t.status === 'Done').length
  const overdueTasks = tasks.filter((t) => isOverdue(t.deadline) && t.status !== 'Done')
  const dueTodayTasks = tasks.filter((t) => isDueToday(t.deadline) && t.status !== 'Done')
  const completionRate = totalTasks ? Math.round((done / totalTasks) * 100) : 0

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`${greeting()}, ${displayName(user)} 👋`}
        description="Here's what's happening with your projects today."
        action={isManager && (
          <Link to="/kanban">
            <Button size="sm">
              <Plus size={16} /> New Task
            </Button>
          </Link>
        )}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={totalTasks} icon={CheckSquare} color="bg-primary" sub={`${completionRate}% completion rate`} />
        <StatCard label="In Progress" value={inProgress} icon={Clock} color="bg-blue-500" sub="Currently active" />
        <StatCard label="Overdue" value={overdueTasks.length} icon={AlertTriangle} color="bg-red-500" sub="Need attention" />
        <StatCard label="Completed" value={done} icon={TrendingUp} color="bg-green-500" sub="This cycle" />
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Overall Progress</span>
            <span className="text-sm font-bold text-primary">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tasks */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Tasks</h2>
            <Link to="/kanban" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentTasks.map((task) => (
                    <div key={task.taskId} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        {task.deadline && (
                          <p className={`text-xs ${isOverdue(task.deadline) ? 'text-destructive' : 'text-muted-foreground'}`}>
                            Due {formatDate(task.deadline)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} compact />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <TaskStatusChart tasks={tasks} />

          {dueTodayTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock size={14} className="text-amber-500" />
                  Due Today ({dueTodayTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {dueTodayTasks.slice(0, 4).map((task) => (
                    <div key={task.taskId} className="px-5 py-2.5">
                      <p className="text-xs font-medium text-foreground truncate">{task.title}</p>
                      <PriorityBadge priority={task.priority} compact />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <TasksCreatedChart tasks={tasks} />
      </div>
    </div>
  )
}
