import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Activity, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'
import StatusBadge from '@/components/common/StatusBadge'
import PriorityBadge from '@/components/common/PriorityBadge'
import { useTasks } from '@/hooks/useTasks'
import { useTeams } from '@/hooks/useTeams'
import { useUsers } from '@/hooks/useUsers'
import { timeAgo } from '@/utils/helpers'

function ActivityItem({ task, teamName, assigneeName, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex gap-3 group"
    >
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Plus size={14} className="text-primary" />
        </div>
        <div className="w-px flex-1 bg-border mt-2" />
      </div>

      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">{task.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Created {timeAgo(task.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} compact />
          </div>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {assigneeName && <span>Assigned to {assigneeName}</span>}
          {teamName && <Badge variant="outline" className="text-[10px] py-0">{teamName}</Badge>}
        </div>
      </div>
    </motion.div>
  )
}

export default function ActivityLogPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: teams = [] } = useTeams()
  const { data: users = [] } = useUsers()

  const sorted = useMemo(() =>
    [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [tasks]
  )

  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.teamId, t.name])), [teams])
  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [u.userId, u.username || u.email])), [users])

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Activity Log"
        description="A timeline of all task activity in your workspace."
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Task activity will appear here as tasks are created and updated."
        />
      ) : (
        <div className="max-w-2xl">
          {sorted.map((task, i) => (
            <ActivityItem
              key={task.taskId}
              task={task}
              index={i}
              teamName={task.teamId ? teamMap[task.teamId] : null}
              assigneeName={task.assigneeId ? userMap[task.assigneeId] : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
