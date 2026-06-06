import React from 'react'

export default function Input({ label, error, id, className = '', ...rest }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-green">
          {label}
        </label>
      )}
      <input
        id={id}
        className={[
          'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green transition-colors',
          error ? 'border-red-500 focus:ring-red-400' : 'border-gray-300',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
