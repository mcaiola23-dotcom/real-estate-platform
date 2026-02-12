import { createClient } from "next-sanity";

// Server-side only client for writing to Sanity
// Never import this in a client component!
export const writeClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
    token: process.env.SANITY_API_WRITE_TOKEN, // Protected token
    useCdn: false, // Must be false for writes
});
