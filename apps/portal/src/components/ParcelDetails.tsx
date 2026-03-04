'use client'

import { useState } from 'react'
import { 
  HomeIcon, 
  MapPinIcon, 
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ParcelData {
  parcel_id: string
  address: string
  city: string
  state: string
  zip_code: string
  coordinates: { lat: number; lng: number }
  boundary: GeoJSON.Polygon
  property_details: {
    square_feet: number
    bedrooms: number
    bathrooms: number
    acreage: number
    year_built: number
    property_type: string
  }
  ownership?: {
    owner_name: string
    owner_address: string
    ownership_type: string
  }
  market_data: {
    estimated_value: number
    last_sale_price: number
    last_sale_date: string
    price_per_sqft: number
  }
  zoning: {
    zone: string
    use_restrictions: string[]
  }
}

interface ParcelDetailsProps {
  parcel: ParcelData | null
  showOwnership?: boolean
  onClose?: () => void
}

export default function ParcelDetails({ parcel, showOwnership = false, onClose }: ParcelDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'zoning' | 'ownership'>('overview')

  if (!parcel) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getValueChange = () => {
    const change = parcel.market_data.estimated_value - parcel.market_data.last_sale_price
    const percentChange = (change / parcel.market_data.last_sale_price) * 100
    return { change, percentChange }
  }

  const valueChange = getValueChange()

  return (
    <div className="bg-white rounded-lg shadow-lg border border-stone-200 max-w-md">
      {/* Header */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-stone-900">{parcel.address}</h3>
            <p className="text-sm text-stone-500">{parcel.city}, {parcel.state} {parcel.zip_code}</p>
            <p className="text-xs text-stone-500 mt-1">Parcel ID: {parcel.parcel_id}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex space-x-8 px-4">
          {[
            { id: 'overview', label: 'Overview', icon: HomeIcon },
            { id: 'market', label: 'Market', icon: CurrencyDollarIcon },
            { id: 'zoning', label: 'Zoning', icon: BuildingOfficeIcon },
            ...(showOwnership ? [{ id: 'ownership', label: 'Ownership', icon: UserIcon }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${
                activeTab === tab.id
                  ? 'border-stone-500 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-600 hover:border-stone-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Property Details */}
            <div>
              <h4 className="font-medium text-stone-900 mb-3">Property Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <HomeIcon className="w-4 h-4 text-stone-400" />
                  <span className="text-stone-500">{parcel.property_details.square_feet.toLocaleString()} sqft</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-stone-500">{parcel.property_details.bedrooms} bed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-stone-500">{parcel.property_details.bathrooms} bath</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-stone-500">{parcel.property_details.acreage} acres</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-stone-400" />
                  <span className="text-stone-500">Built {parcel.property_details.year_built}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-stone-500">{parcel.property_details.property_type}</span>
                </div>
              </div>
            </div>

            {/* Market Value */}
            <div>
              <h4 className="font-medium text-stone-900 mb-2">Estimated Market Value</h4>
              <div className="bg-stone-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-stone-700">
                  {formatPrice(parcel.market_data.estimated_value)}
                </div>
                <div className="text-sm text-stone-500">
                  ${parcel.market_data.price_per_sqft.toFixed(0)} per sqft
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="space-y-4">
            {/* Current Value */}
            <div>
              <h4 className="font-medium text-stone-900 mb-3">Current Market Data</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Estimated Value</span>
                  <span className="font-semibold">{formatPrice(parcel.market_data.estimated_value)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Price per Sqft</span>
                  <span className="font-semibold">${parcel.market_data.price_per_sqft.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Last Sale */}
            <div>
              <h4 className="font-medium text-stone-900 mb-3">Last Sale</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Sale Price</span>
                  <span className="font-semibold">{formatPrice(parcel.market_data.last_sale_price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Sale Date</span>
                  <span className="font-semibold">{formatDate(parcel.market_data.last_sale_date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Value Change</span>
                  <span className={`font-semibold ${valueChange.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {valueChange.change >= 0 ? '+' : ''}{formatPrice(valueChange.change)} 
                    ({valueChange.percentChange >= 0 ? '+' : ''}{valueChange.percentChange.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'zoning' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-stone-900 mb-3">Zoning Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Zone</span>
                  <span className="font-semibold bg-stone-100 text-stone-700 px-2 py-1 rounded text-sm">
                    {parcel.zoning.zone}
                  </span>
                </div>
                {parcel.zoning.use_restrictions.length > 0 && (
                  <div>
                    <span className="text-stone-500 text-sm">Use Restrictions</span>
                    <ul className="mt-1 space-y-1">
                      {parcel.zoning.use_restrictions.map((restriction, index) => (
                        <li key={index} className="text-sm text-stone-500 flex items-start">
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                          {restriction}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ownership' && showOwnership && parcel.ownership && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-stone-900 mb-3">Ownership Information</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-stone-500 text-sm">Owner Name</span>
                  <div className="font-semibold">{parcel.ownership.owner_name}</div>
                </div>
                <div>
                  <span className="text-stone-500 text-sm">Owner Address</span>
                  <div className="font-semibold">{parcel.ownership.owner_address}</div>
                </div>
                <div>
                  <span className="text-stone-500 text-sm">Ownership Type</span>
                  <div className="font-semibold">{parcel.ownership.ownership_type}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-stone-200 bg-stone-50">
        <div className="flex space-x-2">
          <button className="flex-1 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800">
            View Full Details
          </button>
          <button className="px-4 py-2 border border-stone-300 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-50">
            Save Property
          </button>
        </div>
      </div>
    </div>
  )
}
