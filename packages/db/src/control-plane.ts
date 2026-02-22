import { randomUUID } from 'node:crypto';

import type {
  AddTenantDomainInput,
  ControlPlaneActorPermission,
  ControlPlaneActorRole,
  ControlPlaneAdminAuditStatus,
  ControlPlaneBillingDriftModeCounts,
  ControlPlaneBillingDriftSummary,
  ControlPlaneBillingDriftTenantSummary,
  ControlPlaneIngestionStatusCount,
  ControlPlaneMutationTrend,
  ControlPlaneOnboardingObservabilitySummary,
  ControlPlaneOnboardingUsageTelemetryObservabilitySummary,
  ControlPlaneObservabilitySummary,
  TenantBillingEntitlementDriftSummary,
  TenantBillingPaymentStatus,
  TenantBillingProvider,
  TenantBillingProviderEventInput,
  TenantBillingProviderEventResult,
  TenantBillingSubscription,
  TenantBillingSubscriptionStatus,
  TenantOnboardingPlan,
  TenantOnboardingPlanStatus,
  TenantOnboardingPlanTaskSeedInput,
  TenantOnboardingPlanWithTasks,
  TenantOnboardingTask,
  TenantOnboardingTaskPriority,
  TenantOnboardingTaskStatus,
  TenantOnboardingOwnerRole,
  TenantSupportDiagnosticCheck,
  TenantSupportDiagnosticStatus,
  TenantSupportDiagnosticsSummary,
  TenantSupportRemediationAction,
  TenantSupportRemediationResult,
  ControlPlaneTenantSnapshot,
  CreateTenantProvisioningInput,
  TenantControlActor,
  TenantSupportSessionUpdateInput,
  TenantControlSettings,
  UpdateTenantOnboardingPlanInput,
  UpdateTenantOnboardingTaskInput,
  UpdateTenantBillingSubscriptionInput,
  UpdateTenantControlActorInput,
  UpdateTenantControlSettingsInput,
  UpsertTenantControlActorInput,
  CreateTenantOnboardingPlanFromTemplateInput,
} from '@real-estate/types/control-plane';
import type { Tenant, TenantDomain } from '@real-estate/types/tenant';

import { getPrismaClient } from './prisma-client';
import {
  getIngestionRuntimeReadiness,
  listDeadLetterQueueJobs,
  requeueDeadLetterQueueJobs,
  scheduleIngestionQueueJobNow,
} from './crm';
import { DEFAULT_WEBSITE_MODULE_ORDER, SEED_TENANT_DOMAINS, SEED_TENANTS } from './seed-data';
import { isTenantActorRoleCompatibleWithOnboardingOwnerRole } from './onboarding-owner-assignment';

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

function normalizeEntitlementFlags(
  flags: Array<string | null | undefined> | string[] | null | undefined
): string[] {
  if (!Array.isArray(flags)) {
    return [];
  }

  const normalized: string[] = [];
  for (const entry of flags) {
    if (typeof entry !== 'string') {
      continue;
    }
    const trimmed = entry.trim();
    if (trimmed.length > 0) {
      normalized.push(trimmed);
    }
  }

  return Array.from(
    new Set(normalized)
  ).sort((left, right) => left.localeCompare(right));
}

async function getPersistedTenantEntitlementFlags(prismaAny: any, tenantId: string): Promise<string[]> {
  const settings = await prismaAny.tenantControlSettings.findUnique({
    where: { tenantId },
    select: { featureFlagsJson: true },
  });
  return normalizeEntitlementFlags(parseFeatureFlags(settings?.featureFlagsJson));
}

async function buildTenantBillingEntitlementDriftSummary(
  prismaAny: any,
  tenantId: string,
  providerEntitlementFlags: string[] | undefined
): Promise<TenantBillingEntitlementDriftSummary> {
  const evaluatedAt = new Date().toISOString();
  const persistedEntitlementFlags = await getPersistedTenantEntitlementFlags(prismaAny, tenantId);
  const normalizedProviderFlags = normalizeEntitlementFlags(providerEntitlementFlags);

  if (providerEntitlementFlags === undefined) {
    return {
      mode: 'provider_missing',
      evaluatedAt,
      hasDrift: false,
      providerEntitlementFlags: normalizedProviderFlags,
      persistedEntitlementFlags,
      missingInTenantSettings: [],
      extraInTenantSettings: [],
    };
  }

  const persistedSet = new Set(persistedEntitlementFlags);
  const providerSet = new Set(normalizedProviderFlags);
  const missingInTenantSettings = normalizedProviderFlags.filter((flag) => !persistedSet.has(flag));
  const extraInTenantSettings = persistedEntitlementFlags.filter((flag) => !providerSet.has(flag));

  return {
    mode: 'compared',
    evaluatedAt,
    hasDrift: missingInTenantSettings.length > 0 || extraInTenantSettings.length > 0,
    providerEntitlementFlags: normalizedProviderFlags,
    persistedEntitlementFlags,
    missingInTenantSettings,
    extraInTenantSettings,
  };
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

function buildDefaultBillingSubscription(tenantId: string, planCode = 'starter'): TenantBillingSubscription {
  const now = new Date().toISOString();
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `tenant_billing_subscription_${tenantId}`,
    tenantId,
    planCode: planCode.trim() || 'starter',
    status: 'trialing',
    paymentStatus: 'pending',
    billingProvider: 'manual',
    billingCustomerId: null,
    billingSubscriptionId: null,
    trialEndsAt,
    currentPeriodEndsAt: null,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  };
}

function toTenantBillingSubscription(record: {
  id: string;
  tenantId: string;
  planCode: string;
  status: string;
  paymentStatus: string;
  billingProvider: string;
  billingCustomerId: string | null;
  billingSubscriptionId: string | null;
  trialEndsAt: string | Date | null;
  currentPeriodEndsAt: string | Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}): TenantBillingSubscription {
  return {
    id: record.id,
    tenantId: record.tenantId,
    planCode: record.planCode,
    status: normalizeBillingStatus(record.status),
    paymentStatus: normalizeBillingPaymentStatus(record.paymentStatus),
    billingProvider: record.billingProvider,
    billingCustomerId: record.billingCustomerId,
    billingSubscriptionId: record.billingSubscriptionId,
    trialEndsAt: record.trialEndsAt ? toIsoString(record.trialEndsAt) : null,
    currentPeriodEndsAt: record.currentPeriodEndsAt ? toIsoString(record.currentPeriodEndsAt) : null,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd,
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

const VALID_BILLING_SUBSCRIPTION_STATUS = new Set<TenantBillingSubscriptionStatus>([
  'trialing',
  'active',
  'past_due',
  'canceled',
]);
const VALID_BILLING_PAYMENT_STATUS = new Set<TenantBillingPaymentStatus>(['pending', 'paid', 'past_due', 'unpaid']);
const VALID_BILLING_PROVIDERS = new Set<TenantBillingProvider>(['manual', 'stripe']);
const VALID_ONBOARDING_PLAN_STATUSES = new Set<TenantOnboardingPlanStatus>([
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
]);
const VALID_ONBOARDING_TASK_STATUSES = new Set<TenantOnboardingTaskStatus>([
  'pending',
  'in_progress',
  'blocked',
  'done',
  'skipped',
]);
const VALID_ONBOARDING_TASK_PRIORITIES = new Set<TenantOnboardingTaskPriority>([
  'critical',
  'high',
  'normal',
  'low',
]);
const VALID_ONBOARDING_OWNER_ROLES = new Set<TenantOnboardingOwnerRole>(['sales', 'ops', 'build', 'client']);

function normalizeBillingStatus(value: string | null | undefined): TenantBillingSubscriptionStatus {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (VALID_BILLING_SUBSCRIPTION_STATUS.has(normalized as TenantBillingSubscriptionStatus)) {
    return normalized as TenantBillingSubscriptionStatus;
  }
  return 'trialing';
}

function normalizeBillingPaymentStatus(value: string | null | undefined): TenantBillingPaymentStatus {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (VALID_BILLING_PAYMENT_STATUS.has(normalized as TenantBillingPaymentStatus)) {
    return normalized as TenantBillingPaymentStatus;
  }
  return 'pending';
}

function normalizeBillingProvider(value: string | null | undefined): TenantBillingProvider {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (VALID_BILLING_PROVIDERS.has(normalized as TenantBillingProvider)) {
    return normalized as TenantBillingProvider;
  }
  return 'manual';
}

function normalizeOnboardingPlanStatus(value: string | null | undefined): TenantOnboardingPlanStatus {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (VALID_ONBOARDING_PLAN_STATUSES.has(normalized as TenantOnboardingPlanStatus)) {
    return normalized as TenantOnboardingPlanStatus;
  }
  return 'active';
}

function normalizeOnboardingTaskStatus(value: string | null | undefined): TenantOnboardingTaskStatus {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (VALID_ONBOARDING_TASK_STATUSES.has(normalized as TenantOnboardingTaskStatus)) {
    return normalized as TenantOnboardingTaskStatus;
  }
  return 'pending';
}

function normalizeOnboardingTaskPriority(value: string | null | undefined): TenantOnboardingTaskPriority {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (VALID_ONBOARDING_TASK_PRIORITIES.has(normalized as TenantOnboardingTaskPriority)) {
    return normalized as TenantOnboardingTaskPriority;
  }
  return 'normal';
}

function normalizeOnboardingOwnerRole(value: string | null | undefined): TenantOnboardingOwnerRole {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (VALID_ONBOARDING_OWNER_ROLES.has(normalized as TenantOnboardingOwnerRole)) {
    return normalized as TenantOnboardingOwnerRole;
  }
  return 'ops';
}

function parseOptionalIsoDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function deriveOverallDiagnosticStatus(statuses: TenantSupportDiagnosticStatus[]): TenantSupportDiagnosticStatus {
  if (statuses.some((status) => status === 'failed')) {
    return 'failed';
  }
  if (statuses.some((status) => status === 'warning')) {
    return 'warning';
  }
  return 'ok';
}

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

function toTenantOnboardingPlan(record: {
  id: string;
  tenantId: string;
  status: string;
  planCode: string;
  startedAt: string | Date | null;
  targetLaunchDate: string | Date | null;
  completedAt: string | Date | null;
  pausedAt: string | Date | null;
  pauseReason: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}): TenantOnboardingPlan {
  return {
    id: record.id,
    tenantId: record.tenantId,
    status: normalizeOnboardingPlanStatus(record.status),
    planCode: record.planCode,
    startedAt: record.startedAt ? toIsoString(record.startedAt) : null,
    targetLaunchDate: record.targetLaunchDate ? toIsoString(record.targetLaunchDate) : null,
    completedAt: record.completedAt ? toIsoString(record.completedAt) : null,
    pausedAt: record.pausedAt ? toIsoString(record.pausedAt) : null,
    pauseReason: record.pauseReason ?? null,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

function toTenantOnboardingTask(record: {
  id: string;
  tenantOnboardingPlanId: string;
  tenantId: string;
  taskKey: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  required: boolean;
  ownerRole: string;
  ownerActorId: string | null;
  dueAt: string | Date | null;
  blockedByClient: boolean;
  blockerReason: string | null;
  sortOrder: number;
  completedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}): TenantOnboardingTask {
  return {
    id: record.id,
    tenantOnboardingPlanId: record.tenantOnboardingPlanId,
    tenantId: record.tenantId,
    taskKey: record.taskKey,
    title: record.title,
    description: record.description ?? null,
    status: normalizeOnboardingTaskStatus(record.status),
    priority: normalizeOnboardingTaskPriority(record.priority),
    required: Boolean(record.required),
    ownerRole: normalizeOnboardingOwnerRole(record.ownerRole),
    ownerActorId: record.ownerActorId ?? null,
    dueAt: record.dueAt ? toIsoString(record.dueAt) : null,
    blockedByClient: Boolean(record.blockedByClient),
    blockerReason: record.blockerReason ?? null,
    sortOrder: Number(record.sortOrder) || 0,
    completedAt: record.completedAt ? toIsoString(record.completedAt) : null,
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function parseAuditMetadataJson(value: string | null | undefined): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  try {
    return asRecord(JSON.parse(value));
  } catch {
    return null;
  }
}

function getAuditChangeAfterValue(metadata: Record<string, unknown> | null, field: string): unknown {
  const changes = asRecord(metadata?.changes);
  const detail = asRecord(changes?.[field]);
  if (detail && 'after' in detail) {
    return detail.after;
  }

  return changes?.[field];
}

function toBooleanValue(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }

  return null;
}

function toIntegerValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.trunc(parsed));
    }
  }

  return null;
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return [];
    }

    return trimmed
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
}

function defaultBillingDriftModeCounts(): ControlPlaneBillingDriftModeCounts {
  return {
    compared: 0,
    provider_missing: 0,
    tenant_unresolved: 0,
  };
}

function normalizeBillingDriftMode(value: unknown): keyof ControlPlaneBillingDriftModeCounts {
  if (typeof value !== 'string') {
    return 'compared';
  }

  const normalized = value.trim();
  if (normalized === 'provider_missing' || normalized === 'tenant_unresolved') {
    return normalized;
  }

  return 'compared';
}

function buildEmptyBillingDriftSummary(generatedAt: string, windowDays: number): ControlPlaneBillingDriftSummary {
  return {
    windowDays,
    generatedAt,
    totals: {
      driftEvents: 0,
      tenantsWithDrift: 0,
      missingFlagCount: 0,
      extraFlagCount: 0,
      modeCounts: defaultBillingDriftModeCounts(),
    },
    byTenant: [],
  };
}

function buildEmptyOnboardingUsageTelemetrySummary(
  generatedAt: string,
  windowDays: number
): ControlPlaneOnboardingUsageTelemetryObservabilitySummary {
  return {
    windowDays,
    publishCount: 0,
    latestPublishedAt: null,
    totals: {
      recentEventCount: 0,
      publishedEventTypeCount: 0,
      publishedBulkActionTypeCount: 0,
    },
    bulkActionStats: {},
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

    await tx.tenantBillingSubscription.create({
      data: {
        id: `tenant_billing_subscription_${tenantId}`,
        tenantId,
        planCode: input.planCode?.trim() || 'starter',
        status: 'trialing',
        paymentStatus: 'pending',
        billingProvider: 'manual',
        billingCustomerId: null,
        billingSubscriptionId: null,
        trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        currentPeriodEndsAt: null,
        cancelAtPeriodEnd: false,
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

export async function listTenantOnboardingPlansByTenantId(tenantId: string): Promise<TenantOnboardingPlan[]> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return [];
  }
  const prismaAny = prisma as any;

  const rows = await prismaAny.tenantOnboardingPlan.findMany({
    where: { tenantId },
    orderBy: [{ createdAt: 'desc' }],
  });

  return rows.map(toTenantOnboardingPlan);
}

export async function getActiveTenantOnboardingPlanByTenantId(tenantId: string): Promise<TenantOnboardingPlan | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }
  const prismaAny = prisma as any;

  const rows = await prismaAny.tenantOnboardingPlan.findMany({
    where: { tenantId, status: { not: 'archived' } },
    orderBy: [{ createdAt: 'desc' }],
  });
  const preferred =
    rows.find((row: any) => row.status === 'active') ??
    rows.find((row: any) => row.status === 'paused') ??
    rows.find((row: any) => row.status === 'draft') ??
    rows[0] ??
    null;

  return preferred ? toTenantOnboardingPlan(preferred) : null;
}

export async function listTenantOnboardingTasksByPlanId(
  tenantId: string,
  tenantOnboardingPlanId: string
): Promise<TenantOnboardingTask[]> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return [];
  }
  const prismaAny = prisma as any;

  const rows = await prismaAny.tenantOnboardingTask.findMany({
    where: { tenantId, tenantOnboardingPlanId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return rows.map(toTenantOnboardingTask);
}

export async function getActiveTenantOnboardingPlanWithTasks(tenantId: string): Promise<TenantOnboardingPlanWithTasks | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }
  const prismaAny = prisma as any;

  const planRows = await prismaAny.tenantOnboardingPlan.findMany({
    where: { tenantId, status: { not: 'archived' } },
    orderBy: [{ createdAt: 'desc' }],
  });
  const planRow =
    planRows.find((row: any) => row.status === 'active') ??
    planRows.find((row: any) => row.status === 'paused') ??
    planRows.find((row: any) => row.status === 'draft') ??
    planRows[0] ??
    null;
  if (!planRow) {
    return null;
  }

  const taskRows = await prismaAny.tenantOnboardingTask.findMany({
    where: { tenantId, tenantOnboardingPlanId: planRow.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return {
    plan: toTenantOnboardingPlan(planRow),
    tasks: taskRows.map(toTenantOnboardingTask),
  };
}

function normalizeOnboardingTemplateTasks(tasks: TenantOnboardingPlanTaskSeedInput[]): Array<{
  taskKey: string;
  title: string;
  description: string | null;
  required: boolean;
  ownerRole: TenantOnboardingOwnerRole;
  priority: TenantOnboardingTaskPriority;
  sortOrder: number;
  dueAt: Date | null;
}> {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new Error('At least one onboarding task is required to create a plan.');
  }

  const seenTaskKeys = new Set<string>();

  return tasks.map((task, index) => {
    const taskKey = normalizeOptionalString(task.taskKey);
    if (!taskKey) {
      throw new Error(`Task at index ${index} is missing a taskKey.`);
    }
    if (seenTaskKeys.has(taskKey)) {
      throw new Error(`Duplicate onboarding taskKey: ${taskKey}.`);
    }
    seenTaskKeys.add(taskKey);

    const title = normalizeOptionalString(task.title);
    if (!title) {
      throw new Error(`Task ${taskKey} is missing a title.`);
    }

    const parsedDueAt =
      task.dueAt === undefined ? null : task.dueAt === null ? null : parseOptionalIsoDate(task.dueAt);
    if (task.dueAt !== undefined && task.dueAt !== null && !parsedDueAt) {
      throw new Error(`Task ${taskKey} dueAt must be a valid ISO date or null.`);
    }

    return {
      taskKey,
      title,
      description: normalizeOptionalString(task.description ?? null),
      required: Boolean(task.required),
      ownerRole: normalizeOnboardingOwnerRole(task.ownerRole),
      priority: normalizeOnboardingTaskPriority(task.priority),
      sortOrder: Number.isFinite(task.sortOrder as number) ? Math.trunc(task.sortOrder as number) : index,
      dueAt: parsedDueAt,
    };
  });
}

export async function createTenantOnboardingPlanFromTemplate(
  tenantId: string,
  input: CreateTenantOnboardingPlanFromTemplateInput
): Promise<TenantOnboardingPlanWithTasks> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Onboarding task persistence requires Prisma runtime availability.');
  }
  const prismaAny = prisma as any;

  const tenant = await prismaAny.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
  if (!tenant) {
    throw new Error('Tenant not found.');
  }

  const planCode = normalizeOptionalString(input.planCode) ?? 'starter';
  const status = normalizeOnboardingPlanStatus(input.status);
  const startedAtInput = input.startedAt === undefined ? undefined : input.startedAt;
  const startedAt =
    startedAtInput === undefined
      ? status === 'active' || status === 'paused' || status === 'completed'
        ? new Date()
        : null
      : startedAtInput === null
        ? null
        : parseOptionalIsoDate(startedAtInput);
  if (startedAtInput !== undefined && startedAtInput !== null && !startedAt) {
    throw new Error('startedAt must be a valid ISO date or null.');
  }

  const targetLaunchDate =
    input.targetLaunchDate === undefined
      ? null
      : input.targetLaunchDate === null
        ? null
        : parseOptionalIsoDate(input.targetLaunchDate);
  if (input.targetLaunchDate !== undefined && input.targetLaunchDate !== null && !targetLaunchDate) {
    throw new Error('targetLaunchDate must be a valid ISO date or null.');
  }

  const normalizedTasks = normalizeOnboardingTemplateTasks(input.tasks);
  const now = new Date();

  const result = await prisma.$transaction(async (tx: any) => {
    if (status === 'active') {
      const activeExisting = await tx.tenantOnboardingPlan.findFirst({
        where: { tenantId, status: 'active' },
        select: { id: true },
      });
      if (activeExisting) {
        throw new Error('An active onboarding plan already exists for this tenant.');
      }
    }

    const planId = `tenant_onboarding_plan_${tenantId}_${randomUUID().slice(0, 8)}`;
    const planRow = await tx.tenantOnboardingPlan.create({
      data: {
        id: planId,
        tenantId,
        status,
        planCode,
        startedAt,
        targetLaunchDate,
        completedAt: status === 'completed' ? now : null,
        pausedAt: status === 'paused' ? now : null,
        pauseReason: normalizeOptionalString(input.pauseReason),
        createdAt: now,
        updatedAt: now,
      },
    });

    const taskRows: any[] = [];
    for (const [index, task] of normalizedTasks.entries()) {
      const createdTask = await tx.tenantOnboardingTask.create({
        data: {
          id: `tenant_onboarding_task_${planId}_${String(index + 1).padStart(2, '0')}`,
          tenantOnboardingPlanId: planId,
          tenantId,
          taskKey: task.taskKey,
          title: task.title,
          description: task.description,
          status: 'pending',
          priority: task.priority,
          required: task.required,
          ownerRole: task.ownerRole,
          ownerActorId: null,
          dueAt: task.dueAt,
          blockedByClient: false,
          blockerReason: null,
          sortOrder: task.sortOrder,
          completedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      });
      taskRows.push(createdTask);
    }

    return {
      plan: toTenantOnboardingPlan(planRow),
      tasks: taskRows.map(toTenantOnboardingTask),
    } satisfies TenantOnboardingPlanWithTasks;
  });

  return result;
}

export async function updateTenantOnboardingPlan(
  tenantId: string,
  planId: string,
  input: UpdateTenantOnboardingPlanInput
): Promise<TenantOnboardingPlan | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Onboarding task persistence requires Prisma runtime availability.');
  }
  const prismaAny = prisma as any;

  const existing = await prismaAny.tenantOnboardingPlan.findFirst({
    where: { id: planId, tenantId },
  });
  if (!existing) {
    return null;
  }

  const nextStatus = input.status ? normalizeOnboardingPlanStatus(input.status) : normalizeOnboardingPlanStatus(existing.status);
  const parsedTargetLaunchDate =
    input.targetLaunchDate === undefined
      ? existing.targetLaunchDate
      : input.targetLaunchDate === null
        ? null
        : parseOptionalIsoDate(input.targetLaunchDate);
  if (input.targetLaunchDate !== undefined && input.targetLaunchDate !== null && !parsedTargetLaunchDate) {
    throw new Error('targetLaunchDate must be a valid ISO date or null.');
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx: any) => {
    if (nextStatus === 'active') {
      const activeOther = await tx.tenantOnboardingPlan.findFirst({
        where: { tenantId, status: 'active', id: { not: planId } },
        select: { id: true },
      });
      if (activeOther) {
        throw new Error('Another active onboarding plan already exists for this tenant.');
      }
    }

    return tx.tenantOnboardingPlan.update({
      where: { id: planId },
      data: {
        status: nextStatus,
        targetLaunchDate: parsedTargetLaunchDate,
        pauseReason: input.pauseReason === undefined ? existing.pauseReason : normalizeOptionalString(input.pauseReason),
        pausedAt:
          nextStatus === 'paused'
            ? existing.pausedAt ?? now
            : input.status && existing.status === 'paused'
              ? null
              : existing.pausedAt,
        completedAt:
          nextStatus === 'completed'
            ? existing.completedAt ?? now
            : input.status && existing.status === 'completed'
              ? null
              : existing.completedAt,
        startedAt:
          existing.startedAt ?? (nextStatus === 'active' || nextStatus === 'paused' || nextStatus === 'completed' ? now : null),
        updatedAt: now,
      },
    });
  });

  return toTenantOnboardingPlan(updated);
}

export async function updateTenantOnboardingTask(
  tenantId: string,
  taskId: string,
  input: UpdateTenantOnboardingTaskInput
): Promise<TenantOnboardingTask | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Onboarding task persistence requires Prisma runtime availability.');
  }
  const prismaAny = prisma as any;

  const existing = await prismaAny.tenantOnboardingTask.findFirst({
    where: { id: taskId, tenantId },
  });
  if (!existing) {
    return null;
  }

  const nextStatus = input.status ? normalizeOnboardingTaskStatus(input.status) : normalizeOnboardingTaskStatus(existing.status);
  const nextPriority = input.priority
    ? normalizeOnboardingTaskPriority(input.priority)
    : normalizeOnboardingTaskPriority(existing.priority);
  const nextOwnerRole = input.ownerRole
    ? normalizeOnboardingOwnerRole(input.ownerRole)
    : normalizeOnboardingOwnerRole(existing.ownerRole);
  const requestedOwnerActorId =
    input.ownerActorId === undefined ? existing.ownerActorId : normalizeOptionalString(input.ownerActorId);
  const nextOwnerActorId = nextOwnerRole === 'client' ? null : requestedOwnerActorId;
  const shouldValidateOwnerActor = Boolean(nextOwnerActorId) && (input.ownerActorId !== undefined || input.ownerRole !== undefined);
  if (shouldValidateOwnerActor && nextOwnerActorId) {
    const actor = await prismaAny.tenantControlActor.findFirst({
      where: { tenantId, actorId: nextOwnerActorId },
      select: { actorId: true, role: true },
    });
    if (!actor) {
      throw new Error('ownerActorId must reference an existing tenant actor for the tenant.');
    }
    if (!isTenantActorRoleCompatibleWithOnboardingOwnerRole(actor.role as ControlPlaneActorRole, nextOwnerRole)) {
      throw new Error(`Actor role ${String(actor.role)} is not compatible with onboarding owner role ${nextOwnerRole}.`);
    }
  }
  const nextDueAt =
    input.dueAt === undefined ? existing.dueAt : input.dueAt === null ? null : parseOptionalIsoDate(input.dueAt);
  if (input.dueAt !== undefined && input.dueAt !== null && !nextDueAt) {
    throw new Error('dueAt must be a valid ISO date or null.');
  }

  const nextTitle =
    input.title === undefined
      ? existing.title
      : (() => {
          const title = normalizeOptionalString(input.title);
          if (!title) {
            throw new Error('title must not be empty.');
          }
          return title;
        })();

  const now = new Date();
  const updated = await prismaAny.tenantOnboardingTask.update({
    where: { id: taskId },
    data: {
      status: nextStatus,
      priority: nextPriority,
      ownerRole: nextOwnerRole,
      ownerActorId: nextOwnerActorId,
      dueAt: nextDueAt,
      blockedByClient: input.blockedByClient ?? existing.blockedByClient,
      blockerReason:
        input.blockerReason === undefined ? existing.blockerReason : normalizeOptionalString(input.blockerReason),
      title: nextTitle,
      description: input.description === undefined ? existing.description : normalizeOptionalString(input.description),
      completedAt:
        nextStatus === 'done'
          ? existing.completedAt ?? now
          : input.status !== undefined
            ? null
            : existing.completedAt,
      updatedAt: now,
    },
  });

  return toTenantOnboardingTask(updated);
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

export async function getTenantBillingSubscription(tenantId: string): Promise<TenantBillingSubscription> {
  const prisma = await getPrismaClient();
  const settings = await getTenantControlSettings(tenantId);
  if (!prisma) {
    return buildDefaultBillingSubscription(tenantId, settings.planCode);
  }
  const prismaAny = prisma as any;

  const subscription = await prismaAny.tenantBillingSubscription.findUnique({ where: { tenantId } });
  if (!subscription) {
    return buildDefaultBillingSubscription(tenantId, settings.planCode);
  }

  return toTenantBillingSubscription(subscription);
}

export async function updateTenantBillingSubscription(
  tenantId: string,
  input: UpdateTenantBillingSubscriptionInput
): Promise<TenantBillingSubscription> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Billing updates require Prisma runtime availability.');
  }
  const prismaAny = prisma as any;

  const existingTenant = await prismaAny.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });
  if (!existingTenant) {
    throw new Error('Tenant not found.');
  }

  const existing = await prismaAny.tenantBillingSubscription.findUnique({ where: { tenantId } });
  const existingSettings = await prismaAny.tenantControlSettings.findUnique({ where: { tenantId } });
  const now = new Date();

  const normalizedPlanCode =
    typeof input.planCode === 'string' && input.planCode.trim().length > 0
      ? input.planCode.trim()
      : existing?.planCode || existingSettings?.planCode || 'starter';
  const normalizedStatus = input.status ? normalizeBillingStatus(input.status) : normalizeBillingStatus(existing?.status);
  const normalizedPaymentStatus = input.paymentStatus
    ? normalizeBillingPaymentStatus(input.paymentStatus)
    : normalizeBillingPaymentStatus(existing?.paymentStatus);
  const normalizedProvider = input.billingProvider
    ? normalizeBillingProvider(input.billingProvider)
    : normalizeBillingProvider(existing?.billingProvider);

  const parsedTrialEndsAt =
    input.trialEndsAt === undefined
      ? existing?.trialEndsAt ?? null
      : input.trialEndsAt === null
        ? null
        : parseOptionalIsoDate(input.trialEndsAt);
  if (input.trialEndsAt !== undefined && input.trialEndsAt !== null && !parsedTrialEndsAt) {
    throw new Error('trialEndsAt must be a valid ISO date or null.');
  }

  const parsedCurrentPeriodEndsAt =
    input.currentPeriodEndsAt === undefined
      ? existing?.currentPeriodEndsAt ?? null
      : input.currentPeriodEndsAt === null
        ? null
        : parseOptionalIsoDate(input.currentPeriodEndsAt);
  if (input.currentPeriodEndsAt !== undefined && input.currentPeriodEndsAt !== null && !parsedCurrentPeriodEndsAt) {
    throw new Error('currentPeriodEndsAt must be a valid ISO date or null.');
  }

  const normalizedEntitlements =
    input.entitlementFlags !== undefined
      ? input.entitlementFlags.map((entry) => entry.trim()).filter((entry) => entry.length > 0)
      : undefined;

  const next = await prisma.$transaction(async (tx: any) => {
    const subscription = existing
      ? await tx.tenantBillingSubscription.update({
          where: { tenantId },
          data: {
            planCode: normalizedPlanCode,
            status: normalizedStatus,
            paymentStatus: normalizedPaymentStatus,
            billingProvider: normalizedProvider,
            billingCustomerId:
              input.billingCustomerId === undefined
                ? existing.billingCustomerId
                : normalizeOptionalString(input.billingCustomerId),
            billingSubscriptionId:
              input.billingSubscriptionId === undefined
                ? existing.billingSubscriptionId
                : normalizeOptionalString(input.billingSubscriptionId),
            trialEndsAt: parsedTrialEndsAt,
            currentPeriodEndsAt: parsedCurrentPeriodEndsAt,
            cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? existing.cancelAtPeriodEnd,
            updatedAt: now,
          },
        })
      : await tx.tenantBillingSubscription.create({
          data: {
            id: `tenant_billing_subscription_${tenantId}`,
            tenantId,
            planCode: normalizedPlanCode,
            status: normalizedStatus,
            paymentStatus: normalizedPaymentStatus,
            billingProvider: normalizedProvider,
            billingCustomerId: normalizeOptionalString(input.billingCustomerId),
            billingSubscriptionId: normalizeOptionalString(input.billingSubscriptionId),
            trialEndsAt: parsedTrialEndsAt,
            currentPeriodEndsAt: parsedCurrentPeriodEndsAt,
            cancelAtPeriodEnd: Boolean(input.cancelAtPeriodEnd),
            createdAt: now,
            updatedAt: now,
          },
        });

    const shouldSyncPlanCode = typeof input.planCode === 'string' && input.planCode.trim().length > 0;
    const shouldSyncEntitlements = Boolean(input.syncEntitlements);
    if (shouldSyncPlanCode || shouldSyncEntitlements) {
      const settings = await tx.tenantControlSettings.findUnique({ where: { tenantId } });
      const nextFeatureFlags = shouldSyncEntitlements
        ? JSON.stringify(normalizedEntitlements ?? parseFeatureFlags(settings?.featureFlagsJson))
        : settings?.featureFlagsJson ?? '[]';

      if (settings) {
        await tx.tenantControlSettings.update({
          where: { tenantId },
          data: {
            planCode: shouldSyncPlanCode ? normalizedPlanCode : settings.planCode,
            featureFlagsJson: nextFeatureFlags,
            updatedAt: now,
          },
        });
      } else {
        await tx.tenantControlSettings.create({
          data: {
            id: `tenant_control_settings_${tenantId}`,
            tenantId,
            status: 'active',
            planCode: normalizedPlanCode,
            featureFlagsJson: shouldSyncEntitlements ? JSON.stringify(normalizedEntitlements ?? []) : '[]',
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }

    return subscription;
  });

  return toTenantBillingSubscription(next);
}

async function resolveTenantIdForBillingProviderEvent(
  prismaAny: any,
  input: TenantBillingProviderEventInput
): Promise<string | null> {
  const explicitTenantId = normalizeOptionalString(input.tenantId);
  if (explicitTenantId) {
    const tenant = await prismaAny.tenant.findUnique({
      where: { id: explicitTenantId },
      select: { id: true },
    });
    return tenant ? tenant.id : null;
  }

  const billingSubscriptionId = normalizeOptionalString(input.billingSubscriptionId);
  if (billingSubscriptionId) {
    const bySubscriptionId = await prismaAny.tenantBillingSubscription.findFirst({
      where: { billingSubscriptionId },
      select: { tenantId: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (bySubscriptionId?.tenantId) {
      return bySubscriptionId.tenantId;
    }
  }

  const billingCustomerId = normalizeOptionalString(input.billingCustomerId);
  if (billingCustomerId) {
    const byCustomerId = await prismaAny.tenantBillingSubscription.findFirst({
      where: { billingCustomerId },
      select: { tenantId: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (byCustomerId?.tenantId) {
      return byCustomerId.tenantId;
    }
  }

  return null;
}

export async function reconcileTenantBillingProviderEvent(
  input: TenantBillingProviderEventInput
): Promise<TenantBillingProviderEventResult> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    throw new Error('Billing provider reconciliation requires Prisma runtime availability.');
  }

  const eventId = normalizeOptionalString(input.eventId);
  if (!eventId) {
    throw new Error('eventId is required for billing provider reconciliation.');
  }

  const eventType = normalizeOptionalString(input.eventType) ?? 'unknown';
  const provider = normalizeBillingProvider(input.provider);
  const prismaAny = prisma as any;

  const existingEvent = await prismaAny.tenantBillingSyncEvent.findUnique({
    where: {
      provider_eventId: {
        provider,
        eventId,
      },
    },
    select: {
      tenantId: true,
      resultStatus: true,
      resultMessage: true,
    },
  });
  if (existingEvent) {
    const tenantId = typeof existingEvent.tenantId === 'string' ? existingEvent.tenantId : null;
    const entitlementDrift = tenantId
      ? await buildTenantBillingEntitlementDriftSummary(prismaAny, tenantId, input.entitlementFlags)
      : null;
    return {
      provider,
      eventId,
      eventType,
      tenantId,
      duplicate: true,
      applied: existingEvent.resultStatus === 'applied',
      message: existingEvent.resultMessage || 'Provider event was already reconciled.',
      subscription: tenantId ? await getTenantBillingSubscription(tenantId) : null,
      entitlementDrift,
    };
  }

  const tenantId = await resolveTenantIdForBillingProviderEvent(prismaAny, input);
  const now = new Date();
  const payloadJson = JSON.stringify(input);
  if (!tenantId) {
    const message = 'Unable to resolve tenant from billing provider identifiers.';
    await prismaAny.tenantBillingSyncEvent.create({
      data: {
        id: `tenant_billing_sync_event_${randomUUID().replace(/-/g, '')}`,
        tenantId: null,
        provider,
        eventId,
        eventType,
        payloadJson,
        resultStatus: 'ignored',
        resultMessage: message,
        createdAt: now,
        processedAt: now,
      },
    });

    return {
      provider,
      eventId,
      eventType,
      tenantId: null,
      duplicate: false,
      applied: false,
      message,
      subscription: null,
      entitlementDrift: {
        mode: 'tenant_unresolved',
        evaluatedAt: new Date().toISOString(),
        hasDrift: false,
        providerEntitlementFlags: normalizeEntitlementFlags(input.entitlementFlags),
        persistedEntitlementFlags: [],
        missingInTenantSettings: [],
        extraInTenantSettings: [],
      },
    };
  }

  const subscriptionInput = input.subscription ?? {};
  const result = await updateTenantBillingSubscription(tenantId, {
    planCode: subscriptionInput.planCode,
    status: subscriptionInput.status,
    paymentStatus: subscriptionInput.paymentStatus,
    billingProvider: provider,
    billingCustomerId: normalizeOptionalString(input.billingCustomerId),
    billingSubscriptionId: normalizeOptionalString(input.billingSubscriptionId),
    trialEndsAt:
      subscriptionInput.trialEndsAt === undefined ? undefined : subscriptionInput.trialEndsAt,
    currentPeriodEndsAt:
      subscriptionInput.currentPeriodEndsAt === undefined ? undefined : subscriptionInput.currentPeriodEndsAt,
    cancelAtPeriodEnd: subscriptionInput.cancelAtPeriodEnd,
    entitlementFlags: input.entitlementFlags,
    syncEntitlements: input.syncEntitlements,
  });

  const message = 'Billing provider event reconciled.';
  const entitlementDrift = await buildTenantBillingEntitlementDriftSummary(prismaAny, tenantId, input.entitlementFlags);
  await prismaAny.tenantBillingSyncEvent.create({
    data: {
      id: `tenant_billing_sync_event_${randomUUID().replace(/-/g, '')}`,
      tenantId,
      provider,
      eventId,
      eventType,
      payloadJson,
      resultStatus: 'applied',
      resultMessage: message,
      createdAt: now,
      processedAt: now,
    },
  });

  return {
    provider,
    eventId,
    eventType,
    tenantId,
    duplicate: false,
    applied: true,
    message,
    subscription: result,
    entitlementDrift,
  };
}

export async function getTenantSupportDiagnosticsSummary(tenantId: string): Promise<TenantSupportDiagnosticsSummary> {
  const snapshot = await getTenantSnapshotForAdmin(tenantId);
  if (!snapshot) {
    throw new Error('Tenant not found.');
  }

  const runtime = await getIngestionRuntimeReadiness();
  const actors = await listTenantControlActors(tenantId);
  const deadLetterJobs = await listDeadLetterQueueJobs({ tenantId, limit: 200 });
  const prisma = await getPrismaClient();

  let pendingReadyCount = 0;
  if (prisma) {
    pendingReadyCount = await prisma.ingestionQueueJob.count({
      where: {
        tenantId,
        status: 'pending',
        nextAttemptAt: { lte: new Date() },
      },
    });
  }

  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const privilegedActors = actors.filter((actor) => actor.role === 'admin' || actor.role === 'operator');
  const primaryDomain = snapshot.domains.find((domain) => domain.status === 'active' && domain.isPrimary) ?? null;

  const checks: TenantSupportDiagnosticCheck[] = [
    {
      id: 'auth.clerk-key',
      category: 'auth' as const,
      status: hasClerkKey ? 'ok' : 'warning',
      label: 'Auth provider key',
      detail: hasClerkKey
        ? 'Clerk publishable key detected for authenticated admin flows.'
        : 'Clerk publishable key missing. Authenticated admin sign-in is unavailable in this environment.',
      remediation: [],
    },
    {
      id: 'auth.privileged-actor-coverage',
      category: 'auth' as const,
      status: privilegedActors.length > 0 ? 'ok' : 'warning',
      label: 'Privileged actor coverage',
      detail:
        privilegedActors.length > 0
          ? `${privilegedActors.length} admin/operator actor(s) configured for tenant support workflows.`
          : 'No admin/operator actors are configured. Add at least one privileged actor for support remediation ownership.',
      remediation: [],
    },
    {
      id: 'domain.primary-domain',
      category: 'domain' as const,
      status: primaryDomain ? 'ok' : 'failed',
      label: 'Primary domain assigned',
      detail: primaryDomain
        ? `Primary domain is set to ${primaryDomain.hostname}.`
        : 'Tenant has no active primary domain, so launch routing cannot be completed.',
      remediation: [],
    },
    {
      id: 'domain.primary-domain-verified',
      category: 'domain' as const,
      status: !primaryDomain ? 'failed' : primaryDomain.isVerified ? 'ok' : 'warning',
      label: 'Primary domain verification',
      detail: !primaryDomain
        ? 'Primary domain verification cannot run without an active primary domain.'
        : primaryDomain.isVerified
          ? `${primaryDomain.hostname} is marked verified in control-plane persistence.`
          : `${primaryDomain.hostname} is not verified yet.`,
      remediation:
        primaryDomain && !primaryDomain.isVerified
          ? [
              {
                action: 'domain.mark_primary_verified' as const,
                label: 'Mark primary domain verified',
                detail: 'Apply verified state to the current primary domain.',
              },
            ]
          : [],
    },
    {
      id: 'ingestion.runtime',
      category: 'ingestion' as const,
      status: runtime.ready ? 'ok' : 'failed',
      label: 'Ingestion runtime readiness',
      detail: runtime.message,
      remediation: [],
    },
    {
      id: 'ingestion.dead-letter-backlog',
      category: 'ingestion' as const,
      status: deadLetterJobs.length === 0 ? 'ok' : 'warning',
      label: 'Dead-letter backlog',
      detail:
        deadLetterJobs.length === 0
          ? 'No dead-letter queue jobs are awaiting intervention.'
          : `${deadLetterJobs.length} dead-letter job(s) require remediation.`,
      remediation:
        deadLetterJobs.length > 0
          ? [
              {
                action: 'ingestion.requeue_dead_letters' as const,
                label: 'Requeue dead-letter jobs',
                detail: 'Move dead-letter jobs back to pending for retry processing.',
              },
            ]
          : [],
    },
    {
      id: 'ingestion.pending-ready',
      category: 'ingestion' as const,
      status: pendingReadyCount > 0 ? 'warning' : 'ok',
      label: 'Pending ingestion jobs',
      detail:
        pendingReadyCount > 0
          ? `${pendingReadyCount} pending job(s) are ready for immediate processing.`
          : 'No pending ingestion jobs are currently awaiting immediate processing.',
      remediation:
        pendingReadyCount > 0
          ? [
              {
                action: 'ingestion.schedule_pending_now' as const,
                label: 'Schedule next pending job now',
                detail: 'Pull the next pending job forward for immediate worker pickup.',
              },
            ]
          : [],
    },
  ];

  const counts = {
    ok: checks.filter((check) => check.status === 'ok').length,
    warning: checks.filter((check) => check.status === 'warning').length,
    failed: checks.filter((check) => check.status === 'failed').length,
  };
  const overallStatus = deriveOverallDiagnosticStatus(checks.map((check) => check.status));

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    overallStatus,
    counts,
    checks,
  };
}

export async function runTenantSupportRemediationAction(
  tenantId: string,
  action: TenantSupportRemediationAction
): Promise<TenantSupportRemediationResult> {
  if (action === 'domain.mark_primary_verified') {
    const snapshot = await getTenantSnapshotForAdmin(tenantId);
    if (!snapshot) {
      return { action, ok: false, message: 'Tenant not found.' };
    }

    const primaryDomain = snapshot.domains.find((domain) => domain.status === 'active' && domain.isPrimary) ?? null;
    if (!primaryDomain) {
      return { action, ok: false, message: 'No active primary domain is configured for this tenant.' };
    }

    const updated = await updateTenantDomainStatus(tenantId, primaryDomain.id, { isVerified: true });
    if (!updated) {
      return { action, ok: false, message: 'Unable to update primary domain verification state.' };
    }

    return {
      action,
      ok: true,
      message: `Primary domain ${updated.hostname} marked verified.`,
      changedCount: 1,
    };
  }

  if (action === 'ingestion.requeue_dead_letters') {
    const result = await requeueDeadLetterQueueJobs({ tenantId, limit: 200 });
    if (result.requeuedCount === 0) {
      return {
        action,
        ok: false,
        message: 'No dead-letter jobs were requeued (none found or runtime unavailable).',
        changedCount: 0,
      };
    }

    return {
      action,
      ok: true,
      message: `Requeued ${result.requeuedCount} dead-letter job(s).`,
      changedCount: result.requeuedCount,
    };
  }

  if (action === 'ingestion.schedule_pending_now') {
    const prisma = await getPrismaClient();
    if (!prisma) {
      return { action, ok: false, message: 'Prisma runtime unavailable for pending-job scheduling.' };
    }

    const job = await prisma.ingestionQueueJob.findFirst({
      where: {
        tenantId,
        status: 'pending',
      },
      orderBy: {
        nextAttemptAt: 'asc',
      },
      select: { id: true },
    });
    if (!job) {
      return { action, ok: false, message: 'No pending ingestion jobs are available for scheduling.' };
    }

    const scheduled = await scheduleIngestionQueueJobNow(job.id);
    if (!scheduled) {
      return { action, ok: false, message: 'Unable to schedule the next pending ingestion job.' };
    }

    return {
      action,
      ok: true,
      message: 'Next pending ingestion job scheduled for immediate attempt.',
      changedCount: 1,
    };
  }

  return { action, ok: false, message: 'Unsupported remediation action.' };
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
  const safeTenantLimit = Math.max(1, Math.min(Math.trunc(tenantLimit), 100));
  const generatedAt = new Date().toISOString();
  const nowTimestamp = Date.now();
  let onboardingSummary: ControlPlaneOnboardingObservabilitySummary = {
    tenantsWithPersistedPlan: 0,
    activePlans: 0,
    pausedPlans: 0,
    completedPlans: 0,
    blockedRequiredTasks: 0,
    overdueRequiredTasks: 0,
    unassignedRequiredTasks: 0,
  };

  const onboardingCurrentPlanByTenantId = new Map<
    string,
    { id: string; status: TenantOnboardingPlanStatus; createdAt: Date | string }
  >();
  const onboardingTasksByPlanId = new Map<
    string,
    Array<{
      status: string;
      required: boolean;
      dueAt: Date | string | null;
      ownerRole: string;
      ownerActorId: string | null;
    }>
  >();

  if (prisma && snapshots.length > 0) {
    const tenantIds = snapshots.map((snapshot) => snapshot.tenant.id);
    const planRows = await prisma.tenantOnboardingPlan.findMany({
      where: {
        tenantId: { in: tenantIds },
        status: { not: 'archived' },
      },
      select: {
        id: true,
        tenantId: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const choosePreferredPlan = (rows: typeof planRows) =>
      rows.find((row: { status: string }) => row.status === 'active') ??
      rows.find((row: { status: string }) => row.status === 'paused') ??
      rows.find((row: { status: string }) => row.status === 'draft') ??
      rows.find((row: { status: string }) => row.status === 'completed') ??
      rows[0] ??
      null;

    const groupedByTenant = new Map<string, typeof planRows>();
    for (const row of planRows) {
      const list = groupedByTenant.get(row.tenantId) ?? [];
      list.push(row);
      groupedByTenant.set(row.tenantId, list);
    }
    for (const [tenantId, rows] of groupedByTenant.entries()) {
      const selected = choosePreferredPlan(rows);
      if (selected) {
        onboardingCurrentPlanByTenantId.set(tenantId, selected);
      }
    }

    const currentPlanIds = Array.from(onboardingCurrentPlanByTenantId.values()).map((plan) => plan.id);
    if (currentPlanIds.length > 0) {
      const taskRows = await prisma.tenantOnboardingTask.findMany({
        where: {
          tenantOnboardingPlanId: { in: currentPlanIds },
        },
        select: {
          tenantOnboardingPlanId: true,
          status: true,
          required: true,
          dueAt: true,
          ownerRole: true,
          ownerActorId: true,
        },
      });

      for (const row of taskRows) {
        const list = onboardingTasksByPlanId.get(row.tenantOnboardingPlanId) ?? [];
        list.push(row);
        onboardingTasksByPlanId.set(row.tenantOnboardingPlanId, list);
      }
    }

    onboardingSummary.tenantsWithPersistedPlan = onboardingCurrentPlanByTenantId.size;
    for (const plan of onboardingCurrentPlanByTenantId.values()) {
      if (plan.status === 'active') {
        onboardingSummary.activePlans += 1;
      } else if (plan.status === 'paused') {
        onboardingSummary.pausedPlans += 1;
      } else if (plan.status === 'completed') {
        onboardingSummary.completedPlans += 1;
      }

      const tasks = onboardingTasksByPlanId.get(plan.id) ?? [];
      for (const task of tasks) {
        if (!task.required || task.status === 'done' || task.status === 'skipped') {
          continue;
        }
        if (task.status === 'blocked') {
          onboardingSummary.blockedRequiredTasks += 1;
        }
        if (task.dueAt) {
          const dueAtTimestamp = Date.parse(toIsoString(task.dueAt));
          if (Number.isFinite(dueAtTimestamp) && dueAtTimestamp < nowTimestamp) {
            onboardingSummary.overdueRequiredTasks += 1;
          }
        }
        if (task.ownerRole !== 'client' && (!task.ownerActorId || task.ownerActorId.trim().length === 0)) {
          onboardingSummary.unassignedRequiredTasks += 1;
        }
      }
    }
  }

  const tenantReadiness: ControlPlaneObservabilitySummary['tenantReadiness'] = snapshots
    .map((snapshot): ControlPlaneObservabilitySummary['tenantReadiness'][number] => {
      const activeDomains = snapshot.domains.filter((domain) => domain.status === 'active');
      const primaryDomain = activeDomains.find((domain) => domain.isPrimary) ?? null;
      const onboardingPlan = onboardingCurrentPlanByTenantId.get(snapshot.tenant.id) ?? null;
      const onboardingTasks = onboardingPlan ? onboardingTasksByPlanId.get(onboardingPlan.id) ?? [] : [];
      const onboardingPlanStatus: TenantOnboardingPlanStatus | 'none' = onboardingPlan
        ? (onboardingPlan.status as TenantOnboardingPlanStatus)
        : 'none';
      const requiredOnboardingTasks = onboardingTasks.filter((task) => task.required);
      const completedRequiredOnboardingCount = requiredOnboardingTasks.filter((task) => task.status === 'done').length;
      const incompleteRequiredOnboardingCount = requiredOnboardingTasks.filter(
        (task) => task.status !== 'done' && task.status !== 'skipped'
      ).length;
      const blockedRequiredOnboardingCount = requiredOnboardingTasks.filter((task) => task.status === 'blocked').length;
      const overdueRequiredOnboardingCount = requiredOnboardingTasks.filter((task) => {
        if (task.status === 'done' || task.status === 'skipped' || !task.dueAt) {
          return false;
        }
        const dueAtTimestamp = Date.parse(toIsoString(task.dueAt));
        return Number.isFinite(dueAtTimestamp) && dueAtTimestamp < nowTimestamp;
      }).length;
      const unassignedRequiredOnboardingCount = requiredOnboardingTasks.filter((task) => {
        if (task.status === 'done' || task.status === 'skipped') {
          return false;
        }
        return task.ownerRole !== 'client' && (!task.ownerActorId || task.ownerActorId.trim().length === 0);
      }).length;
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
        { label: 'Onboarding plan created', ok: Boolean(onboardingPlan) },
        {
          label: 'Onboarding plan active (not paused)',
          ok: Boolean(onboardingPlan) && onboardingPlan?.status !== 'paused' && onboardingPlan?.status !== 'archived',
        },
        {
          label: 'No blocked required onboarding tasks',
          ok: Boolean(onboardingPlan) && blockedRequiredOnboardingCount === 0,
        },
        {
          label: 'No overdue required onboarding tasks',
          ok: Boolean(onboardingPlan) && overdueRequiredOnboardingCount === 0,
        },
        {
          label: 'Required onboarding tasks assigned',
          ok: Boolean(onboardingPlan) && unassignedRequiredOnboardingCount === 0,
        },
      ];

      const completed = checks.filter((entry) => entry.ok).length;
      const score = Math.round((completed / checks.length) * 100);

      return {
        tenantId: snapshot.tenant.id,
        tenantName: snapshot.tenant.name,
        tenantSlug: snapshot.tenant.slug,
        score,
        onboarding: {
          planStatus: onboardingPlanStatus,
          requiredTaskCount: requiredOnboardingTasks.length,
          completedRequiredTaskCount: completedRequiredOnboardingCount,
          incompleteRequiredTaskCount: incompleteRequiredOnboardingCount,
          blockedRequiredTasks: blockedRequiredOnboardingCount,
          overdueRequiredTasks: overdueRequiredOnboardingCount,
          unassignedRequiredTasks: unassignedRequiredOnboardingCount,
        },
        checks,
      };
    })
    .sort((left, right) => left.score - right.score || left.tenantName.localeCompare(right.tenantName))
    .slice(0, safeTenantLimit);

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
  const billingDriftWindowDays = 7;
  let billingDriftSummary = buildEmptyBillingDriftSummary(generatedAt, billingDriftWindowDays);
  const onboardingUsageTelemetryWindowDays = 14;
  let onboardingUsageTelemetrySummary = buildEmptyOnboardingUsageTelemetrySummary(
    generatedAt,
    onboardingUsageTelemetryWindowDays
  );

  if (prisma) {
    const sevenDaysAgo = new Date(Date.now() - billingDriftWindowDays * 24 * 60 * 60 * 1000);
    const telemetryWindowStart = new Date(Date.now() - onboardingUsageTelemetryWindowDays * 24 * 60 * 60 * 1000);

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

    const driftRows = await prisma.adminAuditEvent.findMany({
      where: {
        action: 'tenant.billing.sync',
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        tenantId: true,
        metadataJson: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const tenantDetailsById = new Map(
      snapshots.map((snapshot) => [
        snapshot.tenant.id,
        { tenantName: snapshot.tenant.name, tenantSlug: snapshot.tenant.slug },
      ])
    );
    const driftByTenant = new Map<string, ControlPlaneBillingDriftTenantSummary>();

    for (const row of driftRows) {
      const metadata = parseAuditMetadataJson(row.metadataJson);
      const driftDetected = toBooleanValue(getAuditChangeAfterValue(metadata, 'entitlementDriftDetected'));
      if (driftDetected !== true) {
        continue;
      }

      const mode = normalizeBillingDriftMode(getAuditChangeAfterValue(metadata, 'entitlementDriftMode'));
      const missingCount =
        toIntegerValue(getAuditChangeAfterValue(metadata, 'entitlementMissingCount')) ??
        toStringList(getAuditChangeAfterValue(metadata, 'entitlementMissingFlags')).length;
      const extraCount =
        toIntegerValue(getAuditChangeAfterValue(metadata, 'entitlementExtraCount')) ??
        toStringList(getAuditChangeAfterValue(metadata, 'entitlementExtraFlags')).length;
      const createdAt = toIsoString(row.createdAt);

      billingDriftSummary.totals.driftEvents += 1;
      billingDriftSummary.totals.missingFlagCount += missingCount;
      billingDriftSummary.totals.extraFlagCount += extraCount;
      billingDriftSummary.totals.modeCounts[mode] += 1;

      const tenantId = typeof row.tenantId === 'string' && row.tenantId.trim().length > 0 ? row.tenantId : null;
      if (!tenantId) {
        continue;
      }

      const tenantDetails = tenantDetailsById.get(tenantId);
      const tenantSummary = driftByTenant.get(tenantId) ?? {
        tenantId,
        tenantName: tenantDetails?.tenantName ?? tenantId,
        tenantSlug: tenantDetails?.tenantSlug ?? 'unknown',
        driftEvents: 0,
        missingFlagCount: 0,
        extraFlagCount: 0,
        modeCounts: defaultBillingDriftModeCounts(),
        latestDriftAt: null,
      };

      tenantSummary.driftEvents += 1;
      tenantSummary.missingFlagCount += missingCount;
      tenantSummary.extraFlagCount += extraCount;
      tenantSummary.modeCounts[mode] += 1;
      if (!tenantSummary.latestDriftAt || createdAt > tenantSummary.latestDriftAt) {
        tenantSummary.latestDriftAt = createdAt;
      }

      driftByTenant.set(tenantId, tenantSummary);
    }

    billingDriftSummary = {
      ...billingDriftSummary,
      totals: {
        ...billingDriftSummary.totals,
        tenantsWithDrift: driftByTenant.size,
      },
      byTenant: Array.from(driftByTenant.values())
        .sort((left, right) => {
          if (right.driftEvents !== left.driftEvents) {
            return right.driftEvents - left.driftEvents;
          }

          const leftLatest = left.latestDriftAt ?? '';
          const rightLatest = right.latestDriftAt ?? '';
          if (rightLatest !== leftLatest) {
            return rightLatest.localeCompare(leftLatest);
          }

          return left.tenantName.localeCompare(right.tenantName);
        })
        .slice(0, safeTenantLimit),
    };

    const telemetryRows = await prisma.adminAuditEvent.findMany({
      where: {
        action: 'tenant.observability.telemetry.publish',
        status: 'succeeded',
        createdAt: {
          gte: telemetryWindowStart,
        },
      },
      select: {
        metadataJson: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    onboardingUsageTelemetrySummary.publishCount = telemetryRows.length;
    for (const row of telemetryRows) {
      const metadata = parseAuditMetadataJson(row.metadataJson);
      const telemetryAggregate =
        metadata &&
        typeof metadata.telemetryAggregate === 'object' &&
        metadata.telemetryAggregate &&
        !Array.isArray(metadata.telemetryAggregate)
          ? (metadata.telemetryAggregate as Record<string, unknown>)
          : null;

      const createdAt = toIsoString(row.createdAt);
      if (!onboardingUsageTelemetrySummary.latestPublishedAt || createdAt > onboardingUsageTelemetrySummary.latestPublishedAt) {
        onboardingUsageTelemetrySummary.latestPublishedAt = createdAt;
      }
      if (!telemetryAggregate) {
        continue;
      }

      onboardingUsageTelemetrySummary.totals.recentEventCount += toIntegerValue(telemetryAggregate.recentEventCount) ?? 0;

      const countsByEvent =
        telemetryAggregate.countsByEvent &&
        typeof telemetryAggregate.countsByEvent === 'object' &&
        !Array.isArray(telemetryAggregate.countsByEvent)
          ? (telemetryAggregate.countsByEvent as Record<string, unknown>)
          : null;
      if (countsByEvent) {
        onboardingUsageTelemetrySummary.totals.publishedEventTypeCount += Object.keys(countsByEvent).length;
      }

      const bulkActionStats =
        telemetryAggregate.bulkActionStats &&
        typeof telemetryAggregate.bulkActionStats === 'object' &&
        !Array.isArray(telemetryAggregate.bulkActionStats)
          ? (telemetryAggregate.bulkActionStats as Record<string, unknown>)
          : null;
      if (!bulkActionStats) {
        continue;
      }

      onboardingUsageTelemetrySummary.totals.publishedBulkActionTypeCount += Object.keys(bulkActionStats).length;
      for (const [actionKey, rawStats] of Object.entries(bulkActionStats)) {
        if (
          actionKey !== 'status' &&
          actionKey !== 'owner_role' &&
          actionKey !== 'owner_actor' &&
          actionKey !== 'owner_role_actor'
        ) {
          continue;
        }

        const statsRecord =
          rawStats && typeof rawStats === 'object' && !Array.isArray(rawStats)
            ? (rawStats as Record<string, unknown>)
            : null;
        if (!statsRecord) {
          continue;
        }

        const current = onboardingUsageTelemetrySummary.bulkActionStats[actionKey] ?? {
          count: 0,
          totalSelectedCount: 0,
          totalEligibleCount: 0,
          totalSuccessCount: 0,
          totalFailureCount: 0,
          totalDurationMs: 0,
        };
        current.count += toIntegerValue(statsRecord.count) ?? 0;
        current.totalSelectedCount += toIntegerValue(statsRecord.totalSelectedCount) ?? 0;
        current.totalEligibleCount += toIntegerValue(statsRecord.totalEligibleCount) ?? 0;
        current.totalSuccessCount += toIntegerValue(statsRecord.totalSuccessCount) ?? 0;
        current.totalFailureCount += toIntegerValue(statsRecord.totalFailureCount) ?? 0;
        current.totalDurationMs += toIntegerValue(statsRecord.totalDurationMs) ?? 0;
        onboardingUsageTelemetrySummary.bulkActionStats[actionKey] = current;
      }
    }
  }

  return {
    generatedAt,
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
    billingDrift: billingDriftSummary,
    onboarding: onboardingSummary,
    onboardingUsageTelemetry: onboardingUsageTelemetrySummary,
    tenantReadiness,
  };
}
