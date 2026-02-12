import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPostsByCategoryLabel, getCategoryLabelFromValue, getCategoryValueFromSlug } from "../../lib/sanity.queries";
import Container from "../../components/Container";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{
        categorySlug: string;
    }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { categorySlug } = await params;
    const categoryValue = getCategoryValueFromSlug(categorySlug);
    const categoryLabel = categoryValue
        ? getCategoryLabelFromValue(categoryValue)
        : categorySlug.replace(/-/g, " ");

    const formattedLabel =
        categoryLabel.charAt(0).toUpperCase() + categoryLabel.slice(1);

    const title = `${formattedLabel} | Fairfield County Real Estate Insights`;
    const description = `Browse ${formattedLabel.toLowerCase()} articles and insights about Fairfield County real estate. Expert analysis and local market knowledge.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function InsightsCategoryPage(props: Props) {
    const params = await props.params;
    const { categorySlug } = params;

    const categoryValue = getCategoryValueFromSlug(categorySlug);
    const posts = await getPostsByCategoryLabel(categorySlug);
    const categoryLabel = categoryValue ? getCategoryLabelFromValue(categoryValue) : categorySlug.replace(/-/g, ' ');

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <section className="bg-stone-900 text-white">
                <Container className="py-16 md:py-20">
                    <Link
                        href="/insights"
                        className="inline-flex items-center gap-2 text-stone-400 hover:text-white mb-6 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        All Insights
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-serif font-medium capitalize">
                        {categoryLabel}
                    </h1>
                </Container>
            </section>

            <Container className="py-16">
                {/* Post Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <Link
                            key={post._id}
                            href={`/insights/${post.categorySlug}/${post.slug}`}
                            className="group block bg-white rounded-xl overflow-hidden border border-stone-200 hover:border-stone-300 hover:shadow-xl transition-all duration-300"
                        >
                            {/* Featured Image */}
                            <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                                {post.featuredImageUrl ? (
                                    <Image
                                        src={post.featuredImageUrl}
                                        alt={post.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                                        <svg className="w-12 h-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <span className="inline-block px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm font-medium mb-4">
                                    {post.categoryLabel}
                                </span>
                                <h2 className="text-xl font-serif font-medium text-stone-900 mb-3 group-hover:text-stone-700 transition-colors line-clamp-2">
                                    {post.title}
                                </h2>
                                <p className="text-stone-500 text-sm">
                                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                {posts.length === 0 && (
                    <div className="text-center py-16 bg-stone-50 rounded-xl">
                        <p className="text-stone-500 text-lg mb-4">No posts found in {categoryLabel}.</p>
                        <Link href="/insights" className="text-stone-700 hover:text-stone-900 font-medium">
                            Browse all insights →
                        </Link>
                    </div>
                )}
            </Container>
        </div>
    );
}
