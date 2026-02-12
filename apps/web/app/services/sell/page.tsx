import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/app/components/Container";
import ClosingCostEstimator from "@/app/components/ClosingCostEstimator";
import EmailSignupSection from "@/app/components/EmailSignupSection";

export const metadata: Metadata = {
  title: "Sell Your Home in Fairfield County CT | Listing Representation",
  description:
    "Strategic seller representation in Fairfield County—accurate pricing, professional marketing, and skilled negotiation with Higgins Group Private Brokerage.",
};

export default function SellPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-stone-900 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: "url('/visual/stock/AdobeStock_509621631.jpeg')" }}
        />
        <Container className="relative z-10 py-20 md:py-28">
          <div className="max-w-4xl">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-stone-400 uppercase mb-4">
              Seller Representation
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.05]">
              Sell strategically in Fairfield County.
            </h1>
            <div className="w-14 h-px bg-stone-500 my-7" />
            <p className="text-lg sm:text-xl text-stone-300 leading-relaxed max-w-3xl">
              Every home sale is different. Whether you need to move quickly or
              want to maximize value with careful timing, you deserve a plan
              built around your goals—not a templated approach.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/home-value"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-stone-900 font-semibold rounded-none hover:bg-stone-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Get Your Home Value
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-none hover:bg-white/10 transition-colors"
              >
                Schedule a Consultation
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Value Props */}
      <section className="pt-16 md:pt-20 pb-0 bg-stone-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-stone-900 mb-4">
              Pricing with perspective.
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Fairfield County pricing is hyper-local. A few streets can mean a meaningful difference in value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
              <div className="w-14 h-14 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">
                Accurate Pricing Strategy
              </h3>
              <p className="text-stone-600 leading-relaxed">
                A clear-eyed view of your home relative to recent sales, current competition, and buyer expectations.
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
              <div className="w-14 h-14 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">
                Professional Presentation
              </h3>
              <p className="text-stone-600 leading-relaxed">
                Photography, staging guidance, and marketing materials that reflect the caliber of your property.
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
              <div className="w-14 h-14 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">
                Skilled Negotiation
              </h3>
              <p className="text-stone-600 leading-relaxed">
                Calm, professional negotiation focused on terms, timing, and protecting your interests through closing.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* How We Work */}
      <section className="relative pt-8 pb-16 md:pb-20 bg-stone-50 overflow-hidden">
        {/* Removed Dark Background/Overlay - using light theme now */}
        <Container className="relative z-10">
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
                    Initial Consultation
                  </h3>
                  <p className="text-stone-600 leading-relaxed">
                    Walk me through your home, timeline, and goals. I'll share preliminary pricing perspective and outline next steps.
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
                    Pricing & Preparation
                  </h3>
                  <p className="text-stone-600 leading-relaxed">
                    We finalize list price, coordinate any prep work or staging, and schedule professional photography.
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
                    Marketing & Showings
                  </h3>
                  <p className="text-stone-600 leading-relaxed">
                    Your listing is promoted across MLS, syndicated platforms, and targeted channels. Showings are managed to minimize disruption.
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
                    Negotiation & Closing
                  </h3>
                  <p className="text-stone-600 leading-relaxed">
                    We evaluate offers together, negotiate terms, and coordinate through inspection, appraisal, and closing.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </Container>
      </section>

      {/* Sellers Guide */}
      <section className="relative py-16 md:py-20 bg-stone-900 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/visual/stock/AdobeStock_158911146.jpeg')" }}
        />
        {/* Overlay */}
        {/* Overlay */}
        <div className="absolute inset-0 bg-stone-900/50" />

        <Container className="relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold tracking-[0.2em] text-stone-300 uppercase mb-3">
                Seller Resources
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium text-white mb-4">
                Connecticut Seller's Guide
              </h2>
              <p className="text-lg text-stone-200">
                Essential information for navigating the Connecticut home selling process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-3">
                  <span className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Closing Costs & Conveyance Tax
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Connecticut charges a state conveyance tax (0.75% under $800K, 1.25% above). Combined with commission and fees, expect total closing costs of 6-8% of sale price.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-3">
                  <span className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  Disclosure Requirements
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Connecticut requires sellers to complete a Residential Property Condition Disclosure Report. I'll guide you through what needs to be disclosed and how.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-3">
                  <span className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </span>
                  Preparing Your Home
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Strategic preparation pays off. I'll advise on what improvements matter most and connect you with trusted contractors if needed.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-3">
                  <span className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  Off-Market & Discretion
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Some sellers prefer privacy. If you want to explore options before going public, I can discuss off-market strategies and quiet networking.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Closing Cost Estimator */}
      <ClosingCostEstimator initialSalePrice={1250000} />

      {/* Final CTA */}
      <section className="bg-stone-50 grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Content */}
        <div className="flex items-center justify-center py-20 px-4 order-2 lg:order-1">
          <div className="max-w-xl mx-auto text-center lg:text-left">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-stone-900 mb-6">
              Ready to Explore Your Options?
            </h2>
            <p className="text-lg text-stone-600 mb-8 leading-relaxed">
              Start with a home value estimate or schedule a consultation to discuss your timeline and goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/home-value"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-stone-900 text-white font-semibold rounded-none hover:bg-stone-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Get Your Home Value
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-stone-900 text-stone-900 font-semibold rounded-none hover:bg-stone-100 transition-colors"
              >
                Contact Matt
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Image */}
        <div className="relative h-[400px] lg:h-auto order-1 lg:order-2">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/visual/stock/AdobeStock_345186238.jpeg')" }}
          />
        </div>
      </section>
      <EmailSignupSection />
    </div>
  );
}
