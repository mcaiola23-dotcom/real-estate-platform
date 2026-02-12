"use client";

import Image from "next/image";
import Link from "next/link";
import Container from "./Container";

interface TownHeroProps {
    title: string;
    subtitle?: string;
    imageSlug: string; // Used to construct /visual/towns/{slug}.jpg
    parentLink?: {
        href: string;
        label: string;
    };
}

export default function TownHero({
    title,
    subtitle,
    imageSlug,
    parentLink,
}: TownHeroProps) {
    return (
        <section className="relative min-h-[45vh] md:min-h-[55vh] flex items-center justify-center overflow-hidden bg-stone-900">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                {/* Fallback Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-900" />

                <Image
                    src={`/visual/towns/${imageSlug}.jpg`}
                    alt=""
                    fill
                    className={`object-cover ${imageSlug === 'darien' ? 'object-bottom' : 'object-center'}`}
                    priority
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none'; // Hide broken image to show gradient fallback
                    }}
                />

                {/* Improved gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-stone-900/30" />

                {/* Vignette effect for premium look */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(28,25,23,0.4)_100%)]" />
            </div>

            {/* Content Layer */}
            <Container className="relative z-10 text-center text-white py-16 md:py-20">
                {parentLink && (
                    <Link
                        href={parentLink.href}
                        className="inline-flex items-center gap-2 mb-6 text-xs font-semibold tracking-[0.2em] uppercase text-stone-300 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to {parentLink.label}
                    </Link>
                )}

                <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-stone-400 uppercase mb-4">
                    Connecticut&apos;s Gold Coast
                </p>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium mb-4 tracking-tight font-serif text-white">
                    {title}
                </h1>

                <div className="w-14 h-px bg-stone-500 mx-auto my-6" />

                {subtitle && (
                    <p className="text-lg md:text-xl text-stone-300 max-w-2xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                )}
            </Container>
        </section>
    );
}
