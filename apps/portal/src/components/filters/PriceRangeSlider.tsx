'use client'

import DualRangeSlider from './DualRangeSlider'

interface PriceRangeSliderProps {
  min: number
  max: number
  onChange: (min: number, max: number) => void
  className?: string
}

// Logarithmic price scale with fine granularity from $0-$2M,
// then $0.5M increments from $2M-$5M, then larger increments up to $20M+
const PRICE_STEPS = [
  0,
  100000,   // $100K
  200000,   // $200K
  300000,
  400000,
  500000,
  600000,
  700000,
  800000,
  900000,
  1000000,  // $1M
  1100000,
  1200000,
  1300000,
  1400000,
  1500000,
  1600000,
  1700000,
  1800000,
  1900000,
  2000000,  // $2M
  2500000,  // $2.5M
  3000000,  // $3M
  3500000,  // $3.5M
  4000000,  // $4M
  4500000,  // $4.5M
  5000000,  // $5M
  6000000,  // $6M
  7000000,  // $7M
  8000000,  // $8M
  10000000, // $10M
  12000000, // $12M
  15000000, // $15M
  20000000, // $20M+
]

/**
 * Price range slider with logarithmic scale
 * Provides fine granularity at lower price points
 */
export default function PriceRangeSlider({ min, max, onChange, className = '' }: PriceRangeSliderProps) {
  const formatPrice = (value: number): string => {
    if (value >= 20000000) return '$20M+'
    if (value >= 1000000) {
      const millions = value / 1000000
      return `$${millions % 1 === 0 ? millions : millions.toFixed(1)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value}`
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-stone-600 mb-3">
        Price Range
      </label>
      <DualRangeSlider
        min={0}
        max={20000000}
        step={50000} // $50K step for smooth dragging
        valueMin={min}
        valueMax={max}
        onChange={onChange}
        formatLabel={formatPrice}
        logarithmic={true}
        logSteps={PRICE_STEPS}
      />
    </div>
  )
}

