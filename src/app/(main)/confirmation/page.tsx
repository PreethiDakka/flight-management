'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/store/useFlightStore'
import Link from 'next/link'

export default function ConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pnr = searchParams.get('pnr')
  const { resetBooking } = useFlightStore()

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pnr) { router.push('/search'); return }
    fetchBooking()
    resetBooking()
  }, [])

  async function fetchBooking() {
    const supabase = createClient()
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        flight:flights(*),
        seat:seats(*),
        passengers(*)
      `)
      .eq('pnr_code', pnr)
      .single()

    setBooking(data)
    setLoading(false)
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    })
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <p className="text-gray-500">Loading booking details...</p>
    </div>
  )

  if (!booking) return (
    <div className="text-center py-12">
      <p className="text-gray-500">Booking not found</p>
      <Link href="/search" className="text-blue-600 hover:underline mt-4 block">
        Back to Search
      </Link>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-6">
        <div className="text-5xl mb-3">✅</div>
        <h1 className="text-2xl font-bold text-green-800 mb-1">Booking Confirmed!</h1>
        <p className="text-green-600">Your flight has been successfully booked</p>
      </div>

      {/* PNR Code */}
      <div className="bg-blue-600 text-white rounded-xl p-6 text-center mb-6">
        <p className="text-sm font-medium opacity-80 mb-1">Your PNR Code</p>
        <p className="text-4xl font-bold tracking-widest">{booking.pnr_code}</p>
        <p className="text-sm opacity-70 mt-2">Save this code to manage your booking</p>
      </div>

      {/* Flight Details */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="font-bold text-lg mb-4">Flight Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Flight</span>
            <span className="font-semibold">{booking.flight.flight_no}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Route</span>
            <span className="font-semibold">
              {booking.flight.origin} → {booking.flight.destination}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-semibold">{formatDate(booking.flight.departs_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Departure</span>
            <span className="font-semibold">{formatTime(booking.flight.departs_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Arrival</span>
            <span className="font-semibold">{formatTime(booking.flight.arrives_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Aircraft</span>
            <span className="font-semibold">{booking.flight.aircraft_type}</span>
          </div>
        </div>
      </div>

      {/* Seat Details */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="font-bold text-lg mb-4">Seat & Price</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Seat Number</span>
            <span className="font-semibold">{booking.seat.seat_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Class</span>
            <span className="font-semibold capitalize">{booking.seat.class}</span>
          </div>
          <div className="flex justify-between border-t pt-3 mt-3">
            <span className="font-bold">Total Paid</span>
            <span className="font-bold text-blue-600 text-lg">
              ₹{booking.total_price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Passenger Details */}
      {booking.passengers?.[0] && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Passenger Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-semibold">{booking.passengers[0].full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nationality</span>
              <span className="font-semibold">{booking.passengers[0].nationality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date of Birth</span>
              <span className="font-semibold">
                {new Date(booking.passengers[0].dob).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/my-bookings"
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
        >
          View My Bookings
        </Link>
        <Link
          href="/search"
          className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
        >
          Book Another Flight
        </Link>
      </div>
    </div>
  )
}