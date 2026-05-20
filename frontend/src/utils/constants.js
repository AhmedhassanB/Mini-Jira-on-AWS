export const TASK_STATUSES = [
  { id: 'To Do', label: 'To Do', color: 'bg-slate-500', textColor: 'text-slate-500' },
  { id: 'In Progress', label: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-500' },
  { id: 'In Review', label: 'In Review', color: 'bg-amber-500', textColor: 'text-amber-500' },
  { id: 'Done', label: 'Done', color: 'bg-green-500', textColor: 'text-green-500' },
]

export const TASK_PRIORITIES = [
  { id: 'low', label: 'Low', color: 'bg-slate-400', textColor: 'text-slate-400' },
  { id: 'medium', label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  { id: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-500' },
  { id: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-500' },
]

export const USER_ROLES = [
  { id: 'Employee', label: 'Employee' },
  { id: 'Manager', label: 'Manager' },
  { id: 'Admin', label: 'Admin' },
]

export const KANBAN_COLUMNS = [
  { id: 'To Do', title: 'To Do', dotColor: 'bg-slate-400' },
  { id: 'In Progress', title: 'In Progress', dotColor: 'bg-blue-500' },
  { id: 'In Review', title: 'In Review', dotColor: 'bg-amber-500' },
  { id: 'Done', title: 'Done', dotColor: 'bg-green-500' },
]

export const STATUS_BADGE_VARIANTS = {
  'To Do': 'secondary',
  'In Progress': 'blue',
  'In Review': 'warning',
  'Done': 'success',
}

export const PRIORITY_BADGE_VARIANTS = {
  low: 'secondary',
  medium: 'warning',
  high: 'orange',
  critical: 'destructive',
}
