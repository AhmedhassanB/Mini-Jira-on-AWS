import { useMemo } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { isOverdue, isDueToday } from '@/utils/helpers'

export function useNotifications() {
  const { user } = useAuthStore()
  const dismissedIds = useNotificationStore((s) => s.dismissedIds)
  const { data: tasks = [] } = useTasks(
    user?.role === 'Employee' && user?.teamId ? { teamId: user.teamId } : {}
  )

  const all = useMemo(() => {
    const list = []
    const active = tasks.filter((t) => t.status !== 'Done')

    active.forEach((t) => {
      if (t.deadline && isOverdue(t.deadline)) {
        list.push({
          id: `overdue_${t.taskId}`,
          type: 'overdue',
          label: 'Overdue',
          message: t.title,
          taskId: t.taskId,
          time: t.deadline,
        })
      } else if (t.deadline && isDueToday(t.deadline)) {
        list.push({
          id: `due_today_${t.taskId}`,
          type: 'due_today',
          label: 'Due Today',
          message: t.title,
          taskId: t.taskId,
          time: t.deadline,
        })
      }
    })

    // Critical unstarted tasks — only visible to managers and admins
    if (user?.role !== 'Employee') {
      active
        .filter((t) => t.priority === 'critical' && t.status === 'To Do')
        .forEach((t) => {
          if (!list.find((n) => n.taskId === t.taskId)) {
            list.push({
              id: `critical_${t.taskId}`,
              type: 'critical',
              label: 'Critical & Unstarted',
              message: t.title,
              taskId: t.taskId,
              time: t.createdAt,
            })
          }
        })
    }

    return list
  }, [tasks, user])

  const unread = all.filter((n) => !dismissedIds.includes(n.id))

  return { all, unread, count: unread.length }
}
