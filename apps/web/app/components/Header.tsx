"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
} from '@clerk/nextjs';
import Container from './Container';
import townData from '../data/acs/fairfield-county-towns.json';

// Get towns from static JSON data
const TOWNS = Object.entries(townData.towns).map(([slug, town]) => ({
  slug,
  name: town.name,
})).sort((a, b) => a.name.localeCompare(b.name));

// Custom User Button with initials
function UserInitialsButton() {
  const { user, isLoaded } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isLoaded || !user) return null;

  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || user.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() || 'U';

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-stone-100 border-2 border-stone-300 flex items-center justify-center text-sm font-semibold text-stone-700 hover:bg-stone-200 hover:border-stone-400 transition-colors"
        aria-label="User menu"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-stone-100">
            <p className="text-sm font-medium text-stone-900 truncate">
              {user.fullName || user.primaryEmailAddress?.emailAddress}
            </p>
            <p className="text-xs text-stone-500 truncate">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <Link
            href="/saved-homes"
            className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Saved Homes
          </Link>
          <Link
            href="/saved-searches"
            className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Saved Searches
          </Link>
          <Link
            href="/account"
            className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Account Settings
          </Link>
          <div className="border-t border-stone-100 mt-1 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // Clerk sign out - we'll use the clerk signOut function
                window.location.href = '/sign-out';
              }}
              className="block w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTownsOpen, setIsTownsOpen] = useState(false);
  const townsRef = useRef<HTMLDivElement>(null);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (townsRef.current && !townsRef.current.contains(e.target as Node)) {
        setIsTownsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`w-full sticky top-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white shadow-md'
        : 'bg-white/80 backdrop-blur-md border-b border-stone-200'
        }`}
    >
      <Container>
        <div className={`flex items-center transition-all duration-300 ${isScrolled ? 'h-16' : 'h-20 md:h-24'
          }`}>
          {/* Matt Caiola Logo - Primary */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <div className={`relative transition-all duration-300 ${isScrolled
                ? 'h-8 w-28 sm:h-10 sm:w-36'
                : 'h-12 w-44 sm:h-14 sm:w-52 md:h-16 md:w-60'
                }`}>
                <Image
                  src="/brand/matt-caiola-logo.png"
                  alt="Matt Caiola Luxury Properties"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Nav - positioned closer to logo */}
          <nav className="hidden lg:flex items-center space-x-2.5 xl:space-x-4 ml-2">
            <Link href="/services/buy" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors uppercase tracking-wide">
              Buy
            </Link>
            <Link href="/services/sell" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors uppercase tracking-wide">
              Sell
            </Link>
            <Link href="/services/investing" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors uppercase tracking-wide">
              Investing
            </Link>

            {/* Towns Dropdown */}
            <div
              ref={townsRef}
              className="relative"
              onMouseEnter={() => setIsTownsOpen(true)}
              onMouseLeave={() => setIsTownsOpen(false)}
            >
              <div className="flex items-center gap-0.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors uppercase tracking-wide">
                <Link
                  href="/towns"
                  className="py-2 flex items-center gap-1"
                  onClick={() => setIsTownsOpen(false)}
                >
                  Towns
                  <svg
                    className={`w-4 h-4 transition-transform ${isTownsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
              </div>

              {/* Towns Mega Dropdown */}
              {isTownsOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-xl shadow-xl border border-stone-200 py-3 z-[100] min-w-[280px]"
                >
                  <div className="grid grid-cols-2 gap-1 px-2">
                    {TOWNS.map((town) => (
                      <Link
                        key={town.slug}
                        href={`/towns/${town.slug}`}
                        className="px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
                        onClick={() => setIsTownsOpen(false)}
                      >
                        {town.name}
                      </Link>
                    ))}
                  </div>
                  <div className="px-4 pt-3 mt-2 border-t border-stone-100">
                    <Link
                      href="/towns"
                      className="text-xs font-semibold text-stone-500 hover:text-stone-900 uppercase tracking-wider flex items-center gap-1"
                      onClick={() => setIsTownsOpen(false)}
                    >
                      View All Towns
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/insights" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors uppercase tracking-wide">
              Insights
            </Link>
            <Link href="/about" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors uppercase tracking-wide">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors uppercase tracking-wide mr-6">
              Contact
            </Link>
          </nav>

          {/* Right Side: Auth + Buttons + Higgins Logo */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0 ml-auto pl-2">
            {/* Auth - Initials Style */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors uppercase tracking-wide">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserInitialsButton />
            </SignedIn>

            {/* Separator */}
            <div className="h-6 w-px bg-stone-300" />

            {/* Home Search Button - House Icon */}
            <Link
              href="/home-search"
              className="inline-flex items-center justify-center gap-1.5 px-3 h-9 text-sm font-medium text-stone-700 hover:text-stone-900 border border-stone-300 hover:border-stone-400 rounded-full transition-colors leading-none"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Search</span>
            </Link>

            {/* Separator between Search and Home Value */}
            <div className="h-6 w-px bg-stone-300" />

            {/* Home Value Button */}
            <Link
              href="/home-value"
              className="inline-flex items-center justify-center px-4 h-9 border border-transparent text-sm font-medium rounded-full text-white bg-stone-900 hover:bg-stone-800 shadow-sm transition-colors whitespace-nowrap"
            >
              Home Value
            </Link>

            {/* Higgins Group Logo - matching size */}
            <div className={`relative transition-all duration-300 ml-1 ${isScrolled ? 'h-8 w-28' : 'h-12 w-40 xl:h-14 xl:w-44'
              }`}>
              <Image
                src="/brand/higgins-lockup.jpg"
                alt="Higgins Group Private Brokerage"
                fill
                className="object-contain object-right"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <SignedIn>
              <UserInitialsButton />
            </SignedIn>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-stone-400 hover:text-stone-500 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-500"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-stone-200">
          <Container>
            <div className="pt-2 pb-4 space-y-1">
              <Link href="/services/buy" className="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50" onClick={() => setIsMenuOpen(false)}>Buy</Link>
              <Link href="/services/sell" className="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50" onClick={() => setIsMenuOpen(false)}>Sell</Link>
              <Link href="/services/investing" className="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50" onClick={() => setIsMenuOpen(false)}>Investing</Link>

              {/* Towns Section in Mobile */}
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2">Towns</p>
                <div className="grid grid-cols-2 gap-1 pl-2">
                  {TOWNS.map((town) => (
                    <Link
                      key={town.slug}
                      href={`/towns/${town.slug}`}
                      className="text-sm text-stone-600 hover:text-stone-900 py-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {town.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link href="/insights" className="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50" onClick={() => setIsMenuOpen(false)}>Insights</Link>
              <Link href="/about" className="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50" onClick={() => setIsMenuOpen(false)}>About</Link>
              <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50" onClick={() => setIsMenuOpen(false)}>Contact</Link>

              {/* Auth Links - Mobile */}
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 w-full text-left">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Sign In / Create Account
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/saved-homes" className="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50" onClick={() => setIsMenuOpen(false)}>
                  Saved Homes
                </Link>
                <Link href="/saved-searches" className="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50" onClick={() => setIsMenuOpen(false)}>
                  Saved Searches
                </Link>
              </SignedIn>

              <div className="pt-4 mt-4 border-t border-stone-200 space-y-3">
                <Link href="/home-search" className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full font-medium text-stone-700 border border-stone-300 hover:border-stone-400" onClick={() => setIsMenuOpen(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Search Homes
                </Link>
                <Link href="/home-value" className="block w-full text-center px-4 py-3 rounded-full font-bold text-white bg-stone-900 hover:bg-stone-800" onClick={() => setIsMenuOpen(false)}>
                  Home Value Estimate
                </Link>
              </div>
              {/* Higgins Group Logo in Mobile Menu */}
              <div className="pt-4 mt-4 border-t border-stone-200 flex justify-center">
                <div className="relative h-12 w-40">
                  <Image
                    src="/brand/higgins-lockup.jpg"
                    alt="Higgins Group Private Brokerage"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
