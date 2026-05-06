interface KYCStatusBadgeProps {
  status: string
}

const styles: Record<string, string> = {
  Verified: 'bg-green-100 text-green-800',
  'Pending Review': 'bg-amber-100 text-amber-800',
  Rejected: 'bg-red-100 text-red-800',
  Unverified: 'bg-gray-100 text-gray-500',
}

export default function KYCStatusBadge({ status }: KYCStatusBadgeProps) {
  const className = styles[status] || 'bg-gray-100 text-gray-500'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${className}`}>
      {status}
    </span>
  )
}
