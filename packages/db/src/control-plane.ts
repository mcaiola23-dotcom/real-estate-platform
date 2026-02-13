import { randomUUID } from 'node:crypto';

import type {
  AddTenantDomainInput,
  ControlPlaneTenantSnapshot,
  CreateTenantProvisioningInput,
  TenantControlSettings,
  UpdateTenantControlSettingsInput,
} from '@real-estate/types/control-plane';
import type { Tenant, TenantDomain } from '@real-estate/types/tenant';

import { getPrismaClient } from './prisma-client';
import { DEFAULT_WEBSITE_MODULE_ORDER, SEED_TENANT_DOMAINS, SEED_TENANTS } from './seed-data';

function toIsoString(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString();
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase();
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function toTenant(record: {
  id: string;
  slug: string;
  name: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}): Tenant {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    status: (record.status as Tenant['status']) || 'active',
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

function toTenantDomain(record: {
  id: string;
  tenantId: string;
  hostname: string;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}): TenantDomain {
  return {
    id: record.id,
    tenantId: record.tenantId,
    hostname: record.hostname,
    isPrimary: record.isPrimary,
    isVerified: record.isVerified,
    verifiedAt: record.verifiedAt ? toIsoString(record.verifiedAt) : null,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

function parseFeatureFlags(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
  } catch {
    return [];
  }
}

function buildDefaultSettings(tenantId: string): TenantControlSettings {
  const now = new Date().toISOString();
  return {
    id: `tenant_control_settings_${tenantId}`,
    tenantId,
    planCode: 'starter',
    featureFlags: [],
    createdAt: now,
    updatedAt: now,
  };
}

function toTenantControlSettings(record: {
  id: string;
  tenantId: string;
  planCode: string;
  featureFlagsJson: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}): TenantControlSettings {
  return {
    id: record.id,
    tenantId: record.tenantId,
    planCode: record.planCode,
    featureFlags: parseFeatureFlags(record.featureFlagsJson),
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

export async function listTenantSnapshotsForAdmin(): Promise<ControlPlaneTenantSnapshot[]> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return SEED_TENANTS.map((seedTenant) => ({
      tenant: seedTenant,
      domains: SEED_TENANT_DOMAINS.filter((domain) => domain.tenantId === seedTenant.id),
      settings: buildDefaultSettings(seedTenant.id),
    }));
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      domains: { orderBy: [{ isPrimary: 'desc' }, { hostname: 'asc' }] },
      controlSettings: true,
    },
  });

  return tenants.map((tenantRecord: any) => ({
    tenant: toTenant(tenantRecord),
    domains: tenantRecord.domains.map(toTenantDomain),
    settings: tenantRecord.controlSettings
      ? toTenantControlSettings(tenantRecord.controlSettings)
      : buildDefaultSettings(tenantRecord.id),
  }));
}

export async function provisionTenant(input: CreateTenantProvisioningInput): Promise<ControlPlaneTenantSnapshot> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Provisioning requires Prisma runtime availability.');
  }

  const slug = normalizeSlug(input.slug);
  const hostname = normalizeHostname(input.primaryDomain);
  if (!slug || !hostname) {
    throw new Error('Valid slug and primaryDomain are required.');
  }

  const now = new Date();
  const tenantId = `tenant_${slug}`;
  const domainId = `tenant_domain_${slug}_${hostname.replace(/[^a-z0-9]/g, '_')}`;
  const websiteConfigId = `website_config_${tenantId}`;
  const settingsId = `tenant_control_settings_${tenantId}`;
  const featureFlags = (input.featureFlags ?? []).map((entry) => entry.trim()).filter((entry) => entry.length > 0);

  await prisma.$transaction(async (tx: any) => {
    await tx.tenant.create({
      data: {
        id: tenantId,
        slug,
        name: input.name.trim(),
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    });

    await tx.tenantDomain.create({
      data: {
        id: domainId,
        tenantId,
        hostname,
        hostnameNormalized: hostname,
        isPrimary: true,
        isVerified: false,
        verifiedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    });

    await tx.websiteConfig.create({
      data: {
        id: websiteConfigId,
        tenantId,
        createdAt: now,
        updatedAt: now,
        modules: {
          create: DEFAULT_WEBSITE_MODULE_ORDER.map((moduleKey, index) => ({
            id: `module_config_${tenantId}_${moduleKey}`,
            tenantId,
            moduleKey,
            enabled: true,
            sortOrder: index,
            createdAt: now,
            updatedAt: now,
          })),
        },
      },
    });

    await tx.tenantControlSettings.create({
      data: {
        id: settingsId,
        tenantId,
        planCode: input.planCode?.trim() || 'starter',
        featureFlagsJson: JSON.stringify(featureFlags),
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  const snapshot = await getTenantSnapshotForAdmin(tenantId);
  if (!snapshot) {
    throw new Error('Tenant provisioning completed but snapshot lookup failed.');
  }

  return snapshot;
}

export async function addTenantDomain(tenantId: string, input: AddTenantDomainInput): Promise<TenantDomain> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Domain management requires Prisma runtime availability.');
  }

  const hostname = normalizeHostname(input.hostname);
  if (!hostname) {
    throw new Error('Hostname is required.');
  }

  const now = new Date();
  const domainId = `tenant_domain_${tenantId}_${randomUUID().slice(0, 8)}`;

  if (input.isPrimary) {
    await prisma.tenantDomain.updateMany({
      where: { tenantId, isPrimary: true },
      data: { isPrimary: false, updatedAt: now },
    });
  }

  const created = await prisma.tenantDomain.create({
    data: {
      id: domainId,
      tenantId,
      hostname,
      hostnameNormalized: hostname,
      isPrimary: Boolean(input.isPrimary),
      isVerified: Boolean(input.isVerified),
      verifiedAt: input.isVerified ? now : null,
      createdAt: now,
      updatedAt: now,
    },
  });

  return toTenantDomain(created);
}

export async function updateTenantDomainStatus(
  tenantId: string,
  domainId: string,
  input: { isPrimary?: boolean; isVerified?: boolean }
): Promise<TenantDomain | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Domain management requires Prisma runtime availability.');
  }

  const existing = await prisma.tenantDomain.findFirst({ where: { id: domainId, tenantId } });
  if (!existing) {
    return null;
  }

  const now = new Date();
  if (input.isPrimary) {
    await prisma.tenantDomain.updateMany({
      where: { tenantId, isPrimary: true },
      data: { isPrimary: false, updatedAt: now },
    });
  }

  const updated = await prisma.tenantDomain.update({
    where: { id: domainId },
    data: {
      isPrimary: input.isPrimary ?? existing.isPrimary,
      isVerified: input.isVerified ?? existing.isVerified,
      verifiedAt:
        input.isVerified === undefined
          ? existing.verifiedAt
          : input.isVerified
            ? now
            : null,
      updatedAt: now,
    },
  });

  return toTenantDomain(updated);
}

export async function getTenantControlSettings(tenantId: string): Promise<TenantControlSettings> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return buildDefaultSettings(tenantId);
  }

  const settings = await prisma.tenantControlSettings.findUnique({ where: { tenantId } });
  if (!settings) {
    return buildDefaultSettings(tenantId);
  }

  return toTenantControlSettings(settings);
}

export async function updateTenantControlSettings(
  tenantId: string,
  input: UpdateTenantControlSettingsInput
): Promise<TenantControlSettings> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Settings updates require Prisma runtime availability.');
  }

  const now = new Date();
  const existing = await prisma.tenantControlSettings.findUnique({ where: { tenantId } });
  const featureFlags =
    input.featureFlags !== undefined
      ? input.featureFlags.map((entry) => entry.trim()).filter((entry) => entry.length > 0)
      : undefined;

  const next = existing
    ? await prisma.tenantControlSettings.update({
        where: { tenantId },
        data: {
          planCode: input.planCode?.trim() || existing.planCode,
          featureFlagsJson: featureFlags ? JSON.stringify(featureFlags) : existing.featureFlagsJson,
          updatedAt: now,
        },
      })
    : await prisma.tenantControlSettings.create({
        data: {
          id: `tenant_control_settings_${tenantId}`,
          tenantId,
          planCode: input.planCode?.trim() || 'starter',
          featureFlagsJson: JSON.stringify(featureFlags ?? []),
          createdAt: now,
          updatedAt: now,
        },
      });

  return toTenantControlSettings(next);
}

export async function getTenantSnapshotForAdmin(tenantId: string): Promise<ControlPlaneTenantSnapshot | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    const tenant = SEED_TENANTS.find((entry) => entry.id === tenantId) ?? null;
    if (!tenant) {
      return null;
    }
    return {
      tenant,
      domains: SEED_TENANT_DOMAINS.filter((domain) => domain.tenantId === tenantId),
      settings: buildDefaultSettings(tenantId),
    };
  }

  const tenantRecord = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      domains: { orderBy: [{ isPrimary: 'desc' }, { hostname: 'asc' }] },
      controlSettings: true,
    },
  });

  if (!tenantRecord) {
    return null;
  }

  return {
    tenant: toTenant(tenantRecord),
    domains: tenantRecord.domains.map(toTenantDomain),
    settings: tenantRecord.controlSettings
      ? toTenantControlSettings(tenantRecord.controlSettings)
      : buildDefaultSettings(tenantRecord.id),
  };
}
