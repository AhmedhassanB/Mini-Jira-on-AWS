import { cn } from '@/lib/utils'
import { STATUS_COLORS } from '@/utils/constants'

export default function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        STATUS_COLORS[status] || 'text-muted-foreground bg-muted border-border',
        className
      )}
    >
      {status}
    </span>
  )
}
