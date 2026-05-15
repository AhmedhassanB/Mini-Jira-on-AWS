import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { useToast } from '@/components/ui/toaster.jsx'

const KEY = ['tasks']

export function useTasks() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => tasksApi.getAll().then((r) => r.data),
  })
}

export function useTasksByTeam(teamId) {
  return useQuery({
    queryKey: ['tasks', 'team', teamId],
    queryFn: () => tasksApi.getByTeam(teamId).then((r) => r.data),
    enabled: !!teamId,
  })
}

export function useTask(id) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getById(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (data) => tasksApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      toast({ title: 'Task created', variant: 'success' })
    },
    onError: (err) =>
      toast({ title: 'Failed to create task', description: err.message, variant: 'destructive' }),
  })
}

export function useUpdateTask(id) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (data) => tasksApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      queryClient.invalidateQueries({ queryKey: ['task', id] })
      toast({ title: 'Task updated', variant: 'success' })
    },
    onError: (err) =>
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' }),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      toast({ title: 'Task deleted' })
    },
    onError: (err) =>
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
  })
}
