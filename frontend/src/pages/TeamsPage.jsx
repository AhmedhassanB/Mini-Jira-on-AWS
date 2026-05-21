import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Users, Pencil, Trash2, Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from '@/hooks/useTeams'
import { useUsers, useAssignUserToTeam } from '@/hooks/useUsers'
import { useTasks } from '@/hooks/useTasks'
import { useAuthStore } from '@/store/authStore'

function AssignMemberModal({ open, onOpenChange, team }) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const { data: users = [] } = useUsers()
  const assign = useAssignUserToTeam()

  const handleAssign = () => {
    if (!selectedUserId) return
    assign.mutate(
      { userId: selectedUserId, teamId: team.teamId },
      { onSuccess: () => { setSelectedUserId(''); onOpenChange(false) } }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member to {team?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Select Employee</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.userId} value={u.userId}>
                    <span>{u.username || u.email}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {u.role}{u.teamId ? ` · currently assigned` : ' · unassigned'}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedUserId || assign.isPending}>
            {assign.isPending ? <><Loader2 size={14} className="animate-spin" /> Assigning...</> : 'Assign to Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TeamModal({ open, onOpenChange, team }) {
  const isEdit = !!team
  const [form, setForm] = useState({ name: '', description: '' })
  const create = useCreateTeam()
  const update = useUpdateTeam()
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const isPending = create.isPending || update.isPending

  useEffect(() => {
    if (open) {
      setForm({ name: team?.name || '', description: team?.description || '' })
    }
  }, [open, team])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isEdit) {
      update.mutate({ id: team.teamId, ...form }, { onSuccess: () => onOpenChange(false) })
    } else {
      create.mutate(form, { onSuccess: () => { setForm({ name: '', description: '' }); onOpenChange(false) } })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Team' : 'New Team'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Team Name *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Frontend Squad" required />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What does this team do?" className="h-20" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending || !form.name.trim()}>
              {isPending ? <><Loader2 size={14} className="animate-spin" /> {isEdit ? 'Saving...' : 'Creating...'}</> : (isEdit ? 'Save' : 'Create Team')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TeamCard({ team, members = [], onEdit, onDelete, onAssignMember, isAdmin }) {
  const { data: tasks = [] } = useTasks({ teamId: team.teamId })
  const done = tasks.filter((t) => t.status === 'Done').length
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length

  const visibleMembers = members.slice(0, 4)
  const extraCount = members.length - visibleMembers.length

  const getInitials = (name) =>
    (name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:border-primary/30 transition-colors group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/15 rounded-lg">
                <Users size={16} className="text-blue-500" />
              </div>
              <CardTitle className="text-base">{team.name}</CardTitle>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isAdmin && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary" title="Add member" onClick={() => onAssignMember(team)}>
                  <UserPlus size={13} />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(team)}>
                <Pencil size={13} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(team)}>
                <Trash2 size={13} />
              </Button>
            </div>
          </div>
          {team.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{team.description}</p>
          )}
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Members */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Members</p>
            {members.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No members yet</p>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex -space-x-2">
                  {visibleMembers.map((m) => (
                    <Avatar key={m.userId} className="h-7 w-7 border-2 border-card" title={m.username || m.email}>
                      <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                        {getInitials(m.username || m.email)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {visibleMembers.map((m) => (
                    <span key={m.userId} className="text-xs text-foreground">{m.username || m.email}</span>
                  ))}
                  {extraCount > 0 && (
                    <span className="text-xs text-muted-foreground">+{extraCount} more</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Task stats */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">{tasks.length} tasks</Badge>
            <Badge variant="blue" className="text-xs">{inProgress} in progress</Badge>
            <Badge variant="success" className="text-xs">{done} done</Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function TeamsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role?.toLowerCase() === 'admin'
  const { data: teams = [], isLoading } = useTeams()
  const { data: allUsers = [] } = useUsers()
  const deleteTeam = useDeleteTeam()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTeam, setEditTeam] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [assignTarget, setAssignTarget] = useState(null)

  const handleEdit = (team) => { setEditTeam(team); setModalOpen(true) }
  const handleDelete = (team) => setDeleteTarget(team)
  const handleAssignMember = (team) => setAssignTarget(team)
  const confirmDelete = () => {
    deleteTeam.mutate(deleteTarget.teamId, { onSuccess: () => setDeleteTarget(null) })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teams"
        description="Organize your workforce into teams."
        action={
          <Button size="sm" onClick={() => { setEditTeam(null); setModalOpen(true) }}>
            <Plus size={16} /> New Team
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create teams to organize members and filter tasks."
          action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Create Team</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <TeamCard
              key={t.teamId}
              team={t}
              members={allUsers.filter((u) => u.teamId === t.teamId)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAssignMember={handleAssignMember}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      <TeamModal
        open={modalOpen}
        onOpenChange={(v) => { setModalOpen(v); if (!v) setEditTeam(null) }}
        team={editTeam}
      />

      <AssignMemberModal
        open={!!assignTarget}
        onOpenChange={(v) => !v && setAssignTarget(null)}
        team={assignTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Team"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        loading={deleteTeam.isPending}
      />
    </div>
  )
}
