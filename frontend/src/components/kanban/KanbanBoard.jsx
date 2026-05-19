import { useState, useMemo } from 'react'
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import KanbanColumn from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { useUpdateTask } from '@/hooks/useTasks'
import { KANBAN_COLUMNS } from '@/utils/constants'

export default function KanbanBoard({ tasks = [], onTaskClick, onAddTask }) {
  const [activeTask, setActiveTask] = useState(null)
  const updateTask = useUpdateTask()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const tasksByColumn = useMemo(() => {
    return KANBAN_COLUMNS.reduce((acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id)
      return acc
    }, {})
  }, [tasks])

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((t) => t.taskId === active.id) ?? null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null)
    if (!over) return

    const newStatus = over.id
    const isColumn = KANBAN_COLUMNS.some((c) => c.id === newStatus)
    if (!isColumn) return

    const task = tasks.find((t) => t.taskId === active.id)
    if (task && task.status !== newStatus) {
      updateTask.mutate({ id: task.taskId, status: newStatus })
    }
  }

  const handleDragOver = ({ active, over }) => {
    if (!over) return
    const activeTask = tasks.find((t) => t.taskId === active.id)
    const overTask = tasks.find((t) => t.taskId === over.id)
    if (!activeTask || !overTask) return
    if (activeTask.status !== overTask.status) {
      updateTask.mutate({ id: activeTask.taskId, status: overTask.status })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] ?? []}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
