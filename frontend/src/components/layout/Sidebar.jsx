import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, FolderKanban, Users, User,
  ChevronLeft, ChevronRight, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useUiStore from '@/store/uiStore'
import useAuthStore from '@/store/authStore'
import { USER_ROLES } from '@/utils/constants'
import { Avatar, AvatarFallback } from '../ui/avatar.jsx'
import { getInitials } from '@/utils/formatters'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip.jsx'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/teams', icon: Users, label: 'Teams', managerOnly: true },
  { to: '/profile', icon: User, label: 'Profile' },
]

function NavItem({ to, icon: Icon, label, collapsed }) {
  const location = useLocation()
  const active = location.pathname.startsWith(to)

  const content = (
    <NavLink
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return content
}

export default function Sidebar() {
  const { sidebarOpen: open, toggleSidebar } = useUiStore()
  const user = useAuthStore((s) => s.user)
  const isManager = user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.ADMIN

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r transition-all duration-300',
          open ? 'w-64' : 'w-16'
        )}
      >
        {/* Brand */}
        <div className={cn('flex items-center gap-2 px-4 py-5 border-b', !open && 'justify-center px-2')}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          {open && (
            <div>
              <p className="font-semibold text-sm leading-none">Mini Jira</p>
              <p className="text-xs text-muted-foreground mt-0.5">Task Manager</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {NAV_ITEMS.filter((item) => !item.managerOnly || isManager).map((item) => (
            <NavItem key={item.to} {...item} collapsed={!open} />
          ))}
        </nav>

        {/* User + collapse toggle */}
        <div className={cn('border-t px-2 py-3 space-y-2')}>
          {open && user && (
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/50">
              <Avatar className="h-7 w-7 text-xs">
                <AvatarFallback>{getInitials(user.username || user.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{user.username || 'User'}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user.role || 'member'}</p>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
