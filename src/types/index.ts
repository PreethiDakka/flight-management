export type FlightStatus = 'scheduled' | 'delayed' | 'cancelled' | 'completed'
export type SeatClass = 'economy' | 'business' | 'first'
export type BookingStatus = 'confirmed' | 'rescheduled' | 'cancelled'

export interface Flight {
  id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  aircraft_type: string
  status: FlightStatus
  base_price: number
}

export interface Seat {
  id: string
  flight_id: string
  seat_number: string
  class: SeatClass
  is_available: boolean
  extra_fee: number
}

export interface Booking {
  id: string
  user_id: string
  flight_id: string
  seat_id: string
  status: BookingStatus
  booked_at: string
  total_price: number
  pnr_code: string
  flight?: Flight
  seat?: Seat
  passengers?: Passenger[]
}

export interface Passenger {
  id: string
  booking_id: string
  full_name: string
  passport_no: string
  nationality: string
  dob: string
}

export interface Reschedule {
  id: string
  booking_id: string
  old_flight_id: string
  new_flight_id: string
  requested_at: string
  fee_charged: number
}

export interface SearchQuery {
  origin: string
  destination: string
  date: string
  passengers: number
}