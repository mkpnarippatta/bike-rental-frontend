interface PriceData {
  daily_rate: number
  days: number
  base_amount: number
  deposit: number
  total_due: number
}

export default function PriceBreakdown({ price }: { price: PriceData }) {
  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Price Breakdown</h4>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            Daily Rate &times; {price.days} day{price.days > 1 ? 's' : ''}
          </span>
          <span className="text-gray-700">&#8377;{price.base_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Security Deposit</span>
          <span className="text-gray-700">&#8377;{price.deposit.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2 mt-2">
          <span>Total Due</span>
          <span className="text-brand-500">&#8377;{price.total_due.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
