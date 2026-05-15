import { cn } from '@/lib/utils'
import { PRIORITY_COLORS } from '@/utils/constants'
import { AlertCircle, Minus, ChevronUp } from 'lucide-react'

const ICONS = {
  Low: Minus,
  Medium: ChevronUp,
  High: AlertCircle,
}

export default function PriorityBadge({ priority, className, showIcon = true }) {
  const Icon = ICONS[priority]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        PRIORITY_COLORS[priority] || 'text-muted-foreground bg-muted border-border',
        className
      )}
    >
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {priority}
    </span>
  )
}
