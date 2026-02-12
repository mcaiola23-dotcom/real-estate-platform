import type { ModuleConfig, WebsiteConfig, WebsiteModuleKey } from '@real-estate/types/website-config';

import { DEFAULT_TENANT_ID, DEFAULT_WEBSITE_MODULE_ORDER } from './seed-data';
import { getPrismaClient } from './prisma-client';

function toIsoString(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString();
}

function toModuleConfigRecord(record: {
  id: string;
  tenantId: string;
  moduleKey: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}): ModuleConfig {
  return {
    id: record.id,
    tenantId: record.tenantId,
    moduleKey: record.moduleKey as WebsiteModuleKey,
    enabled: record.enabled,
    sortOrder: record.sortOrder,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

function buildSeedWebsiteConfig(tenantId: string): WebsiteConfig {
  const timestamp = new Date().toISOString();
  const modules = DEFAULT_WEBSITE_MODULE_ORDER.map((moduleKey, index) =>
    toModuleConfigRecord({
      id: `module_config_${tenantId}_${moduleKey}`,
      tenantId,
      moduleKey,
      enabled: true,
      sortOrder: index,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  );

  return {
    id: `website_config_${tenantId}`,
    tenantId,
    createdAt: timestamp,
    updatedAt: timestamp,
    modules,
  };
}

export async function getWebsiteConfigByTenantId(tenantId: string): Promise<WebsiteConfig> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return buildSeedWebsiteConfig(tenantId || DEFAULT_TENANT_ID);
  }

  try {
    const config = await prisma.websiteConfig.findUnique({
      where: { tenantId },
      include: {
        modules: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!config) {
      return buildSeedWebsiteConfig(tenantId || DEFAULT_TENANT_ID);
    }

    return {
      id: config.id,
      tenantId: config.tenantId,
      createdAt: toIsoString(config.createdAt),
      updatedAt: toIsoString(config.updatedAt),
      modules: config.modules.map(toModuleConfigRecord),
    };
  } catch {
    return buildSeedWebsiteConfig(tenantId || DEFAULT_TENANT_ID);
  }
}

export async function getModuleEnabledMapByTenantId(
  tenantId: string
): Promise<Record<WebsiteModuleKey, boolean>> {
  const config = await getWebsiteConfigByTenantId(tenantId);
  const defaults = DEFAULT_WEBSITE_MODULE_ORDER.reduce<Record<WebsiteModuleKey, boolean>>((result, moduleKey) => {
    result[moduleKey] = true;
    return result;
  }, {} as Record<WebsiteModuleKey, boolean>);

  for (const moduleConfig of config.modules) {
    defaults[moduleConfig.moduleKey] = moduleConfig.enabled;
  }

  return defaults;
}
