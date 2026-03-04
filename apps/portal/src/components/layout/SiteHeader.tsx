'use client'

import Link from 'next/link'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import UserMenu from '@/components/auth/UserMenu'

const navigation = [
    { name: 'Properties', href: '/properties' },
    { name: 'Towns', href: '/towns' },
    { name: 'Neighborhoods', href: '/neighborhoods' },
    { name: 'Agents', href: '/agents' },
    { name: 'Valuation', href: '/estimate' },
]

export default function SiteHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header className={`sticky top-0 z-50 bg-white border-b border-stone-200 transition-all duration-200 ${scrolled ? 'shadow-sm' : ''}`}>
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
                <div className={`flex items-center justify-between transition-all duration-200 ${scrolled ? 'h-14' : 'h-16'}`}>
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <span className={`hidden sm:block font-serif font-semibold text-stone-900 tracking-tight transition-all duration-200 ${scrolled ? 'text-lg' : 'text-xl'}`}>
                                Matt Caiola
                            </span>
                            <span className={`hidden sm:block text-stone-400 font-light transition-all duration-200 ${scrolled ? 'text-xs' : 'text-sm'}`}>
                                Luxury Properties
                            </span>
                            <span className="sm:hidden font-serif text-lg font-semibold text-stone-900">MC</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex md:items-center md:gap-x-6">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors uppercase tracking-wide"
                            >
                                {item.name}
                            </Link>
                        ))}

                        <div className="h-5 w-px bg-stone-200 mx-1" />

                        <UserMenu />
                    </div>

                    {/* Mobile: Auth + hamburger */}
                    <div className="flex items-center gap-4 md:hidden">
                        <UserMenu />

                        <button
                            type="button"
                            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-stone-600"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <span className="sr-only">Open main menu</span>
                            {mobileMenuOpen ? (
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-stone-200">
                        <div className="flex flex-col gap-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="block px-3 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg uppercase tracking-wide"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    )
}
