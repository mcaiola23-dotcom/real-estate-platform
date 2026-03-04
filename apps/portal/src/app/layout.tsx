import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import '../styles/leaflet.css'
import './globals.css'
import { PostHogProvider } from '@/components/providers/PostHogProvider'
import { AuthProvider } from '@/components/auth'
import SiteHeader from '@/components/layout/SiteHeader'
import { ComparisonProvider } from '@/components/comparison/ComparisonContext'
import ComparisonBar from '@/components/comparison/ComparisonBar'
import ComparisonOverlay from '@/components/comparison/ComparisonOverlay'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-inter' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
})

export const metadata: Metadata = {
  title: 'SmartMLS AI Platform',
  description: 'AI-driven real estate platform for Fairfield County, CT',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cormorant.variable} font-sans antialiased`}>
        <AuthProvider>
          <PostHogProvider>
            <ComparisonProvider>
              <div className="min-h-screen bg-stone-50">
                <SiteHeader />
                <main>
                  {children}
                </main>
              </div>
              <ComparisonBar />
              <ComparisonOverlay />
            </ComparisonProvider>
          </PostHogProvider>
        </AuthProvider>
      </body>
    </html>
  )
}



