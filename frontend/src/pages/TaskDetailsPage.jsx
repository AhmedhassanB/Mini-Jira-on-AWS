import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2, Edit, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select.jsx'
import StatusBadge from '@/components/common/StatusBadge.jsx'
import PriorityBadge from '@/components/common/PriorityBadge.jsx'
import CommentSection from '@/components/tasks/CommentSection.jsx'
import ConfirmDialog from '@/components/common/ConfirmDialog.jsx'
import { PageLoader } from '@/components/common/Loader.jsx'
import { tasksApi } from '@/api/tasks'
import { useToast } from '@/components/ui/toaster.jsx'
import { TASK_STATUS_LIST, TASK_PRIORITY_LIST } from '@/utils/constants'
import { formatDate, timeAgo } from '@/utils/formatters'
import { useState } from 'react'

export default function TaskDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getById(id).then((r) => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({ title: 'Task updated', variant: 'success' })
    },
    onError: (err) =>
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({ title: 'Task deleted' })
      navigate('/tasks')
    },
    onError: (err) =>
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
  })

  if (isLoading) return <PageLoader />
  if (error || !task)
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Task not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/tasks')}>
          Back to tasks
        </Button>
      </div>
    )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-1">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl leading-snug">{task.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:text-destructive shrink-0"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {task.description || 'No description provided.'}
          </p>

          <Separator />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {/* Quick-edit status */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Status</p>
              <Select
                value={task.status}
                onValueChange={(status) => updateMutation.mutate({ status })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_LIST.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick-edit priority */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Priority</p>
              <Select
                value={task.priority}
                onValueChange={(priority) => updateMutation.mutate({ priority })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITY_LIST.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {task.deadline && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Deadline</p>
                <p className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(task.deadline)}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Created</p>
              <p className="flex items-center gap-1.5 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {timeAgo(task.createdAt)}
              </p>
            </div>
          </div>

          {task.imageUrl && (
            <>
              <Separator />
              <img
                src={task.imageUrl}
                alt="Attachment"
                className="rounded-lg max-h-64 object-cover w-full"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardContent className="p-5">
          <CommentSection comments={task.comments || []} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete task?"
        description="This action cannot be undone. The task will be permanently removed."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
