import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@sanity/client';

/**
 * Sanity client with write access for user sync operations
 */
const sanityClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
    token: process.env.SANITY_API_WRITE_TOKEN,
    useCdn: false,
});

interface SyncRequestBody {
    savedHomes?: string[];
    savedSearches?: Array<{
        name: string;
        url?: string;
        filterState?: string;
        createdAt?: string;
    }>;
}

/**
 * POST /api/user/sync
 * 
 * Syncs user's saved homes and searches from localStorage to Sanity.
 * Merges incoming data with existing cloud data (union of both).
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body: SyncRequestBody = await request.json();
        const { savedHomes = [], savedSearches = [] } = body;

        // Fetch existing profile or create new one
        let profile = await sanityClient.fetch(
            `*[_type == "userProfile" && clerkId == $clerkId][0]`,
            { clerkId: userId }
        );

        if (!profile) {
            // Create new profile
            const user = await currentUser();
            profile = await sanityClient.create({
                _type: 'userProfile',
                clerkId: userId,
                email: user?.emailAddresses?.[0]?.emailAddress || '',
                firstName: user?.firstName || '',
                lastName: user?.lastName || '',
                savedHomes: [],
                savedSearches: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }

        // Merge saved homes (union of local + cloud, no duplicates)
        const existingHomes = profile.savedHomes || [];
        const mergedHomes = [...new Set([...existingHomes, ...savedHomes])];

        // Merge saved searches (by URL to avoid duplicates)
        const existingSearches = profile.savedSearches || [];
        const existingUrls = new Set(existingSearches.map((s: { url?: string }) => s.url));
        const newSearches = savedSearches.filter(s => !existingUrls.has(s.url));
        const mergedSearches = [...existingSearches, ...newSearches];

        // Update profile with merged data
        const updatedProfile = await sanityClient
            .patch(profile._id)
            .set({
                savedHomes: mergedHomes,
                savedSearches: mergedSearches,
                updatedAt: new Date().toISOString(),
            })
            .commit();

        return NextResponse.json({
            success: true,
            profile: updatedProfile,
            merged: {
                homes: mergedHomes.length,
                searches: mergedSearches.length,
            },
        });
    } catch (error) {
        console.error('Error syncing user data:', error);
        return NextResponse.json(
            { error: 'Failed to sync data' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/user/sync
 * 
 * Updates a single saved home (add or remove).
 */
export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { listingId, action } = body;

        if (!listingId || !['add', 'remove'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid request. Requires listingId and action (add/remove)' },
                { status: 400 }
            );
        }

        // Fetch existing profile
        const profile = await sanityClient.fetch(
            `*[_type == "userProfile" && clerkId == $clerkId][0]`,
            { clerkId: userId }
        );

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not found. Please sign in again.' },
                { status: 404 }
            );
        }

        const currentHomes = profile.savedHomes || [];
        let updatedHomes: string[];

        if (action === 'add') {
            updatedHomes = currentHomes.includes(listingId)
                ? currentHomes
                : [...currentHomes, listingId];
        } else {
            updatedHomes = currentHomes.filter((id: string) => id !== listingId);
        }

        const updatedProfile = await sanityClient
            .patch(profile._id)
            .set({
                savedHomes: updatedHomes,
                updatedAt: new Date().toISOString(),
            })
            .commit();

        return NextResponse.json({
            success: true,
            savedHomes: updatedProfile.savedHomes,
        });
    } catch (error) {
        console.error('Error updating saved home:', error);
        return NextResponse.json(
            { error: 'Failed to update saved home' },
            { status: 500 }
        );
    }
}
