'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/store/useFlightStore'

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata']

export default function SearchPage() {
  const router = useRouter()
  const { searchQuery, setSearchQuery } = useFlightStore()

  const [origin, setOrigin] = useState(searchQuery?.origin || '')
  const [destination, setDestination] = useState(searchQuery?.destination || '')
  const [date, setDate] = useState(searchQuery?.date || '')
  const [passengers, setPassengers] = useState(searchQuery?.passengers || 1)
  const [error, setError] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (origin === destination) {
      setError('Origin and destination cannot be the same')
      return
    }

    setSearchQuery({ origin, destination, date, passengers })
    router.push('/flights')
  }

  // Today's date for min date
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Find Your Flight</h1>
        <p className="text-gray-500">Search from hundreds of flights across India</p>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} className="space-y-6">

          {/* Origin & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <select
                className="input-field"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
              >
                <option value="">Select city</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <select
                className="input-field"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              >
                <option value="">Select city</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Passengers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                className="input-field"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Passengers</label>
              <select
                className="input-field"
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full text-lg">
            🔍 Search Flights
          </button>
        </form>
      </div>
    </div>
  )
}