import React, { useEffect, useRef } from 'react'

export default function Modal({ isOpen, onClose, title, children }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 focus:outline-none"
      >
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 id="modal-title" className="text-lg font-semibold text-green font-serif">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
