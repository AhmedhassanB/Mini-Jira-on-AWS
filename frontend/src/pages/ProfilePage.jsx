import { useQuery } from '@tanstack/react-query'
import { User, Mail, Shield, Users, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import useAuthStore from '@/store/authStore'
import { tasksApi } from '@/api/tasks'
import { teamsApi } from '@/api/teams'
import { getInitials, timeAgo, formatDate } from '@/utils/formatters'
import { TASK_STATUS } from '@/utils/constants'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton.jsx'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)

  const { data: myTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'assignee', user?.sub],
    queryFn: () =>
      user?.sub
        ? tasksApi.getByAssignee(user.sub).then((r) => r.data)
        : Promise.resolve([]),
    enabled: !!user?.sub,
  })

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll().then((r) => r.data),
  })

  const myTeam = teams.find((t) => t.teamId === user?.teamId)
  const done = myTasks.filter((t) => t.status === TASK_STATUS.DONE).length
  const inProgress = myTasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS).length
  const completionRate = myTasks.length ? Math.round((done / myTasks.length) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback>{getInitials(user?.username || user?.email || 'U')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold">{user?.username || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs capitalize">
                  <Shield className="h-3 w-3 mr-1" />
                  {user?.role || 'Member'}
                </Badge>
                {myTeam && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {myTeam.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {tasksLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">{myTasks.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Tasks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-500">{done}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-500">{inProgress}</p>
                <p className="text-xs text-muted-foreground mt-1">In Progress</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Completion progress */}
      {!tasksLoading && myTasks.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Your completion rate</p>
              <p className="text-sm font-bold text-primary">{completionRate}%</p>
            </div>
            <Progress value={completionRate} />
          </CardContent>
        </Card>
      )}

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account Info</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {[
            { icon: User, label: 'Username', value: user?.username || '—' },
            { icon: Mail, label: 'Email', value: user?.email || '—' },
            { icon: Shield, label: 'Role', value: user?.role || '—' },
            { icon: Users, label: 'Team', value: myTeam?.name || 'Not assigned' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
