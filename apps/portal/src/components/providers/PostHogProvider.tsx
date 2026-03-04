'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Only initialize PostHog if we have an API key
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
                // Enable debug mode in development
                loaded: (posthog) => {
                    if (process.env.NODE_ENV === 'development') {
                        // You can enable debug mode here if needed
                        // posthog.debug()
                    }
                },
                // Capture pageviews automatically
                capture_pageview: true,
                // Capture pageleave events
                capture_pageleave: true,
                // Disable autocapture in favor of manual tracking for better control
                autocapture: false,
                // Respect Do Not Track
                respect_dnt: true,
                // Persistence
                persistence: 'localStorage+cookie',
            })
        }
    }, [])

    // Return children directly if PostHog is not configured
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        return <>{children}</>
    }

    return <PHProvider client={posthog}>{children}</PHProvider>
}
