export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '28rem',
        border: '1px solid #f3f4f6'
      }}>
        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>✈️</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          You are offline
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          No internet connection. Your last saved bookings are still available.
        </p>
        
          href="/my-bookings"
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          View Saved Bookings
        </a>
      </div>
    </div>
  )
}