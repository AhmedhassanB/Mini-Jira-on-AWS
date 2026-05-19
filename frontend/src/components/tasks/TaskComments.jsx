import { useState } from 'react'
import { Trash2, Send } from 'lucide-react'
import { useComments, useCreateComment, useDeleteComment } from '@/hooks/useComments'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { timeAgo, getInitials } from '@/utils/helpers'

export default function TaskComments({ taskId }) {
  const [text, setText] = useState('')
  const { user } = useAuthStore()
  const { data: comments = [], isLoading } = useComments(taskId)
  const createComment = useCreateComment(taskId)
  const deleteComment = useDeleteComment(taskId)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    createComment.mutate({ text: text.trim() }, { onSuccess: () => setText('') })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        Comments ({comments.length})
      </h3>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="text-[10px]">
            {getInitials(user?.name || user?.email || 'U')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[36px] h-9 py-2 text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" size="icon" disabled={!text.trim() || createComment.isPending}>
            <Send size={14} />
          </Button>
        </div>
      </form>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.commentId} className="flex gap-2 group">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {getInitials(comment.authorName || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">
                    {comment.authorName || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground">
                  {comment.text}
                </div>
              </div>
              {comment.authorId === user?.userId && (
                <button
                  onClick={() => deleteComment.mutate(comment.commentId)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all self-start mt-5"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
