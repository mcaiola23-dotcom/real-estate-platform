import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Header from "./components/Header";
import GlobalFooter from "./components/GlobalFooter";
import FloatingButtons from "./components/FloatingButtons";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Matt Caiola | Luxury Real Estate | Fairfield County CT",
    template: "%s | Matt Caiola | Fairfield County Real Estate",
  },
  description:
    "Matt Caiola offers expert luxury real estate guidance in Fairfield County, Connecticut. Serving Greenwich, Stamford, Darien, New Canaan, Westport, Fairfield, Norwalk, and surrounding towns. Licensed with Higgins Group Private Brokerage.",
  metadataBase: new URL("https://example.com"), // Placeholder — update before launch
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Matt Caiola Luxury Properties",
    title: "Matt Caiola | Luxury Real Estate | Fairfield County CT",
    description:
      "Matt Caiola offers expert luxury real estate guidance in Fairfield County, Connecticut. Serving Greenwich, Stamford, Darien, New Canaan, Westport, Fairfield, Norwalk, and surrounding towns.",
    images: [
      {
        url: "/visual/home/hero-1.jpg",
        width: 1200,
        height: 630,
        alt: "Matt Caiola - Fairfield County Connecticut luxury real estate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Matt Caiola | Luxury Real Estate | Fairfield County CT",
    description:
      "Matt Caiola offers expert luxury real estate guidance in Fairfield County, Connecticut. Serving Greenwich, Stamford, Darien, New Canaan, Westport, and surrounding towns.",
    images: ["/visual/home/hero-1.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Matt Caiola",
  alternateName: "Matt Caiola Luxury Properties",
  image: "https://example.com/brand/matt-headshot.jpg", // Placeholder domain
  description:
    "Matt Caiola provides expert luxury real estate services in Fairfield County, Connecticut. With a background in corporate finance and personal investment experience, Matt brings analytical rigor and genuine care to every transaction. Serving Greenwich, Stamford, Darien, New Canaan, Westport, Fairfield, Norwalk, and surrounding towns.",
  url: "https://example.com", // Placeholder — update before launch
  telephone: "+1-203-658-8282",
  priceRange: "$$$",
  worksFor: {
    "@type": "RealEstateAgent",
    name: "Higgins Group Private Brokerage",
    url: "https://higginsgroup.com/",
    address: {
      "@type": "PostalAddress",
      streetAddress: "1055 Washington Blvd.",
      addressLocality: "Stamford",
      addressRegion: "CT",
      postalCode: "06901",
      addressCountry: "US",
    },
    telephone: "+1-203-658-8282",
  },
  areaServed: [
    { "@type": "City", name: "Greenwich", addressRegion: "CT" },
    { "@type": "City", name: "Stamford", addressRegion: "CT" },
    { "@type": "City", name: "Darien", addressRegion: "CT" },
    { "@type": "City", name: "New Canaan", addressRegion: "CT" },
    { "@type": "City", name: "Westport", addressRegion: "CT" },
    { "@type": "City", name: "Fairfield", addressRegion: "CT" },
    { "@type": "City", name: "Norwalk", addressRegion: "CT" },
    { "@type": "City", name: "Wilton", addressRegion: "CT" },
    { "@type": "City", name: "Ridgefield", addressRegion: "CT" },
  ],
  knowsAbout: [
    "Luxury Real Estate",
    "Fairfield County Real Estate",
    "Connecticut Gold Coast",
    "Real Estate Investment",
    "Property Management",
  ],
  sameAs: [
    "https://higginsgroup.com/", // Brokerage website
  ],
};

/**
 * Clerk appearance configuration for luxury brand consistency
 * Uses stone color palette and Cormorant serif headings
 */
const clerkAppearance = {
  variables: {
    colorPrimary: '#1c1917', // stone-900
    colorBackground: '#fafaf9', // stone-50
    colorText: '#1c1917', // stone-900
    colorTextSecondary: '#57534e', // stone-600
    colorInputBackground: '#ffffff',
    colorInputText: '#1c1917',
    borderRadius: '0.375rem',
    fontFamily: 'var(--font-inter), sans-serif',
  },
  elements: {
    formButtonPrimary:
      'bg-stone-900 hover:bg-stone-800 text-sm font-medium shadow-sm',
    card: 'shadow-xl border border-stone-200',
    headerTitle: 'font-serif text-2xl',
    headerSubtitle: 'text-stone-600',
    socialButtonsBlockButton:
      'border border-stone-300 hover:bg-stone-50',
    formFieldInput:
      'border-stone-300 focus:border-stone-500 focus:ring-stone-500',
    footerActionLink: 'text-stone-900 hover:text-stone-700',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en">
        <body
          className={`${cormorant.variable} ${inter.variable} font-sans antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900`}
        >
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <GlobalFooter />
          <FloatingButtons />
        </body>
      </html>
    </ClerkProvider>
  );
}

