import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getRecentPosts } from "../lib/sanity.queries";
import Container from "../components/Container";
import EmailSignupSection from "@/app/components/EmailSignupSection";

export const metadata: Metadata = {
    title: "Insights | Fairfield County Real Estate Market News & Tips",
    description:
        "Expert analysis, market updates, and community news for Fairfield County real estate. Stay informed about trends, tips, and local developments.",
};

export const dynamic = "force-dynamic";

// All available categories with display info
const CATEGORIES = [
    { slug: 'market-update', label: 'Market Update' },
    { slug: 'community', label: 'Community' },
    { slug: 'real-estate-tips', label: 'Real Estate Tips' },
    { slug: 'news', label: 'News' },
    { slug: 'investing', label: 'Investing' },
    { slug: 'commercial', label: 'Commercial' },
];

export default async function InsightsPage() {
    const posts = await getRecentPosts();

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section with Background Image */}
            <section className="relative bg-stone-900 text-white overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-75"
                    style={{ backgroundImage: "url('/visual/stock/stamford water view - smaller (1).jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 to-stone-900/40" />
                <Container className="relative z-10 py-20 md:py-28">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium mb-6">
                            Insights
                        </h1>
                        <p className="text-lg text-stone-300 leading-relaxed">
                            Expert analysis, market updates, and community news for Fairfield County
                            real estate. Stay informed about trends, tips, and local developments.
                        </p>
                    </div>
                </Container>
            </section>

            <Container className="py-16">
                {/* Category Pills */}
                <div className="flex gap-3 mb-12 flex-wrap">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.slug}
                            href={`/insights/${cat.slug}`}
                            className="px-5 py-2 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-700 font-medium transition-colors"
                        >
                            {cat.label}
                        </Link>
                    ))}
                </div>

                {/* Post Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <Link
                            key={post._id}
                            href={`/insights/${post.categorySlug}/${post.slug}`}
                            className="group block bg-white rounded-xl overflow-hidden border border-stone-200 hover:border-stone-300 hover:shadow-xl transition-all duration-300"
                        >
                            {/* Featured Image */}
                            <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                                {post.featuredImageUrl ? (
                                    <Image
                                        src={post.featuredImageUrl}
                                        alt={post.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                                        <svg className="w-12 h-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <span className="inline-block px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm font-medium mb-4">
                                    {post.categoryLabel}
                                </span>
                                <h2 className="text-xl font-serif font-medium text-stone-900 mb-3 group-hover:text-stone-700 transition-colors line-clamp-2">
                                    {post.title}
                                </h2>
                                <p className="text-stone-500 text-sm">
                                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                {posts.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-stone-500 text-lg">No posts found.</p>
                        <p className="text-stone-400 mt-2">Check back soon for new content!</p>
                    </div>
                )}
            </Container>

            {/* Final CTA */}
            <section className="bg-stone-900 text-white grid grid-cols-1 lg:grid-cols-2">
                <div className="flex items-center justify-center py-20 px-4 order-2 lg:order-1">
                    <div className="max-w-xl mx-auto text-center lg:text-left">
                        <h2 className="font-serif text-3xl md:text-4xl font-medium mb-6">
                            Ready to work together?
                        </h2>
                        <p className="text-lg text-stone-300 mb-8 leading-relaxed">
                            Whether you're looking for market data or ready to make a move, let's start the conversation.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link href="/contact" className="inline-flex items-center justify-center px-8 py-3 bg-white text-stone-900 font-semibold rounded-none hover:bg-stone-100 transition-colors">
                                Contact Matt
                            </Link>
                            <Link href="/home-search" className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-semibold rounded-none hover:bg-white/10 transition-colors">
                                Search Homes
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="relative h-[400px] lg:h-auto order-1 lg:order-2">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/visual/stock/AdobeStock_521077579.jpeg')" }} />
                    <div className="absolute inset-0 bg-stone-900/20" />
                </div>
            </section>
            <EmailSignupSection />
        </div>
    );
}
