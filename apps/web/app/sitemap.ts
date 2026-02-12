import { MetadataRoute } from 'next'
import { getAllTowns, getAllNeighborhoods, getAllPosts } from './lib/sanity.queries'

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://example.com' // Placeholder as requested

    // 1. Static Routes
    const staticRoutes = [
        '',
        '/about',
        '/services/buy',
        '/services/sell',
        '/services/investing',
        '/towns',
        '/insights',
        '/home-value',
        '/contact',
        '/fair-housing',
        '/privacy',
        '/terms',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1.0 : 0.8,
    }))

    // 2. Dynamic Routes: Towns
    const towns = await getAllTowns()
    const townRoutes = towns.map((town) => ({
        url: `${baseUrl}/towns/${town.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }))

    // 3. Dynamic Routes: Neighborhoods
    // Note: Neighborhoods are nested under towns: /towns/{townSlug}/{neighborhoodSlug}
    const neighborhoods = await getAllNeighborhoods()
    const neighborhoodRoutes = neighborhoods
        .filter((n) => n.town?.slug && n.slug) // Ensure required data exists
        .map((n) => ({
            url: `${baseUrl}/towns/${n.town!.slug}/${n.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }))

    // 4. Dynamic Routes: Insights (Posts)
    // URL: /insights/{categorySlug}/{postSlug}
    const posts = await getAllPosts()
    const postRoutes = posts
        .filter((p) => p.categorySlug && p.slug)
        .map((post) => ({
            url: `${baseUrl}/insights/${post.categorySlug}/${post.slug}`,
            lastModified: new Date(post.publishedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))

    return [...staticRoutes, ...townRoutes, ...neighborhoodRoutes, ...postRoutes]
}
