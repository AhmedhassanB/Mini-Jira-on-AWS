import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/common/PageHeader'
import { KanbanSkeleton } from '@/components/common/LoadingSkeleton'
import EmptyState from '@/components/common/EmptyState'
import KanbanBoard from '@/components/kanban/KanbanBoard'
import CreateTaskModal from '@/components/tasks/CreateTaskModal'
import TaskModal from '@/components/tasks/TaskModal'
import TaskFilters from '@/components/tasks/TaskFilters'
import { useTasks } from '@/hooks/useTasks'
import { useUsers } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/authStore'
import { filterTasks } from '@/utils/helpers'
import { Kanban } from 'lucide-react'

export default function KanbanPage() {
  const { user } = useAuthStore()
  const role = user?.role?.toLowerCase()
  const isEmployee = role !== 'manager' && role !== 'admin'

  const [createOpen, setCreateOpen] = useState(false)
  const [createStatus, setCreateStatus] = useState('To Do')
  const [selectedTask, setSelectedTask] = useState(null)
  const [editTask, setEditTask] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', teamId: '' })

  const { data: rawTasks = [], isLoading } = useTasks()
  const { data: users = [] } = useUsers()

  const userMap = useMemo(
    () => Object.fromEntries(users.map((u) => [u.userId, u.username || u.email])),
    [users]
  )

  // Employees: client-side guard — only show tasks that belong to their team
  // Enrich every task with a resolved assigneeName for display in TaskCard
  const tasks = useMemo(() => {
    const base = isEmployee && user?.teamId
      ? rawTasks.filter((t) => t.teamId === user.teamId)
      : rawTasks
    return base.map((t) => ({
      ...t,
      assigneeName: t.assigneeId ? (userMap[t.assigneeId] || null) : null,
    }))
  }, [rawTasks, isEmployee, user?.teamId, userMap])

  const filteredTasks = filterTasks(tasks, filters)
  const hasActiveFilters = filters.search || filters.status || filters.priority || filters.teamId

  const handleAddTask = (status) => {
    setCreateStatus(status)
    setCreateOpen(true)
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Kanban Board" description="Drag and drop tasks between columns." />
        <KanbanSkeleton />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Kanban Board"
        description="Drag and drop tasks between columns to update their status."
        action={!isEmployee && (
          <Button onClick={() => { setCreateStatus('To Do'); setCreateOpen(true) }} size="sm">
            <Plus size={16} /> Add Task
          </Button>
        )}
      />

      <div className="mb-4">
        <TaskFilters filters={filters} onChange={setFilters} />
      </div>

      {filteredTasks.length === 0 && !hasActiveFilters ? (
        <EmptyState
          icon={Kanban}
          title="No tasks yet"
          description="Create your first task to get started with the Kanban board."
          action={!isEmployee && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Create Task
            </Button>
          )}
        />
      ) : filteredTasks.length === 0 && hasActiveFilters ? (
        <EmptyState
          icon={Kanban}
          title="No tasks match your filters"
          description="Try adjusting or clearing the filters above."
          action={
            <Button variant="outline" onClick={() => setFilters({ search: '', status: '', priority: '', teamId: '' })}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskClick={setSelectedTask}
          onAddTask={isEmployee ? undefined : handleAddTask}
        />
      )}

      <CreateTaskModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialStatus={createStatus}
      />

      <CreateTaskModal
        open={!!editTask}
        onOpenChange={(v) => !v && setEditTask(null)}
        task={editTask}
      />

      <TaskModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(v) => !v && setSelectedTask(null)}
        onEdit={(task) => {
          setSelectedTask(null)
          setEditTask(task)
        }}
      />
    </div>
  )
}
