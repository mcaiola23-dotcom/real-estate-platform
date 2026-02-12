import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllTowns, Town } from "../lib/sanity.queries";
import Container from "@/app/components/Container";
import EmailSignupSection from "@/app/components/EmailSignupSection";

export const metadata: Metadata = {
    title: "Connecticut's Gold Coast Towns | Explore Fairfield County",
    description:
        "Discover towns across Fairfield County, Connecticut. Browse Greenwich, Stamford, Darien, New Canaan, Westport, Fairfield, Norwalk, Ridgefield, and more.",
};

export const dynamic = "force-dynamic";

// Local fallback images for towns
const townFallbackImages: Record<string, string> = {
    "greenwich": "/visual/towns/greenwich.jpg",
    "stamford": "/visual/towns/stamford.jpg",
    "darien": "/visual/towns/darien.jpg",
    "new-canaan": "/visual/towns/new-canaan.jpg",
    "westport": "/visual/towns/westport.jpg",
    "fairfield": "/visual/towns/fairfield.jpg",
    "norwalk": "/visual/towns/norwalk.jpg",
    "ridgefield": "/visual/towns/ridgefield.jpg",
    "wilton": "/visual/towns/wilton.jpg",
};

// Town card component with hover effect
function TownCard({ town }: { town: Town }) {
    // Use Sanity heroImageUrl first, then fall back to local image
    const imageUrl = town.heroImageUrl || townFallbackImages[town.slug] || null;

    return (
        <Link
            href={`/towns/${town.slug}`}
            className="group relative block overflow-hidden rounded-xl bg-stone-100 aspect-[4/3]"
        >
            {/* Background Image */}
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={town.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-stone-300 to-stone-400" />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6">
                <h2 className="text-xl md:text-2xl font-serif font-medium text-white mb-2 group-hover:translate-y-0 translate-y-0 transition-transform">
                    {town.name}
                </h2>
                {town.overviewShort && (
                    <p className="text-sm text-stone-200 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {town.overviewShort}
                    </p>
                )}

                {/* Arrow indicator */}
                <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 -translate-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}

export default async function TownsPage() {
    const towns = await getAllTowns();

    if (!towns || towns.length === 0) {
        return (
            <div className="bg-white min-h-screen">
                <Container className="py-12">
                    <h1 className="text-3xl font-bold text-stone-900">Our Towns</h1>
                    <p className="mt-4 text-lg text-stone-600">
                        No towns found (check Sanity publishing and API access).
                    </p>
                </Container>
            </div>
        );
    }

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="relative bg-stone-900 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-70"
                    style={{ backgroundImage: "url('/visual/home/coastal-beach.jpg')" }}
                />
                <Container className="relative z-10 py-20 md:py-28">
                    <div className="max-w-3xl">
                        <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-stone-400 uppercase mb-4">
                            Connecticut&apos;s Gold Coast
                        </p>
                        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.05]">
                            Explore Our Towns
                        </h1>
                        <div className="w-14 h-px bg-stone-500 my-7" />
                        <p className="text-lg sm:text-xl text-stone-300 leading-relaxed">
                            From waterfront communities to charming downtown villages, discover what makes each Fairfield County town unique.
                        </p>
                    </div>
                </Container>
            </section>

            {/* Towns Grid */}
            <section className="py-16 md:py-20">
                <Container>
                    <div className="mb-10 flex items-center justify-between">
                        <div>
                            <h2 className="font-serif text-2xl md:text-3xl font-medium text-stone-900">
                                All Towns
                            </h2>
                            <p className="text-stone-600 mt-1">
                                {towns.length} communities to explore
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {towns.map((town) => (
                            <TownCard key={town._id} town={town} />
                        ))}
                    </div>
                </Container>
            </section>

            {/* CTA Section */}
            <section className="relative py-20 bg-stone-900 border-t border-stone-800 overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40"
                    style={{ backgroundImage: "url('/visual/stock/AdobeStock_390225432.jpeg')" }}
                />

                <Container className="relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="font-serif text-3xl md:text-4xl font-medium text-white mb-6">
                            Find Your Perfect Town
                        </h2>
                        <p className="text-lg text-stone-200 mb-10 leading-relaxed">
                            Not sure which community is right for you? Let&apos;s discuss your priorities and find the perfect match.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center">
                            <Link
                                href="/home-search"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-transparent border-2 border-white text-white font-medium rounded-none hover:bg-white/10 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Search Homes
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center px-8 py-3 bg-transparent border-2 border-white text-white font-medium rounded-none hover:bg-white/10 transition-colors"
                            >
                                Contact Matt
                            </Link>
                        </div>
                    </div>
                </Container>
            </section>
            <EmailSignupSection />
        </div>
    );
}
