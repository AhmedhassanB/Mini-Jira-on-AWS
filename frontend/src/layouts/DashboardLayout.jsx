import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import useUiStore from '../store/uiStore.js'
import { cn } from '../lib/utils.js'

export default function DashboardLayout() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div
        className={cn(
          'flex flex-col flex-1 overflow-hidden transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="max-w-screen-2xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
