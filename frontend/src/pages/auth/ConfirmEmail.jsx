import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MailCheck, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useConfirmEmail } from '@/hooks/useAuth'

export default function ConfirmEmail() {
  const location = useLocation()
  const [form, setForm] = useState({
    email: location.state?.email || '',
    code: '',
  })
  const { mutate: confirm, isPending } = useConfirmEmail()

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    confirm({ email: form.email, code: form.code })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/25">
            <Zap size={22} className="text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">Mini Jira</span>
        </div>

        <Card className="border-border/60 shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="mx-auto w-12 h-12 bg-primary/15 rounded-full flex items-center justify-center mb-2">
              <MailCheck size={24} className="text-primary" />
            </div>
            <CardTitle className="text-xl text-center">Check your email</CardTitle>
            <CardDescription className="text-center">
              We sent a 6-digit confirmation code to your email address.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code">Confirmation Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => set('code', e.target.value)}
                  placeholder="123456"
                  maxLength={8}
                  required
                  className="text-center text-lg tracking-widest font-mono"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Confirming...</>
                ) : (
                  'Confirm Email'
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already confirmed?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
