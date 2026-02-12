"use client";

import Image from "next/image";

interface Town {
    _id: string;
    name: string;
    slug: string;
}

interface TownsHoverBackgroundProps {
    towns: Town[];
    hoveredSlug: string | null;
}

export default function TownsHoverBackground({
    towns,
    hoveredSlug,
}: TownsHoverBackgroundProps) {
    // Default to first town if nothing hovered, or keep previous?
    // Strategy: Always render all town images but control opacity. 
    // If nothing hovered, maybe show the first one or a neutral one.
    // The prompt says: "Default background when not hovering: use /visual/towns/stamford.jpg (or first available)."

    const defaultSlug = towns.length > 0 ? towns[0].slug : null;
    const activeSlug = hoveredSlug || defaultSlug;

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-50">
            {/* Fallback Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-stone-100" />

            {towns.map((town) => {
                const isVisible = town.slug === activeSlug;
                const src = `/visual/towns/${town.slug}.jpg`;

                return (
                    <div
                        key={town._id}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"
                            }`}
                    >
                        {/* Gradient Overlay for Readability */}
                        <div className="absolute inset-0 bg-white/80 z-10" />

                        <Image
                            src={src}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="100vw"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
}
