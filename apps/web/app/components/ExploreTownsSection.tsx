"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Town {
    _id: string;
    name: string;
    slug: string;
    overviewShort?: string;
}

interface ExploreTownsSectionProps {
    towns: Town[];
}

// Map town slugs to local image files
const TOWN_IMAGES: Record<string, string> = {
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

export default function ExploreTownsSection({ towns }: ExploreTownsSectionProps) {
    const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

    return (
        <section className="py-20 bg-stone-100">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-stone-900 mb-2">Explore Towns</h2>
                        <p className="text-stone-600">Discover the unique communities of Fairfield County.</p>
                    </div>
                    <Link href="/towns" className="hidden sm:inline-block text-stone-900 font-medium hover:underline decoration-stone-400 underline-offset-4">
                        View all towns &rarr;
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {towns.map((town) => {
                        const imageUrl = TOWN_IMAGES[town.slug] || "/visual/towns/greenwich.jpg";
                        const isHovered = hoveredSlug === town.slug;

                        return (
                            <Link
                                key={town._id}
                                href={`/towns/${town.slug}`}
                                className="group relative block aspect-square rounded-lg overflow-hidden"
                                onMouseEnter={() => setHoveredSlug(town.slug)}
                                onMouseLeave={() => setHoveredSlug(null)}
                            >
                                {/* Background Image - always visible */}
                                <Image
                                    src={imageUrl}
                                    alt={town.name}
                                    fill
                                    className={`object-cover transition-transform duration-700 ${isHovered ? "scale-105" : "scale-100"
                                        }`}
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />

                                {/* Dark overlay - darker on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 transition-opacity duration-300 ${isHovered ? "opacity-90" : "opacity-70"
                                    }`} />

                                {/* Content */}
                                <div className="absolute inset-0 flex flex-col justify-end p-6">
                                    <h3 className="text-2xl font-serif font-medium text-white mb-2">
                                        {town.name}
                                    </h3>
                                    {town.overviewShort && (
                                        <p className={`text-stone-200 text-sm line-clamp-2 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-80"
                                            }`}>
                                            {town.overviewShort}
                                        </p>
                                    )}

                                    {/* Explore link - appears on hover */}
                                    <span className={`mt-4 text-sm font-medium text-white/90 transition-all duration-300 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                                        }`}>
                                        Explore {town.name} &rarr;
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-8 text-center sm:hidden">
                    <Link href="/towns" className="text-stone-900 font-medium hover:underline decoration-stone-400 underline-offset-4">
                        View all towns &rarr;
                    </Link>
                </div>
            </div>
        </section>
    );
}
