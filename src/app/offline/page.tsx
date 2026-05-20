export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center max-w-md">
        <p className="text-6xl mb-4">✈️</p>
        <h1 className="text-2xl font-bold mb-2">You are offline</h1>
        <p className="text-gray-500 mb-6">
          No internet connection. Your last saved bookings are still available.
        </p>
        
          href="/my-bookings"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
        >
          View Saved Bookings
        </a>
      </div>
    </div>
  )
}