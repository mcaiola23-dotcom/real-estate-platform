import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION!;

function resolveUseCdn(): boolean {
    const explicit = process.env.NEXT_PUBLIC_SANITY_USE_CDN;
    if (explicit === "true") {
        return true;
    }
    if (explicit === "false") {
        return false;
    }
    return process.env.NODE_ENV === "production";
}

const useCdn = resolveUseCdn();

export const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn,
});
