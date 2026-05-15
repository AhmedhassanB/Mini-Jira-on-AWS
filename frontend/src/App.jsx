import AppRoutes from './routes/index.jsx'
import { Toaster } from './components/ui/toaster.jsx'

export default function App() {
  return (
    <Toaster>
      <AppRoutes />
    </Toaster>
  )
}
