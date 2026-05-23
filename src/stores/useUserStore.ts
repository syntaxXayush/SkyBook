'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserStoreState, UserProfile, Booking } from '@/types';

// ---- Initial state for clean-slate resets ----
const initialState = {
  user: null as UserProfile | null,
  cachedBookings: [] as Booking[],
  theme: 'dark' as const,
};

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      // ---- State ----
      ...initialState,

      // ---- Actions ----
      setUser: (user: UserProfile | null) =>
        set({ user }),

      setCachedBookings: (bookings: Booking[]) =>
        set({ cachedBookings: bookings }),

      addCachedBooking: (booking: Booking) =>
        set((state) => ({
          cachedBookings: [booking, ...state.cachedBookings],
        })),

      updateCachedBooking: (id: string, updates: Partial<Booking>) =>
        set((state) => ({
          cachedBookings: state.cachedBookings.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      // ✅ CLEAN SLATE: Wipe everything on logout.
      // Clears user identity + cached bookings so the next user
      // doesn't see stale data from a previous session.
      resetStore: () => set(initialState),
    }),
    {
      name: 'skybook-user-store',
      // Persist user info (without auth tokens), cached bookings
      // (for offline support / StaleWhileRevalidate), and theme pref.
      partialize: (state) => ({
        user: state.user,
        cachedBookings: state.cachedBookings,
        theme: state.theme,
      }),
    }
  )
);

// ============================================================
// Selector hooks for selective re-rendering
// ============================================================
export const useUser = () =>
  useUserStore((state) => state.user);

export const useCachedBookings = () =>
  useUserStore((state) => state.cachedBookings);
