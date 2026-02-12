import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@sanity/client';

/**
 * Sanity client with write access for user profile operations
 */
const sanityClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
    token: process.env.SANITY_API_WRITE_TOKEN,
    useCdn: false, // Mutations require no CDN
});

/**
 * GET /api/user/profile
 * 
 * Fetches the current user's profile from Sanity.
 * Creates a new profile if one doesn't exist.
 */
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch existing profile
        const profile = await sanityClient.fetch(
            `*[_type == "userProfile" && clerkId == $clerkId][0]`,
            { clerkId: userId }
        );

        if (profile) {
            return NextResponse.json({ profile });
        }

        // Create new profile if doesn't exist
        const user = await currentUser();
        const newProfile = await sanityClient.create({
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

        return NextResponse.json({ profile: newProfile, created: true });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}
