import Link from 'next/link';
import Image from 'next/image';
import type { TenantWebsiteConfig } from '@real-estate/types';
import Container from './Container';
import { getTenantWebsiteConfig } from '../lib/tenant/website-profile';

export default function GlobalFooter({
    tenantWebsiteConfig,
}: {
    tenantWebsiteConfig?: TenantWebsiteConfig;
}) {
    const websiteConfig = tenantWebsiteConfig ?? getTenantWebsiteConfig();

    return (
        <footer className="bg-white border-t border-stone-200">
            <Container>
                {/* Main Footer Content */}
                <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand section */}
                    <div className="md:col-span-2 lg:col-span-1">
                        <div className="relative h-14 w-52 mb-4">
                            <Image
                                src={websiteConfig.logos.primary.src}
                                alt={websiteConfig.logos.primary.alt}
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                        <p className="text-sm text-stone-500 max-w-xs mb-4">
                            {websiteConfig.legal.footerDescription}
                        </p>
                        <div className="flex flex-col gap-2">
                            <Link
                                href="/contact"
                                className="text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors"
                            >
                                {websiteConfig.cta.contactAgentLabel} →
                            </Link>
                            <Link
                                href="/home-value"
                                className="text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors"
                            >
                                Get {websiteConfig.cta.homeValueLabel} →
                            </Link>
                        </div>
                    </div>

                    {/* Brokerage section */}
                    <div>
                        <div className="relative h-16 w-48 mb-4">
                            <Image
                                src={websiteConfig.logos.brokerage.src}
                                alt={websiteConfig.logos.brokerage.alt}
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                        <address className="not-italic text-sm text-stone-500 space-y-1">
                            <p className="font-medium text-stone-700">{websiteConfig.brokerage.name}</p>
                            <p>{websiteConfig.brokerage.address.streetAddress}</p>
                            <p>
                                {websiteConfig.brokerage.address.city}, {websiteConfig.brokerage.address.region}{" "}
                                {websiteConfig.brokerage.address.postalCode}
                            </p>
                            <p>
                                <a href={`tel:${websiteConfig.contact.phoneE164}`} className="hover:text-stone-900 transition-colors">
                                    {websiteConfig.contact.phoneDisplay}
                                </a>
                            </p>
                        </address>
                    </div>

                    {/* Service Areas */}
                    <div>
                        <h3 className="text-sm font-semibold text-stone-900 tracking-wider uppercase mb-4">
                            Service Areas
                        </h3>
                        <ul className="space-y-2 text-sm text-stone-500">
                            {websiteConfig.serviceArea.featuredTowns.map((town) => (
                                <li key={town.slug}>
                                    <Link href={`/towns/${town.slug}`} className="hover:text-stone-900 transition-colors">
                                        {town.name}
                                    </Link>
                                </li>
                            ))}
                            <li><Link href="/towns" className="font-medium text-stone-700 hover:text-stone-900 transition-colors">View all towns →</Link></li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-stone-900 tracking-wider uppercase mb-4">
                            Legal
                        </h3>
                        <ul className="space-y-2 text-sm text-stone-500">
                            <li>
                                <Link href="/privacy" className="hover:text-stone-900 transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-stone-900 transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/fair-housing" className="hover:text-stone-900 transition-colors">
                                    Fair Housing
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright Bar */}
                <div className="py-6 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-stone-500">
                    <p>
                        &copy; {new Date().getFullYear()} {websiteConfig.brandName}. {websiteConfig.legal.rightsReservedLabel}
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
                        <span>{websiteConfig.legal.licensedWithLabel}</span>
                        <span className="hidden md:inline text-stone-300">|</span>
                        <span>{websiteConfig.legal.equalHousingLabel}</span>
                        <span className="hidden md:inline text-stone-300">|</span>
                        <a href={websiteConfig.legal.designerUrl} className="hover:text-stone-900 transition-colors">
                            {websiteConfig.legal.designerLabel}
                        </a>
                    </div>
                </div>
            </Container>
        </footer>
    );
}
