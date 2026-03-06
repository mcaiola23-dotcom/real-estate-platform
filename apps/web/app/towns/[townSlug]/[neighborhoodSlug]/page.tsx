import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getNeighborhoodBySlug } from "../../../lib/sanity.queries";
import { PortableText, PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "sanity";
import TownHero from "../../../components/TownHero";
import Container from "../../../components/Container";
import TownFAQs from "../../../components/TownFAQs";

// Data Modules
import { formatContentText } from "../../../lib/formatters";
import { getLifestyleHeading, getHighlightsHeading } from "../../../lib/heading-variants";
import AgentCTASection from "../../../components/AgentCTASection";
import EmailSignupSection from "../../../components/EmailSignupSection";
import { WalkScoreModule } from "../../../components/data/WalkScoreModule";
import { ListingsModule } from "../../../components/data/ListingsModule";
import { getWalkScore } from "../../../lib/data/providers/walkscore.provider";
import { TOWN_CENTERS } from "../../../lib/data/town-centers";
import { getTenantContextFromHeaders } from "../../../lib/tenant/resolve-tenant";
import { getTenantModuleToggles } from "../../../lib/modules/tenant-modules";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ townSlug: string; neighborhoodSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { townSlug, neighborhoodSlug } = await params;
    const tenantContext = await getTenantContextFromHeaders(await headers());
    const neighborhood = await getNeighborhoodBySlug(townSlug, neighborhoodSlug, tenantContext);

    if (!neighborhood) {
        return {
            title: "Neighborhood Not Found",
            description: "The requested neighborhood could not be found.",
        };
    }

    const townName = neighborhood.town?.name || "Fairfield County";
    const title = neighborhood.seoTitle || `${neighborhood.name}, ${townName} CT | Neighborhood Guide`;
    const description =
        neighborhood.seoDescription ||
        neighborhood.overview ||
        `Explore ${neighborhood.name} in ${townName}, Connecticut. Discover homes, market trends, and neighborhood highlights.`;

    // Use town image as fallback for neighborhoods
    const image = `/visual/towns/${townSlug}.jpg`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: `${neighborhood.name} neighborhood in ${townName}, Connecticut`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
    };
}

// Custom PortableText components with consistent paragraph spacing
const sanitizedComponents: PortableTextComponents = {
    block: {
        normal: ({ children }) => {
            return <p className="mb-6 last:mb-0">{children}</p>;
        },
    },
};

// Recursively sanitize Portable Text blocks to remove em/en dashes
function sanitizePortableText(value: unknown): unknown {
    if (!value) return value;
    if (Array.isArray(value)) return value.map(sanitizePortableText);
    if (typeof value === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
            result[key] = sanitizePortableText(nestedValue);
        }
        return result;
    }
    if (typeof value === "string") return formatContentText(value);
    return value;
}

export default async function NeighborhoodPage({
    params,
}: {
    params: Promise<{ townSlug: string; neighborhoodSlug: string }>;
}) {
    const { townSlug, neighborhoodSlug } = await params;
    const tenantContext = await getTenantContextFromHeaders(await headers());
    const moduleToggles = await getTenantModuleToggles(tenantContext);
    const neighborhood = await getNeighborhoodBySlug(townSlug, neighborhoodSlug, tenantContext);

    if (!neighborhood) {
        notFound();
    }

    const townName = neighborhood.town?.name || "Town";
    const townId = neighborhood.town?._id || "";
    const hasDescription =
        Array.isArray(neighborhood.description) && neighborhood.description.length > 0;
    const hasHighlights = Boolean(neighborhood.highlights && neighborhood.highlights.length > 0);

    // Determine coordinates - prefer neighborhood center, fallback to town center
    const center = neighborhood.center || neighborhood.town?.center;
    const hasCenterCoords = center?.lat && center?.lng;

    // Fetch Walk Score data if coordinates are available
    let walkScoreResult = null;
    if (moduleToggles.walk_score && hasCenterCoords) {
        walkScoreResult = await getWalkScore({
            townSlug,
            townId,
            townName,
            lat: center!.lat,
            lng: center!.lng,
            neighborhoodSlug,
            neighborhoodId: neighborhood._id,
            address: `${neighborhood.name}, ${townName}, CT`,
            tenantContext,
        });
    }

    // Place structured data for the neighborhood
    const placeJsonLd = {
        "@context": "https://schema.org",
        "@type": "Place",
        name: `${neighborhood.name}, ${townName}, Connecticut`,
        description:
            neighborhood.overview ||
            `${neighborhood.name} is a neighborhood in ${townName}, Fairfield County, Connecticut.`,
        address: {
            "@type": "PostalAddress",
            addressLocality: townName,
            addressRegion: "CT",
            addressCountry: "US",
        },
        containedInPlace: {
            "@type": "Place",
            name: `${townName}, Connecticut`,
            url: `https://example.com/towns/${townSlug}`,
        },
        url: `https://example.com/towns/${townSlug}/${neighborhoodSlug}`,
    };

    // FAQ structured data (only for schema-enabled FAQs)
    const schemaFaqs = neighborhood.faqs?.filter((f) => f.schemaEnabled !== false) || [];
    const faqJsonLd = schemaFaqs.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: schemaFaqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: faq.answer,
                },
            })),
        }
        : null;

    return (
        <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
        />
        {faqJsonLd && (
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
        )}
        <div className="bg-white min-h-screen">
            {/* N4: Hero uses TownHero with updated gradient overlay */}
            {/* N2: Photos - uses townSlug as fallback for neighborhood images */}
            <TownHero
                title={neighborhood.name}
                subtitle={neighborhood.overview ? neighborhood.overview.split(/\.\s+/)[0] + '.' : `A neighborhood in ${townName}`}
                imageSlug={townSlug} // Use town image as fallback (neighborhoods share town images)
                parentLink={{ href: `/towns/${townSlug}`, label: townName }}
            />

            <Container className="py-16">
                {/* Overview - Centered like Town pages */}
                <section className="max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-6">
                        About {neighborhood.name}
                    </h2>
                    {neighborhood.overview ? (
                        <p className="text-lg text-stone-600 leading-relaxed">
                            {formatContentText(neighborhood.overview)}
                        </p>
                    ) : (
                        <p className="text-stone-500 italic">Overview coming soon.</p>
                    )}
                </section>

                {/* Description */}
                <section className="max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-6">
                        {getLifestyleHeading(neighborhood.name, neighborhood.overview, neighborhood.highlights)}
                    </h2>
                    {hasDescription ? (
                        <div className="max-w-none text-stone-600 leading-relaxed">
                            <PortableText
                                value={sanitizePortableText(neighborhood.description) as PortableTextBlock[]}
                                components={sanitizedComponents}
                            />
                        </div>
                    ) : (
                        <p className="text-stone-500 italic">Description coming soon.</p>
                    )}
                </section>

                {/* Highlights Section - N3: Centering fixed, N5: Blue → Stone */}
                {hasHighlights && (
                    <section className="max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-6">
                            {getHighlightsHeading(neighborhood.name, neighborhood.overview, neighborhood.highlights)}
                        </h2>
                        <ul className="space-y-3">
                            {neighborhood.highlights!.map((highlight, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="text-stone-400 mr-3 flex-shrink-0">•</span>
                                    <span className="text-stone-600">{formatContentText(highlight)}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Housing Characteristics Section */}
                {neighborhood.housingCharacteristics && (
                    <section className="max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-6">
                            Housing in {neighborhood.name}
                        </h2>
                        <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed">
                            <p className="whitespace-pre-line">{formatContentText(neighborhood.housingCharacteristics)}</p>
                        </div>
                    </section>
                )}

                {/* Market Notes Section */}
                {neighborhood.marketNotes && (
                    <section className="max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-6">
                            Real Estate in {neighborhood.name}
                        </h2>
                        <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed">
                            <p className="whitespace-pre-line">{formatContentText(neighborhood.marketNotes)}</p>
                        </div>
                    </section>
                )}

                {/* Location & Access Section */}
                {neighborhood.locationAccess && (
                    <section className="max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-6">
                            Getting Around {neighborhood.name}
                        </h2>
                        <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed">
                            <p className="whitespace-pre-line">{formatContentText(neighborhood.locationAccess)}</p>
                        </div>
                    </section>
                )}

                {/* FAQs Section */}
                {neighborhood.faqs && neighborhood.faqs.length > 0 && (
                    <section className="max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-8">
                            Frequently Asked Questions About {neighborhood.name}
                        </h2>
                        <TownFAQs faqs={neighborhood.faqs} />
                    </section>
                )}

                {/* Walk Score Section */}
                {moduleToggles.walk_score && walkScoreResult && (
                    <section className="max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-6">
                            Walkability & Transit
                        </h2>
                        <div className="max-w-xl">
                            <WalkScoreModule result={walkScoreResult} />
                        </div>
                    </section>
                )}

                {/* Listings Section */}
                {moduleToggles.listings && (
                    <section>
                        <ListingsModule
                            townSlug={townSlug}
                            townName={townName}
                            neighborhoodSlug={neighborhoodSlug}
                            neighborhoodName={neighborhood.name}
                            center={TOWN_CENTERS[townSlug]}
                            tenantContext={tenantContext}
                        />
                    </section>
                )}
            </Container>

            {/* CTA Section */}
            <AgentCTASection />
            <EmailSignupSection />
        </div>
        </>
    );
}
