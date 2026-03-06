import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import HomeSearchClient from "./HomeSearchClient";
import { getTenantContextFromHeaders } from "../lib/tenant/resolve-tenant";
import { getTenantWebsiteConfig } from "../lib/tenant/website-profile";

const defaultTenantWebsiteConfig = getTenantWebsiteConfig();

export const metadata: Metadata = {
  title: defaultTenantWebsiteConfig.content.search.pageTitle,
  description: defaultTenantWebsiteConfig.content.search.pageDescription,
  alternates: {
    canonical: "/home-search",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function HomeSearchPage() {
  const tenantContext = await getTenantContextFromHeaders(await headers());
  const tenantWebsiteConfig = getTenantWebsiteConfig(tenantContext);

  return (
    <>
      <Suspense fallback={<div className="min-h-screen grid place-items-center">Loading search...</div>}>
        <HomeSearchClient tenantContext={tenantContext} tenantWebsiteConfig={tenantWebsiteConfig} />
      </Suspense>

      {/* Bottom CTA */}
      <section className="bg-stone-900 text-white grid grid-cols-1 lg:grid-cols-2 relative z-10">
        {/* Left: Content */}
        <div className="flex items-center justify-center py-16 px-4 order-2 lg:order-1">
          <div className="max-w-xl mx-auto text-center lg:text-left">
            <h2 className="font-serif text-3xl md:text-3xl font-medium mb-4">
              {tenantWebsiteConfig.content.footerCta.heading}
            </h2>
            <p className="text-base text-stone-300 mb-6 leading-relaxed">
              {tenantWebsiteConfig.content.footerCta.body}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/home-value"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-stone-900 font-semibold rounded-none hover:bg-stone-100 transition-colors"
              >
                {tenantWebsiteConfig.content.footerCta.primaryLabel}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-none hover:bg-white/10 transition-colors"
              >
                {tenantWebsiteConfig.content.footerCta.secondaryLabel}
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Image */}
        <div className="relative h-[300px] lg:h-auto order-1 lg:order-2">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/visual/stock/AdobeStock_521077579.jpeg')" }}
          />
          <div className="absolute inset-0 bg-stone-900/20" />
        </div>
      </section>
    </>
  );
}
