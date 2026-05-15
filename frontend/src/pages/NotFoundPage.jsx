import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative">
          <p className="text-[120px] font-black text-muted/20 leading-none select-none">404</p>
          <p className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-foreground">
            Page not found
          </p>
        </div>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
          <Button asChild>
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
