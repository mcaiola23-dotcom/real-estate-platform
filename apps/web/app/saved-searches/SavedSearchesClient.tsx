"use client";

import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useSavedSearches, SavedSearch } from "../home-search/hooks/useSavedSearches";
import Link from "next/link";
import { useState } from "react";
import Container from "../components/Container";

function SearchCard({
    search,
    emailEnabled,
    onToggleEmail,
    onDelete,
    onRun,
}: {
    search: SavedSearch;
    emailEnabled: boolean;
    onToggleEmail: () => void;
    onDelete: () => void;
    onRun: () => void;
}) {
    const formatDate = (timestamp: number) => {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(new Date(timestamp));
    };

    return (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-stone-900 truncate">
                        {search.name}
                    </h3>
                    <p className="text-sm text-stone-500 mt-1">
                        Created {formatDate(search.createdAt)}
                    </p>
                </div>
                <button
                    onClick={onDelete}
                    className="ml-4 p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete search"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>
            </div>

            {/* Filters Summary */}
            <div className="mb-6">
                <p className="text-sm text-stone-600 bg-stone-50 rounded-lg px-3 py-2">
                    {search.filtersSummary || "All listings"}
                </p>
            </div>

            {/* Email Toggle */}
            <div className="flex items-center justify-between py-4 border-t border-stone-100">
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-stone-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    <span className="text-sm text-stone-700">Email alerts</span>
                </div>
                <button
                    onClick={onToggleEmail}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailEnabled ? "bg-stone-900" : "bg-stone-300"
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailEnabled ? "translate-x-6" : "translate-x-1"
                            }`}
                    />
                </button>
            </div>

            {/* Run Search Button */}
            <button
                onClick={onRun}
                className="w-full mt-2 px-4 py-2.5 bg-stone-900 text-white font-medium rounded-lg hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                Run Search
            </button>
        </div>
    );
}

export default function SavedSearchesClient() {
    const { isLoaded, isSignedIn } = useUser();
    const { savedSearches, deleteSearch, hasLoaded } = useSavedSearches();

    // Email preferences stored locally (would be synced to backend in production)
    const [emailPrefs, setEmailPrefs] = useState<Record<string, boolean>>({});

    const toggleEmailPref = (searchId: string) => {
        setEmailPrefs((prev) => ({
            ...prev,
            [searchId]: !prev[searchId],
        }));
    };

    const runSearch = (params: string) => {
        window.location.href = `/home-search?${params}`;
    };

    if (!isLoaded || !hasLoaded) return null;

    if (!isSignedIn) {
        return <RedirectToSignIn />;
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="bg-white border-b border-stone-200">
                <Container className="py-12">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="font-serif text-3xl md:text-4xl text-stone-900">Saved Searches</h1>
                            <p className="text-stone-500 mt-2">Manage your property search alerts</p>
                        </div>
                        <Link
                            href="/home-search"
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-stone-900 text-white font-medium rounded-lg hover:bg-stone-800 transition-colors gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            New Search
                        </Link>
                    </div>
                </Container>
            </div>

            <Container className="py-12">
                {savedSearches.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-stone-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-medium text-stone-900 mb-2">No saved searches yet</h2>
                        <p className="text-stone-500 mb-8 max-w-sm mx-auto">
                            Save your search criteria from the home search page to get notified when new listings match.
                        </p>
                        <Link
                            href="/home-search"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
                        >
                            Start Searching
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-stone-600">
                                {savedSearches.length} saved {savedSearches.length === 1 ? "search" : "searches"}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedSearches.map((search) => (
                                <SearchCard
                                    key={search.id}
                                    search={search}
                                    emailEnabled={emailPrefs[search.id] ?? false}
                                    onToggleEmail={() => toggleEmailPref(search.id)}
                                    onDelete={() => deleteSearch(search.id)}
                                    onRun={() => runSearch(search.params)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </Container>
        </div>
    );
}
