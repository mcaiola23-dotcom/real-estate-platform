import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/app/components/Container";
import MortgageCalculator from "@/app/components/MortgageCalculator";
import EmailSignupSection from "@/app/components/EmailSignupSection";

export const metadata: Metadata = {
  title: "Buy in Fairfield County CT | Buyer Representation",
  description:
    "Calm, data-driven buyer guidance across Fairfield County—relocation strategy, neighborhood insight, and contract-to-close support with Higgins Group Private Brokerage.",
};

export default function BuyPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-stone-900 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/visual/stock/AdobeStock_559253231.jpeg')" }}
        />
        <Container className="relative z-10 py-20 md:py-28">
          <div className="max-w-4xl">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-stone-400 uppercase mb-4">
              Buyer Representation
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.05]">
              Buy with clarity in Fairfield County.
            </h1>
            <div className="w-14 h-px bg-stone-500 my-7" />
            <p className="text-lg sm:text-xl text-stone-300 leading-relaxed max-w-3xl">
              Whether you're relocating from NYC or moving town-to-town, you
              deserve calm guidance—neighborhood context, pricing perspective,
              and a process that feels organized from the first showing through
              closing.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/home-search"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-stone-900 font-semibold rounded-none hover:bg-stone-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Homes
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-none hover:bg-white/10 transition-colors"
              >
                Start a Conversation
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Value Props */}
      <section className="py-16 md:py-20 bg-stone-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-stone-900 mb-4">
              A premium buying experience—without the pressure.
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Fairfield County is a market of micro-neighborhoods. The right decision depends on your lifestyle, commute, and long-term plans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
              <div className="w-14 h-14 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">
                Relocation-Ready Strategy
              </h3>
              <p className="text-stone-600 leading-relaxed">
                Shortlist towns and neighborhoods based on commute patterns, lifestyle fit, and timing—so your search stays focused.
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
              <div className="w-14 h-14 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">
                Neighborhood-Level Insight
              </h3>
              <p className="text-stone-600 leading-relaxed">
                Understand what drives value street-by-street: condition, location factors, and how pricing shifts by pocket.
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
              <div className="w-14 h-14 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">
                Contract-to-Close Coordination
              </h3>
              <p className="text-stone-600 leading-relaxed">
                Clear next steps, responsive scheduling, and support through inspection, appraisal, and closing logistics.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Explore Towns - Moved & Updated */}
      <section className="relative py-20 md:py-24 bg-stone-900 overflow-hidden">
        {/* Aerial Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/visual/stock/AdobeStock_245746541.jpeg')" }}
        />
        <div className="absolute inset-0 bg-stone-900/60" />

        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="font-serif text-3xl md:text-4xl font-medium mb-6">
              Explore Towns & Neighborhoods
            </h2>
            <p className="text-lg text-stone-200 mb-10 leading-relaxed">
              Start with a town overview, then drill down to specific neighborhoods that match your lifestyle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/towns"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-stone-900 font-semibold rounded-none hover:bg-stone-100 transition-colors"
              >
                Browse All Towns
              </Link>
              <Link
                href="/home-search"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-white text-white font-semibold rounded-none hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Listings
              </Link>
            </div>
            <p className="mt-8 text-sm text-stone-400">
              Common starting points: Greenwich, New Canaan, Darien, Westport, Fairfield, Stamford, Norwalk, Ridgefield.
            </p>
          </div>
        </Container>
      </section>

      {/* How We Work */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-medium text-stone-900 mb-4">
                How We Work Together
              </h2>
              <p className="text-lg text-stone-600">
                A structured approach that keeps you informed and in control.
              </p>
            </div>

            <ol className="space-y-8">
              <li className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-stone-900 text-white font-semibold">
                    1
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">
                    Define the Target
                  </h3>
                  <p className="text-stone-600 leading-relaxed">
                    A short consultation to align on towns, neighborhoods, timing, and deal preferences. We'll create a focused search strategy.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-stone-900 text-white font-semibold">
                    2
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">
                    Tour Efficiently
                  </h3>
                  <p className="text-stone-600 leading-relaxed">
                    We prioritize the right inventory and move quickly when a home matches your criteria. No wasted weekends.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-stone-900 text-white font-semibold">
                    3
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">
                    Offer with Confidence
                  </h3>
                  <p className="text-stone-600 leading-relaxed">
                    We build a strong position with clean terms and clear expectations—no noise, no guesswork.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-stone-900 text-white font-semibold">
                    4
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">
                    Navigate Due Diligence
                  </h3>
                  <p className="text-stone-600 leading-relaxed">
                    Inspection and appraisal are handled with a structured checklist and calm communication through closing.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </Container>
      </section>

      {/* Buyers Guide */}
      <section className="relative py-16 md:py-20 bg-stone-900 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/visual/stock/AdobeStock_552206764.jpeg')" }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-stone-900/60" />

        <Container className="relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold tracking-[0.2em] text-stone-300 uppercase mb-3">
                Buyer Resources
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium text-white mb-4">
                Fairfield County Buyer's Guide
              </h2>
              <p className="text-lg text-stone-200">
                Essential information for navigating the Connecticut home buying process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-3">
                  <span className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  Pre-Approval & Financing
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Get pre-approved before you start touring. Connecticut attorneys handle closings, and I can recommend trusted lenders who know the local market.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-3">
                  <span className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  Property Taxes in CT
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Property taxes vary significantly by town. Greenwich has lower mill rates while smaller towns may be higher. I'll help you understand the true cost of ownership.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-3">
                  <span className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </span>
                  Home Inspections
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Always get a thorough inspection. In Connecticut, buyers typically have 7-14 days for due diligence. I'll help you interpret findings and negotiate repairs.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-3">
                  <span className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Timeline & Closing
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  From accepted offer to closing typically takes 45-60 days. Connecticut requires an attorney for closing—I'll connect you with experienced real estate attorneys.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Mortgage Calculator */}
      <MortgageCalculator initialHomePrice={1250000} />

      {/* Final CTA */}
      <section className="bg-stone-900 text-white grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Content */}
        <div className="flex items-center justify-center py-20 px-4 order-2 lg:order-1">
          <div className="max-w-xl mx-auto text-center lg:text-left">
            <h2 className="font-serif text-3xl md:text-4xl font-medium mb-6">
              Ready to Start Your Search?
            </h2>
            <p className="text-lg text-stone-300 mb-8 leading-relaxed">
              Tell me what you're looking for and your ideal timing. I'll reply with a clear next step and a plan for the search.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-stone-900 font-semibold rounded-none hover:bg-stone-100 transition-colors"
              >
                Contact Matt
              </Link>
              <Link
                href="/home-search"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-semibold rounded-none hover:bg-white/10 transition-colors"
              >
                Search Homes
              </Link>
            </div>
            <div className="mt-6 text-center lg:text-left">
              <Link
                href="/home-value"
                className="inline-block text-stone-400 hover:text-white underline underline-offset-4 text-sm transition-colors"
              >
                Also Selling? Get an Estimate &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Image */}
        <div className="relative h-[400px] lg:h-auto order-1 lg:order-2">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/visual/stock/AdobeStock_584454872.jpeg')" }}
          />
          <div className="absolute inset-0 bg-stone-900/10" />
        </div>
      </section>
      <EmailSignupSection />
    </div>
  );
}
