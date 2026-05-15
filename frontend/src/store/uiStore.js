import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUiStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      darkMode: false,
      selectedTeamId: null,

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode
          if (next) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          return { darkMode: next }
        }),

      setSelectedTeam: (teamId) => set({ selectedTeamId: teamId }),
    }),
    {
      name: 'minijira-ui',
      partialize: (s) => ({ darkMode: s.darkMode, selectedTeamId: s.selectedTeamId }),
      onRehydrateStorage: () => (state) => {
        // Reapply dark mode class on page load
        if (state?.darkMode) {
          document.documentElement.classList.add('dark')
        }
      },
    }
  )
)

export default useUiStore
