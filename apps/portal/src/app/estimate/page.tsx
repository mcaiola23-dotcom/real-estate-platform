'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, HomeIcon, CalculatorIcon } from '@heroicons/react/24/outline'

interface EstimateRequest {
  address: string
  bedrooms: number
  bathrooms: number
  sqft: number
  city?: string
  state?: string
  zip_code?: string
}

interface EstimateResponse {
  estimated_value: number
  confidence_score?: number
  comparable_properties?: number
  market_trend?: string
}

export default function EstimatePage() {
  const [formData, setFormData] = useState<EstimateRequest>({
    address: '',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 2000,
    city: '',
    state: 'CT',
    zip_code: ''
  })

  const [estimate, setEstimate] = useState<EstimateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8000/estimate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setEstimate(data)
      } else {
        setError('Failed to get property estimate. Please try again.')
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-stone-500 hover:text-stone-900">
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Property Value Estimate</h1>
                <p className="text-stone-500">Get an AI-powered property valuation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="card">
            <div className="flex items-center mb-6">
              <CalculatorIcon className="h-8 w-8 text-stone-900 mr-3" />
              <h2 className="text-xl font-bold text-stone-900">Property Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">
                  Property Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  placeholder="123 Main Street, Fairfield, CT"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-2">
                    Bedrooms *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="20"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-2">
                    Bathrooms *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="20"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">
                  Square Footage *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  max="50000"
                  value={formData.sqft}
                  onChange={(e) => setFormData({ ...formData, sqft: Number(e.target.value) })}
                  className="input-field"
                  placeholder="2000"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-field"
                    placeholder="Fairfield"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input-field"
                    placeholder="CT"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className="input-field"
                    placeholder="06824"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Getting Estimate...
                  </div>
                ) : (
                  'Get Property Estimate'
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {estimate ? (
              <div className="card">
                <div className="text-center mb-6">
                  <HomeIcon className="h-12 w-12 text-stone-900 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-stone-900">Property Estimate</h3>
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-stone-900 mb-2">
                    {formatPrice(estimate.estimated_value)}
                  </div>
                  <div className="text-stone-500">Estimated Value</div>
                </div>

                <div className="space-y-4">
                  {estimate.confidence_score && (
                    <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg">
                      <span className="text-sm font-medium text-stone-600">Confidence Score</span>
                      <span className="text-sm font-bold text-stone-900">
                        {Math.round(estimate.confidence_score * 100)}%
                      </span>
                    </div>
                  )}

                  {estimate.comparable_properties && (
                    <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg">
                      <span className="text-sm font-medium text-stone-600">Comparable Properties</span>
                      <span className="text-sm font-bold text-stone-900">
                        {estimate.comparable_properties}
                      </span>
                    </div>
                  )}

                  {estimate.market_trend && (
                    <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg">
                      <span className="text-sm font-medium text-stone-600">Market Trend</span>
                      <span className="text-sm font-bold text-stone-900 capitalize">
                        {estimate.market_trend}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-stone-50 rounded-lg">
                  <p className="text-sm text-stone-700">
                    <strong>Note:</strong> This estimate is based on comparable properties and market data.
                    For a more accurate valuation, consider getting a professional appraisal.
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => setEstimate(null)}
                    className="btn-secondary w-full"
                  >
                    Get Another Estimate
                  </button>
                  <Link href="/properties" className="btn-primary w-full text-center block">
                    Search Properties
                  </Link>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="text-center">
                  <CalculatorIcon className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-stone-900 mb-2">
                    Ready to Get Your Estimate?
                  </h3>
                  <p className="text-stone-500 text-sm">
                    Fill out the form to get an AI-powered property valuation based on
                    comparable properties and market data.
                  </p>
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="card">
              <h3 className="text-lg font-bold text-stone-900 mb-4">How It Works</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-stone-600">
                      Enter your property details including address, bedrooms, bathrooms, and square footage.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-stone-600">
                      Our AI analyzes comparable properties and market trends in your area.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-stone-600">
                      Get an instant estimate with confidence score and market insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


