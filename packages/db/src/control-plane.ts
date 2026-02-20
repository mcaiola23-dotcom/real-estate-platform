import { randomUUID } from 'node:crypto';

import type {
  AddTenantDomainInput,
  ControlPlaneActorPermission,
  ControlPlaneActorRole,
  ControlPlaneAdminAuditStatus,
  ControlPlaneIngestionStatusCount,
  ControlPlaneMutationTrend,
  ControlPlaneObservabilitySummary,
  ControlPlaneTenantSnapshot,
  CreateTenantProvisioningInput,
  TenantControlActor,
  TenantSupportSessionUpdateInput,
  TenantControlSettings,
  UpdateTenantControlActorInput,
  UpdateTenantControlSettingsInput,
  UpsertTenantControlActorInput,
} from '@real-estate/types/control-plane';
import type { Tenant, TenantDomain } from '@real-estate/types/tenant';

import { getPrismaClient } from './prisma-client';
import { getIngestionRuntimeReadiness } from './crm';
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
  status?: string | null;
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
    status: (record.status as TenantDomain['status']) || 'active',
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
    status: 'active',
    planCode: 'starter',
    featureFlags: [],
    createdAt: now,
    updatedAt: now,
  };
}

function toTenantControlSettings(record: {
  id: string;
  tenantId: string;
  status?: string | null;
  planCode: string;
  featureFlagsJson: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}): TenantControlSettings {
  return {
    id: record.id,
    tenantId: record.tenantId,
    status: (record.status as TenantControlSettings['status']) || 'active',
    planCode: record.planCode,
    featureFlags: parseFeatureFlags(record.featureFlagsJson),
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

const CONTROL_PLANE_ROLE_PERMISSIONS: Record<ControlPlaneActorRole, ControlPlaneActorPermission[]> = {
  admin: [
    'tenant.onboarding.manage',
    'tenant.domain.manage',
    'tenant.settings.manage',
    'tenant.audit.read',
    'tenant.observability.read',
    'tenant.support-session.start',
  ],
  operator: ['tenant.onboarding.manage', 'tenant.domain.manage', 'tenant.settings.manage', 'tenant.audit.read'],
  support: ['tenant.audit.read', 'tenant.observability.read', 'tenant.support-session.start'],
  viewer: ['tenant.audit.read', 'tenant.observability.read'],
};

const VALID_CONTROL_PLANE_ROLES = new Set<ControlPlaneActorRole>(['admin', 'operator', 'support', 'viewer']);
const VALID_CONTROL_PLANE_PERMISSIONS = new Set<ControlPlaneActorPermission>([
  'tenant.onboarding.manage',
  'tenant.domain.manage',
  'tenant.settings.manage',
  'tenant.audit.read',
  'tenant.observability.read',
  'tenant.support-session.start',
]);

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeActorRole(value: string | null | undefined): ControlPlaneActorRole {
  if (!value) {
    return 'viewer';
  }

  const normalized = value.trim().toLowerCase() as ControlPlaneActorRole;
  if (VALID_CONTROL_PLANE_ROLES.has(normalized)) {
    return normalized;
  }

  return 'viewer';
}

function normalizeActorPermissions(
  permissions: Array<string | ControlPlaneActorPermission> | undefined,
  role: ControlPlaneActorRole
): ControlPlaneActorPermission[] {
  const cleaned =
    permissions?.filter((entry): entry is ControlPlaneActorPermission => {
      return typeof entry === 'string' && VALID_CONTROL_PLANE_PERMISSIONS.has(entry as ControlPlaneActorPermission);
    }) ?? [];

  return Array.from(new Set([...CONTROL_PLANE_ROLE_PERMISSIONS[role], ...cleaned]));
}

function parseActorPermissions(value: string | null | undefined): ControlPlaneActorPermission[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeActorPermissions(parsed.filter((entry): entry is string => typeof entry === 'string'), 'viewer');
  } catch {
    return [];
  }
}

function toTenantControlActor(record: {
  id: string;
  tenantId: string;
  actorId: string;
  displayName: string | null;
  email: string | null;
  role: string;
  permissionsJson: string;
  supportSessionActive: boolean;
  supportSessionStartedAt: string | Date | null;
  supportSessionExpiresAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}): TenantControlActor {
  const role = normalizeActorRole(record.role);
  const parsedPermissions = parseActorPermissions(record.permissionsJson);

  return {
    id: record.id,
    tenantId: record.tenantId,
    actorId: record.actorId,
    displayName: record.displayName,
    email: record.email,
    role,
    permissions: normalizeActorPermissions(parsedPermissions, role),
    supportSessionActive: record.supportSessionActive,
    supportSessionStartedAt: record.supportSessionStartedAt ? toIsoString(record.supportSessionStartedAt) : null,
    supportSessionExpiresAt: record.supportSessionExpiresAt ? toIsoString(record.supportSessionExpiresAt) : null,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

function defaultMutationTrends(): ControlPlaneMutationTrend[] {
  return [
    { status: 'allowed', count: 0 },
    { status: 'denied', count: 0 },
    { status: 'succeeded', count: 0 },
    { status: 'failed', count: 0 },
  ];
}

function defaultQueueStatusCounts(): ControlPlaneIngestionStatusCount[] {
  return [
    { status: 'pending', count: 0 },
    { status: 'processing', count: 0 },
    { status: 'processed', count: 0 },
    { status: 'dead_letter', count: 0 },
  ];
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

  const prismaAny = prisma as any;
  const tenants = await prismaAny.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      domains: { orderBy: [{ status: 'asc' }, { isPrimary: 'desc' }, { hostname: 'asc' }] },
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
        status: 'active',
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
        status: 'active',
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
  const prismaAny = prisma as any;

  const hostname = normalizeHostname(input.hostname);
  if (!hostname) {
    throw new Error('Hostname is required.');
  }

  const now = new Date();
  const domainId = `tenant_domain_${tenantId}_${randomUUID().slice(0, 8)}`;

  if (input.isPrimary) {
    await prismaAny.tenantDomain.updateMany({
      where: { tenantId, isPrimary: true },
      data: { isPrimary: false, updatedAt: now },
    });
  }

  const created = await prismaAny.tenantDomain.create({
    data: {
      id: domainId,
      tenantId,
      hostname,
      hostnameNormalized: hostname,
      status: 'active',
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
  input: { status?: TenantDomain['status']; isPrimary?: boolean; isVerified?: boolean }
): Promise<TenantDomain | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Domain management requires Prisma runtime availability.');
  }
  const prismaAny = prisma as any;

  const existing = await prismaAny.tenantDomain.findFirst({ where: { id: domainId, tenantId } });
  if (!existing) {
    return null;
  }

  const nextStatus = input.status ?? ((existing as any).status as TenantDomain['status']) ?? 'active';
  const archiving = nextStatus === 'archived' && existing.status !== 'archived';
  if (archiving && existing.isPrimary) {
    throw new Error('Cannot archive the primary domain. Set another active domain as primary first.');
  }
  if (input.isPrimary && nextStatus !== 'active') {
    throw new Error('Only active domains can be set as primary.');
  }

  const now = new Date();
  if (input.isPrimary) {
    await prismaAny.tenantDomain.updateMany({
      where: { tenantId, isPrimary: true, status: 'active' },
      data: { isPrimary: false, updatedAt: now },
    });
  }

  const updated = await prismaAny.tenantDomain.update({
    where: { id: domainId },
    data: {
      status: nextStatus,
      isPrimary: nextStatus === 'active' ? (input.isPrimary ?? existing.isPrimary) : false,
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
  const prismaAny = prisma as any;

  const settings = await prismaAny.tenantControlSettings.findUnique({ where: { tenantId } });
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
  const prismaAny = prisma as any;

  const now = new Date();
  const existing = await prismaAny.tenantControlSettings.findUnique({ where: { tenantId } });
  const featureFlags =
    input.featureFlags !== undefined
      ? input.featureFlags.map((entry) => entry.trim()).filter((entry) => entry.length > 0)
      : undefined;
  const nextStatus = input.status ?? ((existing?.status as TenantControlSettings['status']) || 'active');

  const next = existing
    ? await prismaAny.tenantControlSettings.update({
        where: { tenantId },
        data: {
          status: nextStatus,
          planCode: input.planCode?.trim() || existing.planCode,
          featureFlagsJson: featureFlags ? JSON.stringify(featureFlags) : existing.featureFlagsJson,
          updatedAt: now,
        },
      })
    : await prismaAny.tenantControlSettings.create({
        data: {
          id: `tenant_control_settings_${tenantId}`,
          tenantId,
          status: nextStatus,
          planCode: input.planCode?.trim() || 'starter',
          featureFlagsJson: JSON.stringify(featureFlags ?? []),
          createdAt: now,
          updatedAt: now,
        },
      });

  return toTenantControlSettings(next);
}

export async function updateTenantLifecycleStatus(
  tenantId: string,
  status: Tenant['status']
): Promise<Tenant | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Tenant lifecycle updates require Prisma runtime availability.');
  }

  const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!existing) {
    return null;
  }

  const now = new Date();
  const updatedTenant = await prisma.$transaction(async (tx: any) => {
    const tenant = await tx.tenant.update({
      where: { id: tenantId },
      data: {
        status,
        updatedAt: now,
      },
    });

    if (status === 'archived' || status === 'active') {
      const relatedStatus = status === 'archived' ? 'archived' : 'active';

      await tx.tenantDomain.updateMany({
        where: { tenantId },
        data: {
          status: relatedStatus,
          updatedAt: now,
        },
      });

      await tx.tenantControlSettings.updateMany({
        where: { tenantId },
        data: {
          status: relatedStatus,
          updatedAt: now,
        },
      });
    }

    return tenant;
  });

  return toTenant(updatedTenant);
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

  const prismaAny = prisma as any;
  const tenantRecord = await prismaAny.tenant.findUnique({
    where: { id: tenantId },
    include: {
      domains: { orderBy: [{ status: 'asc' }, { isPrimary: 'desc' }, { hostname: 'asc' }] },
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

export async function listTenantControlActors(tenantId: string): Promise<TenantControlActor[]> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return [];
  }

  const rows = await prisma.tenantControlActor.findMany({
    where: { tenantId },
    orderBy: [{ role: 'asc' }, { actorId: 'asc' }],
  });

  return rows.map(toTenantControlActor);
}

export async function upsertTenantControlActor(
  tenantId: string,
  input: UpsertTenantControlActorInput
): Promise<TenantControlActor> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Actor management requires Prisma runtime availability.');
  }

  const actorId = normalizeOptionalString(input.actorId);
  if (!actorId) {
    throw new Error('actorId is required.');
  }

  const role = normalizeActorRole(input.role);
  const permissions = normalizeActorPermissions(input.permissions, role);
  const now = new Date();

  const existingTenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });
  if (!existingTenant) {
    throw new Error('Tenant not found.');
  }

  const existingActor = await prisma.tenantControlActor.findUnique({
    where: {
      tenantId_actorId: {
        tenantId,
        actorId,
      },
    },
  });

  const next = existingActor
    ? await prisma.tenantControlActor.update({
        where: { id: existingActor.id },
        data: {
          displayName: normalizeOptionalString(input.displayName),
          email: normalizeOptionalString(input.email),
          role,
          permissionsJson: JSON.stringify(permissions),
          updatedAt: now,
        },
      })
    : await prisma.tenantControlActor.create({
        data: {
          id: `tenant_control_actor_${randomUUID().replace(/-/g, '')}`,
          tenantId,
          actorId,
          displayName: normalizeOptionalString(input.displayName),
          email: normalizeOptionalString(input.email),
          role,
          permissionsJson: JSON.stringify(permissions),
          supportSessionActive: false,
          supportSessionStartedAt: null,
          supportSessionExpiresAt: null,
          createdAt: now,
          updatedAt: now,
        },
      });

  return toTenantControlActor(next);
}

export async function updateTenantControlActor(
  tenantId: string,
  actorId: string,
  input: UpdateTenantControlActorInput
): Promise<TenantControlActor | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Actor management requires Prisma runtime availability.');
  }

  const existing = await prisma.tenantControlActor.findUnique({
    where: {
      tenantId_actorId: {
        tenantId,
        actorId,
      },
    },
  });
  if (!existing) {
    return null;
  }

  const nextRole = input.role ? normalizeActorRole(input.role) : normalizeActorRole(existing.role);
  const existingPermissions = parseActorPermissions(existing.permissionsJson);
  const nextPermissions = normalizeActorPermissions(
    input.permissions ?? existingPermissions,
    nextRole
  );

  const updated = await prisma.tenantControlActor.update({
    where: { id: existing.id },
    data: {
      displayName:
        input.displayName === undefined ? existing.displayName : normalizeOptionalString(input.displayName),
      email: input.email === undefined ? existing.email : normalizeOptionalString(input.email),
      role: nextRole,
      permissionsJson: JSON.stringify(nextPermissions),
      updatedAt: new Date(),
    },
  });

  return toTenantControlActor(updated);
}

export async function removeTenantControlActor(tenantId: string, actorId: string): Promise<boolean> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Actor management requires Prisma runtime availability.');
  }

  const existing = await prisma.tenantControlActor.findUnique({
    where: {
      tenantId_actorId: {
        tenantId,
        actorId,
      },
    },
    select: { id: true },
  });
  if (!existing) {
    return false;
  }

  await prisma.tenantControlActor.delete({ where: { id: existing.id } });
  return true;
}

export async function setTenantSupportSessionState(
  tenantId: string,
  actorId: string,
  input: TenantSupportSessionUpdateInput
): Promise<TenantControlActor | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Support session updates require Prisma runtime availability.');
  }

  const existing = await prisma.tenantControlActor.findUnique({
    where: {
      tenantId_actorId: {
        tenantId,
        actorId,
      },
    },
  });
  if (!existing) {
    return null;
  }

  const now = new Date();
  const durationMinutes = Math.min(Math.max(Math.trunc(input.durationMinutes ?? 30), 10), 240);
  const next = await prisma.tenantControlActor.update({
    where: { id: existing.id },
    data: input.active
      ? {
          supportSessionActive: true,
          supportSessionStartedAt: now,
          supportSessionExpiresAt: new Date(now.getTime() + durationMinutes * 60_000),
          updatedAt: now,
        }
      : {
          supportSessionActive: false,
          supportSessionStartedAt: null,
          supportSessionExpiresAt: null,
          updatedAt: now,
        },
  });

  return toTenantControlActor(next);
}

export async function getControlPlaneObservabilitySummary(
  tenantLimit = 25
): Promise<ControlPlaneObservabilitySummary> {
  const prisma = await getPrismaClient();
  const snapshots = await listTenantSnapshotsForAdmin();
  const runtime = await getIngestionRuntimeReadiness();

  const tenantReadiness = snapshots
    .map((snapshot) => {
      const activeDomains = snapshot.domains.filter((domain) => domain.status === 'active');
      const primaryDomain = activeDomains.find((domain) => domain.isPrimary) ?? null;
      const checks = [
        { label: 'Tenant active', ok: snapshot.tenant.status === 'active' },
        { label: 'Primary domain exists', ok: Boolean(primaryDomain) },
        { label: 'Primary domain verified', ok: Boolean(primaryDomain?.isVerified) },
        { label: 'Settings active', ok: snapshot.settings.status === 'active' },
        {
          label: 'Plan assigned',
          ok: snapshot.settings.status === 'active' && snapshot.settings.planCode.trim().length > 0,
        },
        {
          label: 'Feature flags configured',
          ok: snapshot.settings.status === 'active' && snapshot.settings.featureFlags.length > 0,
        },
      ];

      const completed = checks.filter((entry) => entry.ok).length;
      const score = Math.round((completed / checks.length) * 100);

      return {
        tenantId: snapshot.tenant.id,
        tenantName: snapshot.tenant.name,
        tenantSlug: snapshot.tenant.slug,
        score,
        checks,
      };
    })
    .sort((left, right) => left.score - right.score || left.tenantName.localeCompare(right.tenantName))
    .slice(0, Math.max(1, Math.min(Math.trunc(tenantLimit), 100)));

  const totalDomains = snapshots.reduce((total, snapshot) => total + snapshot.domains.length, 0);
  const verifiedPrimaryDomains = snapshots.reduce((total, snapshot) => {
    const primary = snapshot.domains.find((domain) => domain.status === 'active' && domain.isPrimary) ?? null;
    return total + (primary?.isVerified ? 1 : 0);
  }, 0);
  const averageReadinessScore = Number(
    (
      tenantReadiness.reduce((total, entry) => total + entry.score, 0) /
      Math.max(1, tenantReadiness.length)
    ).toFixed(2)
  );

  let mutationTrends = defaultMutationTrends();
  let queueStatusCounts = defaultQueueStatusCounts();
  let deadLetterCount = 0;

  if (prisma) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const auditRows = await prisma.adminAuditEvent.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        status: true,
      },
    });

    const statusCounts = new Map<ControlPlaneAdminAuditStatus, number>([
      ['allowed', 0],
      ['denied', 0],
      ['succeeded', 0],
      ['failed', 0],
    ]);
    for (const row of auditRows) {
      const status = row.status as ControlPlaneAdminAuditStatus;
      if (!statusCounts.has(status)) {
        continue;
      }
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    }
    mutationTrends = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

    const queueRows = await prisma.ingestionQueueJob.findMany({
      select: {
        status: true,
      },
    });

    const queueCountMap = new Map<ControlPlaneIngestionStatusCount['status'], number>([
      ['pending', 0],
      ['processing', 0],
      ['processed', 0],
      ['dead_letter', 0],
    ]);
    for (const row of queueRows) {
      const status = row.status as ControlPlaneIngestionStatusCount['status'];
      if (!queueCountMap.has(status)) {
        continue;
      }
      queueCountMap.set(status, (queueCountMap.get(status) ?? 0) + 1);
    }
    queueStatusCounts = Array.from(queueCountMap.entries()).map(([status, count]) => ({ status, count }));
    deadLetterCount = queueCountMap.get('dead_letter') ?? 0;
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      tenants: snapshots.length,
      domains: totalDomains,
      verifiedPrimaryDomains,
      averageReadinessScore,
    },
    mutationTrends,
    ingestion: {
      runtimeReady: runtime.ready,
      runtimeReason: runtime.reason,
      runtimeMessage: runtime.message,
      queueStatusCounts,
      deadLetterCount,
    },
    tenantReadiness,
  };
}
