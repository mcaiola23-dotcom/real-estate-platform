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

export type ControlPlaneAdminAuditAction =
  | 'tenant.provision'
  | 'tenant.domain.add'
  | 'tenant.domain.update'
  | 'tenant.settings.update';

export type ControlPlaneAdminAuditStatus = 'allowed' | 'denied' | 'succeeded' | 'failed';

export interface CreateControlPlaneAdminAuditEventInput {
  action: ControlPlaneAdminAuditAction;
  status: ControlPlaneAdminAuditStatus;
  actorId?: string | null;
  actorRole: string;
  tenantId?: string;
  domainId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ControlPlaneAdminAuditEvent {
  id: string;
  action: ControlPlaneAdminAuditAction;
  status: ControlPlaneAdminAuditStatus;
  actorId: string | null;
  actorRole: string;
  tenantId: string | null;
  domainId: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
