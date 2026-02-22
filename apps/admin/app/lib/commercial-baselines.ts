import type { ControlPlaneActorPermission, ControlPlaneActorRole } from '@real-estate/types/control-plane';

export interface ControlPlanePlanCommercialBaseline {
  code: string;
  label: string;
  summary: string;
  primaryIcp: string;
  includedFeatureSummary: string;
  setupFeeTargetUsd: number;
  monthlySubscriptionTargetUsd: number;
}

export const CONTROL_PLANE_PLAN_BASELINES: ControlPlanePlanCommercialBaseline[] = [
  {
    code: 'starter',
    label: 'Starter',
    summary: 'Core web + CRM launch package for solo agents.',
    primaryIcp: 'Solo agent launching first premium web + CRM stack',
    includedFeatureSummary: 'crm_pipeline + lead_capture',
    setupFeeTargetUsd: 2500,
    monthlySubscriptionTargetUsd: 399,
  },
  {
    code: 'growth',
    label: 'Growth',
    summary: 'Conversion-focused tier with behavior intelligence and automation.',
    primaryIcp: 'Solo/high-velocity agent optimizing conversion workflows',
    includedFeatureSummary: 'Starter + behavior_intelligence + automation_sequences',
    setupFeeTargetUsd: 4000,
    monthlySubscriptionTargetUsd: 749,
  },
  {
    code: 'pro',
    label: 'Pro',
    summary: 'Advanced automation + domain ops for mature operators/small teams.',
    primaryIcp: 'Mature solo/small team needing advanced automation and domain ops',
    includedFeatureSummary: 'Growth + ai_nba + domain_ops',
    setupFeeTargetUsd: 6500,
    monthlySubscriptionTargetUsd: 1199,
  },
  {
    code: 'team',
    label: 'Team',
    summary: 'Shared operations/governance tier for multi-user teams and boutiques.',
    primaryIcp: 'Multi-user team/boutique brokerage with shared operations',
    includedFeatureSummary: 'Pro + expanded seats/governance',
    setupFeeTargetUsd: 9500,
    monthlySubscriptionTargetUsd: 1899,
  },
];

export const SETUP_PACKAGE_SCOPE_BASELINE: string[] = [
  'Tenant provisioning in Admin (slug, plan, feature flags, actor seed).',
  'Website brand baseline (logo/colors/type tokens, core pages, CTA funnels).',
  'Domain onboarding (attach, DNS guidance, verification, SSL readiness check).',
  'CRM baseline (pipeline, contact fields, lead routing, notification defaults).',
  'Analytics/operations baseline (event capture, audit visibility, first observability snapshot).',
];

export const SETUP_PACKAGE_SLA_TIMELINE_BASELINE: Array<{ label: string; window: string }> = [
  { label: 'Kickoff + intake packet completion', window: 'Day 0-2' },
  { label: 'Initial website + CRM draft delivery', window: 'Day 3-5' },
  { label: 'Revisions + domain onboarding progress checks', window: 'Day 6-10' },
  { label: 'Launch readiness review + go-live', window: 'Day 11-15' },
];

export const SETUP_PACKAGE_SLA_POLICY_NOTES_BASELINE: string[] = [
  'SLA clock pauses when client dependencies are outstanding (DNS access, brand assets, legal approvals).',
  'Each tenant gets up to 2 structured revision rounds inside setup scope.',
  'Net-new modules, custom integrations, or major IA changes require change-order handling.',
];

export interface ManagedServiceBaseline {
  id: string;
  label: string;
  summary: string;
}

export const MANAGED_SERVICE_BASELINES: ManagedServiceBaseline[] = [
  {
    id: 'paid_media_ops',
    label: 'Paid Media Operations',
    summary: 'Campaign build, pacing, lead-quality monitoring, monthly optimization memo.',
  },
  {
    id: 'social_content_ops',
    label: 'Social Content Operations',
    summary: 'Monthly content calendar, post production/publishing, engagement response guidance.',
  },
  {
    id: 'concierge_content_updates',
    label: 'Concierge Content Updates',
    summary: 'Rolling page/copy updates, listing spotlights, local market refreshes.',
  },
];

export const MANAGED_SERVICE_OPERATING_MODEL_BASELINES: string[] = [
  'One operator pod (Account Lead + Specialist) supports roughly 12-20 active tenants.',
  'Cadence: weekly execution review, bi-weekly client update, monthly KPI/roadmap review.',
  'Contract minimum: 3-month initial term for each add-on.',
  'Fulfillment SLA: first response within 1 business day; standard changes within 3 business days.',
];

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface PlanOnboardingChecklistTemplateItem {
  id: string;
  label: string;
  status: 'required' | 'recommended';
  owner: 'sales' | 'ops' | 'build' | 'client';
}

export const PLAN_ONBOARDING_CHECKLIST_TEMPLATES: Record<string, PlanOnboardingChecklistTemplateItem[]> = {
  starter: [
    { id: 'starter-kickoff', label: 'Kickoff + intake packet completed', status: 'required', owner: 'sales' },
    { id: 'starter-brand-assets', label: 'Brand/logo/contact assets received', status: 'required', owner: 'client' },
    { id: 'starter-domain', label: 'Primary domain attached + DNS instructions sent', status: 'required', owner: 'ops' },
    { id: 'starter-web-crm-draft', label: 'Website + CRM baseline draft delivered', status: 'required', owner: 'build' },
    { id: 'starter-launch-review', label: 'Launch readiness review completed', status: 'required', owner: 'ops' },
  ],
  growth: [
    { id: 'growth-kickoff', label: 'Kickoff + intake packet completed', status: 'required', owner: 'sales' },
    { id: 'growth-brand-assets', label: 'Brand/logo/contact assets received', status: 'required', owner: 'client' },
    { id: 'growth-domain', label: 'Primary domain attached + DNS instructions sent', status: 'required', owner: 'ops' },
    { id: 'growth-web-crm-draft', label: 'Website + CRM baseline draft delivered', status: 'required', owner: 'build' },
    { id: 'growth-automation-review', label: 'Automation/behavior intelligence configuration review', status: 'recommended', owner: 'ops' },
    { id: 'growth-launch-review', label: 'Launch readiness review completed', status: 'required', owner: 'ops' },
  ],
  pro: [
    { id: 'pro-kickoff', label: 'Kickoff + intake packet completed', status: 'required', owner: 'sales' },
    { id: 'pro-brand-assets', label: 'Brand/logo/contact assets received', status: 'required', owner: 'client' },
    { id: 'pro-domain', label: 'Primary domain attached + DNS instructions sent', status: 'required', owner: 'ops' },
    { id: 'pro-web-crm-draft', label: 'Website + CRM baseline draft delivered', status: 'required', owner: 'build' },
    { id: 'pro-domain-ops-review', label: 'Domain ops/SSL readiness escalation review', status: 'recommended', owner: 'ops' },
    { id: 'pro-ai-nba-eligibility', label: 'AI/NBA feature readiness reviewed for launch scope', status: 'recommended', owner: 'ops' },
    { id: 'pro-launch-review', label: 'Launch readiness review completed', status: 'required', owner: 'ops' },
  ],
  team: [
    { id: 'team-kickoff', label: 'Kickoff + intake packet completed', status: 'required', owner: 'sales' },
    { id: 'team-brand-assets', label: 'Brand/logo/contact assets received', status: 'required', owner: 'client' },
    { id: 'team-domain', label: 'Primary domain attached + DNS instructions sent', status: 'required', owner: 'ops' },
    { id: 'team-web-crm-draft', label: 'Website + CRM baseline draft delivered', status: 'required', owner: 'build' },
    { id: 'team-actor-seeding', label: 'Team actor roles/support coverage seeded', status: 'required', owner: 'ops' },
    { id: 'team-governance-review', label: 'Governance/feature overrides reviewed with client', status: 'recommended', owner: 'ops' },
    { id: 'team-launch-review', label: 'Launch readiness review completed', status: 'required', owner: 'ops' },
  ],
};

export interface PlanActorSeedPreset {
  id: string;
  label: string;
  actorIdTemplate: string;
  displayName: string;
  emailTemplate: string;
  role: ControlPlaneActorRole;
  permissions?: ControlPlaneActorPermission[];
  recommendedForPlans: string[];
}

export const PLAN_ACTOR_SEED_PRESETS: PlanActorSeedPreset[] = [
  {
    id: 'tenant-admin-owner',
    label: 'Tenant Admin (Primary Operator)',
    actorIdTemplate: 'ops_admin_primary',
    displayName: 'Primary Tenant Admin',
    emailTemplate: 'ops+{tenantSlug}@lunardigital.local',
    role: 'admin',
    recommendedForPlans: ['starter', 'growth', 'pro', 'team'],
  },
  {
    id: 'tenant-support',
    label: 'Support Coverage',
    actorIdTemplate: 'support_primary',
    displayName: 'Support Coverage',
    emailTemplate: 'support+{tenantSlug}@lunardigital.local',
    role: 'support',
    recommendedForPlans: ['growth', 'pro', 'team'],
  },
  {
    id: 'tenant-operator',
    label: 'Ops Specialist',
    actorIdTemplate: 'ops_specialist',
    displayName: 'Ops Specialist',
    emailTemplate: 'ops-specialist+{tenantSlug}@lunardigital.local',
    role: 'operator',
    recommendedForPlans: ['pro', 'team'],
  },
  {
    id: 'tenant-viewer-client',
    label: 'Client Viewer',
    actorIdTemplate: 'client_viewer',
    displayName: 'Client Viewer',
    emailTemplate: 'client+{tenantSlug}@example.com',
    role: 'viewer',
    recommendedForPlans: ['team'],
  },
];
