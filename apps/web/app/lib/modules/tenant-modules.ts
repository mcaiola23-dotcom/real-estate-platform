import { getModuleEnabledMapByTenantId } from '@real-estate/db';
import type { TenantContext, WebsiteModuleKey } from '@real-estate/types';

export async function getTenantModuleToggles(
  tenantContext: Pick<TenantContext, 'tenantId'>
): Promise<Record<WebsiteModuleKey, boolean>> {
  return getModuleEnabledMapByTenantId(tenantContext.tenantId);
}
