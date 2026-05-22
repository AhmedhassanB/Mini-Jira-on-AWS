import { useState, useEffect, useMemo, useRef } from 'react'
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
import { ImagePlus, X } from 'lucide-react'
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import { useTeams } from '@/hooks/useTeams'
import { useProjects } from '@/hooks/useProjects'
import { useUsers } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/authStore'
import { TASK_STATUSES, TASK_PRIORITIES } from '@/utils/constants'

const DEFAULT_FORM = {
  title: '',
  description: '',
  status: 'To Do',
  priority: 'medium',
  teamId: '',
  projectId: '',
  deadline: '',
}

export default function CreateTaskModal({ open, onOpenChange, initialStatus, task }) {
  const isEdit = !!task
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  const { user } = useAuthStore()
  const role = user?.role?.toLowerCase()
  const isManager = role === 'manager' || role === 'admin'

  const { data: teams = [] } = useTeams()
  const { data: projects = [] } = useProjects()
  const { data: users = [] } = useUsers()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const teamMembers = useMemo(
    () => form.teamId ? users.filter((u) => u.teamId === form.teamId) : [],
    [users, form.teamId]
  )

  useEffect(() => {
    if (open) {
      setForm(
        task ? {
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'To Do',
          priority: task.priority || 'medium',
          teamId: task.teamId || '',
          projectId: task.projectId || '',
          deadline: task.deadline ? task.deadline.slice(0, 10) : '',
          assigneeId: task.assigneeId || '',
        } : { ...DEFAULT_FORM, status: initialStatus || 'To Do' }
      )
      setImageFile(null)
      setImagePreview(null)
    }
  }, [open, task])

  const availableTeams = useMemo(() => {
    if (!form.projectId) return teams
    const proj = projects.find((p) => p.projectId === form.projectId)
    return proj?.teamId ? teams.filter((t) => t.teamId === proj.teamId) : teams
  }, [teams, projects, form.projectId])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const setTeam = (val) => setForm((f) => ({ ...f, teamId: val, assigneeId: '' }))
  const setProject = (val) => {
    const proj = val ? projects.find((p) => p.projectId === val) : null
    setForm((f) => ({
      ...f,
      projectId: val,
      teamId: proj?.teamId || '',
      assigneeId: '',
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      const payload = isManager
        ? (() => {
            const p = { ...form }
            if (!p.deadline) delete p.deadline
            if (!p.teamId) delete p.teamId
            if (!p.projectId) delete p.projectId
            if (!p.assigneeId) delete p.assigneeId
            return p
          })()
        : { status: form.status }

      updateTask.mutate(
        { id: task.taskId, ...payload },
        { onSuccess: () => onOpenChange(false) }
      )
      return
    }

    // Build payload — use FormData when a photo is attached, plain object otherwise
    if (imageFile) {
      const fd = new FormData()
      fd.append('title', form.title)
      if (form.description) fd.append('description', form.description)
      fd.append('status', form.status)
      fd.append('priority', form.priority)
      fd.append('assigneeId', user.userId)
      fd.append('assigneeName', user.name || user.email || '')
      if (form.deadline) fd.append('deadline', form.deadline)
      if (form.teamId) fd.append('teamId', form.teamId)
      if (form.projectId) fd.append('projectId', form.projectId)
      if (form.assigneeId) fd.append('assigneeId', form.assigneeId)
      fd.append('file', imageFile)
      createTask.mutate(fd, {
        onSuccess: () => { setForm(DEFAULT_FORM); clearImage(); onOpenChange(false) },
      })
    } else {
      const payload = {
        ...form,
        assigneeId: form.assigneeId || user.userId,
        assigneeName: user.name || user.email,
      }
      if (!payload.deadline) delete payload.deadline
      if (!payload.teamId) delete payload.teamId
      if (!payload.projectId) delete payload.projectId
      if (!payload.assigneeId) delete payload.assigneeId
      createTask.mutate(payload, {
        onSuccess: () => { setForm(DEFAULT_FORM); onOpenChange(false) },
      })
    }
  }

  const isPending = createTask.isPending || updateTask.isPending

  if (isEdit && !isManager) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Status'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
              <Label>Team</Label>
              <Select value={form.teamId || 'none'} onValueChange={(v) => setTeam(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team</SelectItem>
                  {availableTeams.map((t) => (
                    <SelectItem key={t.teamId} value={t.teamId}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={form.projectId || 'none'} onValueChange={(v) => setProject(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.projectId} value={p.projectId}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => set('deadline', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select
                value={form.assigneeId || 'none'}
                onValueChange={(v) => set('assigneeId', v === 'none' ? '' : v)}
                disabled={!form.teamId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={form.teamId ? 'Select assignee' : 'Select a team first'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teamMembers.map((u) => (
                    <SelectItem key={u.userId} value={u.userId}>
                      {u.username || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Existing photo — edit mode read-only preview */}
          {isEdit && task?.imageUrl && (
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={task.imageUrl} alt="Attachment" className="w-full h-32 object-cover" />
              </div>
            </div>
          )}

          {/* Photo upload — managers only, create only */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Photo</Label>
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-1.5 right-1.5 bg-background/80 hover:bg-background rounded-full p-0.5 border border-border"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                >
                  <ImagePlus size={18} />
                  <span className="text-xs">Click to upload an image</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

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
