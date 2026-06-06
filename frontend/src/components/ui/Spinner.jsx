import React from 'react'

export function Spinner({ size = 'md', className = '' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <span
      className={`inline-block border-4 border-green border-t-transparent rounded-full animate-spin ${sizeMap[size] ?? sizeMap.md} ${className}`}
      aria-label="Loading"
    />
  )
}

export function LoadingState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Spinner size="lg" />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  )
}

export default Spinner
