import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select.jsx'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import KanbanBoard from '@/components/kanban/KanbanBoard.jsx'
import TaskModal from '@/components/tasks/TaskModal.jsx'
import TaskForm from '@/components/tasks/TaskForm.jsx'
import StatusBadge from '@/components/common/StatusBadge.jsx'
import PriorityBadge from '@/components/common/PriorityBadge.jsx'
import EmptyState from '@/components/common/EmptyState.jsx'
import { KanbanSkeleton, TableSkeleton } from '@/components/common/LoadingSkeleton.jsx'
import { tasksApi } from '@/api/tasks'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'
import { useToast } from '@/components/ui/toaster.jsx'
import { TASK_PRIORITY_LIST, TASK_STATUS_LIST, USER_ROLES } from '@/utils/constants'
import { formatDate, timeAgo } from '@/utils/formatters'
import { CheckSquare } from 'lucide-react'

export default function TeamTasksPage() {
  const [view, setView] = useState('kanban')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [selectedTask, setSelectedTask] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState('To Do')

  const user = useAuthStore((s) => s.user)
  const { selectedTeamId } = useUiStore()
  const isManager = user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.ADMIN
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const queryKey = ['tasks']
  const { data: allTasks = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => tasksApi.getAll().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast({ title: 'Task created', variant: 'success' })
      setCreateOpen(false)
    },
    onError: (err) =>
      toast({ title: 'Failed to create task', description: err.message, variant: 'destructive' }),
  })

  // Filter + search
  const tasks = useMemo(() => {
    let result = allTasks
    if (!isManager && user?.teamId) {
      result = result.filter((t) => t.teamId === user.teamId)
    } else if (selectedTeamId) {
      result = result.filter((t) => t.teamId === selectedTeamId)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      )
    }
    if (filterStatus !== 'all') result = result.filter((t) => t.status === filterStatus)
    if (filterPriority !== 'all') result = result.filter((t) => t.priority === filterPriority)
    return result
  }, [allTasks, search, filterStatus, filterPriority, isManager, user, selectedTeamId])

  const handleAddTask = (status) => {
    setDefaultStatus(status)
    setCreateOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {TASK_STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {TASK_PRIORITY_LIST.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border overflow-hidden">
            <button
              className={`px-3 py-1.5 text-sm transition-colors ${
                view === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              onClick={() => setView('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              className={`px-3 py-1.5 text-sm transition-colors ${
                view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {tasks.length} task{tasks.length !== 1 ? 's' : ''}
      </p>

      {/* View */}
      {isLoading ? (
        view === 'kanban' ? <KanbanSkeleton /> : <TableSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={
            search || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Try adjusting your filters.'
              : 'Create your first task to get started.'
          }
          action={{ label: 'Create Task', onClick: () => setCreateOpen(true) }}
        />
      ) : view === 'kanban' ? (
        <KanbanBoard
          tasks={tasks}
          onTaskClick={setSelectedTask}
          onAddTask={handleAddTask}
          queryKey={queryKey}
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card
              key={task.taskId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTask(task)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} showIcon={false} />
                  {task.deadline && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {formatDate(task.deadline, 'MMM d')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Task detail modal */}
      <TaskModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      {/* Create task dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            defaultValues={{ status: defaultStatus }}
            onSubmit={(data) => createMutation.mutate(data)}
            loading={createMutation.isPending}
            submitLabel="Create Task"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
