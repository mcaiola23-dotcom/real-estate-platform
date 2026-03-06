import Image from "next/image";
import Link from "next/link";
import type { TenantWebsiteConfig } from "@real-estate/types";
import { getTenantWebsiteConfig } from "../lib/tenant/website-profile";

export default function AgentIntroSection({
    tenantWebsiteConfig,
}: {
    tenantWebsiteConfig?: TenantWebsiteConfig;
}) {
    const websiteConfig = tenantWebsiteConfig ?? getTenantWebsiteConfig();

    return (
        <section className="py-20 bg-stone-50 border-y border-stone-200">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        {/* Photo */}
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-xl">
                            <Image
                                src={websiteConfig.logos.headshot.src}
                                alt={websiteConfig.logos.headshot.alt}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <p className="text-sm font-semibold tracking-[0.2em] text-stone-500 uppercase mb-3">
                                {websiteConfig.content.agentIntro.eyebrow}
                            </p>
                            <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-6">
                                {websiteConfig.agentName}
                            </h2>
                            <p className="text-stone-600 text-lg leading-relaxed mb-6">
                                {websiteConfig.content.agentIntro.summaryPrimary}
                            </p>
                            <p className="text-stone-600 leading-relaxed mb-8">
                                {websiteConfig.content.agentIntro.summarySecondary}
                            </p>

                            {/* Contact Info */}
                            <div className="space-y-3 mb-8">
                                <a
                                    href={`tel:${websiteConfig.contact.phoneE164}`}
                                    className="flex items-center gap-3 text-stone-700 hover:text-stone-900 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span className="font-medium">{websiteConfig.contact.phoneDisplay}</span>
                                </a>
                                <a
                                    href={`mailto:${websiteConfig.contact.email}`}
                                    className="flex items-center gap-3 text-stone-700 hover:text-stone-900 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="font-medium">{websiteConfig.contact.email}</span>
                                </a>
                            </div>

                            <Link
                                href="/about"
                                className="inline-block px-6 py-3 bg-stone-900 text-white font-medium rounded-none hover:bg-stone-800 transition-colors"
                            >
                                {websiteConfig.content.agentIntro.aboutCtaLabel}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
