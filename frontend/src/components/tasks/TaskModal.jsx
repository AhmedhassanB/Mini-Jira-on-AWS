import { useState } from 'react'
import { Pencil, Trash2, Calendar, User, Tag, Layers } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import StatusBadge from '@/components/common/StatusBadge'
import PriorityBadge from '@/components/common/PriorityBadge'
import TaskComments from './TaskComments'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useDeleteTask } from '@/hooks/useTasks'
import { formatDate } from '@/utils/helpers'

export default function TaskModal({ task, open, onOpenChange, onEdit }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteTask = useDeleteTask()

  if (!task) return null

  const handleDelete = () => {
    deleteTask.mutate(task.taskId, {
      onSuccess: () => {
        setConfirmOpen(false)
        onOpenChange(false)
      },
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-8">
              <DialogTitle className="text-lg font-semibold leading-tight">
                {task.title}
              </DialogTitle>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => onEdit?.(task)} className="h-8 w-8">
                  <Pencil size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmOpen(true)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            {/* Metadata row */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.teamId && <Badge variant="outline">Team: {task.teamId}</Badge>}
              {task.projectId && <Badge variant="outline">Project: {task.projectId}</Badge>}
            </div>

            {/* Image */}
            {task.imageUrl && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={task.imageUrl} alt="Attachment" className="w-full max-h-64 object-cover" />
              </div>
            )}

            {/* Description */}
            {task.description && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</h4>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {task.assignee && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assignee</p>
                    <p className="font-medium text-foreground">{task.assignee}</p>
                  </div>
                </div>
              )}
              {task.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium text-foreground">{formatDate(task.deadline)}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Comments */}
            <TaskComments taskId={task.taskId} />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteTask.isPending}
      />
    </>
  )
}
