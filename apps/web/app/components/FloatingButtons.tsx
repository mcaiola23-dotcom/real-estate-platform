"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function FloatingButtons() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);

    // Show button after scrolling down a bit
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    // Don't show on map search page as it has its own controls
    if (pathname === "/home-search") return null;

    return (
        <div
            className={`fixed bottom-6 left-6 z-50 hidden md:flex flex-col gap-3 transition-opacity duration-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
                }`}
        >
            {/* Search Button */}
            <Link
                href="/home-search"
                className="w-14 h-14 bg-white rounded-full shadow-lg border border-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 hover:scale-105 transition-all group"
                aria-label="Search Homes"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="absolute left-full ml-3 bg-stone-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Search Homes
                </span>
            </Link>

            {/* Contact Button */}
            <Link
                href="/contact"
                className="h-14 bg-stone-900 rounded-full shadow-lg flex items-center gap-3 px-5 text-white hover:bg-stone-800 hover:scale-105 transition-all"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-medium">Let&apos;s Connect</span>
            </Link>
        </div>
    );
}
