export type TenantResolutionSource = 'host_match' | 'localhost_fallback' | 'default_fallback';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantDomain: string;
  source: TenantResolutionSource;
}

export type TenantRecord = Omit<TenantContext, 'source'>;

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'suspended' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface TenantDomain {
  id: string;
  tenantId: string;
  hostname: string;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
