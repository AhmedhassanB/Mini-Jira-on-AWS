import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { projectService } from '@/services/projectService'
import { useAuthStore } from '@/store/authStore'

export function useProjects(teamId) {
  const user = useAuthStore((s) => s.user)
  const role = user?.role?.toLowerCase()

  // Employees are always scoped to their own team
  const effectiveTeamId =
    role === 'employee' ? (user?.teamId || null) : (teamId || null)

  return useQuery({
    queryKey: ['projects', { teamId: effectiveTeamId }],
    queryFn: () => (effectiveTeamId ? projectService.getByTeam(effectiveTeamId) : projectService.getAll()),
    select: (data) => (Array.isArray(data) ? data : data?.projects ?? []),
  })
}

export function useProject(id) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.getById(id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: projectService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created!')
    },
    onError: (err) => toast.error(err?.message || 'Failed to create project'),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => projectService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project updated')
    },
    onError: (err) => toast.error(err?.message || 'Failed to update project'),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted')
    },
    onError: (err) => toast.error(err?.message || 'Failed to delete project'),
  })
}
