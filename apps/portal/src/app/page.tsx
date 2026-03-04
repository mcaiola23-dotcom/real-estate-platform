'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  HomeIcon,
  ChartBarIcon,
  MapIcon,
  UserGroupIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

const EXAMPLE_QUERIES = [
  "Homes in Stamford under $1.5M",
  "4 bedroom houses under $1M",
  "Houses in Greenwich with 5+ bedrooms",
  "Homes in Westport over $2M",
]

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      const encodedQuery = encodeURIComponent(query.trim())
      router.push(`/properties?aiQuery=${encodedQuery}`)
    }
  }, [query, router])

  const handleExampleClick = useCallback((exampleQuery: string) => {
    setQuery(exampleQuery)
    setTimeout(() => {
      const encodedQuery = encodeURIComponent(exampleQuery)
      router.push(`/properties?aiQuery=${encodedQuery}`)
    }, 300)
  }, [router])

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-stone-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-800 via-stone-900 to-stone-950 opacity-80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center">
            <p className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 text-stone-300 text-sm font-medium mb-8 animate-fade-in tracking-wide">
              AI-Powered Real Estate
            </p>

            <h1 className="font-serif text-4xl lg:text-6xl font-semibold text-white mb-5 animate-slide-up tracking-tight leading-tight">
              Find Your Perfect Home
              <span className="block text-stone-400">
                in Fairfield County
              </span>
            </h1>

            <p className="text-lg text-stone-400 max-w-2xl mx-auto mb-10 animate-slide-up">
              Describe what you&apos;re looking for in plain English — our AI will find the perfect matches.
            </p>

            {/* AI Search Form */}
            <div className="max-w-3xl mx-auto mb-10 animate-bounce-in">
              <form onSubmit={handleSubmit} className="relative">
                <div
                  className={`
                    relative flex items-center bg-white rounded-full shadow-xl border-2 transition-all duration-200
                    ${isFocused ? 'border-stone-400 shadow-stone-200/20' : 'border-transparent'}
                  `}
                >
                  <div className="pl-5 flex-shrink-0">
                    <MagnifyingGlassIcon className={`h-5 w-5 transition-colors ${isFocused ? 'text-stone-900' : 'text-stone-400'}`} />
                  </div>

                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Tell me all about your dream home..."
                    className="
                      flex-1 px-4 py-4 text-base text-stone-900 placeholder-stone-400
                      bg-transparent border-none focus:outline-none focus:ring-0
                    "
                    aria-label="Search for properties using natural language"
                  />

                  <button
                    type="submit"
                    disabled={!query.trim()}
                    className={`
                      flex-shrink-0 mr-2 px-6 py-2.5 rounded-full font-medium text-white text-sm
                      transition-all duration-200 flex items-center gap-2
                      ${query.trim()
                        ? 'bg-stone-900 hover:bg-stone-800 cursor-pointer'
                        : 'bg-stone-300 cursor-not-allowed'}
                    `}
                  >
                    <span>Search</span>
                  </button>
                </div>
              </form>

              {/* Example Queries */}
              <div className="mt-5 text-center">
                <p className="text-sm text-stone-500 mb-3">Try these examples:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLE_QUERIES.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(example)}
                      className="
                        px-4 py-2 text-sm font-medium text-stone-300
                        bg-white/5 hover:bg-white/10
                        rounded-full transition-colors duration-200
                        border border-white/10 hover:border-white/20
                      "
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 text-stone-500 text-sm animate-fade-in">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>193K+ Properties</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>23 Towns</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>AI-Powered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-stone-900 mb-4">
              Why Choose SmartMLS AI?
            </h2>
            <p className="text-stone-500 max-w-2xl mx-auto">
              Experience the future of real estate with cutting-edge AI technology
              and hyper-local market intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: HomeIcon,
                title: "Smart Search",
                description: "AI-powered property recommendations that learn your preferences and suggest perfect matches.",
              },
              {
                icon: ChartBarIcon,
                title: "Transparent Valuations",
                description: "Get instant property valuations with confidence scores and explainable AI insights.",
              },
              {
                icon: MapIcon,
                title: "Interactive Maps",
                description: "Explore neighborhoods with detailed analytics, school ratings, and commute times.",
              },
              {
                icon: UserGroupIcon,
                title: "Expert Network",
                description: "Connect with top-rated local agents and get personalized guidance throughout your journey.",
              }
            ].map((feature, index) => (
              <div key={index} className="card group">
                <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center mb-4 group-hover:bg-stone-900 transition-colors duration-300">
                  <feature.icon className="h-5 w-5 text-stone-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "500+", label: "Properties Listed" },
              { number: "95%", label: "Valuation Accuracy" },
              { number: "24/7", label: "AI Support" },
              { number: "100%", label: "Local Coverage" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-serif text-3xl lg:text-4xl font-semibold text-stone-900 mb-1">{stat.number}</div>
                <div className="text-sm text-stone-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-stone-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-white mb-4">
            Ready to Find Your Dream Home?
          </h2>
          <p className="text-lg text-stone-400 mb-10">
            Join thousands of satisfied homeowners who found their perfect property with SmartMLS AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/properties" className="inline-flex items-center justify-center bg-white text-stone-900 font-medium text-sm px-8 py-3 rounded-full hover:bg-stone-100 transition-colors">
              Start Your Search
            </Link>
            <Link href="/estimate" className="inline-flex items-center justify-center border border-stone-600 text-stone-300 font-medium text-sm px-8 py-3 rounded-full hover:bg-stone-800 transition-colors">
              Get Free Valuation
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
                <span className="font-serif text-lg font-semibold text-stone-900">SmartMLS</span>
              </div>
              <p className="text-sm text-stone-500">AI-driven real estate for Fairfield County, CT</p>
            </div>

            {/* Explore */}
            <div>
              <h4 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Explore</h4>
              <ul className="space-y-2">
                <li><Link href="/properties" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Properties</Link></li>
                <li><Link href="/towns" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Towns</Link></li>
                <li><Link href="/neighborhoods" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Neighborhoods</Link></li>
              </ul>
            </div>

            {/* Tools */}
            <div>
              <h4 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Tools</h4>
              <ul className="space-y-2">
                <li><Link href="/estimate" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Home Valuation</Link></li>
                <li><Link href="/agents" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Find an Agent</Link></li>
                <li><Link href="/saved-searches" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Saved Searches</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Legal</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-stone-600">Privacy Policy</span></li>
                <li><span className="text-sm text-stone-600">Terms of Service</span></li>
                <li><span className="text-sm text-stone-600">Fair Housing</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-stone-200">
            <p className="text-xs text-stone-400 text-center">&copy; {new Date().getFullYear()} SmartMLS AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
