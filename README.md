# ✈️ FlightApp — Flight Management App

A full-stack flight booking web application built with Next.js, Supabase, and Zustand.

## 🚀 Live Demo
Coming soon

## 🛠️ Tech Stack
- **Frontend:** Next.js 16 (App Router), Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + RLS + Realtime)
- **State Management:** Zustand with persist middleware

## ✨ Features
- 🔍 Search flights by origin, destination and date
- 💺 Interactive seat map with real-time availability updates
- 🎫 Instant booking with auto-generated PNR code
- 📋 My Bookings — view, reschedule, or cancel bookings
- 🔒 Secure authentication with Supabase Auth
- 🚫 Cancellations blocked within 2 hours of departure (DB enforced)
- ⚡ Double-booking prevented with seat-locking RPC function

## 📁 Project Structure
src/
app/
(auth)/        → login, register pages
(main)/        → search, flights, booking, confirmation, my-bookings
components/      → reusable UI components
lib/supabase/    → client, server setup
store/           → Zustand stores
types/           → TypeScript interfaces
supabase/
migrations/      → SQL migration files

## ⚙️ Local Setup

1. Clone the repo:
```bash
   git clone https://github.com/YOURUSERNAME/flight-management.git
   cd flight-management
```

2. Install dependencies:
```bash
   npm install
```

3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
```bash
   cp .env.example .env.local
```

4. Run the migration SQL from `/supabase/migrations/001_initial.sql` in your Supabase SQL Editor

5. Start the dev server:
```bash
   npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 🔑 Test Account
- **Email:** test@flightapp.com
- **Password:** Test@1234

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `flights` | Flight schedules, routes, pricing |
| `seats` | Seat map per flight with availability |
| `bookings` | User bookings with PNR code |
| `passengers` | Passenger details per booking |
| `reschedules` | Reschedule history with fees charged |

## 🧠 Zustand Store Structure

### useFlightStore
| Field | Persisted | Description |
|-------|-----------|-------------|
| `searchQuery` | ✅ Yes | Current search parameters |
| `selectedFlight` | ✅ Yes | Chosen flight |
| `selectedSeat` | ✅ Yes | Chosen seat |
| `bookingStep` | ✅ Yes | Current step in booking flow |
| `passengerData` | ❌ No | Excluded — contains passport number |

### useUserStore
| Field | Persisted | Description |
|-------|-----------|-------------|
| `session` | ✅ Yes | Supabase auth session token |
| `cachedBookings` | ❌ No | Last fetched bookings for offline use |

## 🔐 Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own bookings
- Passport numbers never stored in localStorage
- Service role key never exposed to the client
- Seat reservation uses DB-level locking to prevent race conditions