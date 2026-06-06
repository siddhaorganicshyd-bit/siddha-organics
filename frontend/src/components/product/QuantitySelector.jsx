import React from 'react'

export default function QuantitySelector({ value, onChange, min = 1, max = 99 }) {
  const decrement = () => { if (value > min) onChange(value - 1) }
  const increment = () => { if (value < max) onChange(value + 1) }

  return (
    <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className="px-3 py-2 text-green hover:bg-cream-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10)
          if (!isNaN(v) && v >= min && v <= max) onChange(v)
        }}
        className="w-12 text-center text-sm font-medium text-green border-x border-gray-300 py-2 focus:outline-none"
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className="px-3 py-2 text-green hover:bg-cream-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}
