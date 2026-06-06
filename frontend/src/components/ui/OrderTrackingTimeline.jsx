import React from 'react'

/**
 * OrderTrackingTimeline
 *
 * Props:
 *   statusHistory  – Array<{ status: string, timestamp: string|Date, note?: string }>
 *   currentStatus  – string  (e.g. 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')
 */
export default function OrderTrackingTimeline({ statusHistory = [], currentStatus }) {
  if (!statusHistory.length) return null

  const lastIdx = statusHistory.length - 1

  return (
    <ol className="flex flex-col">
      {statusHistory.map((entry, idx) => {
        const isLast = idx === lastIdx
        const isFirst = idx === 0

        // Node appearance
        const nodeContent = isLast
          ? currentStatus === 'Delivered'
            ? <span className="text-base leading-none">✅</span>
            : currentStatus === 'Cancelled'
              ? <span className="text-base leading-none">❌</span>
              : null
          : null

        const nodeClasses = isLast
          ? 'w-4 h-4 rounded-full bg-green-600 border-2 border-green-600 flex items-center justify-center shrink-0'
          : 'w-4 h-4 rounded-full bg-white border-2 border-gray-300 shrink-0'

        // For Delivered/Cancelled last node, make the circle bigger to fit the emoji
        const hasIcon = isLast && (currentStatus === 'Delivered' || currentStatus === 'Cancelled')

        return (
          <li key={idx} className="flex gap-4">
            {/* Left column: circle + connector line */}
            <div className="flex flex-col items-center">
              {/* Circle node */}
              {hasIcon ? (
                <div className="w-6 h-6 flex items-center justify-center shrink-0 -ml-1">
                  {nodeContent}
                </div>
              ) : (
                <div className={nodeClasses}>
                  {nodeContent}
                </div>
              )}

              {/* Connector line (not after the last item) */}
              {!isLast && (
                <div className="w-0.5 flex-1 bg-gray-200 my-1" />
              )}
            </div>

            {/* Right column: text content */}
            <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
              <p className="font-bold text-sm text-green-800 leading-tight">{entry.status}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(entry.timestamp).toLocaleString('en-IN')}
              </p>
              {entry.note && (
                <p className="text-xs text-gray-500 mt-1">{entry.note}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
