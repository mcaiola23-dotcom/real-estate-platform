import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTownBySlug, getNeighborhoodsByTown } from "../../lib/sanity.queries";
import { PortableText, PortableTextComponents } from "@portabletext/react";
import TownHero from "../../components/TownHero";
import Container from "../../components/Container";
import TownFAQs from "../../components/TownFAQs";

// Data Modules
import { DataModuleGrid } from "../../components/data/DataModule";
import { formatContentText } from "../../lib/formatters";
import AgentCTASection from "../../components/AgentCTASection";
import SimilarTownsSection from "../../components/SimilarTownsSection";
import EmailSignupSection from "../../components/EmailSignupSection";
import { AtAGlanceModule } from "../../components/data/AtAGlanceModule";
import { SchoolsModule } from "../../components/data/SchoolsModule";
import { WalkScoreModule, WalkScoreModulePlaceholder } from "../../components/data/WalkScoreModule";
import { PoisModule, PoisModulePlaceholder } from "../../components/data/PoisModule";
import { TaxesModule } from "../../components/data/TaxesModule";
import { ListingsModule } from "../../components/data/ListingsModule";
import { getWalkScore } from "../../lib/data/providers/walkscore.provider";
import { getPois } from "../../lib/data/providers/places.provider";
import { TOWN_CENTERS } from "../../lib/data/town-centers";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ townSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { townSlug } = await params;
    const town = await getTownBySlug(townSlug);

    if (!town) {
        return {
            title: "Town Not Found",
            description: "The requested town could not be found.",
        };
    }

    const title = `${town.name} CT Real Estate | Homes, Neighborhoods & Market Info`;
    const description =
        town.overviewShort ||
        `Explore ${town.name}, Connecticut real estate. Browse homes for sale, neighborhoods, schools, and local market insights.`;

    // Use town-specific image if available, otherwise fall back to default
    const townImage = `/visual/towns/${townSlug}.jpg`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            images: [
                {
                    url: townImage,
                    width: 1200,
                    height: 630,
                    alt: `${town.name}, Connecticut real estate`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [townImage],
        },
    };
}

// Custom PortableText components that sanitize em dashes
const sanitizedComponents: PortableTextComponents = {
    block: {
        normal: ({ children }) => {
            return <p>{children}</p>;
        },
    },
    marks: {
        // Override the default text rendering to sanitize
    },
};

// Recursively sanitize Portable Text blocks to remove em dashes
function sanitizePortableText(value: any): any {
    if (!value) return value;
    if (Array.isArray(value)) {
        return value.map(sanitizePortableText);
    }
    if (typeof value === 'object') {
        const result: any = {};
        for (const key of Object.keys(value)) {
            result[key] = sanitizePortableText(value[key]);
        }
        return result;
    }
    if (typeof value === 'string') {
        return formatContentText(value);
    }
    return value;
}

export default async function TownPage({
    params,
}: {
    params: Promise<{ townSlug: string }>;
}) {
    const { townSlug } = await params;
    const town = await getTownBySlug(townSlug);

    if (!town) {
        notFound();
    }

    const neighborhoods = await getNeighborhoodsByTown(townSlug);

    // Fetch Walk Score data if center coordinates are available
    let walkScoreResult = null;
    if (town.center?.lat && town.center?.lng) {
        walkScoreResult = await getWalkScore({
            townSlug,
            townId: town._id,
            townName: town.name,
            lat: town.center.lat,
            lng: town.center.lng,
        });
    }

    // Fetch POIs data
    let poisResult = null;
    if (town.center?.lat && town.center?.lng) {
        poisResult = await getPois({
            townSlug,
            townId: town._id,
            townName: town.name,
            lat: town.center.lat,
            lng: town.center.lng,
            curatedPois: town.curatedPois,
        });
    } else if (town.curatedPois && town.curatedPois.length > 0) {
        // Use curated POIs if no coordinates
        poisResult = await getPois({
            townSlug,
            townId: town._id,
            townName: town.name,
            lat: 0,
            lng: 0,
            curatedPois: town.curatedPois,
        });
    }

    // Place structured data for the town
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Place",
        name: `${town.name}, Connecticut`,
        description:
            town.overviewShort ||
            `${town.name} is a town in Fairfield County, Connecticut.`,
        address: {
            "@type": "PostalAddress",
            addressLocality: town.name,
            addressRegion: "CT",
            addressCountry: "US",
        },
        containedInPlace: {
            "@type": "AdministrativeArea",
            name: "Fairfield County",
            addressRegion: "CT",
        },
        url: `https://example.com/towns/${townSlug}`, // Placeholder domain
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="bg-white min-h-screen">
                <TownHero
                    title={town.name}
                    subtitle={formatContentText(town.overviewShort) || `Discover the charm of ${town.name}`}
                    imageSlug={townSlug}
                    parentLink={{ href: "/towns", label: "Towns" }}
                />

                {/* Overview Section */}
                <section className="py-16 border-b border-stone-100">
                    <Container>
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-2xl font-medium text-stone-900 mb-6 font-serif">About {town.name}</h2>
                            {town.overviewLong ? (
                                <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed">
                                    <PortableText value={sanitizePortableText(town.overviewLong)} />
                                </div>
                            ) : (
                                <p className="text-stone-500 italic">Description coming soon.</p>
                            )}
                        </div>
                    </Container>
                </section>

                {/* Lifestyle Section */}
                {town.lifestyle && (
                    <section className="py-16 border-b border-stone-100 bg-stone-50">
                        <Container>
                            <div className="max-w-3xl mx-auto">
                                <h2 className="text-2xl font-medium text-stone-900 mb-6 font-serif">
                                    Living in {town.name}
                                </h2>
                                <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed">
                                    <p className="whitespace-pre-line">{formatContentText(town.lifestyle)}</p>
                                </div>
                            </div>
                        </Container>
                    </section>
                )}

                {/* Market Notes Section */}
                {town.marketNotes && (
                    <section className="py-16 border-b border-stone-100">
                        <Container>
                            <div className="max-w-3xl mx-auto">
                                <h2 className="text-2xl font-medium text-stone-900 mb-6 font-serif">
                                    Real Estate in {town.name}
                                </h2>
                                <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed">
                                    <p className="whitespace-pre-line">{formatContentText(town.marketNotes)}</p>
                                </div>
                            </div>
                        </Container>
                    </section>
                )}

                {/* FAQs Section */}
                {town.faqs && town.faqs.length > 0 && (
                    <section className="py-16 border-b border-stone-100 bg-stone-50">
                        <Container>
                            <div className="max-w-3xl mx-auto">
                                <h2 className="text-2xl font-medium text-stone-900 mb-8 font-serif">
                                    Frequently Asked Questions About {town.name}
                                </h2>
                                <TownFAQs faqs={town.faqs} townName={town.name} />
                            </div>
                        </Container>
                    </section>
                )}

                {/* Highlights Section */}
                {town.highlights && town.highlights.length > 0 && (
                    <section className="py-16 bg-stone-50 border-b border-stone-100">
                        <Container>
                            <div className="max-w-3xl mx-auto">
                                <h2 className="text-2xl font-medium text-stone-900 mb-6 font-serif">
                                    What Makes {town.name} Special
                                </h2>
                                <ul className="space-y-3">
                                    {town.highlights.map((highlight, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="text-stone-500 mr-3 flex-shrink-0">•</span>
                                            <span className="text-stone-600">{formatContentText(highlight)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Container>
                    </section>
                )}

                {/* Demographics Section */}
                <section className="py-16 bg-stone-50 border-b border-stone-100">
                    <Container>
                        <AtAGlanceModule townSlug={townSlug} townName={town.name} />
                    </Container>
                </section>

                {/* Schools Section */}
                <section className="py-16 bg-white border-b border-stone-100">
                    <Container>
                        <SchoolsModule townSlug={townSlug} townName={town.name} />
                    </Container>
                </section>

                {/* Property Taxes Section */}
                <section className="py-16 bg-stone-50 border-b border-stone-100">
                    <Container>
                        <div className="max-w-2xl mx-auto">
                            <TaxesModule townSlug={townSlug} townName={town.name} />
                        </div>
                    </Container>
                </section>

                {/* Walk Score & POIs Section */}
                <section className="py-16 bg-white border-b border-stone-100">
                    <Container>
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Walk Score */}
                            {walkScoreResult ? (
                                <WalkScoreModule result={walkScoreResult} locationName={town.name} />
                            ) : (
                                <WalkScoreModulePlaceholder />
                            )}

                            {/* POIs */}
                            {poisResult && poisResult.pois.length > 0 ? (
                                <PoisModule result={poisResult} locationName={town.name} />
                            ) : (
                                <PoisModulePlaceholder locationName={town.name} />
                            )}
                        </div>
                    </Container>
                </section>

                {/* Neighborhoods */}
                <section className="py-16 border-b border-stone-100">
                    <Container>
                        <h2 className="text-3xl font-medium text-stone-900 mb-8 font-serif text-center">Neighborhoods</h2>
                        {neighborhoods.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {neighborhoods.map((neighborhood) => (
                                    <Link
                                        key={neighborhood._id}
                                        href={`/towns/${townSlug}/${neighborhood.slug}`}
                                        className="group block p-6 bg-white border border-stone-200 rounded-xl shadow-sm hover:shadow-lg transition-all hover:border-stone-400"
                                    >
                                        <h3 className="text-xl font-semibold text-stone-900 mb-2 group-hover:text-stone-700 transition-colors">
                                            {neighborhood.name}
                                        </h3>
                                        {neighborhood.overview && (
                                            <p className="text-stone-600 line-clamp-3 text-sm">
                                                {formatContentText(neighborhood.overview)}
                                            </p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-stone-50 rounded-lg">
                                <p className="text-stone-500">Neighborhood guides coming soon for {town.name}.</p>
                            </div>
                        )}
                    </Container>
                </section>



                {/* Listings Section */}
                <section className="py-16 bg-white">
                    <Container>
                        <ListingsModule
                            townSlug={townSlug}
                            townName={town.name}
                            center={TOWN_CENTERS[townSlug]}
                        />
                    </Container>
                </section>

                {/* Similar Towns */}
                <SimilarTownsSection currentTownSlug={townSlug} />

                {/* CTA Section */}
                <AgentCTASection />
                <EmailSignupSection />
            </div>
        </>
    );
}
