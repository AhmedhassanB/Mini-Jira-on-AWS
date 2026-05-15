import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import TaskCard from './TaskCard.jsx'
import { Button } from '../ui/button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { CheckSquare } from 'lucide-react'

const COLUMN_COLORS = {
  'To Do': 'bg-slate-500',
  'In Progress': 'bg-blue-500',
  'In Review': 'bg-amber-500',
  Done: 'bg-green-500',
}

export default function KanbanColumn({ column, tasks, onTaskClick, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const taskIds = tasks.map((t) => t.taskId)

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={cn('w-2.5 h-2.5 rounded-full', COLUMN_COLORS[column.id])} />
          <span className="text-sm font-semibold text-foreground">{column.label}</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onAddTask(column.id)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[400px] rounded-xl p-2 transition-colors space-y-2',
          isOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-muted/40'
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks"
              description="Drop tasks here or add a new one."
              className="py-8"
            />
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.taskId} task={task} onClick={onTaskClick} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
