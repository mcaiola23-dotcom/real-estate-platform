
"use client";

import Image from "next/image";
import Link from "next/link";
import Container from "./Container";

export default function AgentCTASection() {
    return (
        <section className="relative py-24 md:py-32 overflow-hidden bg-stone-900 border-t border-stone-800">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0 select-none">
                <Image
                    src="/visual/home/coastal-sunset.jpg"
                    alt="Fairfield County coastline at sunset"
                    fill
                    className="object-cover opacity-40"
                    sizes="100vw"
                    priority={false}
                />

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/50 to-stone-900/40" />
            </div>

            {/* Content Layer */}
            <Container className="relative z-10 text-center text-white">
                <p className="text-xs md:text-sm font-semibold tracking-[0.25em] text-stone-300 uppercase mb-4">
                    Work With Me
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium text-white mb-6">
                    Let&apos;s Find Your Perfect Home
                </h2>

                <div className="w-12 h-px bg-stone-500 mx-auto mb-8" />

                <p className="text-lg text-stone-200 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                    I&apos;m not just helping you find a property - I&apos;m helping you
                    find the place where you&apos;ll build your life. Whether you&apos;re
                    buying, selling, or just starting to explore, I&apos;d love to be
                    part of the journey.
                </p>

                <Link
                    href="/contact"
                    className="inline-block px-8 py-3 border border-white text-white hover:bg-white hover:text-stone-900 transition-all duration-300 tracking-wide uppercase text-xs md:text-sm font-semibold"
                >
                    Contact Matt
                </Link>
            </Container>
        </section>
    );
}
