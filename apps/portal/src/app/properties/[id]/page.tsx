'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, MapPinIcon, HomeIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface Property {
  id: number
  mls_id: string
  address: string
  city: string
  state: string
  zip_code: string
  bedrooms: number
  bathrooms: number
  square_feet: number
  lot_size: number
  list_price: number
  estimated_value: number
  property_type: string
  status: string
  description: string
  year_built: number
  garage_spaces: number
  created_at: string
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLeadForm, setShowLeadForm] = useState(false)

  const fetchProperty = useCallback(async () => {
    try {
      const response = await fetch(`/api/portal/api/properties/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProperty(data)
      }
    } catch (error) {
      console.error('Error fetching property:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchProperty()
  }, [fetchProperty])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto"></div>
          <p className="mt-4 text-stone-500">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900">Property Not Found</h1>
          <p className="mt-2 text-stone-500">The property you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/properties" className="btn-primary mt-4 inline-block">
            Back to Properties
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/properties" className="text-stone-500 hover:text-stone-900">
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">{property.address}</h1>
                <p className="text-stone-500">{property.city}, {property.state} {property.zip_code}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-stone-900">
                {formatPrice(property.list_price)}
              </div>
              {property.estimated_value && (
                <div className="text-sm text-stone-900">
                  Est. Value: {formatPrice(property.estimated_value)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Images */}
            <div className="card">
              <div className="aspect-w-16 aspect-h-9">
                <div className="w-full h-96 bg-stone-200 rounded-lg flex items-center justify-center">
                  <HomeIcon className="h-24 w-24 text-stone-400" />
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="card">
              <h2 className="text-xl font-bold text-stone-900 mb-4">Property Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-stone-50 rounded-lg">
                  <div className="text-2xl font-bold text-stone-900">{property.bedrooms}</div>
                  <div className="text-sm text-stone-500">Bedrooms</div>
                </div>
                <div className="text-center p-4 bg-stone-50 rounded-lg">
                  <div className="text-2xl font-bold text-stone-900">{property.bathrooms}</div>
                  <div className="text-sm text-stone-500">Bathrooms</div>
                </div>
                <div className="text-center p-4 bg-stone-50 rounded-lg">
                  <div className="text-2xl font-bold text-stone-900">
                    {property.square_feet?.toLocaleString()}
                  </div>
                  <div className="text-sm text-stone-500">Square Feet</div>
                </div>
                <div className="text-center p-4 bg-stone-50 rounded-lg">
                  <div className="text-2xl font-bold text-stone-900">{property.year_built}</div>
                  <div className="text-sm text-stone-500">Year Built</div>
                </div>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="card">
                <h2 className="text-xl font-bold text-stone-900 mb-4">Description</h2>
                <p className="text-stone-600 leading-relaxed">{property.description}</p>
              </div>
            )}

            {/* Additional Details */}
            <div className="card">
              <h2 className="text-xl font-bold text-stone-900 mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-stone-900">Property Type:</span>
                  <span className="ml-2 text-stone-600">{property.property_type}</span>
                </div>
                <div>
                  <span className="font-medium text-stone-900">Status:</span>
                  <span className="ml-2 text-stone-600">{property.status}</span>
                </div>
                <div>
                  <span className="font-medium text-stone-900">Lot Size:</span>
                  <span className="ml-2 text-stone-600">{property.lot_size} acres</span>
                </div>
                <div>
                  <span className="font-medium text-stone-900">Garage Spaces:</span>
                  <span className="ml-2 text-stone-600">{property.garage_spaces}</span>
                </div>
                <div>
                  <span className="font-medium text-stone-900">MLS ID:</span>
                  <span className="ml-2 text-stone-600">{property.mls_id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Form */}
            <div className="card">
              <h3 className="text-lg font-bold text-stone-900 mb-4">Interested in this property?</h3>
              <p className="text-stone-500 mb-4">
                Get in touch with our team to schedule a viewing or learn more.
              </p>

              {!showLeadForm ? (
                <button
                  onClick={() => setShowLeadForm(true)}
                  className="btn-primary w-full"
                >
                  Contact Agent
                </button>
              ) : (
                <LeadCaptureForm
                  propertyId={property.id}
                  propertyAddress={property.address}
                  onClose={() => setShowLeadForm(false)}
                />
              )}
            </div>

            {/* Property Value Estimate */}
            {property.estimated_value && (
              <div className="card">
                <h3 className="text-lg font-bold text-stone-900 mb-4">AI Property Valuation</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-stone-900">
                    {formatPrice(property.estimated_value)}
                  </div>
                  <div className="text-sm text-stone-500 mt-2">
                    Estimated Value
                  </div>
                  <div className="mt-4 text-xs text-stone-500">
                    This estimate is based on comparable properties and market data.
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-bold text-stone-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="btn-secondary w-full">
                  Save Property
                </button>
                <button className="btn-secondary w-full">
                  Share Property
                </button>
                <Link href="/estimate" className="btn-secondary w-full text-center block">
                  Get Custom Estimate
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Lead Capture Form Component
function LeadCaptureForm({
  propertyId,
  propertyAddress,
  onClose
}: {
  propertyId: number
  propertyAddress: string
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/portal/leads/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          interested_property_id: propertyId,
          property_address: propertyAddress,
          source: 'property_detail'
        }),
      })

      if (response.ok) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Error submitting lead:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="text-emerald-600 text-lg font-medium mb-2">
          Thank you for your interest!
        </div>
        <p className="text-stone-500 text-sm mb-4">
          We&apos;ll be in touch soon to discuss this property.
        </p>
        <button onClick={onClose} className="btn-secondary">
          Close
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">
          Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">
          Email *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="input-field"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">
          Phone
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="input-field"
          placeholder="(555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">
          Message
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="input-field"
          rows={3}
          placeholder="Tell us about your interest in this property..."
        />
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex-1"
        >
          {submitting ? 'Sending...' : 'Send Message'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

