import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/search" className="text-xl font-bold text-blue-600">
            ✈️ FlightApp
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/search" className="text-sm font-medium text-gray-600 hover:text-blue-600">
              Search
            </Link>
            <Link href="/my-bookings" className="text-sm font-medium text-gray-600 hover:text-blue-600">
              My Bookings
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm font-medium text-red-500 hover:text-red-600">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}