import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/app/components/Container";
import EmailSignupSection from "@/app/components/EmailSignupSection";

export const metadata: Metadata = {
  title: "Investing & Commercial Real Estate | Fairfield County CT",
  description:
    "Investment and commercial real estate guidance in Fairfield County—multifamily focus, disciplined underwriting, and discreet execution. Licensed with Higgins Group Private Brokerage.",
};

export default function InvestingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-950">
        <Image
          src="/visual/stock/527901164.jpg"
          alt="Commercial real estate in Fairfield County"
          fill
          priority
          className="object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
        <Container className="relative py-16 md:py-24">
          <div className="max-w-4xl">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-white/70 uppercase mb-4">
              Investing & Commercial
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.05]">
              Investment and commercial real estate, guided with discipline.
            </h1>
            <div className="w-14 h-px bg-white/40 my-7" />
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed max-w-3xl">
              Focused on multifamily with experience across commercial property
              types. Clear underwriting, discreet execution, and a process that
              respects your goals.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
              >
                Discuss an opportunity
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/40 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                Share your buy box
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Combined Intro, Services, and Segments Section */}
      <div className="bg-stone-50">
        {/* Intro */}
        <section className="pt-16 md:pt-20 pb-10">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-stone-900 mb-6">
                A partner for buyers, sellers, landlords, and tenants.
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                My core focus is medium and large multifamily, supported by
                experience across a range of commercial property types. Whether
                you are acquiring, selling, or leasing, I bring a disciplined,
                analytical approach and a calm process that prioritizes clarity
                over hype.
              </p>
            </div>
          </Container>
        </section>

        {/* Services Grid */}
        <section className="py-8">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-sm transition-shadow">
                <h3 className="text-lg font-semibold text-stone-900 mb-3">
                  Acquisition strategy
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Define a clear buy box, screen opportunities efficiently,
                  and move decisively when the fit is right.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-sm transition-shadow">
                <h3 className="text-lg font-semibold text-stone-900 mb-3">
                  Underwriting support
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Review income, expenses, capex, and sensitivities to keep
                  decisions grounded in real assumptions.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-sm transition-shadow">
                <h3 className="text-lg font-semibold text-stone-900 mb-3">
                  Due diligence coordination
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Organize materials, inspections, and timelines so you can
                  evaluate risk with confidence.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-sm transition-shadow">
                <h3 className="text-lg font-semibold text-stone-900 mb-3">
                  Disposition planning
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Position assets thoughtfully with pricing guidance and a
                  targeted go-to-market approach.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-sm transition-shadow">
                <h3 className="text-lg font-semibold text-stone-900 mb-3">
                  Leasing representation
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Landlord and tenant representation with market context, term
                  strategy, and clean negotiation.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-sm transition-shadow">
                <h3 className="text-lg font-semibold text-stone-900 mb-3">
                  Relationship-driven outreach
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Tap into trusted relationships that can surface
                  opportunities when available and aligned.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Target Segments */}
        <section className="pt-10 pb-20">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10">
                <h3 className="font-serif text-2xl font-medium text-stone-900 mb-4">
                  For Investors
                </h3>
                <p className="text-slate-600 leading-relaxed mb-8">
                  Tell me your buy box—asset type, size, geography, return
                  profile, and timeline. I will help you evaluate
                  opportunities and prioritize the ones that make sense.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors"
                >
                  Share Your Buy Box
                </Link>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10">
                <h3 className="font-serif text-2xl font-medium text-stone-900 mb-4">
                  For Owners Considering a Sale
                </h3>
                <p className="text-slate-600 leading-relaxed mb-8">
                  If you are exploring a sale, we can start with a quick,
                  no-obligation consultation. I will walk you through
                  positioning, timing, and the likely buyer universe without
                  pressure.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-stone-200 text-stone-900 font-semibold hover:border-stone-900 transition-colors"
                >
                  Request a Consultation
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </div>

      {/* How We Work - Image Background */}
      <section className="relative py-16 md:py-24 bg-stone-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/visual/services/investing-hero.png')" }}
        />
        <div className="absolute inset-0 bg-stone-900/40" />

        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-medium text-white mb-4">
                How We Work
              </h2>
              <p className="text-lg text-stone-300">
                A disciplined process for confident execution.
              </p>
            </div>

            <ol className="space-y-8">
              <li className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-stone-900 font-semibold shadow-md">
                    1
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Align on Goals
                  </h3>
                  <p className="text-stone-300 leading-relaxed text-lg">
                    We define your buy box or disposition objectives, timelines, and constraints.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-stone-900 font-semibold shadow-md">
                    2
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Evaluate Opportunities
                  </h3>
                  <p className="text-stone-300 leading-relaxed text-lg">
                    We screen quickly, then underwrite deeper where the fit is right.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-stone-900 font-semibold shadow-md">
                    3
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Execute Professionally
                  </h3>
                  <p className="text-stone-300 leading-relaxed text-lg">
                    Diligence, financing, negotiation, and coordination handled with clear communication.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-stone-900 font-semibold shadow-md">
                    4
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Close and Transition
                  </h3>
                  <p className="text-stone-300 leading-relaxed text-lg">
                    Support through closing with continuity for leasing or management introductions when needed.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </Container>
      </section>

      {/* Underwriting Templates */}
      <section className="py-16 md:py-20 bg-stone-50">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-3xl font-medium text-stone-900 mb-6">
              Free Underwriting Models (Coming Soon)
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
              I am building a set of underwriting templates to help
              investors evaluate opportunities faster and with more clarity.
            </p>

            <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm font-medium text-stone-700 mb-10">
              <li className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">Single Family Flip</li>
              <li className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">Small Multi Flip</li>
              <li className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">Multifamily</li>
              <li className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">Retail</li>
              <li className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">Development</li>
              <li className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">Industrial</li>
            </ul>

            <div className="inline-block">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white border border-stone-300 text-stone-900 font-semibold hover:bg-stone-50 transition-colors"
              >
                Request Early Access
              </Link>
              <p className="mt-4 text-xs text-slate-500">
                Templates will be released in phases.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA - Standardized */}
      <section className="bg-stone-900 text-white grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Content */}
        <div className="flex items-center justify-center py-20 px-4 order-2 lg:order-1">
          <div className="max-w-xl mx-auto text-center lg:text-left">
            <h2 className="font-serif text-3xl md:text-4xl font-medium mb-6">
              Ready to Discuss an Opportunity?
            </h2>
            <p className="text-lg text-stone-300 mb-8 leading-relaxed">
              Whether you're acquiring, disposing, or leasing, let's start with a conversation about your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-stone-900 font-semibold rounded-none hover:bg-stone-100 transition-colors"
              >
                Contact Matt
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-semibold rounded-none hover:bg-white/10 transition-colors"
              >
                Share Your Buy Box
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Image */}
        <div className="relative h-[400px] lg:h-auto order-1 lg:order-2">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/visual/stock/Greenwich Avenue.png')" }}
          />
          <div className="absolute inset-0 bg-stone-900/20" />
        </div>
      </section>
      <EmailSignupSection />
    </div>
  );
}
