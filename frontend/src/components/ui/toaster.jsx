import { createContext, useContext, useState, useCallback } from 'react'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './toast.jsx'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <Toaster />')
  return ctx
}

let _toastId = 0

// Toaster must WRAP the app so every component can call useToast()
export function Toaster({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ title, description, variant = 'default', duration = 4000 }) => {
    const id = ++_toastId
    setToasts((prev) => [...prev, { id, title, description, variant, open: true }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastProvider>
        {toasts.map(({ id, title, description, variant }) => (
          <Toast key={id} variant={variant}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            <ToastClose onClick={() => dismiss(id)} />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  )
}

