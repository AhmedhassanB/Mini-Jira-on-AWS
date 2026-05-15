import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import useAuthStore from '@/store/authStore'
import { useToast } from '@/components/ui/toaster.jsx'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (credentials) => authApi.login(credentials).then((r) => r.data),
    onSuccess: ({ user, accessToken, idToken }) => {
      setAuth({ user, accessToken, idToken })
      toast({ title: `Welcome back, ${user.username || 'User'}!`, variant: 'success' })
      navigate('/dashboard')
    },
    onError: (err) =>
      toast({
        title: 'Login failed',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      }),
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  return () => {
    logout()
    navigate('/login')
  }
}
