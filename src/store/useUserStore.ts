import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Session } from '@supabase/supabase-js'

interface UserStore {
  session: Session | null
  setSession: (session: Session | null) => void
  cachedBookings: any[]
  setCachedBookings: (bookings: any[]) => void
  reset: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      cachedBookings: [],
      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),
      reset: () => set({ session: null, cachedBookings: [] }),
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        session: state.session,
      }),
    }
  )
)