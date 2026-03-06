import type { SanityClient } from '@sanity/client';

interface TenantIdentity {
  tenantId: string;
  tenantSlug: string;
  tenantDomain: string;
}

export interface UserProfileDocument {
  _id: string;
  clerkId: string;
  tenantId?: string;
  tenantSlug?: string;
  tenantDomain?: string;
  savedHomes?: string[];
  savedSearches?: Array<{
    name: string;
    url?: string;
    filterState?: string;
    createdAt?: string;
  }>;
}

export async function getTenantScopedUserProfile(
  client: SanityClient,
  clerkId: string,
  tenantId: string
): Promise<UserProfileDocument | null> {
  return client.fetch<UserProfileDocument | null>(
    `*[_type == "userProfile" && clerkId == $clerkId && tenantId == $tenantId][0]`,
    { clerkId, tenantId }
  );
}

export async function migrateLegacyUserProfileToTenant(
  client: SanityClient,
  clerkId: string,
  tenant: TenantIdentity
): Promise<UserProfileDocument | null> {
  const legacyProfile = await client.fetch<UserProfileDocument | null>(
    `*[_type == "userProfile" && clerkId == $clerkId && !defined(tenantId)][0]`,
    { clerkId }
  );
  if (!legacyProfile) {
    return null;
  }

  const scopedProfileCount = await client.fetch<number>(
    `count(*[_type == "userProfile" && clerkId == $clerkId && defined(tenantId)])`,
    { clerkId }
  );
  if (scopedProfileCount > 0) {
    return null;
  }

  return client
    .patch(legacyProfile._id)
    .set({
      tenantId: tenant.tenantId,
      tenantSlug: tenant.tenantSlug,
      tenantDomain: tenant.tenantDomain,
      updatedAt: new Date().toISOString(),
    })
    .commit();
}
