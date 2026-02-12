import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getNeighborhoodBySlug } from "../../../lib/sanity.queries";
import { PortableText } from "@portabletext/react";
import TownHero from "../../../components/TownHero";
import Container from "../../../components/Container";

// Data Modules
import { DataModuleGrid } from "../../../components/data/DataModule";
import { formatContentText } from "../../../lib/formatters";
import AgentCTASection from "../../../components/AgentCTASection";
import EmailSignupSection from "../../../components/EmailSignupSection";
import { AtAGlanceModule } from "../../../components/data/AtAGlanceModule";
import { SchoolsModule } from "../../../components/data/SchoolsModule";
import { WalkScoreModule, WalkScoreModulePlaceholder } from "../../../components/data/WalkScoreModule";
import { PoisModule, PoisModulePlaceholder } from "../../../components/data/PoisModule";
import { TaxesModule } from "../../../components/data/TaxesModule";
import { ListingsModule } from "../../../components/data/ListingsModule";
import { getWalkScore } from "../../../lib/data/providers/walkscore.provider";
import { getPois } from "../../../lib/data/providers/places.provider";
import { TOWN_CENTERS } from "../../../lib/data/town-centers";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ townSlug: string; neighborhoodSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { townSlug, neighborhoodSlug } = await params;
    const neighborhood = await getNeighborhoodBySlug(townSlug, neighborhoodSlug);

    if (!neighborhood) {
        return {
            title: "Neighborhood Not Found",
            description: "The requested neighborhood could not be found.",
        };
    }

    const townName = neighborhood.town?.name || "Fairfield County";
    const title = `${neighborhood.name}, ${townName} CT | Neighborhood Guide`;
    const description =
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

// Recursively sanitize Portable Text blocks to remove em/en dashes
function sanitizePortableText(value: any): any {
    if (!value) return value;
    if (Array.isArray(value)) return value.map(sanitizePortableText);
    if (typeof value === 'object') {
        const result: any = {};
        for (const key of Object.keys(value)) result[key] = sanitizePortableText(value[key]);
        return result;
    }
    if (typeof value === 'string') return formatContentText(value);
    return value;
}

export default async function NeighborhoodPage({
    params,
}: {
    params: Promise<{ townSlug: string; neighborhoodSlug: string }>;
}) {
    const { townSlug, neighborhoodSlug } = await params;
    const neighborhood = await getNeighborhoodBySlug(townSlug, neighborhoodSlug);

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
    if (hasCenterCoords) {
        walkScoreResult = await getWalkScore({
            townSlug,
            townId,
            townName,
            lat: center!.lat,
            lng: center!.lng,
            neighborhoodSlug,
            neighborhoodId: neighborhood._id,
            address: `${neighborhood.name}, ${townName}, CT`,
        });
    }

    return (
        <div className="bg-white min-h-screen">
            {/* N4: Hero uses TownHero with updated gradient overlay */}
            {/* N2: Photos - uses townSlug as fallback for neighborhood images */}
            <TownHero
                title={neighborhood.name}
                subtitle={`A neighborhood in ${townName}`}
                imageSlug={townSlug} // Use town image as fallback (neighborhoods share town images)
                parentLink={{ href: `/towns/${townSlug}`, label: townName }}
            />

            <Container className="py-16">
                {/* Overview - Centered like Town pages */}
                <section className="max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-6">
                        Overview
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
                        Living in {neighborhood.name}
                    </h2>
                    {hasDescription ? (
                        <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed">
                            <PortableText value={sanitizePortableText(neighborhood.description)} />
                        </div>
                    ) : (
                        <p className="text-stone-500 italic">Description coming soon.</p>
                    )}
                </section>

                {/* Highlights Section - N3: Centering fixed, N5: Blue → Stone */}
                {hasHighlights && (
                    <section className="max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-6">
                            What Makes {neighborhood.name} Special
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

                {/* Walk Score Section */}
                {walkScoreResult && (
                    <section className="max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-6">
                            Walkability & Transit
                        </h2>
                        <div className="max-w-xl">
                            <WalkScoreModule result={walkScoreResult} locationName={neighborhood.name} />
                        </div>
                    </section>
                )}

                {/* Listings Section */}
                <section>
                    <ListingsModule
                        townSlug={townSlug}
                        townName={townName}
                        neighborhoodSlug={neighborhoodSlug}
                        neighborhoodName={neighborhood.name}
                        center={TOWN_CENTERS[townSlug]}
                    />
                </section>
            </Container>

            {/* CTA Section */}
            <AgentCTASection />
            <EmailSignupSection />
        </div>
    );
}
