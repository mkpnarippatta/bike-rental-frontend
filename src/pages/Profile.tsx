import { useState, useEffect, type FormEvent, useRef } from 'react'
import { Link } from 'react-router-dom'
import { call, uploadFile } from '../api/client'
import { useAuth } from '../context/AuthContext'
import KYCStatusBadge from '../components/KYCStatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

interface DashboardData {
  user_email: string
  user_name: string
  customer: {
    name: string
    customer_name: string
    kyc_status: string
    phone: string
  } | null
  active_booking: {
    name: string
    bike_model: string
    pickup_hub: string
    pickup_datetime: string
    return_datetime: string
    total_amount: number
  } | null
  recent_bookings: Array<{
    name: string
    bike_model: string
    pickup_hub: string
    status: string
    pickup_datetime: string
    return_datetime: string
    total_amount: number
  }>
  kyc_documents: Array<{
    name: string
    document_type: string
    status: string
    creation: string
  }>
}

export default function Profile() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = () => {
    setLoading(true)
    call<DashboardData>('customer_profile.get_dashboard_summary')
      .then(setData)
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }

  // KYC upload state
  const [showKycForm, setShowKycForm] = useState(false)
  const [docType, setDocType] = useState('')
  const [uploading, setUploading] = useState(false)
  const [kycError, setKycError] = useState('')
  const [kycSuccess, setKycSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKycUpload = async (e: FormEvent) => {
    e.preventDefault()
    if (!docType || !fileInputRef.current?.files?.length) return
    setUploading(true)
    setKycError('')
    setKycSuccess('')
    try {
      // Upload file via Frappe
      const fileUrl = await uploadFile(fileInputRef.current.files[0], 'KYC Document')
      if (!fileUrl) throw new Error('File upload failed')

      // Create KYC document record
      const customerName = data?.customer?.name
      if (!customerName) throw new Error('Customer not found')

      await call('kyc.upload_kyc_document', {
        customer: customerName,
        document_type: docType,
        file_url: fileUrl,
      })

      setKycSuccess('Document uploaded for review!')
      setDocType('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchDashboard()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as Error).message
        || 'Upload failed'
      setKycError(msg)
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />
  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />
  if (!data) return <ErrorState message="Could not load profile" />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Dashboard</h1>

      {/* Customer Info Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {data.customer?.customer_name || data.user_name}
            </h2>
            <p className="text-sm text-gray-500">{data.user_email}</p>
            {data.customer?.phone && (
              <p className="text-sm text-gray-500">{data.customer.phone}</p>
            )}
          </div>
          {data.customer && (
            <KYCStatusBadge status={data.customer.kyc_status} />
          )}
        </div>
        {data.customer && data.customer.kyc_status !== 'Verified' && (
          <button
            onClick={() => setShowKycForm(!showKycForm)}
            className="text-sm text-brand-500 font-medium hover:underline"
          >
            {showKycForm ? 'Cancel' : 'Complete KYC Verification'}
          </button>
        )}
      </div>

      {/* Active Booking */}
      {data.active_booking && (
        <div className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-xl p-6 text-white mb-6">
          <p className="text-sm text-white/80 mb-1">Active Rental</p>
          <h3 className="text-lg font-semibold mb-3">{data.active_booking.bike_model}</h3>
          <div className="text-sm space-y-1 text-white/90">
            <p>Hub: {data.active_booking.pickup_hub}</p>
            <p>Start: {new Date(data.active_booking.pickup_datetime).toLocaleDateString()}</p>
            <p>Return: {new Date(data.active_booking.return_datetime).toLocaleDateString()}</p>
          </div>
          <Link
            to={`/bookings/${data.active_booking.name}`}
            className="inline-block mt-4 text-sm font-medium text-white underline underline-offset-2"
          >
            View Details
          </Link>
        </div>
      )}

      {/* KYC Documents */}
      <div id="kyc" className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">KYC Documents</h3>
          {data.customer?.kyc_status !== 'Verified' && (
            <button
              onClick={() => setShowKycForm(!showKycForm)}
              className="text-sm text-brand-500 font-medium hover:underline"
            >
              {showKycForm ? 'Cancel' : 'Upload'}
            </button>
          )}
        </div>

        {/* KYC Upload Form */}
        {showKycForm && (
          <form onSubmit={handleKycUpload} className="mb-4 p-4 bg-gray-50 rounded-lg">
            {kycError && (
              <div className="p-2 bg-red-50 text-red-700 rounded text-xs mb-3">{kycError}</div>
            )}
            {kycSuccess && (
              <div className="p-2 bg-green-50 text-green-700 rounded text-xs mb-3">{kycSuccess}</div>
            )}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select...</option>
                <option value="ID Proof">ID Proof (Aadhaar/PAN/Voter)</option>
                <option value="Driving License">Driving License</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">File (PDF, JPG, PNG)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                required
                className="w-full text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
        )}

        {data.kyc_documents.length > 0 ? (
          <div className="space-y-2">
            {data.kyc_documents.map((doc) => (
              <div key={doc.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm text-gray-700">{doc.document_type}</p>
                  <p className="text-xs text-gray-400">{new Date(doc.creation).toLocaleDateString()}</p>
                </div>
                <KYCStatusBadge status={doc.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No documents uploaded yet.</p>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
          <Link to="/bookings" className="text-sm text-brand-500 font-medium hover:underline">
            View All
          </Link>
        </div>
        {data.recent_bookings.length > 0 ? (
          <div className="space-y-2">
            {data.recent_bookings.map((b) => (
              <Link
                key={b.name}
                to={`/bookings/${b.name}`}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.bike_model}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(b.pickup_datetime).toLocaleDateString()} - {new Date(b.return_datetime).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">&#8377;{Number(b.total_amount).toFixed(0)}</span>
                  <p className="text-xs text-gray-400">{b.status}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📅"
            title="No bookings yet"
            description="Start by browsing available bikes."
            action={{ label: 'Browse Bikes', onClick: () => window.location.href = '/' }}
          />
        )}
      </div>
    </div>
  )
}
