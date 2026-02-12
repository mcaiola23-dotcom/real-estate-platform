import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Fairfield County Real Estate",
  description:
    "Terms and conditions for using our website. Please review these terms before accessing our real estate services and content.",
};

export default function TermsPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Terms of Service</h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                Please read these terms and conditions carefully before using our website.
            </p>
        </div>
    );
}
