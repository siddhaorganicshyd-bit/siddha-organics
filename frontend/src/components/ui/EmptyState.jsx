import React from 'react'
import Button from './Button.jsx'

export default function EmptyState({ icon, heading, description, ctaLabel, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-4">
      {icon && <div className="text-5xl text-gray-300">{icon}</div>}
      <h3 className="font-serif text-xl text-green">{heading}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
      {ctaLabel && onCta && (
        <Button variant="primary" size="md" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
