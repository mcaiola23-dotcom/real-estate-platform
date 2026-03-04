'use client'

import DualRangeSlider from './DualRangeSlider'

interface BedroomSliderProps {
  min: number
  max: number
  onChange: (min: number, max: number) => void
  className?: string
}

/**
 * Bedroom count slider (0-7+, integer values)
 */
export default function BedroomSlider({ min, max, onChange, className = '' }: BedroomSliderProps) {
  const formatBedrooms = (value: number): string => {
    if (value >= 7) return '7+'
    return value.toString()
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-stone-600 mb-3">
        Bedrooms
      </label>
      <DualRangeSlider
        min={0}
        max={7}
        step={1}
        valueMin={min}
        valueMax={max}
        onChange={onChange}
        formatLabel={formatBedrooms}
      />
    </div>
  )
}

