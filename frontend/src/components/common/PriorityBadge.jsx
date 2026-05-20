import { Badge } from '@/components/ui/badge'
import { TASK_PRIORITIES } from '@/utils/constants'

const variantMap = {
  low: 'secondary',
  medium: 'warning',
  high: 'orange',
  critical: 'destructive',
}

const icons = {
  low: '↓',
  medium: '→',
  high: '↑',
  critical: '⚠',
}

export default function PriorityBadge({ priority, compact = false }) {
  const found = TASK_PRIORITIES.find((p) => p.id === priority)
  const label = found?.label || priority || 'None'
  const variant = variantMap[priority] || 'secondary'
  return (
    <Badge variant={variant} className={compact ? 'px-1.5 py-0 text-[10px]' : ''}>
      {icons[priority]} {compact ? '' : label}
    </Badge>
  )
}
