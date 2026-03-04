import { MetadataRoute } from 'next'
import { joinPortalApiPath } from '@/lib/server/portal-api'

// Base URL from env or default
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://smartmls.ai'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const routes: MetadataRoute.Sitemap = [
        {
            url: `${BASE_URL}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/properties`,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/towns`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ]

    // Fetch Towns
    try {
        const townsRes = await fetch(joinPortalApiPath('/api/cities/list'), {
            next: { revalidate: 3600 }
        })

        if (townsRes.ok) {
            const townsData = await townsRes.json()
            const townRoutes = townsData.cities.map((city: any) => ({
                url: `${BASE_URL}/towns/${city.name.toLowerCase().replace(/ /g, '-')}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            }))
            routes.push(...townRoutes)
        }
    } catch (error) {
        console.error('Sitemap: Failed to fetch towns', error)
    }

    // Fetch Neighborhoods
    try {
        const neighborhoodsRes = await fetch(joinPortalApiPath('/neighborhoods/list'), {
            next: { revalidate: 3600 }
        })

        if (neighborhoodsRes.ok) {
            const nData = await neighborhoodsRes.json()
            const nRoutes = nData.neighborhoods.map((n: any) => ({
                url: `${BASE_URL}/neighborhoods/${n.name.toLowerCase().replace(/ /g, '-')}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            }))
            routes.push(...nRoutes)
        }
    } catch (error) {
        console.error('Sitemap: Failed to fetch neighborhoods', error)
    }

    // TODO: Add Listing Pages (Active Listings)
    // Fetching all listing IDs might be heavy. We can add a specialized endpoint later to stream IDs.
    // For now, we omit individual property pages from sitemap.xml to avoid performance issues
    // until we have a dedicated ID-only endpoint or sitemap index strategy.

    return routes
}
