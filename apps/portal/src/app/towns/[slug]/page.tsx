import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Hero from '@/components/common/Hero'
import JsonLdSchema from '@/components/seo/JsonLdSchema'
import { joinPortalApiPath } from '@/lib/server/portal-api'
import { Place, WithContext } from 'schema-dts'

// Revalidate data every hour
export const revalidate = 3600

// Fetch town data by slug
async function getTown(slug: string) {
    const res = await fetch(joinPortalApiPath(`/api/cities/${slug}`), {
        next: { revalidate: 3600 }
    })

    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to fetch town')

    return res.json()
}

// Fetch neighborhoods for this town
async function getNeighborhoods(cityName: string) {
    const res = await fetch(joinPortalApiPath(`/neighborhoods/list?cities=${encodeURIComponent(cityName)}`), {
        next: { revalidate: 3600 }
    })

    if (!res.ok) return { neighborhoods: [] }
    return res.json()
}

export async function generateStaticParams() {
    const res = await fetch(joinPortalApiPath('/api/cities/list'))
    const data = await res.json()

    return data.cities.map((city: any) => ({
        slug: city.name.toLowerCase().replace(/ /g, '-'),
    }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const town = await getTown(params.slug)

    if (!town) {
        return {
            title: 'Town Not Found',
        }
    }

    return {
        title: `Homes for Sale in ${town.name}, CT | Real Estate & Market Data`,
        description: `Find ${town.active_listing_count} active homes for sale in ${town.name}, CT. View market stats, neighborhood guides, and AI-powered property insights.`,
        alternates: {
            canonical: `/towns/${params.slug}`,
        },
        openGraph: {
            title: `${town.name}, CT Real Estate | SmartMLS AI`,
            description: `Browse ${town.property_count} properties and ${town.active_listing_count} homes for sale in ${town.name}.`,
            images: [`/images/towns/${params.slug}.jpg`], // Fallback will be handled by layout/default
        }
    }
}

export default async function TownPage({ params }: { params: { slug: string } }) {
    const town = await getTown(params.slug)

    if (!town) {
        notFound()
    }

    const { neighborhoods } = await getNeighborhoods(town.name)

    // JSON-LD Schema
    const townSchema: WithContext<Place> = {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: town.name,
        address: {
            '@type': 'PostalAddress',
            addressLocality: town.name,
            addressRegion: 'CT',
            addressCountry: 'US'
        },
        url: `https://smartmls.ai/towns/${params.slug}`
    }

    // Pre-filter link for search
    const searchLink = `/properties?location=${encodeURIComponent(town.name)}`

    // Dynamic background - in prod this would map to real images. Using unsplash fallback.
    // We pseudo-randomize based on name length to vary images slightly or just use a nice default.
    const bgImage = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop"

    return (
        <main className="min-h-screen bg-stone-50 pb-20">
            <JsonLdSchema schema={townSchema} />

            <Hero
                backgroundImage={bgImage}
                title={`${town.name}, CT`}
                subtitle="Luxury Real Estate & Community Insights"
                stats={[
                    { label: 'Active Listings', value: town.active_listing_count },
                    { label: 'Total Properties', value: town.property_count }, // Simplified formatting
                ]}
            >
                <div className="flex justify-center gap-4">
                    <Link
                        href={searchLink}
                        className="px-8 py-3 bg-white text-stone-900 font-bold rounded-lg shadow-lg hover:bg-stone-100 transition-colors"
                    >
                        View All Listings in {town.name}
                    </Link>
                </div>
            </Hero>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                {/* Neighborhoods Section */}
                {neighborhoods.length > 0 && (
                    <div className="mb-16">
                        <h2 className="text-3xl font-serif font-bold text-stone-900 mb-8 pb-4 border-b border-stone-200">
                            Neighborhoods in {town.name}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {neighborhoods.map((n: any) => (
                                <Link
                                    key={n.id}
                                    href={`/neighborhoods/${n.name.toLowerCase().replace(/ /g, '-')}`}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 hover:shadow-md hover:border-stone-200 transition-all block group"
                                >
                                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-stone-900 mb-2">
                                        {n.name}
                                    </h3>
                                    <div className="text-sm text-stone-500 flex justify-between">
                                        <span>{n.parcel_count} properties</span>
                                        {/* We could add avg price if available */}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Market Description Stub */}
                <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-stone-200">
                    <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">About {town.name} Real Estate</h2>
                    <p className="text-stone-500 leading-relaxed text-lg">
                        Known for its exceptional quality of life, {town.name} offers a blend of historic charm and modern amenities.
                        Whether you prefer the privacy of a wooded estate or the convenience of a town center, {town.name} presents
                        diverse opportunities for luxury living. Browse our curated listings to find your next home.
                    </p>
                </div>
            </div>
        </main>
    )
}
