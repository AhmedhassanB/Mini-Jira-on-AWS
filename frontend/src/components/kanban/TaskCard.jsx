import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, MessageSquare, Paperclip } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import PriorityBadge from '@/components/common/PriorityBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate, getInitials, isOverdue } from '@/utils/helpers'

export function TaskCard({ task, isDragging, onClick }) {
  const overdue = isOverdue(task.deadline) && task.status !== 'done'

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card border border-border rounded-lg p-3 cursor-pointer select-none',
        'hover:border-primary/40 hover:shadow-md transition-all duration-150',
        isDragging && 'opacity-40 rotate-2 shadow-xl ring-2 ring-primary/30'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-foreground line-clamp-2 flex-1 leading-snug">
          {task.title}
        </p>
        <div className="shrink-0">
          <PriorityBadge priority={task.priority} compact />
        </div>
      </div>

      {task.imageUrl && (
        <div className="mb-2 rounded-md overflow-hidden border border-border">
          <img src={task.imageUrl} alt="" className="w-full h-24 object-cover" />
        </div>
      )}

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px]">
                {getInitials(task.assignee)}
              </AvatarFallback>
            </Avatar>
          )}
          {task.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <MessageSquare size={10} />
              {task.commentCount}
            </span>
          )}
        </div>

        {task.deadline && (
          <span className={cn('flex items-center gap-1 text-[11px]', overdue ? 'text-destructive' : 'text-muted-foreground')}>
            <Calendar size={10} />
            {formatDate(task.deadline)}
          </span>
        )}
      </div>
    </div>
  )
}

export function SortableTaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.taskId,
    data: { status: task.status },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} onClick={onClick} />
    </div>
  )
}

export default TaskCard
