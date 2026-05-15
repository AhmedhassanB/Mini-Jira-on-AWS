import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select.jsx'
import { authApi } from '@/api/auth'
import { useToast } from '@/components/ui/toaster.jsx'

// Matches AWS Cognito default password policy
const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character (e.g. !@#$)')

const schema = z.object({
  username: z.string().min(3, 'Min 3 characters'),
  email: z.string().email('Valid email required'),
  password: passwordSchema,
  role: z.enum(['Manager', 'Employee']),
})

const confirmSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
})

export default function RegisterPage() {
  const [step, setStep] = useState('register') // 'register' | 'confirm'
  const [pendingEmail, setPendingEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const navigate = useNavigate()
  const { toast } = useToast()

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { role: 'Employee' } })
  const confirmForm = useForm({ resolver: zodResolver(confirmSchema) })
  const role = form.watch('role')

  const onRegister = async (data) => {
    setLoading(true)
    try {
      const res = await authApi.signup(data)
      const { userConfirmed } = res.data

      // Cognito auto-confirmed the user — skip the code step
      if (userConfirmed) {
        toast({ title: 'Account created! Please sign in.', variant: 'success' })
        navigate('/login')
        return
      }

      setPendingEmail(data.email)
      setStep('confirm')
      startResendCooldown()
      toast({
        title: 'Check your email',
        description: `A 6-digit code was sent to ${data.email}. Check your spam folder if it doesn't arrive.`,
        variant: 'success',
        duration: 6000,
      })
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err.response?.data?.details || err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const onConfirm = async (data) => {
    setLoading(true)
    try {
      await authApi.confirmSignup({ email: pendingEmail, code: data.code })
      toast({ title: 'Account confirmed! Please sign in.', variant: 'success' })
      navigate('/login')
    } catch (err) {
      toast({
        title: 'Confirmation failed',
        description: err.response?.data?.details || err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const startResendCooldown = () => {
    setResendCooldown(60)
    const timer = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(timer); return 0 }
        return s - 1
      })
    }, 1000)
  }

  const handleResend = async () => {
    try {
      await authApi.resendCode(pendingEmail)
      startResendCooldown()
      toast({ title: 'Code resent', description: 'Check your inbox and spam folder.', variant: 'success' })
    } catch (err) {
      toast({
        title: 'Resend failed',
        description: err.response?.data?.details || err.message,
        variant: 'destructive',
      })
    }
  }

  if (step === 'confirm') {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Confirm your email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <strong>{pendingEmail}</strong>.{' '}
            Check your <strong>spam / junk</strong> folder if it doesn&apos;t arrive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={confirmForm.handleSubmit(onConfirm)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Confirmation code</Label>
              <Input
                id="code"
                placeholder="Enter 6-digit code"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                {...confirmForm.register('code')}
              />
              {confirmForm.formState.errors.code && (
                <p className="text-xs text-destructive">
                  {confirmForm.formState.errors.code.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Confirming…' : 'Confirm account'}
            </Button>
          </form>

          {/* Resend + back */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <button className="text-primary hover:underline" onClick={() => setStep('register')}>
              Back to sign up
            </button>
            <button
              className="text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Join your team workspace on Mini Jira</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onRegister)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="johndoe" {...form.register('username')} />
            {form.formState.errors.username && (
              <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="e.g. MyP@ss123"
                className="pr-10"
                {...form.register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                8+ chars · uppercase · lowercase · number · special char
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => form.setValue('role', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : (
              <>
                <UserPlus className="h-4 w-4" />
                Create account
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
