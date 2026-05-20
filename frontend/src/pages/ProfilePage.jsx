import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Shield, Users, Edit3, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import PageHeader from '@/components/common/PageHeader'
import { useAuthStore } from '@/store/authStore'
import { useUpdateProfile } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { getInitials, displayName } from '@/utils/helpers'

const roleColors = {
  Admin: 'destructive',
  Manager: 'default',
  Employee: 'secondary',
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '' })

  const { data: tasks = [] } = useTasks(
    user?.teamId ? { assigneeId: user?.userId } : {}
  )

  const myTasks = tasks.filter((t) => t.assigneeId === user?.userId || t.assignee === user?.email)
  const completed = myTasks.filter((t) => t.status === 'Done').length
  const inProgress = myTasks.filter((t) => t.status === 'In Progress').length

  const handleSave = () => {
    if (!form.name.trim()) return
    updateProfile(form.name.trim(), { onSuccess: () => setEditing(false) })
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Profile" description="Manage your account information." />

      <div className="space-y-6">
        {/* Avatar card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 text-lg">
                <AvatarFallback className="text-2xl font-bold">
                  {getInitials(displayName(user))}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {editing ? (
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ name: e.target.value })}
                      className="h-8 text-lg font-bold w-48"
                      placeholder="Your name"
                      autoFocus
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-foreground">
                      {displayName(user)}
                    </h2>
                  )}
                  <Badge variant={roleColors[user?.role] || 'secondary'} className="text-xs">
                    {user?.role || 'Employee'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {user?.teamId && (
                  <p className="text-xs text-muted-foreground mt-1">Team: {user.teamId}</p>
                )}
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving…' : 'Save'}</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={isSaving}><X size={14} /></Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Edit3 size={14} /> Edit
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Tasks', value: myTasks.length, color: 'text-primary' },
            { label: 'In Progress', value: inProgress, color: 'text-blue-500' },
            { label: 'Completed', value: completed, color: 'text-green-500' },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Account info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <User size={16} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">User ID</p>
                <p className="text-sm font-medium font-mono text-foreground">{user?.userId || user?.sub || '—'}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Mail size={16} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{user?.email || '—'}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Shield size={16} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium text-foreground">{user?.role || 'Employee'}</p>
              </div>
            </div>
            {user?.teamId && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Users size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Team</p>
                    <p className="text-sm font-medium text-foreground">{user.teamId}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
