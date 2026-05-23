// ============================================================
// Types for the SkyBook Flight Management Application
// ============================================================

// ---- Database Row Types (match Supabase schema) ----

export interface Flight {
  id: string;
  flight_number: string;
  airline: string;
  origin_code: string;
  origin_city: string;
  origin_country: string;
  destination_code: string;
  destination_city: string;
  destination_country: string;
  departure_time: string;
  arrival_time: string;
  price_economy: number;
  price_business: number;
  price_first: number;
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
  created_at: string;
}

export interface Seat {
  id: string;
  flight_id: string;
  seat_number: string;
  class: SeatClass;
  is_available: boolean;
  price: number;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  flight_id: string;
  pnr_code: string;
  status: BookingStatus;
  total_amount: number;
  passenger_count: number;
  booking_class: SeatClass;
  created_at: string;
  updated_at: string;
  // Joined data
  flight?: Flight;
  passengers?: Passenger[];
}

export interface Passenger {
  id: string;
  booking_id: string;
  full_name: string;
  passport_number: string;
  nationality: string;
  seat_id: string | null;
  created_at: string;
  // Joined
  seat?: Seat;
}

export interface Reschedule {
  id: string;
  booking_id: string;
  original_flight_id: string;
  new_flight_id: string;
  fee: number;
  created_at: string;
  // Joined
  original_flight?: Flight;
  new_flight?: Flight;
}

// ---- Enums & Unions ----

export type SeatClass = 'economy' | 'business' | 'first';
export type BookingStatus = 'confirmed' | 'cancelled' | 'rescheduled';

// ---- Search / Booking Flow Types ----

export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
  passengerCount: number;
}

export interface PassengerInput {
  full_name: string;
  passport_number: string;
  nationality: string;
  seat_id?: string;
}

// ---- Airport Data ----

export interface Airport {
  code: string;
  city: string;
  country: string;
  name: string;
}

// ---- UI State ----

export interface FlightStoreState {
  searchParams: SearchParams | null;
  selectedFlight: Flight | null;
  selectedClass: SeatClass;
  passengers: PassengerInput[];
  selectedSeats: string[]; // seat IDs
  setSearchParams: (params: SearchParams) => void;
  setSelectedFlight: (flight: Flight) => void;
  setSelectedClass: (cls: SeatClass) => void;
  setPassengers: (passengers: PassengerInput[]) => void;
  setSelectedSeats: (seats: string[]) => void;
  resetBookingFlow: () => void;
  resetStore: () => void;  // Clean-slate reset on logout/completion
}

export interface UserStoreState {
  user: UserProfile | null;
  cachedBookings: Booking[];
  theme: 'light' | 'dark';
  setUser: (user: UserProfile | null) => void;
  setCachedBookings: (bookings: Booking[]) => void;
  addCachedBooking: (booking: Booking) => void;
  updateCachedBooking: (id: string, updates: Partial<Booking>) => void;
  toggleTheme: () => void;
  resetStore: () => void;  // Clean-slate reset on logout
}

export interface UserProfile {
  id: string;
  email: string;
  created_at?: string;
}
