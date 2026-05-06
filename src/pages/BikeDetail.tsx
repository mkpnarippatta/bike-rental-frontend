import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { callGet } from '../api/client'
import PriceBreakdown from '../components/PriceBreakdown'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'

interface BikeDetailData {
  name: string
  brand: string
  category: string
  base_rate_daily: number
  description: string
  image: string
  total_serials: number
  hubs: string[]
}

interface AvailabilityResult {
  total: number
  occupied: number
  available: number
  safety_margin: number
}

interface PriceResult {
  daily_rate: number
  days: number
  base_amount: number
  deposit: number
  total_due: number
}

function roundToNext30Min(d: Date): Date {
  const ms = 30 * 60 * 1000
  return new Date(Math.ceil(d.getTime() / ms) * ms)
}

function toLocalDatetimeValue(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${da}T${h}:${mi}`
}

export default function BikeDetail() {
  const { model } = useParams<{ model: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [bike, setBike] = useState<BikeDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const defaultStart = toLocalDatetimeValue(roundToNext30Min(new Date()))
  const defaultEnd = toLocalDatetimeValue(new Date(new Date(defaultStart).getTime() + 24 * 60 * 60 * 1000))

  const [startDate, setStartDate] = useState(searchParams.get('start') || defaultStart)
  const [endDate, setEndDate] = useState(searchParams.get('end') || defaultEnd)
  const [selectedHub, setSelectedHub] = useState(searchParams.get('hub') || '')
  const [price, setPrice] = useState<PriceResult | null>(null)
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!model) return
    setLoading(true)
    callGet<BikeDetailData>('catalogue.get_bike_detail', { model_name: model })
      .then((data) => {
        setBike(data)
        if (data.hubs.length > 0 && !selectedHub) {
          setSelectedHub(data.hubs[0])
        }
      })
      .catch(() => setError('Bike not found'))
      .finally(() => setLoading(false))
  }, [model]) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAvailability = useCallback(async () => {
    if (!model || !selectedHub || !startDate || !endDate) return
    setChecking(true)
    try {
      const [avail, pr] = await Promise.all([
        callGet<AvailabilityResult>('availability.check_availability', {
          hub: selectedHub,
          model,
          start_datetime: startDate,
          end_datetime: endDate,
        }),
        callGet<PriceResult>('pricing.calculate_price', {
          model_name: model,
          start_date: startDate,
          end_date: endDate,
        }),
      ])
      setAvailability(avail)
      setPrice(pr)
    } catch {
      // ignore
    } finally {
      setChecking(false)
    }
  }, [model, selectedHub, startDate, endDate])

  useEffect(() => {
    if (startDate && endDate && selectedHub) {
      checkAvailability()
    }
  }, [startDate, endDate, selectedHub, checkAvailability])

  const handleBookNow = () => {
    if (!model || !startDate || !endDate || !selectedHub) return
    const params = new URLSearchParams({
      model,
      start: startDate,
      end: endDate,
      hub: selectedHub,
    })
    navigate(`/checkout?${params.toString()}`)
  }

  if (loading) return <LoadingSpinner text="Loading bike details..." />
  if (error) return <ErrorState message={error} />
  if (!bike) return <ErrorState message="Bike not found" />

  const isAvailable = availability ? availability.available > 0 : false

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Image & Specs */}
        <div>
          <div className="bg-gray-100 rounded-xl flex items-center justify-center p-12 mb-6">
            {bike.image ? (
              <img src={bike.image} alt={bike.name} className="max-w-full max-h-72 object-contain" />
            ) : (
              <span style={{ fontSize: '80px' }}>&#x1F6B2;</span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">{bike.name}</h1>
          {bike.brand && <p className="text-gray-500 mb-4">{bike.brand}</p>}

          <div className="flex gap-2 flex-wrap mb-5">
            {bike.category && (
              <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600">{bike.category}</span>
            )}
            <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600">{bike.total_serials} in fleet</span>
          </div>

          {bike.description && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{bike.description}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Available at</h4>
            <ul className="space-y-1">
              {bike.hubs.map((hub) => (
                <li key={hub} className="text-sm text-gray-600">&#x1F4CD; {hub}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Booking Widget */}
        <div>
          <div className="border border-gray-200 rounded-xl p-6 bg-white sticky top-24">
            <div className="flex justify-between items-center mb-5">
              <div>
                <span className="text-2xl font-bold text-brand-500">
                  &#8377;{Math.round(bike.base_rate_daily)}
                </span>
                <span className="text-gray-500 text-sm"> /day</span>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isAvailable
                    ? 'bg-green-100 text-green-800'
                    : availability
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {availability
                  ? isAvailable
                    ? `${availability.available} Available`
                    : 'Sold Out'
                  : 'Check dates'}
              </div>
            </div>

            {/* Date Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date & Time</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Date & Time</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Hub Selection */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Hub</label>
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
              >
                {bike.hubs.map((hub) => (
                  <option key={hub} value={hub}>{hub}</option>
                ))}
              </select>
            </div>

            {checking && (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Checking availability...</p>
              </div>
            )}

            {price && !checking && <PriceBreakdown price={price} />}

            {availability && !isAvailable && !checking && (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm mt-4">
                Sorry, this model is not available for the selected dates. Try different dates or hub.
              </div>
            )}

            <button
              onClick={handleBookNow}
              disabled={!isAvailable || checking}
              className="w-full py-3 bg-brand-500 text-white rounded-lg font-semibold text-sm hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4"
            >
              {!startDate || !endDate
                ? 'Select dates to continue'
                : checking
                  ? 'Checking...'
                  : isAvailable
                    ? 'Book Now — Proceed to checkout'
                    : 'Not Available'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
