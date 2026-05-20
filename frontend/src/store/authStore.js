import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      idToken: null,
      isAuthenticated: false,
      theme: 'dark',

      setAuth: (user, token, idToken = null) => set({ user, token, idToken, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, idToken: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => ({
          user: {
            ...state.user,
            ...Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== '' && v != null)),
          },
        })),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'mini-jira-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        idToken: state.idToken,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
      }),
    }
  )
)
