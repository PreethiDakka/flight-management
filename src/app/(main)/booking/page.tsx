'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/store/useFlightStore'
import { createClient } from '@/lib/supabase/client'
import { Seat } from '@/types'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })
}

const CLASS_COLORS: Record<string, string> = {
  first: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  business: 'bg-blue-100 border-blue-400 text-blue-800',
  economy: 'bg-gray-100 border-gray-300 text-gray-700',
}

export default function BookingPage() {
  const router = useRouter()
  const {
    selectedFlight,
    selectedSeat, setSelectedSeat,
    passengerData, setPassengerData,
    bookingStep, setBookingStep,
    resetBooking,
  } = useFlightStore()

  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedFlight) { router.push('/search'); return }
    fetchSeats()

    // Realtime subscription
    const supabase = createClient()
    const channel = supabase
      .channel('seats-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'seats',
        filter: `flight_id=eq.${selectedFlight.id}`,
      }, (payload) => {
        setSeats((prev) =>
          prev.map((s) => s.id === payload.new.id ? { ...s, ...payload.new } : s)
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchSeats() {
    const supabase = createClient()
    const { data } = await supabase
      .from('seats')
      .select('*')
      .eq('flight_id', selectedFlight!.id)
      .order('seat_number')
    setSeats(data || [])
    setLoading(false)
  }

  async function handleConfirmBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSeat || !selectedFlight || !passengerData) return
    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const totalPrice = selectedFlight.base_price + selectedSeat.extra_fee
    const pnrCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    const { data, error } = await supabase.rpc('reserve_seat', {
      p_flight_id: selectedFlight.id,
      p_seat_id: selectedSeat.id,
      p_user_id: user.id,
      p_total_price: totalPrice,
      p_pnr_code: pnrCode,
    })

    if (error || !data.success) {
      setError(data?.error || 'Booking failed. Please try again.')
      setSubmitting(false)
      return
    }

    // Save passenger details
    await supabase.from('passengers').insert({
      booking_id: data.booking_id,
      full_name: passengerData.full_name,
      passport_no: passengerData.passport_no,
      nationality: passengerData.nationality,
      dob: passengerData.dob,
    })

    router.push(`/confirmation?pnr=${pnrCode}`)
  }

  const firstClass = seats.filter(s => s.class === 'first')
  const business = seats.filter(s => s.class === 'business')
  const economy = seats.filter(s => s.class === 'economy')

  function SeatButton({ seat }: { seat: Seat }) {
    const isSelected = selectedSeat?.id === seat.id
    const isOccupied = !seat.is_available

    let className = 'w-9 h-9 text-xs font-medium rounded border-2 transition-all '

    if (isOccupied) {
      className += 'bg-red-200 border-red-300 text-red-400 cursor-not-allowed'
    } else if (isSelected) {
      className += 'bg-blue-600 border-blue-700 text-white scale-110'
    } else {
      className += CLASS_COLORS[seat.class] + ' cursor-pointer hover:scale-105'
    }

    return (
      <button
        type="button"
        className={className}
        disabled={isOccupied}
        onClick={() => !isOccupied && setSelectedSeat(isSelected ? null : seat)}
        title={isOccupied ? 'Occupied' : `${seat.class} · ₹${seat.extra_fee} extra`}
      >
        {seat.seat_number}
      </button>
    )
  }

  function SeatGrid({ seatList, label }: { seatList: Seat[], label: string }) {
    const rows: Record<string, Seat[]> = {}
    seatList.forEach(seat => {
      const row = seat.seat_number.replace(/[A-Z]/g, '')
      if (!rows[row]) rows[row] = []
      rows[row].push(seat)
    })

    return (
      <div className="mb-6">
        <h3 className="font-semibold text-sm text-gray-500 uppercase mb-3">{label}</h3>
        <div className="space-y-2 overflow-x-auto">
          {Object.entries(rows).map(([row, rowSeats]) => (
            <div key={row} className="flex items-center gap-1">
              <span className="text-xs text-gray-400 w-5 text-right">{row}</span>
              <div className="flex gap-1 ml-2">
                {rowSeats.slice(0, 3).map(s => <SeatButton key={s.id} seat={s} />)}
              </div>
              <div className="w-4" />
              <div className="flex gap-1">
                {rowSeats.slice(3).map(s => <SeatButton key={s.id} seat={s} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <p className="text-gray-500">Loading seat map...</p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      {/* Flight Summary */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="font-bold text-lg">{selectedFlight?.flight_no}</p>
          <p className="text-gray-600">{selectedFlight?.origin} → {selectedFlight?.destination}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">{formatTime(selectedFlight?.departs_at || '')}</p>
          <p className="text-gray-600">Base: ₹{selectedFlight?.base_price.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seat Map */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Select Your Seat</h2>

          {/* Legend */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300" /> Available
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-4 h-4 rounded bg-blue-600 border-2 border-blue-700" /> Selected
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-4 h-4 rounded bg-red-200 border-2 border-red-300" /> Occupied
            </div>
          </div>

          <SeatGrid seatList={firstClass} label="✨ First Class" />
          <SeatGrid seatList={business} label="💼 Business" />
          <SeatGrid seatList={economy} label="🪑 Economy" />
        </div>

        {/* Passenger Form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Passenger Details</h2>

          {selectedSeat && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="font-semibold text-blue-800">
                Seat {selectedSeat.seat_number} · {selectedSeat.class}
              </p>
              <p className="text-blue-600 text-sm">
                Total: ₹{((selectedFlight?.base_price || 0) + selectedSeat.extra_fee).toLocaleString()}
              </p>
            </div>
          )}

          <form onSubmit={handleConfirmBooking} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="As on passport"
                value={passengerData?.full_name || ''}
                onChange={(e) => setPassengerData({ ...passengerData!, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Passport Number</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. A1234567"
                value={passengerData?.passport_no || ''}
                onChange={(e) => setPassengerData({ ...passengerData!, passport_no: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nationality</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Indian"
                value={passengerData?.nationality || ''}
                onChange={(e) => setPassengerData({ ...passengerData!, nationality: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={passengerData?.dob || ''}
                onChange={(e) => setPassengerData({ ...passengerData!, dob: e.target.value })}
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={!selectedSeat || submitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Confirming...' : selectedSeat ? `Confirm Booking · ₹${((selectedFlight?.base_price || 0) + selectedSeat.extra_fee).toLocaleString()}` : 'Select a seat first'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}