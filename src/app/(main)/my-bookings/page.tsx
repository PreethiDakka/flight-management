'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  rescheduled: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function MyBookingsPage() {
  const router = useRouter()
  const { setCachedBookings, cachedBookings } = useUserStore()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null)
  const [alternativeFlights, setAlternativeFlights] = useState<any[]>([])
  const [loadingFlights, setLoadingFlights] = useState(false)

  // Cancel state
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  async function fetchBookings() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        flight:flights(*),
        seat:seats(*),
        passengers(*)
      `)
      .order('booked_at', { ascending: false })

    if (error) {
      setError('Failed to load bookings')
      // Use cached bookings if offline
      setBookings(cachedBookings)
    } else {
      setBookings(data || [])
      setCachedBookings(data || [])
    }
    setLoading(false)
  }

  async function handleReschedule(booking: any) {
    setReschedulingId(booking.id)
    setLoadingFlights(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('flights')
      .select('*')
      .eq('origin', booking.flight.origin)
      .eq('destination', booking.flight.destination)
      .eq('status', 'scheduled')
      .neq('id', booking.flight_id)

    setAlternativeFlights(data || [])
    setLoadingFlights(false)
  }

  async function confirmReschedule(booking: any, newFlight: any) {
    setActionLoading(true)
    const supabase = createClient()

    const feeDiff = Math.max(0, newFlight.base_price - booking.flight.base_price)

    // Insert reschedule record
    await supabase.from('reschedules').insert({
      booking_id: booking.id,
      old_flight_id: booking.flight_id,
      new_flight_id: newFlight.id,
      fee_charged: feeDiff,
    })

    // Update booking
    await supabase
      .from('bookings')
      .update({
        flight_id: newFlight.id,
        status: 'rescheduled',
        total_price: booking.total_price + feeDiff,
      })
      .eq('id', booking.id)

    setReschedulingId(null)
    setAlternativeFlights([])
    setActionLoading(false)
    fetchBookings()
  }

  async function handleCancel(bookingId: string) {
    setActionLoading(true)
    const supabase = createClient()

    const { data } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
    })

    if (!data.success) {
      setError(data.error || 'Cancellation failed')
    }

    setCancellingId(null)
    setActionLoading(false)
    fetchBookings()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <p className="text-gray-500">Loading your bookings...</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {error && (
        <p className="text-red-500 bg-red-50 p-3 rounded-lg mb-4">{error}</p>
      )}

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-4">🎫</p>
          <p className="text-xl font-semibold mb-2">No bookings yet</p>
          <p className="text-gray-500 mb-6">Search and book your first flight!</p>
          <button
            onClick={() => router.push('/search')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Search Flights
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-bold text-blue-600 text-lg">{booking.pnr_code}</span>
                  <span className={`ml-3 text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[booking.status]}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{formatDate(booking.booked_at)}</p>
              </div>

              {/* Flight info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xl font-bold">{formatTime(booking.flight.departs_at)}</p>
                  <p className="text-gray-500 text-sm">{booking.flight.origin}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-gray-400 text-sm">{booking.flight.flight_no}</p>
                  <div className="border-t border-gray-200 my-1" />
                  <p className="text-gray-400 text-xs">{formatDate(booking.flight.departs_at)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{formatTime(booking.flight.arrives_at)}</p>
                  <p className="text-gray-500 text-sm">{booking.flight.destination}</p>
                </div>
              </div>

              {/* Seat & Price */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-4">
                <p className="text-gray-600 text-sm">
                  Seat <span className="font-semibold">{booking.seat.seat_number}</span>
                  {' '}· <span className="capitalize">{booking.seat.class}</span>
                </p>
                <p className="font-bold text-blue-600">₹{booking.total_price.toLocaleString()}</p>
              </div>

              {/* Actions */}
              {booking.status !== 'cancelled' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReschedule(booking)}
                    disabled={actionLoading}
                    className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => setCancellingId(booking.id)}
                    disabled={actionLoading}
                    className="flex-1 border border-red-400 text-red-500 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Reschedule Flight Picker */}
              {reschedulingId === booking.id && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-semibold mb-3">Select a new flight:</h3>
                  {loadingFlights ? (
                    <p className="text-gray-500 text-sm">Loading flights...</p>
                  ) : alternativeFlights.length === 0 ? (
                    <p className="text-gray-500 text-sm">No alternative flights available</p>
                  ) : (
                    <div className="space-y-2">
                      {alternativeFlights.map((f) => (
                        <div key={f.id} className="flex items-center justify-between border rounded-lg p-3">
                          <div>
                            <p className="font-semibold">{f.flight_no}</p>
                            <p className="text-gray-500 text-sm">
                              {formatDate(f.departs_at)} · {formatTime(f.departs_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">₹{f.base_price.toLocaleString()}</p>
                            {f.base_price > booking.flight.base_price && (
                              <p className="text-orange-500 text-xs">
                                +₹{(f.base_price - booking.flight.base_price).toLocaleString()} fee
                              </p>
                            )}
                            <button
                              onClick={() => confirmReschedule(booking, f)}
                              disabled={actionLoading}
                              className="mt-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setReschedulingId(null)}
                    className="mt-3 text-gray-500 text-sm hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancellingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-2">Cancel Booking?</h2>
            <p className="text-gray-500 mb-6">
              This action cannot be undone. Note: cancellations within 2 hours of departure are not allowed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancellingId(null)}
                className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancel(cancellingId)}
                disabled={actionLoading}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}