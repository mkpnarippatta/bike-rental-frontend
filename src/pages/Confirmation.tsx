import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { callGet } from '../api/client'

interface BookingData {
  name: string
  bike_model: string
  customer_name: string
  pickup_hub: string
  pickup_datetime: string
  return_datetime: string
  total_amount: number
  status: string
  payment_entry: string | null
}

export default function Confirmation() {
  const [searchParams] = useSearchParams()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)

  const bookingName = searchParams.get('booking')
  const paymentEntry = searchParams.get('amount')

  useEffect(() => {
    if (!bookingName) { setLoading(false); return }
    callGet<BookingData>('booking.get_booking_detail', { booking_name: bookingName })
      .then(setBooking)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [bookingName])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">&#x2705;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-500 mb-6">Your booking reference: <strong>{bookingName}</strong></p>
        <div className="flex gap-3 justify-center">
          <Link to="/bookings" className="bg-brand-500 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-brand-600 transition-colors">
            View My Bookings
          </Link>
          <Link to="/" className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">
            Browse Bikes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">&#x2705;</div>
        <h1 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h1>
        <p className="text-gray-500 mt-1">Your booking has been confirmed successfully.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Reference</span>
            <span className="font-medium text-gray-900">{booking.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Model</span>
            <span className="font-medium">{booking.bike_model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Hub</span>
            <span className="font-medium">{booking.pickup_hub}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Pickup</span>
            <span className="font-medium">{new Date(booking.pickup_datetime).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Return</span>
            <span className="font-medium">{new Date(booking.return_datetime).toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3 font-semibold">
            <span>Total Paid</span>
            <span className="text-brand-500">&#8377;{Number(booking.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {paymentEntry && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-6">
          Payment Reference: {paymentEntry}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Link to="/bookings" className="bg-brand-500 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-brand-600 transition-colors">
          View My Bookings
        </Link>
        <Link to="/" className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">
          Browse Bikes
        </Link>
      </div>
    </div>
  )
}
