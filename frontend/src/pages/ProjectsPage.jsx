import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, FolderKanban, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { CardSkeleton } from '@/components/common/LoadingSkeleton'
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects'
import { useTeams } from '@/hooks/useTeams'
import { useTasks } from '@/hooks/useTasks'
import { useAuthStore } from '@/store/authStore'

function ProjectModal({ open, onOpenChange, project }) {
  const isEdit = !!project
  const { user } = useAuthStore()
  const { data: teams = [] } = useTeams()
  const [form, setForm] = useState({ name: '', description: '', teamId: '' })
  const create = useCreateProject()
  const update = useUpdateProject()
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const isPending = create.isPending || update.isPending

  useEffect(() => {
    if (open) {
      setForm({
        name: project?.name || '',
        description: project?.description || '',
        teamId: project?.teamId || '',
      })
    }
  }, [open, project])

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (!payload.teamId) delete payload.teamId
    if (!payload.description) delete payload.description
    if (isEdit) {
      update.mutate({ id: project.projectId, ...payload }, { onSuccess: () => onOpenChange(false) })
    } else {
      create.mutate(
        { ...payload, ownerId: user?.userId },
        { onSuccess: () => { setForm({ name: '', description: '', teamId: '' }); onOpenChange(false) } }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Project Name *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Project name..." required />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What is this project about?" className="h-20" />
          </div>
          <div className="space-y-1.5">
            <Label>Team</Label>
            <Select value={form.teamId || 'none'} onValueChange={(v) => set('teamId', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No team</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.teamId} value={t.teamId}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending || !form.name.trim()}>
              {isPending ? <><Loader2 size={14} className="animate-spin" /> {isEdit ? 'Saving...' : 'Creating...'}</> : (isEdit ? 'Save' : 'Create Project')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProjectCard({ project, tasks, teamName, onEdit, onDelete, isManager }) {
  const done = tasks.filter((t) => t.status === 'Done').length
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:border-primary/30 transition-colors group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/15 rounded-lg">
                <FolderKanban size={16} className="text-primary" />
              </div>
              <CardTitle className="text-base">{project.name}</CardTitle>
            </div>
            {isManager && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(project)}>
                  <Pencil size={13} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(project)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            )}
          </div>
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
          )}
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{tasks.length} tasks</span>
            <span>{done} completed</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{progress}% done</Badge>
            {teamName && <Badge variant="secondary" className="text-xs">{teamName}</Badge>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ProjectsPage() {
  const { user } = useAuthStore()
  const isManager = user?.role?.toLowerCase() === 'manager'
  const { data: projects = [], isLoading } = useProjects()
  const { data: allTasks = [] } = useTasks()
  const { data: teams = [] } = useTeams()
  const deleteProject = useDeleteProject()
  const [modalOpen, setModalOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.teamId, t.name])), [teams])

  const handleEdit = (project) => { setEditProject(project); setModalOpen(true) }
  const handleDelete = (project) => setDeleteTarget(project)
  const confirmDelete = () => {
    deleteProject.mutate(deleteTarget.projectId, { onSuccess: () => setDeleteTarget(null) })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projects"
        description="Manage your projects and track task progress."
        action={isManager && (
          <Button size="sm" onClick={() => { setEditProject(null); setModalOpen(true) }}>
            <Plus size={16} /> New Project
          </Button>
        )}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to organize tasks."
          action={isManager && <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Create Project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.projectId}
              project={p}
              tasks={allTasks.filter((t) => t.projectId === p.projectId)}
              teamName={p.teamId ? teamMap[p.teamId] : null}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isManager={isManager}
            />
          ))}
        </div>
      )}

      <ProjectModal
        open={modalOpen}
        onOpenChange={(v) => { setModalOpen(v); if (!v) setEditProject(null) }}
        project={editProject}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Project"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        loading={deleteProject.isPending}
      />
    </div>
  )
}
