# ✈️ SkyBook — Flight Management Web App (PWA)

A full-stack flight management application built with **Next.js 16**, **Supabase**, **Zustand**, and **Tailwind CSS**. Passengers can search flights, book seats with a real-time interactive seat map, reschedule, and cancel bookings — all protected by Row Level Security and database-level constraints.

![SkyBook](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase) ![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?logo=typescript) ![Zustand](https://img.shields.io/badge/Zustand-5-orange) ![Tailwind](https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwindcss)

---

## 🚀 Live Demo

> **Deployed URL**: _[Add your Vercel URL here]_  
> **Test Account**: `skybook.test@example.com` / `SkyBook2026!`

---

## 📋 Features

| Feature | Status | Details |
|---------|--------|---------|
| Flight Search | ✅ | Search by origin, destination, date, and passenger count |
| Booking Flow | ✅ | Search → Results → Passengers → Seats → Confirmation with PNR |
| Interactive Seat Map | ✅ | Real-time seat grid with live Supabase Realtime subscriptions |
| Dashboard | ✅ | My Bookings with status badges (confirmed/cancelled/rescheduled) |
| Cancellation | ✅ | Cancel bookings with 2-hour departure guard (DB trigger + RPC) |
| Rescheduling | ✅ | Pick alternative flight on same route, fee calculation |
| Row Level Security | ✅ | Users can only access their own bookings |
| Zustand Persistence | ✅ | Search params and booking flow survive tab close |
| PWA | ✅ | Installable, offline-capable with service worker |
| TypeScript | ✅ | Zero type errors, no `any` usage |

---

## 🗂️ Project Structure

```
flight-manager/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing page (Hero + Search)
│   │   ├── globals.css               # Design system (glassmorphism, animations)
│   │   ├── layout.tsx                # Root layout with Navbar + Toaster
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/page.tsx        # Login page
│   │   │   ├── signup/page.tsx       # Signup page
│   │   │   └── callback/route.ts     # OAuth callback handler
│   │   ├── flights/page.tsx          # Search results (Server Component)
│   │   ├── booking/[flightId]/
│   │   │   ├── page.tsx              # Passenger details form
│   │   │   ├── seats/page.tsx        # Interactive seat map (Realtime)
│   │   │   └── confirm/page.tsx      # Booking confirmation + PNR
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # My Bookings list + Cancel
│   │   │   └── [bookingId]/
│   │   │       ├── page.tsx          # Booking detail view
│   │   │       └── reschedule/page.tsx # Reschedule flow
│   │   └── offline/page.tsx          # Offline fallback
│   ├── components/
│   │   ├── layout/Navbar.tsx         # Glass navbar with auth state
│   │   ├── flights/
│   │   │   ├── SearchForm.tsx        # Searchable airport dropdowns
│   │   │   ├── FlightCard.tsx        # Flight card with route viz
│   │   │   └── FlightResults.tsx     # Results list with sorting
│   │   ├── pwa/                      # PWA install prompt
│   │   └── ui/                       # Reusable UI components
│   ├── lib/
│   │   ├── supabase/client.ts        # Browser Supabase client
│   │   ├── supabase/server.ts        # Server Component Supabase client
│   │   ├── constants.ts              # Airports, nationalities, seat config
│   │   └── utils.ts                  # Formatters and helpers
│   ├── stores/
│   │   ├── useFlightStore.ts         # Booking flow state
│   │   └── useUserStore.ts           # Auth + cached bookings
│   ├── types/index.ts                # All TypeScript interfaces
│   └── middleware.ts                 # Auth session refresh + route protection
├── supabase/
│   ├── migrations/                   # SQL migration files (run in order)
│   │   ├── 001_schema.sql            # Tables, constraints, indexes
│   │   ├── 002_rls.sql               # Row Level Security policies
│   │   ├── 003_triggers.sql          # Cancellation 2-hour guard trigger
│   │   ├── 004_rpc.sql               # RPC: reserve_seats, cancel_booking, reschedule_booking
│   │   └── 005_seed.sql              # 8 flights, 4 routes, 1,168 seats
│   ├── schema.sql
│   ├── rls.sql
│   ├── triggers.sql
│   ├── rpc.sql
│   └── seed.sql
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service worker
│   └── icons/                        # PWA icons (192×192, 512×512)
├── .env.example                      # Environment variable template
└── package.json
```

---

## 🛠️ Local Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd flight-manager
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials (from **Settings → API**):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-key
```

### 3. Set Up Database

Run these SQL scripts **in order** in the Supabase SQL Editor:

| Order | File | Purpose |
|-------|------|---------|
| 1 | `supabase/migrations/001_schema.sql` | Creates 5 tables with constraints & indexes |
| 2 | `supabase/migrations/002_rls.sql` | Enables Row Level Security on all tables |
| 3 | `supabase/migrations/003_triggers.sql` | Adds 2-hour cancellation guard trigger |
| 4 | `supabase/migrations/004_rpc.sql` | Creates RPC functions for booking/cancel/reschedule |
| 5 | `supabase/migrations/005_seed.sql` | Seeds 8 flights + 1,168 seats |

### 4. Enable Realtime

In Supabase Dashboard → **Database → Replication**, enable Realtime on the `seats` table:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE seats;
```

### 5. Configure Auth

For development, disable email confirmations:
- Supabase Dashboard → **Auth → Settings** → Toggle off "Enable email confirmations"

### 6. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Test Credentials

Create a test account via the signup page, or use the Supabase Auth dashboard to create one:

| Field | Value |
|-------|-------|
| Email | `skybook.test@example.com` |
| Password | `SkyBook2026!` |

---

## 🏗️ Database Schema

```
┌──────────┐     ┌──────────┐     ┌───────────┐
│ flights  │────<│  seats   │     │ bookings  │
│          │     │          │     │           │
│ id (PK)  │     │ id (PK)  │  ┌─│ id (PK)   │
│ flight_no│     │flight_id │  │ │ user_id   │──> auth.users
│ origin   │     │seat_no   │  │ │ flight_id │──> flights
│ dest     │     │class     │  │ │ pnr_code  │
│ departs  │     │available │  │ │ status    │
│ arrives  │     │price     │  │ │ total_amt │
│ prices   │     └──────────┘  │ └───────────┘
│ status   │                   │       │
└──────────┘                   │       │
                               │  ┌────┴──────┐    ┌─────────────┐
                               │  │passengers │    │ reschedules │
                               │  │           │    │             │
                               │  │booking_id │    │ booking_id  │──> bookings
                               │  │full_name  │    │old_flight_id│──> flights
                               │  │passport   │    │new_flight_id│──> flights
                               │  │nationality│    │ fee         │
                               │  │seat_id    │──> seats
                               │  └───────────┘    └─────────────┘
```

### Key Security Features

| Feature | Implementation |
|---------|---------------|
| **Row Level Security** | All 5 tables have RLS enabled. Users can only access their own bookings. |
| **Seat Locking RPC** | `reserve_seats` uses `SELECT ... FOR UPDATE SKIP LOCKED` to prevent double-booking race conditions |
| **2-Hour Guard** | Cancellation blocked within 2 hours of departure — enforced in BOTH the `cancel_booking` RPC AND a DB trigger |
| **Server-side Client** | Flight search uses Server Components — API keys never exposed in client bundle |
| **Passport Exclusion** | `useFlightStore` uses `partialize` to exclude passport numbers from localStorage |

---

## 🧠 Zustand Store Architecture

### `useFlightStore` — Booking Flow State

**Purpose**: Manages the entire multi-step booking journey (search → passenger details → seat selection → confirmation).

```typescript
interface FlightStoreState {
  searchParams: SearchParams | null;    // Origin, destination, date, pax count
  selectedFlight: Flight | null;         // The flight being booked
  selectedClass: SeatClass;              // economy | business | first
  passengers: PassengerInput[];          // Name, passport, nationality per pax
  selectedSeats: string[];               // Seat UUIDs chosen in seat map
}
```

**Persist Configuration**:
```typescript
persist(storeConfig, {
  name: 'skybook-flight-store',
  partialize: (state) => ({
    searchParams: state.searchParams,     // ✅ Persisted — resume search
    selectedFlight: state.selectedFlight, // ✅ Persisted — resume booking
    selectedClass: state.selectedClass,   // ✅ Persisted — class choice
    selectedSeats: state.selectedSeats,   // ✅ Persisted — seat selection
    // ❌ EXCLUDED: passengers — contains passport_number (PII)
  }),
})
```

**Why `partialize`?** The `passengers` array contains sensitive PII (passport numbers). By explicitly whitelisting only safe fields, we ensure passport data is **never written to localStorage**, even if new fields are added later. This is a security-first design — we use an allowlist, not a blocklist.

**Reset Actions**:
- `resetBookingFlow()` — Clears flight/class/passengers/seats but keeps search params
- `resetStore()` — Full clean slate on logout or booking completion

### `useUserStore` — Auth & Cached Bookings

**Purpose**: Manages user session and provides offline-capable booking data.

```typescript
interface UserStoreState {
  user: UserProfile | null;      // Basic user info (id, email)
  cachedBookings: Booking[];     // Last-fetched bookings for offline access
  theme: 'light' | 'dark';      // UI theme preference
}
```

**Persist Configuration**:
```typescript
persist(storeConfig, {
  name: 'skybook-user-store',
  partialize: (state) => ({
    user: state.user,             // ✅ Session identity
    cachedBookings: state.cachedBookings, // ✅ Offline support
    theme: state.theme,           // ✅ UI preference
  }),
})
```

**Optimistic Updates**: The seat map uses optimistic UI — seats are visually marked as "booked" immediately upon clicking "Confirm Booking", before the Supabase RPC call completes. If the RPC fails (e.g., seat was taken), the optimistic state is reverted and the true seat state is re-fetched.

**Selector Hooks**: Both stores export granular selector hooks (e.g., `useSelectedFlight()`, `useCachedBookings()`) for selective re-rendering — components only re-render when their specific slice changes.

---

## 🔒 RPC Functions

### `reserve_seats(p_flight_id, p_user_id, p_passengers, p_seat_ids, p_booking_class)`
- Locks seats with `FOR UPDATE SKIP LOCKED` (non-blocking)
- Generates unique 6-character PNR
- Creates booking + passenger records atomically
- Returns `{ booking_id, pnr_code }`

### `cancel_booking(p_booking_id, p_user_id)`
- Verifies ownership
- Blocks cancellation within 2 hours of departure
- Sets status to 'cancelled' and frees seats atomically

### `reschedule_booking(p_booking_id, p_user_id, p_new_flight_id, p_new_seat_ids)`
- Verifies same route (origin/destination must match)
- Locks old and new seats to prevent mid-swap race
- Calculates fee = max(0, new_total - old_total)
- Creates audit record in `reschedules` table

---

## 📱 PWA Configuration

- **Manifest**: `public/manifest.json` with app name, icons (192×192, 512×512), theme color, `display: standalone`
- **Service Worker**: `public/sw.js` with:
  - `StaleWhileRevalidate` for flight search API calls
  - `CacheFirst` for static assets (CSS, JS, fonts)
  - Offline fallback page at `/offline`
- **Install Prompt**: Custom banner for first-time mobile visitors
- **Offline Bookings**: Dashboard reads from `cachedBookings` in Zustand when offline

---

## 🧪 Testing Checklist

1. **Auth**: Sign up → Verify email → Login → Redirected to dashboard
2. **Search**: DEL → DXB, pick tomorrow's date, 1 passenger → See 2 flights
3. **Book**: Select flight → Fill passenger details → Pick economy seat → Confirm → Get PNR
4. **Real-time**: Open seat map in 2 tabs → Book seat in Tab 1 → See it turn red in Tab 2
5. **Cancel**: Dashboard → Click trash icon → Confirm → Status changes, seats freed
6. **Reschedule**: Dashboard → Click refresh icon → Pick alt flight → Pick new seats → Confirm
7. **2-Hour Guard**: Try cancelling a booking with departure < 2 hours → Should be blocked
8. **PWA**: Install via Chrome → Go offline → Dashboard shows cached bookings

---

## 🏛️ Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Server Components for search | Keeps Supabase server client away from the browser |
| SECURITY DEFINER RPCs | Bypass RLS for atomic operations while enforcing ownership checks in function body |
| SKIP LOCKED vs FOR UPDATE | Non-blocking: user gets instant error instead of hanging if seat is contested |
| Throttled Realtime | Batches rapid-fire seat updates to max 1 React re-render per 200ms |
| Error Boundary on Seat Map | WebSocket disconnect doesn't crash the whole page |
| Optimistic UI for seats | Seat shows "booked" animation immediately; reverts on RPC failure |

---

## 🚧 Trade-offs & What I'd Do Differently

1. **Email verification**: Currently relies on Supabase's built-in email. For production, I'd add custom email templates and magic link login.
2. **Payment integration**: The app calculates prices but doesn't process actual payments. Stripe integration would be the natural next step.
3. **Date picker UX**: The current date picker could show which dates have available flights. I'd add a calendar view with availability indicators.
4. **Seat map performance**: For very large aircraft (300+ seats), I'd virtualize the grid with `react-window` to avoid DOM bloat.
5. **Testing**: I'd add Playwright E2E tests and Vitest unit tests for the Zustand stores and RPC functions.

---

## 📄 License

This project was built as a technical assignment submission.
