import type { Tenant, TenantDomain } from './tenant';

export interface TenantControlSettings {
  id: string;
  tenantId: string;
  planCode: string;
  featureFlags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ControlPlaneTenantSnapshot {
  tenant: Tenant;
  domains: TenantDomain[];
  settings: TenantControlSettings;
}

export interface CreateTenantProvisioningInput {
  slug: string;
  name: string;
  primaryDomain: string;
  planCode?: string;
  featureFlags?: string[];
}

export interface AddTenantDomainInput {
  hostname: string;
  isPrimary?: boolean;
  isVerified?: boolean;
}

export interface UpdateTenantControlSettingsInput {
  planCode?: string;
  featureFlags?: string[];
}
