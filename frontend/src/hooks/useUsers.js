import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { userService } from '@/services/userService'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
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
