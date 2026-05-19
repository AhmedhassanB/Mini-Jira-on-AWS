import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { teamService } from '@/services/teamService'

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: teamService.getAll,
    select: (data) => (Array.isArray(data) ? data : data?.teams ?? []),
  })
}

export function useTeam(id) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => teamService.getById(id),
    enabled: !!id,
  })
}

export function useCreateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: teamService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Team created!')
    },
    onError: (err) => toast.error(err?.message || 'Failed to create team'),
  })
}

export function useUpdateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => teamService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Team updated')
    },
    onError: (err) => toast.error(err?.message || 'Failed to update team'),
  })
}

export function useDeleteTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: teamService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Team deleted')
    },
    onError: (err) => toast.error(err?.message || 'Failed to delete team'),
  })
}
