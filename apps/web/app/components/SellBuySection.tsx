"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * Sell/Buy Split Section
 * Horizontal split with "Selling?" on left and "Buying?" on right
 * Each side has a background image with overlay and ghost button CTA
 */
export default function SellBuySection() {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 min-h-[500px] lg:min-h-[600px]">
            {/* Selling Side */}
            <Link
                href="/services/sell"
                className="group relative flex items-center justify-center overflow-hidden"
            >
                {/* Background Image */}
                <Image
                    src="/visual/stock/AdobeStock_245746541.jpeg"
                    alt="Luxury home interior"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />

                {/* Content */}
                <div className="relative z-10 text-center px-8">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6 drop-shadow-lg">
                        Selling?
                    </h2>
                    <p className="text-stone-200 text-lg mb-8 max-w-sm mx-auto">
                        Get top dollar with strategic pricing and premium marketing.
                    </p>
                    <span className="inline-block px-8 py-3 bg-transparent border-2 border-white text-white font-medium rounded-none hover:bg-white/10 transition-colors text-lg">
                        Explore Selling Services
                    </span>
                </div>
            </Link>

            {/* Buying Side */}
            <Link
                href="/services/buy"
                className="group relative flex items-center justify-center overflow-hidden"
            >
                {/* Background Image */}
                <Image
                    src="/visual/stock/AdobeStock_552206764.jpeg"
                    alt="Luxury property exterior"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />

                {/* Content */}
                <div className="relative z-10 text-center px-8">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6 drop-shadow-lg">
                        Buying?
                    </h2>
                    <p className="text-stone-200 text-lg mb-8 max-w-sm mx-auto">
                        Find your dream home with personalized search and expert guidance.
                    </p>
                    <span className="inline-block px-8 py-3 bg-transparent border-2 border-white text-white font-medium rounded-none hover:bg-white/10 transition-colors text-lg">
                        Explore Buying Services
                    </span>
                </div>
            </Link>
        </section>
    );
}
