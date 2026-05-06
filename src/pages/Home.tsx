import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { callGet } from '../api/client'
import BikeCard from '../components/BikeCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

interface BikeModel {
  name: string
  brand: string
  category: string
  base_rate_daily: number
  description: string
  image: string
  total_serials: number
  rented: number
  available: number
}

interface CatalogueData {
  models: BikeModel[]
  hub: string
}

interface Hub {
  name: string
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

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [hubs, setHubs] = useState<Hub[]>([])
  const [selectedHub, setSelectedHub] = useState('')
  const [models, setModels] = useState<BikeModel[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const defaultStart = toLocalDatetimeValue(roundToNext30Min(new Date()))
  const defaultEnd = toLocalDatetimeValue(new Date(new Date(defaultStart).getTime() + 24 * 60 * 60 * 1000))

  const [startDate, setStartDate] = useState(searchParams.get('start') || defaultStart)
  const [endDate, setEndDate] = useState(searchParams.get('end') || defaultEnd)

  useEffect(() => {
    callGet<Hub[]>('catalogue.get_hubs_list')
      .then((data) => {
        setHubs(data || [])
        if (data && data.length > 0 && !selectedHub) {
          setSelectedHub(data[0].name)
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCatalogue = useCallback(async () => {
    if (!selectedHub) return
    setLoading(true)
    setError('')
    try {
      const data = await callGet<CatalogueData>('catalogue.get_catalogue_data', { hub: selectedHub })
      setModels(data.models || [])
      const cats = [...new Set((data.models || []).map((m) => m.category).filter(Boolean))] as string[]
      setCategories(cats)
    } catch {
      setError('Failed to load bikes')
    } finally {
      setLoading(false)
    }
  }, [selectedHub])

  useEffect(() => {
    fetchCatalogue()
  }, [fetchCatalogue])

  const handleSearch = () => {
    if (startDate && endDate) {
      setSearchParams({ start: startDate, end: endDate })
    }
  }

  const filteredModels = activeCategory === 'all'
    ? models
    : models.filter((m) => m.category === activeCategory)

  const dateParams = startDate && endDate
    ? `?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
    : ''

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Rent the Perfect Bike</h1>
          <p className="text-white/90 mb-6">Explore our fleet of city, mountain, and electric bikes</p>

          {/* Search Widget */}
          <div className="bg-white rounded-xl p-5 shadow-lg max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 text-left min-w-0">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Pickup
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex-1 text-left min-w-0">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Return
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-brand-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors whitespace-nowrap h-[42px]"
              >
                Search Bikes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hub Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Hub</label>
          <select
            value={selectedHub}
            onChange={(e) => setSelectedHub(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
          >
            {hubs.map((h) => (
              <option key={h.name} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Bike Grid */}
        {loading ? (
          <LoadingSpinner text="Loading bikes..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCatalogue} />
        ) : filteredModels.length === 0 ? (
          <EmptyState
            icon="🚲"
            title="No bikes found"
            description="Try adjusting the category filter or selecting a different hub."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredModels.map((m) => (
              <BikeCard key={m.name} bike={m} dateParams={dateParams} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
