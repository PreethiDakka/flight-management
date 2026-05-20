'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/store/useFlightStore'
import { createClient } from '@/lib/supabase/client'
import { Flight } from '@/types'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(departs: string, arrives: string) {
  const diff = new Date(arrives).getTime() - new Date(departs).getTime()
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

export default function FlightsPage() {
  const router = useRouter()
  const { searchQuery, setSelectedFlight, setBookingStep } = useFlightStore()
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!searchQuery) {
      router.push('/search')
      return
    }
    fetchFlights()
  }, [])

  async function fetchFlights() {
    const supabase = createClient()
    const date = new Date(searchQuery!.date)
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('origin', searchQuery!.origin)
      .eq('destination', searchQuery!.destination)
      .gte('departs_at', date.toISOString())
      .lt('departs_at', nextDay.toISOString())
      .eq('status', 'scheduled')

    if (error) {
      setError('Failed to fetch flights')
    } else {
      setFlights(data || [])
    }
    setLoading(false)
  }

  function handleSelect(flight: Flight) {
    setSelectedFlight(flight)
    setBookingStep(2)
    router.push('/booking')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-gray-500 text-lg">Searching flights...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {searchQuery?.origin} → {searchQuery?.destination}
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date(searchQuery?.date || '').toDateString()} · {searchQuery?.passengers} Passenger(s)
        </p>
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push('/search')}
        className="mb-6 text-blue-600 font-medium hover:underline"
      >
        ← Change Search
      </button>

      {error && (
        <p className="text-red-500 bg-red-50 p-4 rounded-lg mb-4">{error}</p>
      )}

      {flights.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-4">✈️</p>
          <p className="text-xl font-semibold mb-2">No flights found</p>
          <p className="text-gray-500">Try a different date or route</p>
          <button
            onClick={() => router.push('/search')}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Search Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {flights.map((flight) => (
            <div
              key={flight.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
            >
              {/* Flight number and aircraft */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-bold text-blue-600 text-lg">{flight.flight_no}</span>
                  <span className="text-gray-400 text-sm ml-2">{flight.aircraft_type}</span>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                  {flight.status}
                </span>
              </div>

              {/* Times */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatTime(flight.departs_at)}</p>
                  <p className="text-gray-500 text-sm">{flight.origin}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-gray-400 text-sm">{formatDuration(flight.departs_at, flight.arrives_at)}</p>
                  <div className="border-t border-gray-300 my-1 relative">
                    <span className="absolute -top-2 right-0 text-gray-400">✈</span>
                  </div>
                  <p className="text-gray-400 text-xs">Direct</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatTime(flight.arrives_at)}</p>
                  <p className="text-gray-500 text-sm">{flight.destination}</p>
                </div>
              </div>

              {/* Price and select */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">Starting from</p>
                  <p className="text-2xl font-bold text-blue-600">₹{flight.base_price.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleSelect(flight)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Select Seats →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}