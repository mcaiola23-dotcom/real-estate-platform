import type { TenantContext, TenantWebsiteConfig } from "@real-estate/types";

import { FAIRFIELD_TENANT_WEBSITE_CONFIG, TENANT_WEBSITE_CONFIGS } from "./configs";

type TenantIdentity = Partial<Pick<TenantContext, "tenantId" | "tenantSlug">> | null | undefined;

const TENANT_WEBSITE_CONFIG_BY_ID = new Map<string, TenantWebsiteConfig>(
  TENANT_WEBSITE_CONFIGS.map((entry) => [entry.tenantId, entry])
);
const TENANT_WEBSITE_CONFIG_BY_SLUG = new Map<string, TenantWebsiteConfig>(
  TENANT_WEBSITE_CONFIGS.map((entry) => [entry.tenantSlug, entry])
);

function normalize(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed : undefined;
}

function getConfigByTenantId(tenantId: string | null | undefined): TenantWebsiteConfig | undefined {
  const normalized = normalize(tenantId);
  if (!normalized) {
    return undefined;
  }
  return TENANT_WEBSITE_CONFIG_BY_ID.get(normalized);
}

function getConfigByTenantSlug(tenantSlug: string | null | undefined): TenantWebsiteConfig | undefined {
  const normalized = normalize(tenantSlug);
  if (!normalized) {
    return undefined;
  }
  return TENANT_WEBSITE_CONFIG_BY_SLUG.get(normalized);
}

export function getDefaultTenantWebsiteConfig(): TenantWebsiteConfig {
  return FAIRFIELD_TENANT_WEBSITE_CONFIG;
}

export function getTenantWebsiteConfig(tenantIdentity?: TenantIdentity): TenantWebsiteConfig {
  const explicitTenantId = getConfigByTenantId(tenantIdentity?.tenantId);
  if (explicitTenantId) {
    return explicitTenantId;
  }

  const explicitTenantSlug = getConfigByTenantSlug(tenantIdentity?.tenantSlug);
  if (explicitTenantSlug) {
    return explicitTenantSlug;
  }

  const envTenantId = getConfigByTenantId(process.env.NEXT_PUBLIC_SITE_TENANT_ID);
  if (envTenantId) {
    return envTenantId;
  }

  const envTenantSlug = getConfigByTenantSlug(process.env.NEXT_PUBLIC_SITE_TENANT_SLUG);
  if (envTenantSlug) {
    return envTenantSlug;
  }

  return getDefaultTenantWebsiteConfig();
}

export function formatListingInquirySuccessMessage(
  tenantWebsiteConfig: TenantWebsiteConfig,
  addressStreet: string
): string {
  return tenantWebsiteConfig.content.search.listingInquirySuccessTemplate.replace("{address}", addressStreet);
}
