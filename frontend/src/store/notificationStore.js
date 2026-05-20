import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useNotificationStore = create(
  persist(
    (set) => ({
      dismissedIds: [],
      dismiss: (id) =>
        set((s) => ({ dismissedIds: [...new Set([...s.dismissedIds, id])] })),
      dismissAll: (ids) =>
        set((s) => ({ dismissedIds: [...new Set([...s.dismissedIds, ...ids])] })),
    }),
    {
      name: 'mini-jira-notifications',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
