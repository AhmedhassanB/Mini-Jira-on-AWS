import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { cn } from '@/utils/cn'
import { SortableTaskCard } from './TaskCard'

export default function KanbanColumn({ column, tasks, onAddTask, onTaskClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', column.dotColor)} />
          <span className="text-sm font-semibold text-foreground">{column.title}</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask?.(column.id)}
          className="text-muted-foreground hover:text-foreground hover:bg-accent p-1 rounded transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2 p-2 rounded-xl min-h-[200px] transition-colors duration-150',
          isOver
            ? 'bg-primary/10 border-2 border-dashed border-primary/40'
            : 'bg-muted/20 border-2 border-transparent'
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.taskId)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.taskId}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">No tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}
