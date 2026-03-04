'use client'

import DualRangeSlider from './DualRangeSlider'

interface LotSizeSliderProps {
  min: number
  max: number
  onChange: (min: number, max: number) => void
  className?: string
}

/**
 * Lot size slider (0-10+ acres)
 */
export default function LotSizeSlider({ min, max, onChange, className = '' }: LotSizeSliderProps) {
  const formatAcres = (value: number): string => {
    if (value >= 10) return '10+ acres'
    if (value === 0) return '0 acres'
    return value.toFixed(1) + ' acres'
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-stone-600 mb-3">
        Lot Size
      </label>
      <DualRangeSlider
        min={0}
        max={10}
        step={0.1}
        valueMin={min}
        valueMax={max}
        onChange={onChange}
        formatLabel={formatAcres}
      />
    </div>
  )
}

