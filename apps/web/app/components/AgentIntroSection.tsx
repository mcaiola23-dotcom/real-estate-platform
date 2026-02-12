import Image from "next/image";
import Link from "next/link";

export default function AgentIntroSection() {
    return (
        <section className="py-20 bg-stone-50 border-y border-stone-200">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        {/* Photo */}
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-xl">
                            <Image
                                src="/brand/matt-headshot.jpg"
                                alt="Matt Caiola"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <p className="text-sm font-semibold tracking-[0.2em] text-stone-500 uppercase mb-3">
                                Your Fairfield County Expert
                            </p>
                            <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-6">
                                Matt Caiola
                            </h2>
                            <p className="text-stone-600 text-lg leading-relaxed mb-6">
                                With a background in media and commodities at Fortune 500 companies,
                                I bring analytical precision and market intelligence to every transaction.
                                My approach combines data-driven insights with the discretion and
                                personalized service that luxury clients expect.
                            </p>
                            <p className="text-stone-600 leading-relaxed mb-8">
                                Whether you&apos;re buying your dream home on the Gold Coast or selling
                                a treasured property, I&apos;m committed to making the process seamless
                                and successful.
                            </p>

                            {/* Contact Info */}
                            <div className="space-y-3 mb-8">
                                <a
                                    href="tel:+12033456789"
                                    className="flex items-center gap-3 text-stone-700 hover:text-stone-900 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span className="font-medium">(203) 345-6789</span>
                                </a>
                                <a
                                    href="mailto:matt@mattcaiola.com"
                                    className="flex items-center gap-3 text-stone-700 hover:text-stone-900 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="font-medium">matt@mattcaiola.com</span>
                                </a>
                            </div>

                            <Link
                                href="/about"
                                className="inline-block px-6 py-3 bg-stone-900 text-white font-medium rounded-none hover:bg-stone-800 transition-colors"
                            >
                                Learn More About Matt
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
