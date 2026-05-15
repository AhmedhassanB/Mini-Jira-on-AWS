import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamsApi } from '@/api/teams'
import { useToast } from '@/components/ui/toaster.jsx'

const KEY = ['teams']

export function useTeams() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => teamsApi.getAll().then((r) => r.data),
  })
}

export function useTeam(id) {
  return useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getById(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (data) => teamsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      toast({ title: 'Team created', variant: 'success' })
    },
    onError: (err) =>
      toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  })
}

export function useUpdateTeam(id) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (data) => teamsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      toast({ title: 'Team updated', variant: 'success' })
    },
    onError: (err) =>
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' }),
  })
}

export function useDeleteTeam() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (id) => teamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      toast({ title: 'Team deleted' })
    },
    onError: (err) =>
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
  })
}
