import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

// Decode a JWT payload without verification (for reading Cognito claims client-side)
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return {}
  }
}

// Map the /auth/me response → our internal user shape.
// Priority: DynamoDB profile (me.profile) > Cognito attributes > JWT claims.
// me.username from GetUserCommand is Cognito's internal identifier (may be a UUID)
// and must never be used as a display name.
function parseMeResponse(me, fallbackClaims = {}) {
  const attrs = me?.userAttributes || {}
  const db = me?.profile || {}  // DynamoDB profile — source of truth

  const sub = attrs.sub || fallbackClaims.sub || ''
  const email = db.email || attrs.email || fallbackClaims.email || ''
  const emailLocal = email.split('@')[0] || ''

  const name =
    db.name ||
    attrs.name ||
    fallbackClaims.name ||
    (emailLocal ? emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1) : 'User')

  return {
    userId: sub,
    email,
    name,
    role: db.role || attrs['custom:role'] || fallbackClaims['custom:role'] || 'Employee',
    teamId: db.teamId || attrs['custom:teamId'] || fallbackClaims['custom:teamId'] || '',
  }
}

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
    onSuccess: async (data) => {
      // Backend returns { accessToken, idToken, refreshToken, ... } (camelCase)
      const token = data?.accessToken || data?.tokens?.AccessToken || data?.token
      if (!token) {
        toast.error('Login failed: no access token in response')
        return
      }

      // ID token contains user attributes (name, email); access token does not
      const idClaims = data?.idToken ? decodeJwtPayload(data.idToken) : {}
      const claims = { ...idClaims, ...decodeJwtPayload(token) }

      const idToken = data?.idToken || null

      try {
        // Pre-set token so /auth/me request includes Authorization header
        useAuthStore.setState({ token })
        const me = await authService.me()
        const user = parseMeResponse(me, claims)
        setAuth(user, token, idToken)
        queryClient.clear()
        navigate('/')
        toast.success(`Welcome back, ${user.name || user.email}!`)
      } catch {
        // /auth/me failed — fall back to JWT claims so login still works
        const user = parseMeResponse({}, claims)
        setAuth(user, token, idToken)
        queryClient.clear()
        navigate('/')
        toast.success('Welcome back!')
      }
    },
    onError: (error) => {
      const msg = error?.error || error?.details || error?.message || 'Login failed'
      toast.error(msg)
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data) => authService.signup(data),
    onSuccess: (_, variables) => {
      navigate('/confirm', { state: { email: variables.email } })
      toast.success('Account created! Check your email for the confirmation code.')
    },
    onError: (error) => {
      // Backend returns { error: "...", details: "..." } on failures
      const msg = error?.error || error?.details || error?.message || 'Registration failed'
      toast.error(msg)
    },
  })
}

export function useConfirmEmail() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ email, code }) => authService.confirm(email, code),
    onSuccess: () => {
      navigate('/login')
      toast.success('Email confirmed! You can now log in.')
    },
    onError: (error) => {
      const msg = error?.error || error?.details || error?.message || 'Confirmation failed'
      toast.error(msg)
    },
  })
}

export function useUpdateProfile() {
  const updateUser = useAuthStore((s) => s.updateUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name) => authService.updateProfile(name),
    onSuccess: (data) => {
      updateUser({ name: data?.name })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile updated')
    },
    onError: (error) => {
      const msg = error?.error || error?.details || error?.message || 'Update failed'
      toast.error(msg)
    },
  })
}

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const updateUser = useAuthStore((s) => s.updateUser)
  const token = useAuthStore((s) => s.token)
  const idToken = useAuthStore((s) => s.idToken)

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const me = await authService.me()
      // ID token has email + name; access token does not — merge both as fallback
      const idClaims = idToken ? decodeJwtPayload(idToken) : {}
      const claims = { ...idClaims, ...(token ? decodeJwtPayload(token) : {}) }
      const user = parseMeResponse(me, claims)
      updateUser(user)
      return user
    },
    enabled: isAuthenticated && !!token,
    staleTime: 1000 * 60 * 10,
  })
}
