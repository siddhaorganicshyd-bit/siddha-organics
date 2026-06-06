import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'

export default function NotFoundPage() {
  return (
    <div className="bg-cream min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <div className="text-8xl mb-6">🌿</div>
        <h1 className="font-serif text-6xl font-bold text-green mb-4">404</h1>
        <h2 className="font-serif text-2xl font-semibold text-green mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Looks like this page has wandered off into the forest. Let&apos;s get you back to
          something good.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="primary" size="lg">
              Back to Home
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline" size="lg">
              Browse Shop
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
