import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { taskService } from '@/services/taskService'

export function useTasks(filters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => {
      if (filters.teamId) return taskService.getByTeam(filters.teamId)
      if (filters.projectId) return taskService.getByProject(filters.projectId)
      if (filters.assigneeId) return taskService.getByAssignee(filters.assigneeId)
      return taskService.getAll()
    },
    select: (data) => (Array.isArray(data) ? data : data?.tasks ?? []),
  })
}

export function useTask(id) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskService.getById(id),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: taskService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created!')
    },
    onError: (err) => toast.error(err?.message || 'Failed to create task'),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => taskService.update(id, data),
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const snapshot = qc.getQueriesData({ queryKey: ['tasks'] })
      qc.setQueriesData({ queryKey: ['tasks'] }, (old) => {
        if (!Array.isArray(old)) return old
        return old.map((t) => (t.taskId === id ? { ...t, ...data } : t))
      })
      return { snapshot }
    },
    onError: (err, _, ctx) => {
      ctx?.snapshot?.forEach(([key, val]) => qc.setQueryData(key, val))
      toast.error(err?.message || 'Failed to update task')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: taskService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
    onError: (err) => toast.error(err?.message || 'Failed to delete task'),
  })
}
