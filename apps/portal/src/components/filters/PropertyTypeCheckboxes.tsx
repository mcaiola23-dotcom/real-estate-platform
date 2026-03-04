'use client'

import { CheckIcon } from '@heroicons/react/24/outline'

interface PropertyTypeCheckboxesProps {
  selectedTypes: string[]
  onChange: (types: string[]) => void
  className?: string
}

const PROPERTY_TYPES = [
  { value: 'Single Family', label: 'Single Family' },
  { value: 'Condo', label: 'Condo' },
  { value: 'Multi-Family', label: 'Multi-Family' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Land', label: 'Land' },
]

/**
 * Multi-select property type filter with checkboxes
 */
export default function PropertyTypeCheckboxes({
  selectedTypes,
  onChange,
  className = ''
}: PropertyTypeCheckboxesProps) {
  const toggleType = (typeValue: string) => {
    if (selectedTypes.includes(typeValue)) {
      onChange(selectedTypes.filter(t => t !== typeValue))
    } else {
      onChange([...selectedTypes, typeValue])
    }
  }

  const selectAll = () => {
    onChange(PROPERTY_TYPES.map(t => t.value))
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-stone-600">
          Property Type
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-medium text-stone-900 hover:text-stone-700"
          >
            All
          </button>
          <span className="text-stone-300">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-stone-500 hover:text-stone-600"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {PROPERTY_TYPES.map((type) => {
          const isSelected = selectedTypes.includes(type.value)
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => toggleType(type.value)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors text-left"
            >
              <div
                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-stone-500 border-stone-500'
                    : 'border-stone-300 hover:border-stone-400'
                }`}
              >
                {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
              </div>
              <span className="text-sm font-medium text-stone-900">
                {type.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

