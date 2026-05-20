import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { commentService } from '@/services/commentService'

export function useComments(taskId) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentService.getByTask(taskId),
    enabled: !!taskId,
    select: (data) => (Array.isArray(data) ? data : data?.comments ?? []),
  })
}

export function useCreateComment(taskId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => commentService.create(taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] })
    },
    onError: (err) => toast.error(err?.message || 'Failed to add comment'),
  })
}

export function useUpdateComment(taskId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, text }) => commentService.update(taskId, commentId, { text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] })
      toast.success('Comment updated')
    },
    onError: (err) => toast.error(err?.message || 'Failed to update comment'),
  })
}

export function useDeleteComment(taskId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId) => commentService.delete(taskId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] })
      toast.success('Comment deleted')
    },
    onError: (err) => toast.error(err?.message || 'Failed to delete comment'),
  })
}
