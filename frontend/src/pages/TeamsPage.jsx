import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog.jsx'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx'
import EmptyState from '@/components/common/EmptyState.jsx'
import ConfirmDialog from '@/components/common/ConfirmDialog.jsx'
import { TableSkeleton } from '@/components/common/LoadingSkeleton.jsx'
import { teamsApi } from '@/api/teams'
import { tasksApi } from '@/api/tasks'
import { useToast } from '@/components/ui/toaster.jsx'
import { timeAgo } from '@/utils/formatters'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
})

function TeamForm({ defaultValues, onSubmit, loading, submitLabel }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', ...defaultValues },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Team Name *</Label>
        <Input placeholder="e.g. Backend Team" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea placeholder="What does this team work on?" {...register('description')} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}

export default function TeamsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTeam, setEditTeam] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll().then((r) => r.data),
  })

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => teamsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Team created', variant: 'success' })
      setCreateOpen(false)
    },
    onError: (err) =>
      toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => teamsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Team updated', variant: 'success' })
      setEditTeam(null)
    },
    onError: (err) =>
      toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => teamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Team deleted' })
      setDeleteTarget(null)
    },
    onError: (err) =>
      toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  })

  const taskCountForTeam = (teamId) =>
    allTasks.filter((t) => t.teamId === teamId).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Team
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create your first team to start organising work."
          action={{ label: 'Create Team', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => {
            const tc = taskCountForTeam(team.teamId)
            return (
              <Card key={team.teamId} className="hover:shadow-md transition-shadow group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{team.name}</CardTitle>
                        {team.description && (
                          <CardDescription className="mt-0.5 line-clamp-1">
                            {team.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTeam(team)}>
                          <Pencil className="h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(team.teamId)}
                        >
                          <Trash2 className="h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{tc} task{tc !== 1 ? 's' : ''}</span>
                    <span>Created {timeAgo(team.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Team</DialogTitle></DialogHeader>
          <TeamForm
            onSubmit={(data) => createMutation.mutate(data)}
            loading={createMutation.isPending}
            submitLabel="Create Team"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTeam} onOpenChange={() => setEditTeam(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Team</DialogTitle></DialogHeader>
          {editTeam && (
            <TeamForm
              defaultValues={editTeam}
              onSubmit={(data) => updateMutation.mutate({ id: editTeam.teamId, data })}
              loading={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget)}
        title="Delete team?"
        description="This will permanently delete the team."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
