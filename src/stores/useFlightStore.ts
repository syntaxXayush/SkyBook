'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FlightStoreState, Flight, SearchParams, PassengerInput, SeatClass } from '@/types';

// ---- Initial state (used for clean-slate reset) ----
const initialState = {
  searchParams: null as SearchParams | null,
  selectedFlight: null as Flight | null,
  selectedClass: 'economy' as SeatClass,
  passengers: [] as PassengerInput[],
  selectedSeats: [] as string[],
};

export const useFlightStore = create<FlightStoreState>()(
  persist(
    (set) => ({
      // ---- State (spread from initialState for single source of truth) ----
      ...initialState,

      // ---- Actions ----
      setSearchParams: (params: SearchParams) =>
        set({ searchParams: params }),

      setSelectedFlight: (flight: Flight) =>
        set({ selectedFlight: flight }),

      setSelectedClass: (cls: SeatClass) =>
        set({ selectedClass: cls }),

      setPassengers: (passengers: PassengerInput[]) =>
        set({ passengers }),

      setSelectedSeats: (seats: string[]) =>
        set({ selectedSeats: seats }),

      // Partial reset: clears booking flow but keeps search params
      resetBookingFlow: () =>
        set({
          selectedFlight: null,
          selectedClass: 'economy',
          passengers: [],
          selectedSeats: [],
        }),

      // ✅ CLEAN SLATE: Full store reset.
      // Call on logout, booking completion, or when user cancels a flow.
      // Prevents stale state contaminating the next session.
      resetStore: () => set(initialState),
    }),
    {
      name: 'skybook-flight-store',
      // ✅ SECURITY: partialize explicitly maps each field, stripping
      // passengers (which contain passport numbers + nationality).
      // Even if a new sensitive field is added later, it won't leak
      // because we explicitly whitelist what gets persisted.
      partialize: (state) => ({
        searchParams: state.searchParams,
        selectedFlight: state.selectedFlight,
        selectedClass: state.selectedClass,
        selectedSeats: state.selectedSeats,
        // ❌ EXCLUDED: passengers — contains passport_number (PII!)
        // ❌ EXCLUDED: all action functions (not serializable)
      }),
    }
  )
);

// ============================================================
// ✅ SELECTIVE RE-RENDERING: Export granular selector hooks.
// Use these in components to subscribe to ONLY the state slice
// you need, preventing unnecessary re-renders.
//
// Example: const selectedClass = useSelectedClass();
//   → Only re-renders when selectedClass changes, not when
//     passengers or searchParams change.
// ============================================================
export const useSearchParams = () =>
  useFlightStore((state) => state.searchParams);

export const useSelectedFlight = () =>
  useFlightStore((state) => state.selectedFlight);

export const useSelectedClass = () =>
  useFlightStore((state) => state.selectedClass);

export const usePassengers = () =>
  useFlightStore((state) => state.passengers);

export const useSelectedSeats = () =>
  useFlightStore((state) => state.selectedSeats);
