import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X, AlertCircle, Clock, Zap, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications } from '@/hooks/useNotifications'
import { useNotificationStore } from '@/store/notificationStore'
import { formatDate } from '@/utils/helpers'

const TYPE_CONFIG = {
  overdue: {
    icon: AlertCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  due_today: {
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  critical: {
    icon: Zap,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
}

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const navigate = useNavigate()
  const { unread, count } = useNotifications()
  const { dismiss, dismissAll } = useNotificationStore()

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
              {count > 0 && (
                <span className="ml-1.5 text-muted-foreground font-normal">({count})</span>
              )}
            </h3>
            {count > 0 && (
              <button
                onClick={() => dismissAll(unread.map((n) => n.id))}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          {unread.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell size={28} className="mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="divide-y divide-border">
                {unread.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.overdue
                  const Icon = cfg.icon
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
                    >
                      <button
                        className="flex items-start gap-3 flex-1 text-left"
                        onClick={() => { navigate('/kanban'); setOpen(false) }}
                      >
                        <div className={`p-1.5 rounded-lg ${cfg.bg} shrink-0 mt-0.5`}>
                          <Icon size={13} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${cfg.color}`}>{n.label}</p>
                          <p className="text-sm text-foreground truncate">{n.message}</p>
                          {n.time && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(n.time)}
                            </p>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); dismiss(n.id) }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all shrink-0 mt-1"
                        aria-label="Dismiss"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  )
}
