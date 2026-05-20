import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Kanban, FolderKanban, Users, User,
  BarChart3, Activity, Zap, LogOut, X, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, displayName } from '@/utils/helpers'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/kanban', icon: Kanban, label: 'Kanban Board' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/teams', icon: Users, label: 'Teams' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/activity', icon: Activity, label: 'Activity Log' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence initial={false}>
        <motion.aside
          initial={false}
          animate={{ width: open ? 240 : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="relative z-30 flex flex-col h-full overflow-hidden bg-card border-r border-border shrink-0"
        >
          <div className="flex flex-col h-full w-60">
            {/* Logo */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary rounded-lg">
                  <Zap size={16} className="text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">Mini Jira</span>
              </div>
              <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} className={cn('shrink-0', isActive ? 'text-primary' : '')} />
                      <span>{label}</span>
                      {isActive && (
                        <ChevronRight size={14} className="ml-auto text-primary" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* User section */}
            <div className="p-3 border-t border-border shrink-0">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer group">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(displayName(user))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {displayName(user)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.role || 'Employee'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>
    </>
  )
}
