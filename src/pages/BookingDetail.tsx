import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { callGet, call } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'

interface BookingData {
  name: string
  bike_model: string
  bike_serial: string | null
  customer_name: string
  pickup_hub: string
  return_hub: string
  pickup_datetime: string
  return_datetime: string
  status: string
  total_amount: number
  payment_entry: string | null
  invoice_ref: string | null
  invoice_paid: boolean
  outstanding_amount: number
  invoice_status: string | null
  deposit_released: number | null
  cancellation_reason: string | null
  cancellation_refund_amount: number | null
  end_km: number | null
  excess_km_charges: number | null
  late_return_fees: number | null
  damage_charges: number | null
  creation: string
  payment?: {
    name: string
    paid_amount: number
    mode_of_payment: string
    posting_date: string
  } | null
}

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-green-100 text-green-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Completed: 'bg-gray-100 text-gray-600',
  Cancelled: 'bg-red-100 text-red-800',
  Draft: 'bg-amber-100 text-amber-800',
}

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const fetchBooking = () => {
    if (!id) return
    setLoading(true)
    setError('')
    callGet<BookingData>('booking.get_booking_detail', { booking_name: id })
      .then(setBooking)
      .catch(() => setError('Booking not found'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBooking()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMakePayment = async () => {
    if (!id) return
    setPaying(true)
    setPaymentError('')
    try {
      await call('payments.pay_outstanding', { booking_name: id })
      setPaySuccess(true)
      fetchBooking() // Refresh with updated status
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Payment failed'
      setPaymentError(msg)
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading booking details..." />
  if (error) return <ErrorState message={error} onRetry={fetchBooking} />
  if (!booking) return <ErrorState message="Booking not found" />

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/bookings" className="text-sm text-brand-500 font-medium hover:underline mb-4 inline-block">
        &larr; Back to My Bookings
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Booking Detail</h1>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-500'}`}>
          {booking.status}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Booking Information</h3>
        <div className="space-y-3 text-sm">
          <Row label="Reference" value={booking.name} />
          <Row label="Bike Model" value={booking.bike_model} />
          {booking.bike_serial && <Row label="Bike Serial" value={booking.bike_serial} />}
          <Row label="Customer" value={booking.customer_name} />
          <Row label="Pickup Hub" value={booking.pickup_hub} />
          <Row label="Return Hub" value={booking.return_hub} />
          <Row label="Pickup Time" value={new Date(booking.pickup_datetime).toLocaleString()} />
          <Row label="Return Time" value={new Date(booking.return_datetime).toLocaleString()} />
          <Row label="Total Amount" value={`₹${Number(booking.total_amount).toFixed(2)}`} highlight />
          <Row label="Created" value={new Date(booking.creation).toLocaleString()} />
        </div>
      </div>

      {booking.payment && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Information</h3>
          <div className="space-y-3 text-sm">
            <Row label="Payment Entry" value={booking.payment.name} />
            <Row label="Amount" value={`₹${Number(booking.payment.paid_amount).toFixed(2)}`} highlight />
            <Row label="Mode" value={booking.payment.mode_of_payment} />
            <Row label="Date" value={new Date(booking.payment.posting_date).toLocaleDateString()} />
          </div>
        </div>
      )}

      {/* Invoice / Settlement status for completed bookings */}
      {booking.status === 'Completed' && booking.invoice_ref && !booking.invoice_paid && !paySuccess && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-amber-800 mb-2">Payment Pending</h3>
          <p className="text-sm text-amber-700 mb-1">
            Invoice <strong>{booking.invoice_ref}</strong> has an outstanding amount of{' '}
            <strong>₹{Number(booking.outstanding_amount).toFixed(2)}</strong>.
          </p>
          <p className="text-sm text-amber-600 mb-4">Please settle the payment to complete this booking.</p>
          <button
            onClick={handleMakePayment}
            disabled={paying}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-lg font-semibold text-sm hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {paying ? 'Processing...' : `Pay ₹${Number(booking.outstanding_amount).toFixed(2)}`}
          </button>
        </div>
      )}

      {booking.status === 'Completed' && booking.invoice_ref && (booking.invoice_paid || paySuccess) && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-green-700 font-semibold text-sm">Invoice {booking.invoice_ref} — Paid</span>
          </div>
        </div>
      )}

      {paymentError && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{paymentError}</div>
      )}

      {/* Charges for completed rentals */}
      {(booking.excess_km_charges || booking.late_return_fees || booking.damage_charges) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Additional Charges</h3>
          <div className="space-y-3 text-sm">
            {booking.end_km != null && <Row label="End KM" value={String(booking.end_km)} />}
            {booking.excess_km_charges != null && (
              <Row label="Excess KM Charges" value={`₹${Number(booking.excess_km_charges).toFixed(2)}`} />
            )}
            {booking.late_return_fees != null && (
              <Row label="Late Return Fees" value={`₹${Number(booking.late_return_fees).toFixed(2)}`} />
            )}
            {booking.damage_charges != null && (
              <Row label="Damage Charges" value={`₹${Number(booking.damage_charges).toFixed(2)}`} />
            )}
          </div>
        </div>
      )}

      {/* Cancellation info */}
      {booking.status === 'Cancelled' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="font-semibold text-red-800 mb-2">Booking Cancelled</h3>
          {booking.cancellation_reason && (
            <p className="text-sm text-red-700 mb-1">Reason: {booking.cancellation_reason}</p>
          )}
          {booking.cancellation_refund_amount != null && (
            <p className="text-sm text-red-700">
              Refund Amount: ₹{Number(booking.cancellation_refund_amount).toFixed(2)}
            </p>
          )}
        </div>
      )}

      {booking.deposit_released != null && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${booking.deposit_released ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
          Deposit: {booking.deposit_released ? 'Released' : 'Held'}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/bookings" className="text-sm text-brand-500 font-medium hover:underline">
          &larr; Back to My Bookings
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${highlight ? 'text-brand-500 font-semibold' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}
