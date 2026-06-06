import React from 'react'
import Input from './Input.jsx'

export default function FormField({ className = '', ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      <Input {...props} />
    </div>
  )
}
