import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Fairfield County Real Estate",
  description:
    "Learn how we collect, use, and protect your personal information. Our privacy policy explains our data practices and your rights.",
};

export default function PrivacyPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Privacy Policy</h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                Your privacy is important to us. Read our privacy policy to understand how we handle your data.
            </p>
        </div>
    );
}
