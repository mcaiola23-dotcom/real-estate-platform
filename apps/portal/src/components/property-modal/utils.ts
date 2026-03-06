import type { PropertyData } from './types'

export type SectionId = 'overview' | 'details' | 'market' | 'neighborhood'

export function statusBadge(status: PropertyData['status']) {
  switch (status) {
    case 'Active':
      return 'bg-teal-50 text-teal-700 border-teal-200'
    case 'Pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Sold':
      return 'bg-stone-800 text-white border-stone-700'
    case 'Off-Market':
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200'
  }
}

export function formatPrice(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getEffectiveTax(property: PropertyData): number {
  return property.taxAnnualAmount || property.estimatedTaxAnnual || 0
}

export function featureTags(features: string | undefined): string[] {
  if (!features) return []
  return features
    .split(',')
    .map((feature) => feature.trim())
    .filter(Boolean)
}
