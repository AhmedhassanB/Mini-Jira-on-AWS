import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { userService } from '@/services/userService'
import { useAuthStore } from '@/store/authStore'

export function useUsers() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role?.toLowerCase()
  const isPrivileged = role === 'manager' || role === 'admin'

  return useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
    enabled: isPrivileged,
    select: (data) => (Array.isArray(data) ? data : data?.users ?? []),
  })
}

export function useAssignUserToTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, teamId }) => userService.assignToTeam(userId, teamId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Member assigned to team')
    },
    onError: (err) => toast.error(err?.message || 'Failed to assign member'),
  })
}

export function useRemoveUserFromTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId) => userService.removeFromTeam(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Member removed from team')
    },
    onError: (err) => toast.error(err?.message || 'Failed to remove member'),
  })
}
