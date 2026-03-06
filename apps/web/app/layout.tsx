import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Header from "./components/Header";
import GlobalFooter from "./components/GlobalFooter";
import FloatingButtons from "./components/FloatingButtons";
import { getTenantWebsiteConfig } from "./lib/tenant/website-profile";
import { getSeoRuntimeConfig } from "./lib/seo/runtime";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const tenantWebsiteConfig = getTenantWebsiteConfig();
const seoRuntime = getSeoRuntimeConfig(tenantWebsiteConfig.seo.metadataBaseUrl);

export const metadata: Metadata = {
  title: {
    default: tenantWebsiteConfig.seo.defaultTitle,
    template: tenantWebsiteConfig.seo.titleTemplate,
  },
  description: tenantWebsiteConfig.seo.description,
  keywords: tenantWebsiteConfig.seo.keywords,
  metadataBase: new URL(seoRuntime.metadataBaseUrl),
  alternates: {
    canonical: "/",
  },
  robots: seoRuntime.indexingEnabled
    ? {
        index: true,
        follow: true,
      }
    : {
        index: false,
        follow: false,
      },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: tenantWebsiteConfig.seo.siteName,
    title: tenantWebsiteConfig.seo.defaultTitle,
    description: tenantWebsiteConfig.seo.description,
    images: [
      {
        url: tenantWebsiteConfig.seo.openGraphImage.src,
        width: 1200,
        height: 630,
        alt: tenantWebsiteConfig.seo.openGraphImage.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: tenantWebsiteConfig.seo.defaultTitle,
    description: tenantWebsiteConfig.seo.description,
    images: [tenantWebsiteConfig.seo.openGraphImage.src],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${seoRuntime.metadataBaseUrl}/#organization`,
  name: tenantWebsiteConfig.brandName,
  url: seoRuntime.metadataBaseUrl,
  logo: `${seoRuntime.metadataBaseUrl}${tenantWebsiteConfig.logos.primary.src}`,
  description: tenantWebsiteConfig.seo.description,
  telephone: tenantWebsiteConfig.contact.phoneE164,
  sameAs: [tenantWebsiteConfig.brokerage.websiteUrl],
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${seoRuntime.metadataBaseUrl}/#website`,
  name: tenantWebsiteConfig.seo.siteName,
  url: seoRuntime.metadataBaseUrl,
  description: tenantWebsiteConfig.seo.description,
  publisher: {
    "@id": `${seoRuntime.metadataBaseUrl}/#organization`,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: `${seoRuntime.metadataBaseUrl}/home-search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const realEstateAgentJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": `${seoRuntime.metadataBaseUrl}/#agent`,
  name: tenantWebsiteConfig.agentName,
  alternateName: tenantWebsiteConfig.brandName,
  image: `${seoRuntime.metadataBaseUrl}${tenantWebsiteConfig.logos.headshot.src}`,
  description: tenantWebsiteConfig.seo.description,
  url: seoRuntime.metadataBaseUrl,
  telephone: tenantWebsiteConfig.contact.phoneE164,
  priceRange: "$$$",
  worksFor: {
    "@type": "RealEstateAgent",
    name: tenantWebsiteConfig.brokerage.name,
    url: tenantWebsiteConfig.brokerage.websiteUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: tenantWebsiteConfig.brokerage.address.streetAddress,
      addressLocality: tenantWebsiteConfig.brokerage.address.city,
      addressRegion: tenantWebsiteConfig.brokerage.address.region,
      postalCode: tenantWebsiteConfig.brokerage.address.postalCode,
      addressCountry: tenantWebsiteConfig.brokerage.address.country,
    },
    telephone: tenantWebsiteConfig.brokerage.contactPhoneE164,
  },
  areaServed: tenantWebsiteConfig.serviceArea.cityNames.map((cityName) => ({
    "@type": "City",
    name: cityName,
    addressRegion: tenantWebsiteConfig.serviceArea.stateCode,
  })),
  knowsAbout: tenantWebsiteConfig.seo.keywords,
  parentOrganization: {
    "@id": `${seoRuntime.metadataBaseUrl}/#organization`,
  },
  sameAs: [tenantWebsiteConfig.brokerage.websiteUrl],
};

const jsonLd = [organizationJsonLd, webSiteJsonLd, realEstateAgentJsonLd];

/**
 * Clerk appearance configuration for luxury brand consistency
 * Uses stone color palette and Cormorant serif headings
 */
const clerkAppearance = {
  variables: {
    colorPrimary: tenantWebsiteConfig.theme.colorPrimary,
    colorBackground: tenantWebsiteConfig.theme.colorSurface,
    colorText: tenantWebsiteConfig.theme.colorText,
    colorTextSecondary: tenantWebsiteConfig.theme.colorMutedText,
    colorInputBackground: '#ffffff',
    colorInputText: tenantWebsiteConfig.theme.colorText,
    borderRadius: '0.375rem',
    fontFamily: `var(${tenantWebsiteConfig.theme.bodyFontVar}), sans-serif`,
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
          <Header tenantWebsiteConfig={tenantWebsiteConfig} />
          <main className="flex-grow">
            {children}
          </main>
          <GlobalFooter tenantWebsiteConfig={tenantWebsiteConfig} />
          <FloatingButtons />
        </body>
      </html>
    </ClerkProvider>
  );
}
