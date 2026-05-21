import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { callGet } from '../api/client'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

interface Booking {
  name: string
  bike_model: string
  pickup_hub: string
  status: string
  payment_status: string | null
  outstanding_amount: number | null
  pickup_datetime: string
  return_datetime: string
  total_amount: number
  creation: string
}

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-green-100 text-green-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Completed: 'bg-gray-100 text-gray-600',
  Cancelled: 'bg-red-100 text-red-800',
  Draft: 'bg-amber-100 text-amber-800',
}

export default function MyBookings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const statusFilter = searchParams.get('status') || ''

  const fetchBookings = useCallback(async () => {
    if (!user?.customer?.name) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = { customer_name: user.customer.name }
      if (statusFilter) params.status = statusFilter
      const data = await callGet<Booking[]>('booking.get_customer_bookings', params)
      setBookings(data || [])
    } catch {
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [user, statusFilter])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const filters = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'Active' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              if (f.value) {
                setSearchParams({ status: f.value })
              } else {
                setSearchParams({})
              }
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === f.value
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading bookings..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBookings} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No bookings found"
          description={statusFilter ? `No ${statusFilter.toLowerCase()} bookings.` : "You haven't made any bookings yet."}
          action={{ label: 'Browse Bikes', onClick: () => window.location.href = '/' }}
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Link
              key={b.name}
              to={`/bookings/${b.name}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{b.bike_model}</h3>
                  <p className="text-xs text-gray-500">{b.pickup_hub}</p>
                </div>
                <div className="flex items-center gap-2">
                  {b.status === 'Completed' && b.payment_status === 'Unpaid' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Payment Due
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-500'}`}>
                    {b.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {new Date(b.pickup_datetime).toLocaleDateString()} - {new Date(b.return_datetime).toLocaleDateString()}
                </span>
                <span className="font-semibold text-gray-900">
                  &#8377;{Number(b.total_amount).toFixed(0)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
