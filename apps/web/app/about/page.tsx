import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Container from "@/app/components/Container";
import EmailSignupSection from "@/app/components/EmailSignupSection";

export const metadata: Metadata = {
  title: "About Matt Caiola | Fairfield County Real Estate",
  description:
    "Meet Matt Caiola, your Fairfield County luxury real estate expert. With a background in corporate finance and hands-on real estate investment experience, Matt brings analytical rigor and white-glove service to every transaction. Licensed with Higgins Group Private Brokerage.",
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-stone-50 border-b border-stone-200">
        <Container className="py-16 md:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
            {/* Text Content */}
            <div className="max-w-2xl lg:flex-1">
              <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-stone-500 uppercase mb-4">
                About Matt Caiola
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-stone-900 leading-[1.05]">
                Real estate guidance rooted in Fairfield County.
              </h1>
              <div className="w-14 h-px bg-stone-300 my-7" />
              <p className="text-lg sm:text-xl text-stone-600 leading-relaxed">
                I help buyers and sellers navigate Fairfield County with clarity,
                local knowledge, and a process that respects your time.
              </p>
            </div>
            {/* Headshot */}
            <div className="mt-10 lg:mt-0 lg:flex-shrink-0">
              <div className="relative w-64 h-80 sm:w-72 sm:h-96 lg:w-80 lg:h-[28rem] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/brand/matt-headshot.jpg"
                  alt="Matt Caiola - Fairfield County Real Estate Agent"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Bio Content */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8">
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 mb-6">
                Local Roots, Global Perspective
              </h2>

              <div className="prose prose-stone max-w-none space-y-5">
                <p className="text-lg text-stone-600 leading-relaxed">
                  My family and I have called Fairfield County home for over 15 years. As a husband
                  and father of two daughters, I understand that buying or selling a home is about
                  more than square footage and price—it&apos;s about finding the right community for your
                  family to thrive.
                </p>

                <p className="text-lg text-stone-600 leading-relaxed">
                  Before entering real estate, I built my career in corporate America. With experience
                  spanning media at 21st Century Fox to the global commodities trade at Louis Dreyfus
                  Company to running a family business, I&apos;ve learned what it takes to make a deal work—whether
                  big or small, working with an individual or a Fortune 500 company.
                </p>

                <p className="text-lg text-stone-600 leading-relaxed">
                  Real estate has always been more than a profession for me—it&apos;s a personal passion.
                  I own and manage a portfolio of 25 rental units, giving me hands-on experience with
                  property valuation, tenant relations, and long-term investment strategy. I&apos;ve also
                  been involved in the acquisition and disposition of significant commercial properties,
                  so I understand the nuances of larger transactions.
                </p>

                <p className="text-lg text-stone-600 leading-relaxed">
                  This combination—corporate discipline, investment experience, and deep local
                  knowledge—shapes how I approach every client relationship. Whether you&apos;re a
                  first-time buyer, relocating from out of state, or a seasoned investor, I bring
                  the same analytical rigor and personal attention to your goals.
                </p>
              </div>

              {/* White-Glove Messaging - A2 */}
              <div className="mt-16">
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 mb-6">
                  White-Glove Service, Absolute Discretion
                </h2>
                <p className="text-lg text-stone-600 leading-relaxed mb-8">
                  Fairfield County&apos;s luxury market demands a different approach. High-net-worth buyers
                  and sellers require confidentiality, market intelligence, and seamless execution. That&apos;s
                  precisely what I deliver.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6">
                    <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-stone-900 mb-2">Complete Discretion</h3>
                    <p className="text-sm text-stone-600">
                      Off-market transactions, private showings, and confidential negotiations for clients who value privacy.
                    </p>
                  </div>
                  <div className="text-center p-6">
                    <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-stone-900 mb-2">Market Intelligence</h3>
                    <p className="text-sm text-stone-600">
                      Data-driven insights combined with on-the-ground knowledge you won&apos;t find on any website.
                    </p>
                  </div>
                  <div className="text-center p-6">
                    <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-stone-900 mb-2">Premium Service</h3>
                    <p className="text-sm text-stone-600">
                      Every detail managed. Every timeline honored. A transaction experience that matches the property.
                    </p>
                  </div>
                </div>
              </div>

              {/* How I Work */}
              <div className="mt-16">
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 mb-4">
                  How I Work
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-stone-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-900">
                        Honest pricing perspective
                      </p>
                      <p className="text-stone-600">
                        I give you a clear-eyed view of value—not an inflated
                        number to win your listing or a lowball to close
                        quickly.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-stone-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-900">
                        Responsive communication
                      </p>
                      <p className="text-stone-600">
                        You will hear from me promptly. I keep you informed
                        without overwhelming your inbox.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-stone-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-900">
                        Process clarity
                      </p>
                      <p className="text-stone-600">
                        I explain each step before it happens so you always know
                        what to expect and when.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-stone-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-900">
                        Negotiation without drama
                      </p>
                      <p className="text-stone-600">
                        I advocate firmly for your interests while keeping
                        transactions professional and on track.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Higgins Group */}
              <div className="mt-16">
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 mb-4">
                  Higgins Group Private Brokerage
                </h2>
                <p className="text-lg text-stone-600 leading-relaxed">
                  I am proud to be affiliated with{" "}
                  <span className="font-medium text-stone-900">
                    Higgins Group Private Brokerage
                  </span>
                  , one of Connecticut&apos;s premier real estate firms with nearly
                  30 years of success and over 400 agents across ten offices.
                  The Higgins family has been in real estate for over 125
                  years—and the culture they&apos;ve built reflects that legacy.
                </p>
                <p className="mt-4 text-lg text-stone-600 leading-relaxed">
                  Higgins Group is the exclusive{" "}
                  <span className="font-medium text-stone-900">
                    Forbes Global Properties
                  </span>{" "}
                  representative for Fairfield and New Haven Counties—giving
                  clients powerful global reach for luxury properties.
                </p>
                <p className="mt-4 text-sm text-stone-500">
                  Higgins Group Private Brokerage
                  <br />
                  1055 Washington Blvd., Stamford, CT 06901
                  <br />
                  <a
                    href="tel:2036588282"
                    className="hover:text-stone-900 transition-colors"
                  >
                    203-658-8282
                  </a>
                  <br />
                  <a
                    href="https://higginsgroup.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-stone-900 transition-colors"
                  >
                    higginsgroup.com
                  </a>
                </p>
              </div>
            </div>

            {/* Sidebar CTA */}
            <aside className="lg:col-span-4">
              <div className="bg-white border border-stone-200 rounded-2xl p-7 shadow-sm sticky top-24">
                <h2 className="font-serif text-xl font-medium text-stone-900 mb-2">
                  Let&apos;s talk
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Whether you have questions about a specific property, want to
                  discuss your home&apos;s value, or are just starting to explore
                  your options—I&apos;m happy to help.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors"
                  >
                    Contact Matt
                  </Link>
                  <Link
                    href="/home-value"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-stone-300 text-stone-900 font-semibold hover:bg-stone-50 transition-colors"
                  >
                    Home Value Estimate
                  </Link>
                  <a
                    href="tel:+19143256746"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-stone-600 font-medium hover:text-stone-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    (914) 325-6746
                  </a>
                </div>
              </div>

              <div className="mt-6 bg-stone-50 border border-stone-200 rounded-2xl p-7">
                <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-3">
                  Service Areas
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Greenwich, Stamford, Darien, New Canaan, Westport, Fairfield,
                  Norwalk, Wilton, Ridgefield, and surrounding Fairfield County
                  towns.
                </p>
                <div className="mt-4">
                  <Link
                    href="/towns"
                    className="text-sm font-medium text-stone-900 hover:underline"
                  >
                    Explore towns →
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>
      <EmailSignupSection />
    </div>
  );
}
