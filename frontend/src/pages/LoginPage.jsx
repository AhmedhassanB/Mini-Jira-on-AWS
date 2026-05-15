import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx'
import { authApi } from '@/api/auth'
import useAuthStore from '@/store/authStore'
import { useToast } from '@/components/ui/toaster.jsx'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Minimum 8 characters').max(256),
})

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      const { accessToken, idToken, user } = res.data
      setAuth({ user, accessToken, idToken })
      toast({ title: 'Welcome back!', variant: 'success' })
      navigate('/dashboard')
    } catch (err) {
      toast({
        title: 'Login failed',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Enter your credentials to access your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign in
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
