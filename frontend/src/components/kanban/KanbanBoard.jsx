import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import KanbanColumn from './KanbanColumn.jsx'
import TaskCard from './TaskCard.jsx'
import { KANBAN_COLUMNS } from '@/utils/constants'
import { tasksApi } from '@/api/tasks'
import { useToast } from '../ui/toaster.jsx'

export default function KanbanBoard({ tasks, onTaskClick, onAddTask, queryKey = ['tasks'] }) {
  const [activeTask, setActiveTask] = useState(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => tasksApi.update(id, { status }),
    onError: (err, vars) => {
      // Revert optimistic update on failure
      queryClient.invalidateQueries({ queryKey })
      toast({ title: 'Failed to move task', description: err.message, variant: 'destructive' })
    },
  })

  // Group tasks into columns
  const columns = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.id] = (tasks || []).filter((t) => t.status === col.id)
    return acc
  }, {})

  const handleDragStart = useCallback(
    ({ active }) => {
      const task = tasks?.find((t) => t.taskId === active.id)
      setActiveTask(task || null)
    },
    [tasks]
  )

  const handleDragEnd = useCallback(
    ({ active, over }) => {
      setActiveTask(null)
      if (!over || active.id === over.id) return

      // Determine which column we dropped onto
      const overColumnId = KANBAN_COLUMNS.find((c) => c.id === over.id)?.id
        ?? tasks?.find((t) => t.taskId === over.id)?.status

      if (!overColumnId) return

      const task = tasks?.find((t) => t.taskId === active.id)
      if (!task || task.status === overColumnId) return

      // Optimistic update
      queryClient.setQueryData(queryKey, (old) =>
        (old || []).map((t) =>
          t.taskId === active.id ? { ...t, status: overColumnId } : t
        )
      )

      updateMutation.mutate({ id: active.id, status: overColumnId })
    },
    [tasks, queryKey, queryClient, updateMutation]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={columns[col.id] || []}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      {/* Ghost card shown while dragging */}
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
