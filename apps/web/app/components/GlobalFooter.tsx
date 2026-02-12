import Link from 'next/link';
import Image from 'next/image';
import Container from './Container';

export default function GlobalFooter() {
    return (
        <footer className="bg-white border-t border-stone-200">
            <Container>
                {/* Main Footer Content */}
                <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Matt Caiola Brand Section */}
                    <div className="md:col-span-2 lg:col-span-1">
                        <div className="relative h-14 w-52 mb-4">
                            <Image
                                src="/brand/matt-caiola-logo.png"
                                alt="Matt Caiola Luxury Properties"
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                        <p className="text-sm text-stone-500 max-w-xs mb-4">
                            Personalized luxury real estate services in Fairfield County, Connecticut. Your goals, my commitment.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Link
                                href="/contact"
                                className="text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors"
                            >
                                Contact Matt →
                            </Link>
                            <Link
                                href="/home-value"
                                className="text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors"
                            >
                                Get Home Value Estimate →
                            </Link>
                        </div>
                    </div>

                    {/* Higgins Group Brokerage Section */}
                    <div>
                        <div className="relative h-16 w-48 mb-4">
                            <Image
                                src="/brand/higgins-lockup.jpg"
                                alt="Higgins Group Private Brokerage"
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                        <address className="not-italic text-sm text-stone-500 space-y-1">
                            <p className="font-medium text-stone-700">Higgins Group Private Brokerage</p>
                            <p>1055 Washington Blvd.</p>
                            <p>Stamford, CT 06901</p>
                            <p>
                                <a href="tel:2036588282" className="hover:text-stone-900 transition-colors">
                                    203-658-8282
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
                            <li><Link href="/towns/greenwich" className="hover:text-stone-900 transition-colors">Greenwich</Link></li>
                            <li><Link href="/towns/stamford" className="hover:text-stone-900 transition-colors">Stamford</Link></li>
                            <li><Link href="/towns/darien" className="hover:text-stone-900 transition-colors">Darien</Link></li>
                            <li><Link href="/towns/new-canaan" className="hover:text-stone-900 transition-colors">New Canaan</Link></li>
                            <li><Link href="/towns/westport" className="hover:text-stone-900 transition-colors">Westport</Link></li>
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
                    <p>&copy; {new Date().getFullYear()} Matt Caiola Luxury Properties. All rights reserved.</p>
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
                        <span>Licensed with Higgins Group Private Brokerage</span>
                        <span className="hidden md:inline text-stone-300">|</span>
                        <span>Equal Housing Opportunity</span>
                        <span className="hidden md:inline text-stone-300">|</span>
                        <a href="#" className="hover:text-stone-900 transition-colors">
                            Designed by Lunar Digital
                        </a>
                    </div>
                </div>
            </Container>
        </footer>
    );
}
