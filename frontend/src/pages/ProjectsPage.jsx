import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FolderKanban, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
import TeamSelector from '@/components/common/TeamSelector.jsx'
import { projectsApi } from '@/api/projects'
import useAuthStore from '@/store/authStore'
import { useToast } from '@/components/ui/toaster.jsx'
import { timeAgo } from '@/utils/formatters'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
  teamId: z.string().optional(),
})

function ProjectForm({ defaultValues, onSubmit, loading, submitLabel }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', teamId: '', ...defaultValues },
  })
  const teamId = watch('teamId')
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Name *</Label>
        <Input placeholder="Project name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea placeholder="What is this project about?" {...register('description')} />
      </div>
      <div className="space-y-1.5">
        <Label>Team</Label>
        <TeamSelector value={teamId} onChange={(v) => setValue('teamId', v)} placeholder="Assign to team" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}

export default function ProjectsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) =>
      projectsApi.create({ ...data, ownerId: user?.sub || user?.userId || 'unknown' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast({ title: 'Project created', variant: 'success' })
      setCreateOpen(false)
    },
    onError: (err) =>
      toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast({ title: 'Project updated', variant: 'success' })
      setEditProject(null)
    },
    onError: (err) =>
      toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast({ title: 'Project deleted' })
      setDeleteTarget(null)
    },
    onError: (err) =>
      toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to organise your team's work."
          action={{ label: 'Create Project', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.projectId} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
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
                      <DropdownMenuItem onClick={() => setEditProject(project)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(project.projectId)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">Created {timeAgo(project.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <ProjectForm
            onSubmit={(data) => createMutation.mutate(data)}
            loading={createMutation.isPending}
            submitLabel="Create Project"
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editProject} onOpenChange={() => setEditProject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
          {editProject && (
            <ProjectForm
              defaultValues={editProject}
              onSubmit={(data) => updateMutation.mutate({ id: editProject.projectId, data })}
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
        title="Delete project?"
        description="This will permanently delete the project."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
