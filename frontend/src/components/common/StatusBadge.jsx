import { Badge } from '@/components/ui/badge'
import { TASK_STATUSES } from '@/utils/constants'

const variantMap = {
  'todo': 'secondary',
  'in-progress': 'blue',
  'in-review': 'warning',
  'done': 'success',
}

export default function StatusBadge({ status }) {
  const found = TASK_STATUSES.find((s) => s.id === status)
  const label = found?.label || status || 'Unknown'
  const variant = variantMap[status] || 'secondary'
  return <Badge variant={variant}>{label}</Badge>
}
