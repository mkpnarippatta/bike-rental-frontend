import { Link } from 'react-router-dom'

interface BikeCardBike {
  name: string
  brand?: string
  category?: string
  base_rate_daily: number
  image?: string
  total_serials?: number
  available?: number
  hubs?: string[]
}

interface BikeCardProps {
  bike: BikeCardBike
  dateParams?: string
}

export default function BikeCard({ bike, dateParams }: BikeCardProps) {
  const hasStock = (bike.available ?? bike.total_serials ?? 0) > 0
  const link = `/bikes/${encodeURIComponent(bike.name)}${dateParams || ''}`

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      <div className="h-40 bg-gray-100 flex items-center justify-center">
        {bike.image ? (
          <img src={bike.image} alt={bike.name} className="max-w-full max-h-full object-cover" />
        ) : (
          <span style={{ fontSize: '48px' }}>&#x1F6B2;</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-gray-900">{bike.name}</h3>
            {bike.brand && <p className="text-xs text-gray-500">{bike.brand}</p>}
          </div>
          {hasStock ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800 whitespace-nowrap">
              {bike.available != null ? `${bike.available} available` : 'Available'}
            </span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 whitespace-nowrap">
              Unavailable
            </span>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap mb-3">
          {bike.category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {bike.category}
            </span>
          )}
          {(bike.hubs || []).slice(0, 2).map((hub) => (
            <span key={hub} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {hub}
            </span>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span className="text-xl font-bold text-brand-500">
              &#8377;{Math.round(bike.base_rate_daily)}
            </span>
            <span className="text-xs text-gray-500"> /day</span>
          </div>
          {hasStock ? (
            <Link
              to={link}
              className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              Book Now
            </Link>
          ) : (
            <span className="text-sm text-gray-400 px-4 py-2">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  )
}
