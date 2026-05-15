export const TASK_STATUS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
}

export const TASK_STATUS_LIST = Object.values(TASK_STATUS)

export const TASK_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export const TASK_PRIORITY_LIST = Object.values(TASK_PRIORITY)

export const USER_ROLES = {
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
  ADMIN: 'Admin',
}

export const KANBAN_COLUMNS = [
  { id: TASK_STATUS.TODO, label: 'To Do', color: 'bg-slate-500' },
  { id: TASK_STATUS.IN_PROGRESS, label: 'In Progress', color: 'bg-blue-500' },
  { id: TASK_STATUS.IN_REVIEW, label: 'In Review', color: 'bg-amber-500' },
  { id: TASK_STATUS.DONE, label: 'Done', color: 'bg-green-500' },
]

export const PRIORITY_COLORS = {
  Low: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
  Medium: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  High: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
}

export const STATUS_COLORS = {
  'To Do': 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  'In Progress': 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  'In Review': 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  Done: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
}

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
