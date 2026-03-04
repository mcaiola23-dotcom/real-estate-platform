'use client'

import { useState, useEffect, useRef } from 'react'

interface DualRangeSliderProps {
  min: number
  max: number
  step: number
  valueMin: number
  valueMax: number
  onChange: (min: number, max: number) => void
  formatLabel?: (value: number) => string
  logarithmic?: boolean
  logSteps?: number[] // For logarithmic scales with custom breakpoints
  className?: string
}

/**
 * Reusable dual-handle range slider with text inputs
 * Supports both linear and logarithmic scales
 */
export default function DualRangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
  formatLabel = (val) => val.toString(),
  logarithmic = false,
  logSteps,
  className = ''
}: DualRangeSliderProps) {
  const [localMin, setLocalMin] = useState(valueMin)
  const [localMax, setLocalMax] = useState(valueMax)
  const [minInputValue, setMinInputValue] = useState(formatLabel(valueMin))
  const [maxInputValue, setMaxInputValue] = useState(formatLabel(valueMax))
  
  const minThumbRef = useRef<HTMLDivElement>(null)
  const maxThumbRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const isDraggingMin = useRef(false)
  const isDraggingMax = useRef(false)

  // Update local state when props change
  useEffect(() => {
    setLocalMin(valueMin)
    setLocalMax(valueMax)
    setMinInputValue(formatLabel(valueMin))
    setMaxInputValue(formatLabel(valueMax))
  }, [valueMin, valueMax, formatLabel])

  // Convert value to position (0-100%)
  const valueToPosition = (value: number): number => {
    if (logarithmic && logSteps) {
      // Find position within custom log steps
      const index = logSteps.findIndex(v => v >= value)
      if (index === -1) return 100
      if (index === 0) return 0
      
      const prevStep = logSteps[index - 1]
      const nextStep = logSteps[index]
      const segmentProgress = (value - prevStep) / (nextStep - prevStep)
      const segmentSize = 100 / (logSteps.length - 1)
      
      return ((index - 1) * segmentSize) + (segmentProgress * segmentSize)
    }
    
    return ((value - min) / (max - min)) * 100
  }

  // Convert position (0-100%) to value
  const positionToValue = (position: number): number => {
    if (logarithmic && logSteps) {
      const segmentSize = 100 / (logSteps.length - 1)
      const segmentIndex = Math.floor(position / segmentSize)
      const segmentProgress = (position % segmentSize) / segmentSize
      
      if (segmentIndex >= logSteps.length - 1) return logSteps[logSteps.length - 1]
      if (segmentIndex < 0) return logSteps[0]
      
      const prevStep = logSteps[segmentIndex]
      const nextStep = logSteps[segmentIndex + 1]
      const value = prevStep + (segmentProgress * (nextStep - prevStep))
      
      // Snap to step
      return Math.round(value / step) * step
    }
    
    const value = min + (position / 100) * (max - min)
    return Math.round(value / step) * step
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!trackRef.current) return
    
    const rect = trackRef.current.getBoundingClientRect()
    const position = ((e.clientX - rect.left) / rect.width) * 100
    const clampedPosition = Math.max(0, Math.min(100, position))
    const newValue = positionToValue(clampedPosition)

    if (isDraggingMin.current) {
      const newMin = Math.min(newValue, localMax - step)
      if (newMin !== localMin) {
        setLocalMin(newMin)
        onChange(newMin, localMax)
      }
    } else if (isDraggingMax.current) {
      const newMax = Math.max(newValue, localMin + step)
      if (newMax !== localMax) {
        setLocalMax(newMax)
        onChange(localMin, newMax)
      }
    }
  }

  const handleMouseUp = () => {
    isDraggingMin.current = false
    isDraggingMax.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const handleMinThumbMouseDown = () => {
    isDraggingMin.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMaxThumbMouseDown = () => {
    isDraggingMax.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinInputValue(e.target.value)
  }

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxInputValue(e.target.value)
  }

  const handleMinInputBlur = () => {
    const parsed = parseFloat(minInputValue.replace(/[^0-9.]/g, ''))
    if (!isNaN(parsed)) {
      const newMin = Math.max(min, Math.min(parsed, localMax - step))
      setLocalMin(newMin)
      onChange(newMin, localMax)
    }
    setMinInputValue(formatLabel(localMin))
  }

  const handleMaxInputBlur = () => {
    const parsed = parseFloat(maxInputValue.replace(/[^0-9.]/g, ''))
    if (!isNaN(parsed)) {
      const newMax = Math.min(max, Math.max(parsed, localMin + step))
      setLocalMax(newMax)
      onChange(localMin, newMax)
    }
    setMaxInputValue(formatLabel(localMax))
  }

  const minPosition = valueToPosition(localMin)
  const maxPosition = valueToPosition(localMax)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Text Inputs */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-stone-600 mb-1">Min</label>
          <input
            type="text"
            value={minInputValue}
            onChange={handleMinInputChange}
            onBlur={handleMinInputBlur}
            className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent"
          />
        </div>
        <div className="pt-6 text-stone-400">—</div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-stone-600 mb-1">Max</label>
          <input
            type="text"
            value={maxInputValue}
            onChange={handleMaxInputChange}
            onBlur={handleMaxInputBlur}
            className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative pt-2 pb-1">
        <div
          ref={trackRef}
          className="relative h-2 bg-stone-200 rounded-full cursor-pointer"
        >
          {/* Active Range */}
          <div
            className="absolute h-full bg-stone-500 rounded-full"
            style={{
              left: `${minPosition}%`,
              width: `${maxPosition - minPosition}%`
            }}
          />

          {/* Min Thumb */}
          <div
            ref={minThumbRef}
            onMouseDown={handleMinThumbMouseDown}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-stone-500 rounded-full cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform"
            style={{ left: `${minPosition}%` }}
          />

          {/* Max Thumb */}
          <div
            ref={maxThumbRef}
            onMouseDown={handleMaxThumbMouseDown}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-stone-500 rounded-full cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform"
            style={{ left: `${maxPosition}%` }}
          />
        </div>
      </div>
    </div>
  )
}

