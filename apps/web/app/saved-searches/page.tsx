import type { Metadata } from "next";
import SavedSearchesClient from "./SavedSearchesClient";

export const metadata: Metadata = {
    title: "Saved Searches | Matt Caiola",
    description: "Manage your saved property searches and email alerts for Fairfield County real estate.",
};

export default function SavedSearchesPage() {
    return <SavedSearchesClient />;
}
