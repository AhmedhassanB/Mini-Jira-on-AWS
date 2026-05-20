import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import { useTeams } from '@/hooks/useTeams'
import { TASK_STATUSES, TASK_PRIORITIES } from '@/utils/constants'

const DEFAULT_FORM = {
  title: '',
  description: '',
  status: 'To Do',
  priority: 'medium',
  assignee: '',
  deadline: '',
  teamId: '',
  projectId: '',
}

export default function CreateTaskModal({ open, onOpenChange, initialStatus, task }) {
  const isEdit = !!task
  const [form, setForm] = useState(
    task ? {
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'To Do',
      priority: task.priority || 'medium',
      assignee: task.assignee || '',
      deadline: task.deadline ? task.deadline.slice(0, 10) : '',
      teamId: task.teamId || '',
      projectId: task.projectId || '',
    } : { ...DEFAULT_FORM, status: initialStatus || 'To Do' }
  )

  const { data: teams = [] } = useTeams()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (!payload.deadline) delete payload.deadline
    if (!payload.teamId) delete payload.teamId
    if (!payload.projectId) delete payload.projectId
    if (!payload.assignee) delete payload.assignee

    if (isEdit) {
      updateTask.mutate(
        { id: task.taskId, ...payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createTask.mutate(payload, { onSuccess: () => { setForm(DEFAULT_FORM); onOpenChange(false) } })
    }
  }

  const isPending = createTask.isPending || updateTask.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Task title..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Add more details..."
              className="h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                value={form.assignee}
                onChange={(e) => set('assignee', e.target.value)}
                placeholder="Name or email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => set('deadline', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select value={form.teamId || 'none'} onValueChange={(v) => set('teamId', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.teamId} value={t.teamId}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                value={form.projectId}
                onChange={(e) => set('projectId', e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !form.title.trim()}>
              {isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Task')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
