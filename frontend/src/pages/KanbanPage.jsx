import { useState } from 'react'
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
import { useAuthStore } from '@/store/authStore'
import { filterTasks } from '@/utils/helpers'
import { Kanban } from 'lucide-react'

export default function KanbanPage() {
  const { user } = useAuthStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [createStatus, setCreateStatus] = useState('To Do')
  const [selectedTask, setSelectedTask] = useState(null)
  const [editTask, setEditTask] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', teamId: '' })

  const { data: tasks = [], isLoading } = useTasks(
    user?.role === 'Employee' && user?.teamId ? { teamId: user.teamId } : {}
  )

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
        action={
          <Button onClick={() => { setCreateStatus('To Do'); setCreateOpen(true) }} size="sm">
            <Plus size={16} /> Add Task
          </Button>
        }
      />

      <div className="mb-4">
        <TaskFilters filters={filters} onChange={setFilters} />
      </div>

      {filteredTasks.length === 0 && !hasActiveFilters ? (
        <EmptyState
          icon={Kanban}
          title="No tasks yet"
          description="Create your first task to get started with the Kanban board."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Create Task
            </Button>
          }
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
          onAddTask={handleAddTask}
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
