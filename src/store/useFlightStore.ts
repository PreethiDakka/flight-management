import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SearchQuery {
  origin: string
  destination: string
  date: string
  passengers: number
}

interface Flight {
  id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  aircraft_type: string
  status: string
  base_price: number
}

interface Seat {
  id: string
  flight_id: string
  seat_number: string
  class: string
  is_available: boolean
  extra_fee: number
}

interface FlightStore {
  searchQuery: SearchQuery | null
  setSearchQuery: (query: SearchQuery) => void
  selectedFlight: Flight | null
  setSelectedFlight: (flight: Flight | null) => void
  selectedSeat: Seat | null
  setSelectedSeat: (seat: Seat | null) => void
  bookingStep: number
  setBookingStep: (step: number) => void
  passengerData: {
    full_name: string
    passport_no: string
    nationality: string
    dob: string
  } | null
  setPassengerData: (data: FlightStore['passengerData']) => void
  resetBooking: () => void
}

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      searchQuery: null,
      setSearchQuery: (query) => set({ searchQuery: query }),
      selectedFlight: null,
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),
      selectedSeat: null,
      setSelectedSeat: (seat) => set({ selectedSeat: seat }),
      bookingStep: 1,
      setBookingStep: (step) => set({ bookingStep: step }),
      passengerData: null,
      setPassengerData: (data) => set({ passengerData: data }),
      resetBooking: () => set({
        selectedFlight: null,
        selectedSeat: null,
        bookingStep: 1,
        passengerData: null,
      }),
    }),
    {
      name: 'flight-store',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        bookingStep: state.bookingStep,
      }),
    }
  )
)