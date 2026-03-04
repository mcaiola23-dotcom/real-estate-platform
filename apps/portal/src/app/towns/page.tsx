import { Metadata } from 'next'
import Link from 'next/link'
import Hero from '@/components/common/Hero'
import { joinPortalApiPath } from '@/lib/server/portal-api'

export const metadata: Metadata = {
    title: 'All Towns | SmartMLS AI Platform',
    description: 'Explore real estate in Fairfield County, CT by town. Find homes for sale, market stats, and neighborhood guides.',
}

async function getTowns() {
    const res = await fetch(joinPortalApiPath('/api/cities/list'), {
        next: { revalidate: 3600 }
    })

    if (!res.ok) {
        throw new Error('Failed to fetch towns')
    }

    return res.json()
}

export default async function TownsPage() {
    const data = await getTowns()
    const { cities } = data

    // Filter out any empty towns if needed, or sort by importance
    // For Fairfield County app, we might want to prioritize specific ones or manual ordering.
    // API returns alphabetical.

    return (
        <main className="min-h-screen bg-stone-50 pb-20">
            <Hero
                backgroundImage="https://images.unsplash.com/photo-1592595896551-12b371d546d5?q=80&w=2070&auto=format&fit=crop"
                title="Explore Fairfield County"
                subtitle="Discover the perfect community for your lifestyle in Connecticut's Gold Coast."
                overlayOpacity={0.5}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[-80px] relative z-20">
                <div className="bg-white rounded-xl shadow-xl p-8 md:p-12 mb-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cities.map((city: any) => (
                            <Link
                                href={`/towns/${city.name.toLowerCase().replace(/ /g, '-')}`}
                                key={city.name}
                                className="group block p-6 rounded-lg border border-stone-100 hover:border-primary-100 hover:bg-stone-50 transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-serif font-bold text-stone-900 group-hover:text-stone-700 transition-colors">
                                        {city.name}
                                    </h3>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800 group-hover:bg-white">
                                        {city.property_count || 0} Homes
                                    </span>
                                </div>

                                <div className="flex items-center text-sm text-stone-500 mb-2">
                                    <span className="font-medium text-stone-900 mr-2">
                                        {city.active_listing_count || 0} Active Listings
                                    </span>
                                </div>

                                <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden mt-4">
                                    <div
                                        className="bg-stone-700 h-full transition-all duration-500 group-hover:w-full"
                                        style={{ width: '0%' }}
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* SEO Content Section */}
                <div className="prose prose-lg mx-auto text-stone-500 max-w-4xl">
                    <h2 className="font-serif text-3xl text-stone-900 text-center mb-6">Real Estate in Fairfield County</h2>
                    <p>
                        Fairfield County offers a diverse range of communities, from the bustling shoreline cities of Stamford and Norwalk
                        to the picturesque colonial towns of Fairfield and Westport, and the quiet pastoral beauty of Weston and Easton.
                        Whether you&apos;re looking for a waterfront estate, a downtown condo, or a historic farmhouse, you&apos;ll find it here.
                    </p>
                </div>
            </div>
        </main>
    )
}
