'use client'

import Image from 'next/image'
import { ReactNode } from 'react'

interface StatItem {
    label: string
    value: string | number
    icon?: ReactNode
}

interface HeroProps {
    backgroundImage: string
    title: string
    subtitle?: string
    stats?: StatItem[]
    children?: ReactNode
    className?: string
    overlayOpacity?: number
}

export default function Hero({
    backgroundImage,
    title,
    subtitle,
    stats,
    children,
    className = '',
    overlayOpacity = 0.4
}: HeroProps) {
    return (
        <div className={`relative w-full h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden ${className}`}>
            {/* Background Image with Parallax-like fixed attachment effect or simple absolute */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={backgroundImage}
                    alt={title}
                    fill
                    priority
                    className="object-cover object-center"
                    quality={90}
                />
                {/* Gradient Overlay for text readability */}
                <div
                    className="absolute inset-0 bg-black transition-opacity duration-300"
                    style={{ opacity: overlayOpacity }}
                />
                {/* Vignette effect */}
                <div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"
                />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">

                {/* Title Block */}
                <div className="mb-8 animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-4 drop-shadow-lg">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-lg md:text-xl lg:text-2xl font-light text-stone-200 max-w-3xl mx-auto drop-shadow-md">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Optional Stats Row */}
                {stats && stats.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-10 animate-fade-in-up delay-100">
                        {stats.map((stat, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <span className="text-3xl md:text-4xl font-bold font-serif">{stat.value}</span>
                                <div className="flex items-center gap-2 mt-1 text-sm md:text-base font-medium uppercase tracking-wider text-stone-300">
                                    {stat.icon && <span className="w-4 h-4">{stat.icon}</span>}
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Arbitrary Children (Search Bar, Buttons) */}
                {children && (
                    <div className="mt-8 animate-fade-in-up delay-200">
                        {children}
                    </div>
                )}
            </div>
        </div>
    )
}
