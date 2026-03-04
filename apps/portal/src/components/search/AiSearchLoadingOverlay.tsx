'use client'

import { useEffect, useState } from 'react'
import { SparklesIcon, HomeModernIcon } from '@heroicons/react/24/outline'

interface AiSearchLoadingOverlayProps {
  isLoading: boolean
  query?: string
}

/**
 * AI Search Loading Overlay
 * Shows "Finding you the perfect home..." with animated dots
 */
export default function AiSearchLoadingOverlay({ isLoading, query }: AiSearchLoadingOverlayProps) {
  const [dots, setDots] = useState('')

  // Animate dots
  useEffect(() => {
    if (!isLoading) {
      setDots('')
      return
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return ''
        return prev + '.'
      })
    }, 400)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Animated icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-stone-100 animate-ping opacity-30" />
          </div>
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-stone-500 to-stone-800 flex items-center justify-center shadow-lg">
              <SparklesIcon className="h-10 w-10 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main message */}
        <h2 className="text-2xl font-semibold text-stone-900 mb-2">
          Finding you the perfect home<span className="inline-block w-8 text-left">{dots}</span>
        </h2>

        {/* Query display */}
        {query && (
          <p className="text-stone-500 mb-6">
            Searching for: <span className="font-medium text-stone-900">&quot;{query}&quot;</span>
          </p>
        )}

        {/* Progress steps */}
        <div className="space-y-3 mt-8">
          <LoadingStep step={1} label="Understanding your request" delay={0} />
          <LoadingStep step={2} label="Analyzing properties" delay={500} />
          <LoadingStep step={3} label="Matching your criteria" delay={1000} />
        </div>
      </div>
    </div>
  )
}

interface LoadingStepProps {
  step: number
  label: string
  delay: number
}

function LoadingStep({ step, label, delay }: LoadingStepProps) {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsActive(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`flex items-center gap-3 transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
        }`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-300 ${isActive ? 'bg-stone-100 text-stone-700' : 'bg-stone-100 text-stone-400'
          }`}
      >
        {step}
      </div>
      <span className={`text-sm ${isActive ? 'text-stone-600' : 'text-stone-400'}`}>
        {label}
      </span>
      {isActive && (
        <div className="flex-1 flex justify-end">
          <div className="h-1 w-12 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-stone-500 animate-pulse rounded-full" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </div>
  )
}


