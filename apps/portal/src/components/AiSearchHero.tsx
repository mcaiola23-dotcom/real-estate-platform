'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline'

// Example queries for users to try
const EXAMPLE_QUERIES = [
  "Waterfront homes in Greenwich",
  "4 bedroom houses under $1M",
  "Condos near downtown Stamford",
  "Luxury estates with pools",
]

interface AiSearchHeroProps {
  /** Whether to show example query chips */
  showExamples?: boolean
  /** Custom placeholder text */
  placeholder?: string
  /** Custom heading text */
  heading?: string
  /** Custom subheading text */
  subheading?: string
}

export default function AiSearchHero({
  showExamples = true,
  placeholder = "Tell me all about your dream home!",
  heading = "Find Your Dream Home",
  subheading = "Describe what you're looking for in plain English — our AI will find the perfect matches."
}: AiSearchHeroProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      // Redirect to properties page with the AI search query
      const encodedQuery = encodeURIComponent(query.trim())
      router.push(`/properties?aiQuery=${encodedQuery}`)
    }
  }, [query, router])

  const handleExampleClick = useCallback((exampleQuery: string) => {
    setQuery(exampleQuery)
    // Auto-submit after a brief delay for user to see what's happening
    setTimeout(() => {
      const encodedQuery = encodeURIComponent(exampleQuery)
      router.push(`/properties?aiQuery=${encodedQuery}`)
    }, 300)
  }, [router])

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-stone-50 text-stone-700 text-sm font-medium mb-4">
            <SparklesIcon className="h-4 w-4 mr-2" />
            AI-Powered Search
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-3">
            {heading}
          </h2>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto">
            {subheading}
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div 
            className={`
              relative flex items-center bg-white rounded-2xl shadow-lg border-2 transition-all duration-200
              ${isFocused ? 'border-stone-500 shadow-xl shadow-primary-100' : 'border-stone-200 hover:border-stone-300'}
            `}
          >
            {/* AI Icon */}
            <div className="pl-5 flex-shrink-0">
              <SparklesIcon className={`h-6 w-6 transition-colors ${isFocused ? 'text-stone-700' : 'text-stone-400'}`} />
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className="
                flex-1 px-4 py-5 text-lg text-stone-900 placeholder-gray-400
                bg-transparent border-none focus:outline-none focus:ring-0
              "
              aria-label="Search for properties using natural language"
            />

            {/* Search Button */}
            <button
              type="submit"
              disabled={!query.trim()}
              className={`
                flex-shrink-0 mx-3 px-6 py-3 rounded-xl font-semibold text-white
                transition-all duration-200 flex items-center gap-2
                ${query.trim() 
                  ? 'bg-stone-900 hover:bg-stone-800 cursor-pointer' 
                  : 'bg-stone-300 cursor-not-allowed'}
              `}
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </form>

        {/* Example Queries */}
        {showExamples && (
          <div className="mt-6 text-center">
            <p className="text-sm text-stone-500 mb-3">Try these examples:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUERIES.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="
                    px-4 py-2 text-sm font-medium text-stone-500 
                    bg-stone-100 hover:bg-stone-50 hover:text-stone-700
                    rounded-full transition-colors duration-200
                    border border-transparent hover:border-stone-200
                  "
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-stone-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>193,000+ properties</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-stone-500"></div>
            <span>23 towns covered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span>AI-powered insights</span>
          </div>
        </div>
      </div>
    </section>
  )
}


