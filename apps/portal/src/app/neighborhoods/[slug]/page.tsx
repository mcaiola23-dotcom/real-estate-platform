import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Hero from '@/components/common/Hero'
import JsonLdSchema from '@/components/seo/JsonLdSchema'
import { joinPortalApiPath } from '@/lib/server/portal-api'
import { Place, WithContext } from 'schema-dts'

export const revalidate = 3600

async function getNeighborhood(slug: string) {
    const res = await fetch(joinPortalApiPath(`/neighborhoods/by-slug/${slug}`), {
        next: { revalidate: 3600 }
    })

    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to fetch neighborhood')

    return res.json()
}

// We can implement generateStaticParams if we fetch all neighborhoods first.
// Given thousands of neighborhoods, we might want to skip or do a limited set.
// For now, let's omit generateStaticParams for neighborhoods to keep build fast, or fetch just top ones?
// Let's implement it for top neighborhoods if possible, or just skip it (ISR on demand).
// I'll skip it for now to avoid massive build times.

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const neighborhood = await getNeighborhood(params.slug)

    if (!neighborhood) {
        return { title: 'Neighborhood Not Found' }
    }

    return {
        title: `Homes in ${neighborhood.name} (${neighborhood.town_name}, CT) | SmartMLS AI`,
        description: `Explore homes for sale in the ${neighborhood.name} neighborhood of ${neighborhood.town_name}, CT. View market trends and listings.`,
        alternates: {
            canonical: `/neighborhoods/${params.slug}`,
        }
    }
}

export default async function NeighborhoodPage({ params }: { params: { slug: string } }) {
    const neighborhood = await getNeighborhood(params.slug)

    if (!neighborhood) {
        notFound()
    }

    // Format town slug for breadcrumb
    const townSlug = neighborhood.town_name.toLowerCase().replace(/ /g, '-')


    // JSON-LD
    const schema: WithContext<Place> = {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: neighborhood.name,
        address: {
            '@type': 'PostalAddress',
            addressLocality: neighborhood.town_name,
            addressRegion: 'CT'
        },
        containedInPlace: {
            '@type': 'City',
            name: neighborhood.town_name
        }
    }

    // Background image (different fallback)
    const bgImage = "https://images.unsplash.com/photo-1600596542815-e32c8ec049b8?q=80&w=2074&auto=format&fit=crop"

    return (
        <main className="min-h-screen bg-stone-50 pb-20">
            <JsonLdSchema schema={schema} />

            {/* Breadcrumb-ish Hero overlay? Or separate breadcrumb */}

            <Hero
                backgroundImage={bgImage}
                title={neighborhood.name}
                subtitle={`A Neighborhood in ${neighborhood.town_name}, CT`}
                stats={[
                    { label: 'Avg Price', value: neighborhood.avg_price ? `$${Math.round(neighborhood.avg_price / 1000)}k` : 'N/A' },
                    { label: 'Properties', value: neighborhood.property_count }
                ]}
            >
                <div className="flex flex-col items-center gap-4">
                    <div className="text-white/80 text-sm mb-2 font-medium tracking-wide uppercase">
                        <Link href="/towns" className="hover:text-white underline decoration-transparent hover:decoration-white transition-all">Towns</Link>
                        {' / '}
                        <Link href={`/towns/${townSlug}`} className="hover:text-white underline decoration-transparent hover:decoration-white transition-all">{neighborhood.town_name}</Link>
                    </div>

                    <Link
                        href={`/properties?location=${encodeURIComponent(neighborhood.name)}`}
                        className="px-8 py-3 bg-white text-stone-900 font-bold rounded-lg shadow-lg hover:bg-stone-100 transition-colors"
                    >
                        View Homes in {neighborhood.name}
                    </Link>
                </div>
            </Hero>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                {/* Could list nearby neighborhoods or active listings grid here */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 text-center text-stone-500 py-16">
                    <h3 className="text-xl font-medium mb-2">Detailed Market Data Coming Soon</h3>
                    <p>We are aggregating live market statistics for {neighborhood.name}. Check back shortly.</p>
                </div>
            </div>
        </main>
    )
}
