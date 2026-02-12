import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostByCategoryLabelAndSlug } from "../../../lib/sanity.queries";
import RichText from "../../../components/RichText";
import Link from "next/link";
import Image from "next/image";
import Container from "../../../components/Container";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{
        categorySlug: string;
        postSlug: string;
    }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { categorySlug, postSlug } = await params;
    const post = await getPostByCategoryLabelAndSlug(categorySlug, postSlug);

    if (!post) {
        return {
            title: "Post Not Found",
            description: "The requested article could not be found.",
        };
    }

    const title = `${post.title} | Fairfield County Insights`;
    const description = `Read ${post.title} - expert insights on Fairfield County real estate from a local market perspective.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
            publishedTime: post.publishedAt,
            authors: post.author ? [post.author] : undefined,
            images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: post.featuredImageUrl ? [post.featuredImageUrl] : undefined,
        },
    };
}

export default async function InsightsPostPage(props: Props) {
    const params = await props.params;
    const { categorySlug, postSlug } = params;

    const post = await getPostByCategoryLabelAndSlug(categorySlug, postSlug);

    if (!post) {
        notFound();
    }

    // BlogPosting structured data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        image: post.featuredImageUrl,
        author: post.author
            ? {
                "@type": "Person",
                name: post.author,
            }
            : undefined,
        publisher: {
            "@type": "RealEstateAgent",
            name: "Higgins Group Private Brokerage",
            url: "https://example.com", // Placeholder
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://example.com/insights/${categorySlug}/${postSlug}`,
        },
        articleSection: post.categoryLabel,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Hero Image Header */}
            {post.featuredImageUrl && (
                <div className="relative h-[400px] md:h-[500px] bg-stone-900">
                    <Image
                        src={post.featuredImageUrl}
                        alt={post.title}
                        fill
                        priority
                        className="object-cover opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/50 to-transparent" />
                </div>
            )}

            <Container className="py-12">
                <article className="max-w-3xl mx-auto">
                    {/* Back Link */}
                    <Link
                        href={`/insights/${categorySlug}`}
                        className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-8 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to {post.categoryLabel}
                    </Link>

                    {/* Article Header */}
                    <header className="mb-12">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="inline-block px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm font-medium">
                                {post.categoryLabel}
                            </span>
                            <time className="text-stone-500 text-sm">
                                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </time>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-medium text-stone-900 leading-tight mb-4">
                            {post.title}
                        </h1>
                        {post.author && (
                            <p className="text-stone-600">By {post.author}</p>
                        )}
                    </header>

                    {/* Article Body */}
                    <div className="prose prose-stone prose-lg max-w-none">
                        {post.body ? (
                            <RichText value={post.body} />
                        ) : (
                            <p className="text-stone-500 italic">No content available for this post.</p>
                        )}
                    </div>
                </article>
            </Container>
        </>
    );
}
