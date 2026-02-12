import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fair Housing | Equal Opportunity Commitment",
  description:
    "Our commitment to Fair Housing and Equal Opportunity in real estate. We uphold the principles of fair and equal housing access for all.",
};

export default function FairHousingPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Fair Housing</h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                We are committed to the principles of Fair Housing and Equal Opportunity.
            </p>
        </div>
    );
}
