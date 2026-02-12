import type { Metadata } from "next";
import SavedHomesClient from "./SavedHomesClient";

export const metadata: Metadata = {
    title: "Saved Homes | Matt Caiola",
    description: "View and manage your saved luxury properties in Fairfield County.",
};

export default function SavedHomesPage() {
    return <SavedHomesClient />;
}
