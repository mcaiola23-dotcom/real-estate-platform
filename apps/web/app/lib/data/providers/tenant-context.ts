import type { TenantContext } from '@real-estate/types';

export type TenantScope = Pick<TenantContext, 'tenantId' | 'tenantSlug' | 'tenantDomain'>;
