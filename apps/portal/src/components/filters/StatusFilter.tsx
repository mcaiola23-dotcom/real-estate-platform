'use client'

import { useState } from 'react'

interface StatusFilterProps {
  selectedStatuses: string[]
  soldYears: number
  onStatusChange: (statuses: string[]) => void
  onSoldYearsChange: (years: number) => void
  className?: string
}

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active', color: 'text-emerald-600' },
  { value: 'Pending', label: 'Pending', color: 'text-amber-600' },
  { value: 'Sold', label: 'Sold', color: 'text-stone-900' },
  { value: 'Off-Market', label: 'Off-Market', color: 'text-stone-500' },
]

/**
 * Property status filter with configurable sold years timeframe
 */
export default function StatusFilter({
  selectedStatuses,
  soldYears,
  onStatusChange,
  onSoldYearsChange,
  className = ''
}: StatusFilterProps) {
  const [yearsInput, setYearsInput] = useState(soldYears.toString())

  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status))
    } else {
      onStatusChange([...selectedStatuses, status])
    }
  }

  const handleYearsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setYearsInput(value)
  }

  const handleYearsInputBlur = () => {
    const parsed = parseFloat(yearsInput)
    if (!isNaN(parsed) && parsed >= 0.1 && parsed <= 10) {
      onSoldYearsChange(parsed)
    } else {
      // Reset to current value if invalid
      setYearsInput(soldYears.toString())
    }
  }

  const isSoldSelected = selectedStatuses.includes('Sold')

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-stone-600 mb-2">
        Listing Status
      </label>

      <div className="space-y-2">
        {STATUS_OPTIONS.map((status) => {
          const isSelected = selectedStatuses.includes(status.value)
          return (
            <div key={status.value}>
              <button
                type="button"
                onClick={() => toggleStatus(status.value)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  isSelected
                    ? 'bg-stone-50 border border-stone-200'
                    : 'hover:bg-stone-50 border border-transparent'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    isSelected
                      ? 'border-stone-500 bg-stone-500'
                      : 'border-stone-300'
                  }`}
                >
                  {isSelected && (
                    <div className="w-full h-full rounded-full bg-white scale-50" />
                  )}
                </div>
                <span className={`text-sm font-medium ${status.color}`}>
                  {status.label}
                </span>
              </button>

              {/* Sold Years Input - Only show if Sold is selected */}
              {status.value === 'Sold' && isSoldSelected && (
                <div className="mt-2 ml-7 mr-3">
                  <div className="flex items-center gap-2 text-xs">
                    <label className="text-stone-500">Sold within last</label>
                    <input
                      type="text"
                      value={yearsInput}
                      onChange={handleYearsInputChange}
                      onBlur={handleYearsInputBlur}
                      className="w-16 px-2 py-1 border border-stone-300 rounded text-center focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                    />
                    <span className="text-stone-500">years</span>
                  </div>
                  <div className="mt-1 text-xs text-stone-500">
                    (e.g., 0.5 = 6 months, 2 = 2 years)
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Select shortcuts */}
      <div className="mt-3 pt-3 border-t border-stone-200 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onStatusChange(['Active', 'Pending'])}
          className="text-xs font-medium text-stone-900 hover:text-stone-700"
        >
          Active Only
        </button>
        <span className="text-stone-300">|</span>
        <button
          type="button"
          onClick={() => onStatusChange(STATUS_OPTIONS.map(s => s.value))}
          className="text-xs font-medium text-stone-900 hover:text-stone-700"
        >
          All
        </button>
        <span className="text-stone-300">|</span>
        <button
          type="button"
          onClick={() => onStatusChange([])}
          className="text-xs font-medium text-stone-500 hover:text-stone-600"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

