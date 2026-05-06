import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { callGet, call } from '../api/client'
import { useAuth } from '../context/AuthContext'
import PriceBreakdown from '../components/PriceBreakdown'
import LoadingSpinner from '../components/LoadingSpinner'

interface PriceResult {
  daily_rate: number
  days: number
  base_amount: number
  deposit: number
  total_due: number
}

interface CreateBookingResult {
  name: string
  total_amount: number
  status: string
  message: string
}

interface KYCStatus {
  kyc_status: string
  can_book: boolean
  message: string
  rejection_reason?: string
}

export default function Checkout() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const model = searchParams.get('model') || ''
  const hub = searchParams.get('hub') || ''
  const startDate = searchParams.get('start') || ''
  const endDate = searchParams.get('end') || ''

  const [price, setPrice] = useState<PriceResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState('')

  useEffect(() => {
    if (!model || !startDate || !endDate) {
      setLoading(false)
      return
    }
    Promise.all([
      callGet<PriceResult>('pricing.calculate_price', {
        model_name: model,
        start_date: startDate,
        end_date: endDate,
      }),
      callGet<{ name: string; payment_methods?: string[] }>('catalogue.get_hubs_list').then(
        (hubs) => hubs.find((h: { name: string }) => h.name === hub)
      ),
    ])
      .then(([p, hubInfo]) => {
        setPrice(p)
        const methods = (hubInfo as { payment_methods?: string[] } | undefined)?.payment_methods || ['Cash', 'Card', 'UPI']
        setPaymentMethods(methods)
        setPaymentMethod(methods[0] || 'Cash')
      })
      .catch(() => setError('Failed to load pricing'))
      .finally(() => setLoading(false))
  }, [model, startDate, endDate, hub])

  useEffect(() => {
    if (user?.customer?.name) {
      callGet<KYCStatus>('kyc.check_kyc_booking_status', { customer: user.customer.name })
        .then(setKycStatus)
        .catch(() => {})
    }
  }, [user])

  const handlePayAndConfirm = async () => {
    if (!model || !hub || !startDate || !endDate || !price) return
    setSubmitting(true)
    setError('')
    try {
      const booking = await call<CreateBookingResult>('booking.create_booking', {
        model,
        hub,
        start_datetime: startDate,
        end_datetime: endDate,
      })
      await call<{ status: string }>('booking.process_payment', {
        booking_name: booking.name,
        amount: booking.total_amount,
        payment_method: paymentMethod,
      })
      navigate(`/confirmation?booking=${encodeURIComponent(booking.name)}&amount=${booking.total_amount}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Booking failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!model || !hub || !startDate || !endDate) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-4xl mb-4">&#x26A0;&#xFE0F;</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Missing Booking Details</h2>
        <p className="text-gray-500 mb-4">Please select a bike and dates first.</p>
        <Link to="/" className="text-brand-500 font-medium hover:underline">Browse Bikes</Link>
      </div>
    )
  }

  const canProceed = !kycStatus || kycStatus.can_book || kycStatus.kyc_status === 'Pending Review'
  const kycBlocker = kycStatus && !kycStatus.can_book && kycStatus.kyc_status !== 'Pending Review'

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        <p className="text-gray-500 mt-1">Review your booking details</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{error}</div>
      )}

      {/* KYC Warning */}
      {kycBlocker && kycStatus && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-800 font-medium mb-1">KYC Required</p>
          <p className="text-xs text-red-700">{kycStatus.message}</p>
          {kycStatus.rejection_reason && (
            <p className="text-xs text-red-600 mt-1">Reason: {kycStatus.rejection_reason}</p>
          )}
          <Link to="/profile" className="text-xs text-red-700 font-medium underline mt-2 inline-block">
            Complete KYC
          </Link>
        </div>
      )}

      {kycStatus?.kyc_status === 'Pending Review' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-sm text-amber-800">
          {kycStatus.message}
        </div>
      )}

      {/* Booking Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Model</span>
            <span className="font-medium text-gray-900">{model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Hub</span>
            <span className="font-medium">{hub}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Pickup</span>
            <span className="font-medium">{new Date(startDate).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Return</span>
            <span className="font-medium">{new Date(endDate).toLocaleString()}</span>
          </div>
        </div>

        {price && <PriceBreakdown price={price} />}
      </div>

      {/* Payment Method */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <label
              key={method}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                paymentMethod === method
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value={method}
                checked={paymentMethod === method}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="accent-brand-500"
              />
              <span className="text-sm font-medium text-gray-900">{method}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handlePayAndConfirm}
        disabled={submitting || !canProceed || !price}
        className="w-full py-3 bg-brand-500 text-white rounded-lg font-semibold text-sm hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Processing...' : `Pay & Confirm — ₹${price?.total_due.toFixed(2) || '0.00'}`}
      </button>

      {kycStatus?.kyc_status === 'Unverified' && (
        <p className="text-xs text-gray-400 text-center mt-3">
          Complete KYC verification from your profile to proceed.
        </p>
      )}
    </div>
  )
}
