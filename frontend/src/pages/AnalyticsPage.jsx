import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import PageHeader from '@/components/common/PageHeader'
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton'
import TaskStatusChart from '@/components/charts/TaskStatusChart'
import TasksCreatedChart from '@/components/charts/TasksCreatedChart'
import TeamProductivityChart from '@/components/charts/TeamProductivityChart'
import { useTasks } from '@/hooks/useTasks'
import { useTeams } from '@/hooks/useTeams'
import { isOverdue } from '@/utils/helpers'
import { TASK_STATUSES, TASK_PRIORITIES } from '@/utils/constants'

function MetricCard({ label, value, icon: Icon, color, description }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
            <div className={`p-1.5 rounded-lg ${color}`}>
              <Icon size={14} className="text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function AnalyticsPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: teams = [] } = useTeams()

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'Done').length
    const overdue = tasks.filter((t) => isOverdue(t.deadline) && t.status !== 'Done').length
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length
    const rate = total ? Math.round((done / total) * 100) : 0
    return { total, done, overdue, inProgress, rate }
  }, [tasks])

  const statusBreakdown = useMemo(() => {
    return TASK_STATUSES.map((s) => ({
      ...s,
      count: tasks.filter((t) => t.status === s.id).length,
      pct: tasks.length ? Math.round((tasks.filter((t) => t.status === s.id).length / tasks.length) * 100) : 0,
    }))
  }, [tasks])

  const priorityBreakdown = useMemo(() => {
    return TASK_PRIORITIES.map((p) => ({
      ...p,
      count: tasks.filter((t) => t.priority === p.id).length,
    }))
  }, [tasks])

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Analytics"
        description="Track performance, productivity, and project health."
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Tasks" value={stats.total} icon={BarChart3} color="bg-primary" />
        <MetricCard label="Completed" value={stats.done} icon={CheckCircle} color="bg-green-500" description={`${stats.rate}% completion rate`} />
        <MetricCard label="In Progress" value={stats.inProgress} icon={Clock} color="bg-blue-500" />
        <MetricCard label="Overdue" value={stats.overdue} icon={AlertTriangle} color="bg-red-500" description="Need immediate attention" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TasksCreatedChart tasks={tasks} />
        <TaskStatusChart tasks={tasks} />
      </div>

      <TeamProductivityChart tasks={tasks} teams={teams} />

      {/* Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusBreakdown.map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground font-medium">{s.label}</span>
                  <span className="text-muted-foreground">{s.count} ({s.pct}%)</span>
                </div>
                <Progress value={s.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityBreakdown.map((p) => {
              const pct = tasks.length ? Math.round((p.count / tasks.length) * 100) : 0
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{p.label}</span>
                    <span className="text-muted-foreground">{p.count} ({pct}%)</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
