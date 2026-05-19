import { format, formatDistanceToNow, isAfter, isBefore, startOfDay } from 'date-fns'

export function formatDate(date) {
  if (!date) return '—'
  try {
    return format(new Date(date), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export function formatDateTime(date) {
  if (!date) return '—'
  try {
    return format(new Date(date), 'MMM d, yyyy h:mm a')
  } catch {
    return '—'
  }
}

export function timeAgo(date) {
  if (!date) return ''
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return ''
  }
}

export function isOverdue(deadline) {
  if (!deadline) return false
  return isBefore(new Date(deadline), startOfDay(new Date()))
}

export function isDueToday(deadline) {
  if (!deadline) return false
  const today = startOfDay(new Date())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const d = new Date(deadline)
  return d >= today && d < tomorrow
}

// Single source of truth for user display name across all UI components
export function displayName(user) {
  if (!user) return 'User'
  return (
    user.name ||
    user.preferred_username ||
    (user.email ? user.email.split('@')[0] : null) ||
    'User'
  )
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str, length = 60) {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '…' : str
}

export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

export function sortTasks(tasks, sortBy = 'createdAt', order = 'desc') {
  return [...tasks].sort((a, b) => {
    const aVal = a[sortBy] ?? ''
    const bVal = b[sortBy] ?? ''
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return order === 'desc' ? -cmp : cmp
  })
}

export function filterTasks(tasks, filters = {}) {
  return tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false
    if (filters.priority && task.priority !== filters.priority) return false
    if (filters.teamId && task.teamId !== filters.teamId) return false
    if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      return (
        task.title?.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q)
      )
    }
    return true
  })
}
