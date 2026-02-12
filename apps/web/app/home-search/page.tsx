import { Suspense } from "react";
import Link from "next/link";
import HomeSearchClient from "./HomeSearchClient";

export const metadata = {
  title: "Home Search | Fairfield County Real Estate",
  description:
    "Explore a refined home search experience for Fairfield County listings, with map-based browsing and thoughtful filters.",
};

export default function HomeSearchPage() {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen grid place-items-center">Loading search...</div>}>
        <HomeSearchClient />
      </Suspense>

      {/* Bottom CTA */}
      <section className="bg-stone-900 text-white grid grid-cols-1 lg:grid-cols-2 relative z-10">
        {/* Left: Content */}
        <div className="flex items-center justify-center py-16 px-4 order-2 lg:order-1">
          <div className="max-w-xl mx-auto text-center lg:text-left">
            <h2 className="font-serif text-3xl md:text-3xl font-medium mb-4">
              Ready to make a move?
            </h2>
            <p className="text-base text-stone-300 mb-6 leading-relaxed">
              Whether you&apos;re curious about your home&apos;s value or ready to start touring, I&apos;m here to help you take the next step.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/home-value"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-stone-900 font-semibold rounded-none hover:bg-stone-100 transition-colors"
              >
                Get Home Estimate
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-none hover:bg-white/10 transition-colors"
              >
                Contact Matt
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
