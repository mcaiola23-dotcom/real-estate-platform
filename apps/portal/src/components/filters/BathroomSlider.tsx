'use client'

import DualRangeSlider from './DualRangeSlider'

interface BathroomSliderProps {
  min: number
  max: number
  onChange: (min: number, max: number) => void
  className?: string
}

/**
 * Bathroom count slider (0-5+, 0.5 increments)
 */
export default function BathroomSlider({ min, max, onChange, className = '' }: BathroomSliderProps) {
  const formatBathrooms = (value: number): string => {
    if (value >= 5) return '5+'
    return value.toString()
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-stone-600 mb-3">
        Bathrooms
      </label>
      <DualRangeSlider
        min={0}
        max={5}
        step={0.5}
        valueMin={min}
        valueMax={max}
        onChange={onChange}
        formatLabel={formatBathrooms}
      />
    </div>
  )
}

