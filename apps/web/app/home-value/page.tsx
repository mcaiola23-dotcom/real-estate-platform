import ValuationForm from "../components/ValuationForm";
import Container from "../components/Container";
import EmailSignupSection from "@/app/components/EmailSignupSection";
import Link from "next/link";

export const metadata = {
    title: "Home Value Estimate | Fairfield County Real Estate",
    description: "Get a free home value estimate for your property in Fairfield County. Discover what your home is worth with Matt Caiola's expert market analysis.",
};

export default function HomeValuePage() {
    return (
        <div className="bg-white">
            {/* Hero Section with Background - HV1 */}
            <section className="relative bg-stone-900 text-white overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/visual/stock/AdobeStock_390225529.jpeg')",
                        filter: 'brightness(1.1)'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-stone-900/30 to-stone-900/5" />
                <Container className="relative z-10 py-16 md:py-20">
                    <div className="max-w-2xl">
                        <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-stone-300 uppercase mb-4">
                            Home Valuation
                        </p>
                        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight leading-[1.05] mb-6">
                            What&apos;s Your Home Worth?
                        </h1>
                        <p className="text-lg sm:text-xl text-stone-200 leading-relaxed">
                            Get a preliminary estimate in seconds, or request a comprehensive
                            market analysis for a precise valuation.
                        </p>
                    </div>
                </Container>
            </section>

            {/* Form Section */}
            <section className="py-16 md:py-20 bg-stone-50">
                <Container>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Form */}
                        <div className="lg:col-span-7">
                            <ValuationForm />
                        </div>

                        {/* What to Expect - HV3 */}
                        <div className="lg:col-span-5">
                            <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm sticky top-24">
                                <h2 className="font-serif text-2xl font-medium text-stone-900 mb-6">
                                    What to Expect
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 font-semibold text-sm">
                                            1
                                        </div>
                                        <div>
                                            <p className="font-medium text-stone-900">Instant Estimate</p>
                                            <p className="text-sm text-stone-600">
                                                Receive an automated range based on comparable sales and market data.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 font-semibold text-sm">
                                            2
                                        </div>
                                        <div>
                                            <p className="font-medium text-stone-900">Personal Review</p>
                                            <p className="text-sm text-stone-600">
                                                Matt reviews your property details and local market conditions.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 font-semibold text-sm">
                                            3
                                        </div>
                                        <div>
                                            <p className="font-medium text-stone-900">Detailed CMA</p>
                                            <p className="text-sm text-stone-600">
                                                For sellers, receive a comprehensive Comparative Market Analysis.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-stone-200">
                                    <h3 className="font-medium text-stone-900 mb-2">Why Choose Matt?</h3>
                                    <p className="text-sm text-stone-600 leading-relaxed">
                                        With deep local knowledge of Fairfield County and a background in
                                        analytics, Matt provides valuations grounded in both data and
                                        neighborhood expertise—not just algorithms.
                                    </p>
                                </div>

                                <div className="mt-6">
                                    <a
                                        href="tel:+19143256746"
                                        className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span className="text-sm font-medium">(914) 325-6746</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            {/* Tips Section - HV2 */}
            <section className="relative py-16 md:py-24 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover"
                    style={{
                        backgroundImage: "url('/visual/stock/new-england-estate.jpg')",
                        backgroundPosition: "center 35%"
                    }}
                />
                <div className="absolute inset-0 bg-white/20" />
                <Container className="relative z-10">
                    <div className="text-center mb-12 -mt-12">
                        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                            Maximize Your Home&apos;s Value
                        </h2>
                        <p className="text-lg text-black font-medium max-w-2xl mx-auto">
                            Before selling, consider these factors that can significantly impact your home&apos;s market value.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Tip 1 */}
                        <div className="bg-stone-50 rounded-xl p-8 border border-stone-100">
                            <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-stone-900 text-lg mb-3">
                                Timing Matters
                            </h3>
                            <p className="text-stone-600 text-sm leading-relaxed">
                                Spring and early fall typically see more buyer activity in Fairfield County.
                                However, less competition in winter can work to your advantage for the right buyer.
                            </p>
                        </div>

                        {/* Tip 2 */}
                        <div className="bg-stone-50 rounded-xl p-8 border border-stone-100">
                            <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-stone-900 text-lg mb-3">
                                Strategic Improvements
                            </h3>
                            <p className="text-stone-600 text-sm leading-relaxed">
                                Not all renovations yield equal returns. Kitchen updates, bathroom refreshes, and
                                curb appeal improvements typically offer the best ROI in our market.
                            </p>
                        </div>

                        {/* Tip 3 */}
                        <div className="bg-stone-50 rounded-xl p-8 border border-stone-100">
                            <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-stone-900 text-lg mb-3">
                                Preparation Pays
                            </h3>
                            <p className="text-stone-600 text-sm leading-relaxed">
                                Professional staging, quality photos, and addressing minor repairs before listing
                                can increase perceived value and attract more serious buyers.
                            </p>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <Link
                            href="/services/sell"
                            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors"
                        >
                            Learn About Selling With Matt
                        </Link>
                    </div>
                </Container>
            </section>
            <EmailSignupSection />
        </div>
    );
}
