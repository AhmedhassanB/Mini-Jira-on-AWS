import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/api/projects'
import { useToast } from '@/components/ui/toaster.jsx'

const KEY = ['projects']

export function useProjects() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => projectsApi.getAll().then((r) => r.data),
  })
}

export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (data) => projectsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      toast({ title: 'Project created', variant: 'success' })
    },
    onError: (err) =>
      toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  })
}

export function useUpdateProject(id) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (data) => projectsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      toast({ title: 'Project updated', variant: 'success' })
    },
    onError: (err) =>
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' }),
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (id) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      toast({ title: 'Project deleted' })
    },
    onError: (err) =>
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
  })
}
