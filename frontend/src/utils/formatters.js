import { formatDistanceToNow, format, parseISO } from 'date-fns'

export function timeAgo(dateString) {
  if (!dateString) return '—'
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
  } catch {
    return '—'
  }
}

export function formatDate(dateString, pattern = 'MMM d, yyyy') {
  if (!dateString) return '—'
  try {
    return format(parseISO(dateString), pattern)
  } catch {
    return '—'
  }
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function truncate(str, length = 80) {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '…' : str
}

export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
