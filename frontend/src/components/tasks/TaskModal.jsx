import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../ui/dialog.jsx'
import { Button } from '../ui/button.jsx'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs.jsx'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select.jsx'
import { Separator } from '../ui/separator.jsx'
import StatusBadge from '../common/StatusBadge.jsx'
import PriorityBadge from '../common/PriorityBadge.jsx'
import CommentSection from './CommentSection.jsx'
import { tasksApi } from '@/api/tasks'
import { useToast } from '../ui/toaster.jsx'
import { TASK_STATUS_LIST, TASK_PRIORITY_LIST } from '@/utils/constants'
import { formatDate, timeAgo } from '@/utils/formatters'
import { Calendar, Clock, ImagePlus, Trash2, Edit } from 'lucide-react'
import TaskForm from './TaskForm.jsx'

export default function TaskModal({ task, open, onClose, onDelete }) {
  const [tab, setTab] = useState('details')
  const [editMode, setEditMode] = useState(false)
  const fileRef = useRef()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const updateMutation = useMutation({
    mutationFn: (data) => tasksApi.update(task.taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({ title: 'Task updated', variant: 'success' })
      setEditMode(false)
    },
    onError: (err) => toast({ title: 'Update failed', description: err.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(task.taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({ title: 'Task deleted' })
      onClose()
      onDelete?.()
    },
    onError: (err) => toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
  })

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData()
      fd.append('image', file)
      return tasksApi.uploadImage(task.taskId, fd)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({ title: 'Image uploaded', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Upload failed', description: err.message, variant: 'destructive' }),
  })

  if (!task) return null

  const handleStatusChange = (status) => updateMutation.mutate({ status })
  const handlePriorityChange = (priority) => updateMutation.mutate({ priority })
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) uploadMutation.mutate(file)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-6">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base leading-snug line-clamp-2">
                {task.title}
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2 flex-wrap">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {editMode ? (
          <div className="pt-2">
            <TaskForm
              defaultValues={task}
              onSubmit={(data) => updateMutation.mutate(data)}
              loading={updateMutation.isPending}
              submitLabel="Update Task"
            />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>

            {/* Details tab */}
            <TabsContent value="details" className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {task.description || 'No description provided.'}
              </p>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Select value={task.status} onValueChange={handleStatusChange}>
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

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Priority</p>
                  <Select value={task.priority} onValueChange={handlePriorityChange}>
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
                    <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                    <p className="flex items-center gap-1.5 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(task.deadline)}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="flex items-center gap-1.5 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {timeAgo(task.createdAt)}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Comments tab */}
            <TabsContent value="comments" className="pt-2">
              <CommentSection comments={task.comments || []} />
            </TabsContent>

            {/* Media tab */}
            <TabsContent value="media" className="pt-2">
              <div className="space-y-3">
                {task.imageUrl ? (
                  <img
                    src={task.imageUrl}
                    alt="Task attachment"
                    className="w-full rounded-lg object-cover max-h-64"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-10 text-muted-foreground">
                    <ImagePlus className="h-8 w-8 mb-2" />
                    <p className="text-sm">No image attached</p>
                  </div>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  <ImagePlus className="h-4 w-4" />
                  {uploadMutation.isPending ? 'Uploading…' : 'Upload Image'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
