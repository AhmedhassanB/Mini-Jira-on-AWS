import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ThemeToggle from './ThemeToggle'
import { useAuthStore } from '@/store/authStore'
import { getInitials, displayName } from '@/utils/helpers'
import { useTasks } from '@/hooks/useTasks'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const { data: allTasks = [] } = useTasks()

  const results = query.trim().length > 1
    ? allTasks.filter((t) => {
        const q = query.toLowerCase()
        return t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      }).slice(0, 6)
    : []

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleChange = (e) => {
    setQuery(e.target.value)
    setOpen(true)
  }

  const handleSelect = (task) => {
    setQuery('')
    setOpen(false)
    navigate('/kanban')
  }

  const handleClear = () => {
    setQuery('')
    setOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0 sticky top-0 z-10">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="shrink-0">
        <Menu size={18} />
      </Button>

      <div className="flex-1 max-w-sm relative" ref={containerRef}>
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search tasks..."
            className="pl-8 pr-8 h-8 text-sm bg-background"
            value={query}
            onChange={handleChange}
            onFocus={() => query.trim().length > 1 && setOpen(true)}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {open && results.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
            {results.map((task) => (
              <button
                key={task.taskId}
                onMouseDown={() => handleSelect(task)}
                className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
              >
                <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {open && query.trim().length > 1 && results.length === 0 && (
          <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg z-50 px-3 py-2">
            <p className="text-sm text-muted-foreground">No tasks found</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <ThemeToggle />

        <Button variant="ghost" size="icon" className="relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(displayName(user))}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{displayName(user)}</p>
                <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/analytics')}>Analytics</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
