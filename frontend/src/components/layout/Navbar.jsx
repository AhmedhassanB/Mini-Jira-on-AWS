import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Moon, Sun, LogOut, User, Settings } from 'lucide-react'
import { Button } from '../ui/button.jsx'
import { Avatar, AvatarFallback } from '../ui/avatar.jsx'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu.jsx'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'
import { getInitials } from '@/utils/formatters'

const BREADCRUMBS = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/projects': 'Projects',
  '/teams': 'Teams',
  '/profile': 'Profile',
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { darkMode, toggleDarkMode } = useUiStore()

  const currentPage =
    BREADCRUMBS[location.pathname] ||
    (location.pathname.startsWith('/tasks/') ? 'Task Details' : 'Page')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-6 gap-4">
      {/* Page title */}
      <h1 className="text-lg font-semibold text-foreground">{currentPage}</h1>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications (UI only) */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <Avatar className="h-8 w-8 text-xs cursor-pointer">
                <AvatarFallback>{getInitials(user?.username || user?.email || 'U')}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium text-sm">{user?.username || 'User'}</p>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
