import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      idToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken, idToken }) =>
        set({ user, accessToken, idToken, isAuthenticated: true }),

      updateUser: (userData) =>
        set((state) => ({ user: { ...state.user, ...userData } })),

      logout: () =>
        set({ user: null, accessToken: null, idToken: null, isAuthenticated: false }),
    }),
    {
      name: 'minijira-auth',
      // Only persist these fields; refresh tokens should be in http-only cookies in prod
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        idToken: state.idToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
