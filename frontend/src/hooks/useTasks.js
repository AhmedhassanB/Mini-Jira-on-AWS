import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { taskService } from '@/services/taskService'
import { useAuthStore } from '@/store/authStore'

export function useTasks(filters = {}) {
  const user = useAuthStore((s) => s.user)
  const role = user?.role?.toLowerCase()

  // Employees are always scoped to their own team regardless of what the caller passes
  const effectiveFilters =
    role === 'employee' && user?.teamId
      ? { ...filters, teamId: user.teamId }
      : filters

  return useQuery({
    queryKey: ['tasks', effectiveFilters],
    queryFn: () => {
      if (effectiveFilters.teamId) return taskService.getByTeam(effectiveFilters.teamId)
      if (effectiveFilters.projectId) return taskService.getByProject(effectiveFilters.projectId)
      if (effectiveFilters.assigneeId) return taskService.getByAssignee(effectiveFilters.assigneeId)
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
    onError: (err) => toast.error(err?.error || err?.details || err?.message || 'Failed to create task'),
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
      toast.error(err?.error || err?.details || err?.message || 'Failed to update task')
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
