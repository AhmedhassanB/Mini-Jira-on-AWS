import { useState } from 'react'
import { Avatar, AvatarFallback } from '../ui/avatar.jsx'
import { Button } from '../ui/button.jsx'
import { Textarea } from '../ui/textarea.jsx'
import { getInitials, timeAgo } from '@/utils/formatters'
import useAuthStore from '@/store/authStore'
import EmptyState from '../common/EmptyState.jsx'
import { MessageSquare, Send } from 'lucide-react'

export default function CommentSection({ comments = [], onAddComment, loading }) {
  const [text, setText] = useState('')
  const user = useAuthStore((s) => s.user)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    await onAddComment?.({ text: text.trim(), authorId: user?.sub || user?.userId })
    setText('')
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Comments
        {comments.length > 0 && (
          <span className="text-xs text-muted-foreground">({comments.length})</span>
        )}
      </h4>

      {/* Comment list */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No comments yet"
            description="Be the first to comment on this task."
            className="py-6"
          />
        ) : (
          comments.map((comment, i) => (
            <div key={comment.commentId || i} className="flex gap-3">
              <Avatar className="h-7 w-7 text-xs shrink-0">
                <AvatarFallback>
                  {getInitials(comment.authorId?.slice(0, 6) || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted rounded-xl px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">
                    {comment.authorId?.slice(0, 8) || 'User'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar className="h-7 w-7 text-xs shrink-0 mt-1.5">
          <AvatarFallback>{getInitials(user?.username || 'U')}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            className="min-h-[60px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e)
            }}
          />
          <Button type="submit" size="icon" disabled={!text.trim() || loading} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
