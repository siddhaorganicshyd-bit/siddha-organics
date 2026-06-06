import React, { useEffect } from 'react'

const typeClasses = {
  success: 'bg-green text-cream',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
}

export function Toast({ id, message, type = 'info', onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 3000)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[260px] max-w-sm animate-slide-in ${typeClasses[type] ?? typeClasses.info}`}
      role="alert"
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        className="text-current opacity-70 hover:opacity-100 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
