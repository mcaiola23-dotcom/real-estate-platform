
"use client";

import Image from "next/image";
import Link from "next/link";
import Container from "./Container";

// Similar towns mapping
// If a town is missing, we fall back to a default set
const SIMILAR_TOWNS: Record<string, { name: string; slug: string }[]> = {
    "greenwich": [
        { name: "Darien", slug: "darien" },
        { name: "New Canaan", slug: "new-canaan" },
        { name: "Westport", slug: "westport" }
    ],
    "darien": [
        { name: "New Canaan", slug: "new-canaan" },
        { name: "Westport", slug: "westport" },
        { name: "Greenwich", slug: "greenwich" }
    ],
    "new-canaan": [
        { name: "Darien", slug: "darien" },
        { name: "Ridgefield", slug: "ridgefield" },
        { name: "Wilton", slug: "wilton" }
    ],
    "westport": [
        { name: "Fairfield", slug: "fairfield" },
        { name: "Darien", slug: "darien" },
        { name: "Greenwich", slug: "greenwich" } // Replacing Southport as it's a neighborhood
    ],
    "fairfield": [
        { name: "Westport", slug: "westport" },
        { name: "Norwalk", slug: "norwalk" },
        { name: "Stamford", slug: "stamford" }
    ],
    "norwalk": [
        { name: "Stamford", slug: "stamford" },
        { name: "Westport", slug: "westport" },
        { name: "Wilton", slug: "wilton" }
    ],
    "stamford": [
        { name: "Norwalk", slug: "norwalk" },
        { name: "Greenwich", slug: "greenwich" },
        { name: "Darien", slug: "darien" }
    ],
    "ridgefield": [
        { name: "Wilton", slug: "wilton" },
        { name: "New Canaan", slug: "new-canaan" },
        { name: "Westport", slug: "westport" }
    ],
    "wilton": [
        { name: "Ridgefield", slug: "ridgefield" },
        { name: "New Canaan", slug: "new-canaan" },
        { name: "Norwalk", slug: "norwalk" }
    ]
};

// Fallback if specific mapping missing or invalid
const DEFAULT_SIMILAR = [
    { name: "Westport", slug: "westport" },
    { name: "Fairfield", slug: "fairfield" },
    { name: "Darien", slug: "darien" }
];

interface SimilarTownsSectionProps {
    currentTownSlug: string;
}

export default function SimilarTownsSection({ currentTownSlug }: SimilarTownsSectionProps) {
    // Get towns, filtering out any that might match current (just in case of fallback)
    let towns = SIMILAR_TOWNS[currentTownSlug] || DEFAULT_SIMILAR;

    // Safety check to ensure we don't show the current town
    if (towns.some(t => t.slug === currentTownSlug)) {
        towns = DEFAULT_SIMILAR.filter(t => t.slug !== currentTownSlug).slice(0, 3);
    }

    // If we still don't have 3, just use the defaults carefully
    if (towns.length < 3) {
        const extras = DEFAULT_SIMILAR.filter(t => t.slug !== currentTownSlug && !towns.some(existing => existing.slug === t.slug));
        towns = [...towns, ...extras].slice(0, 3);
    }

    return (
        <section className="py-20 bg-stone-50 border-t border-stone-200">
            <Container>
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-serif font-medium text-stone-900 mb-4">
                        Explore Similar Towns
                    </h2>
                    <p className="text-stone-500 max-w-xl mx-auto">
                        Discover other communities in Fairfield County that match your lifestyle.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {towns.map((town) => (
                        <Link
                            key={town.slug}
                            href={`/towns/${town.slug}`}
                            className="group relative aspect-[4/3] overflow-hidden rounded-lg shadow-md block"
                        >
                            <Image
                                src={`/visual/towns/${town.slug}.jpg`}
                                alt={town.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 33vw"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-stone-900/30 group-hover:bg-stone-900/40 transition-colors duration-300" />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                <h3 className="text-3xl md:text-4xl font-serif font-medium text-white mb-4 drop-shadow-md">
                                    {town.name}
                                </h3>

                                {/* Ghost Button */}
                                <span className="px-6 py-2 border border-white text-white text-sm font-medium tracking-wide uppercase opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                    Explore {town.name}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="text-center">
                    <Link
                        href="/towns"
                        className="inline-block px-8 py-3 bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
                    >
                        Explore All Towns
                    </Link>
                </div>
            </Container>
        </section>
    );
}
