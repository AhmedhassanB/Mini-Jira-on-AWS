import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, MessageSquare, Paperclip, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '../common/StatusBadge.jsx'
import PriorityBadge from '../common/PriorityBadge.jsx'
import { Avatar, AvatarFallback } from '../ui/avatar.jsx'
import { formatDate, getInitials, truncate } from '@/utils/formatters'

export default function TaskCard({ task, onClick, isDragOverlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.taskId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-card border rounded-xl p-4 shadow-sm cursor-pointer select-none',
        'hover:shadow-md hover:border-primary/30 transition-all duration-150',
        isDragging && 'opacity-40 scale-95',
        isDragOverlay && 'shadow-xl rotate-1 ring-2 ring-primary/30'
      )}
      onClick={() => !isDragging && onClick?.(task)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Priority indicator strip */}
      <div
        className={cn(
          'absolute left-0 top-3 bottom-3 w-1 rounded-full',
          task.priority === 'High' && 'bg-red-400',
          task.priority === 'Medium' && 'bg-amber-400',
          task.priority === 'Low' && 'bg-green-400'
        )}
      />

      <div className="pl-3">
        {/* Title */}
        <p className="text-sm font-semibold text-foreground leading-snug pr-6 mb-2">
          {truncate(task.title, 60)}
        </p>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <PriorityBadge priority={task.priority} showIcon />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {task.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(task.deadline, 'MMM d')}
              </span>
            )}
            {task.imageUrl && (
              <span className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
              </span>
            )}
          </div>

          {task.assigneeId && (
            <Avatar className="h-6 w-6 text-[10px]">
              <AvatarFallback>{getInitials(task.assigneeId.slice(0, 6))}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  )
}
