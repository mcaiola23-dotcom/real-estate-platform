'use client'

import DualRangeSlider from './DualRangeSlider'

interface SquareFootageSliderProps {
  min: number
  max: number
  onChange: (min: number, max: number) => void
  className?: string
}

/**
 * Square footage slider (0-10,000+)
 */
export default function SquareFootageSlider({ min, max, onChange, className = '' }: SquareFootageSliderProps) {
  const formatSqft = (value: number): string => {
    if (value >= 10000) return '10,000+'
    return value.toLocaleString() + ' sqft'
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-stone-600 mb-3">
        Square Footage
      </label>
      <DualRangeSlider
        min={0}
        max={10000}
        step={100}
        valueMin={min}
        valueMax={max}
        onChange={onChange}
        formatLabel={formatSqft}
      />
    </div>
  )
}

