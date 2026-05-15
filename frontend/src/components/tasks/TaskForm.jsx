import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'
import { Label } from '../ui/label.jsx'
import { Textarea } from '../ui/textarea.jsx'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select.jsx'
import { TASK_PRIORITY_LIST, TASK_STATUS_LIST } from '@/utils/constants'
import TeamSelector from '../common/TeamSelector.jsx'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['Low', 'Medium', 'High']),
  status: z.enum(['To Do', 'In Progress', 'In Review', 'Done']),
  teamId: z.string().min(1, 'Team is required'),
  assigneeId: z.string().optional(),
  deadline: z.string().optional(),
  projectId: z.string().optional(),
})

export default function TaskForm({ defaultValues, onSubmit, loading, submitLabel = 'Save Task' }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium',
      status: 'To Do',
      teamId: '',
      assigneeId: '',
      deadline: '',
      projectId: '',
      ...defaultValues,
    },
  })

  const teamId = watch('teamId')
  const priority = watch('priority')
  const status = watch('status')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" placeholder="Task title" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the task…"
          className="min-h-[80px]"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Priority */}
        <div className="space-y-1.5">
          <Label>Priority *</Label>
          <Select value={priority} onValueChange={(v) => setValue('priority', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITY_LIST.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setValue('status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Team */}
      <div className="space-y-1.5">
        <Label>Team *</Label>
        <TeamSelector
          value={teamId}
          onChange={(v) => setValue('teamId', v)}
        />
        {errors.teamId && <p className="text-xs text-destructive">{errors.teamId.message}</p>}
      </div>

      {/* Assignee */}
      <div className="space-y-1.5">
        <Label htmlFor="assigneeId">Assignee ID</Label>
        <Input id="assigneeId" placeholder="User ID" {...register('assigneeId')} />
      </div>

      {/* Deadline */}
      <div className="space-y-1.5">
        <Label htmlFor="deadline">Deadline</Label>
        <Input id="deadline" type="date" {...register('deadline')} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
