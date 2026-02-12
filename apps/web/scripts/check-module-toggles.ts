import { getModuleEnabledMapByTenantId } from '@real-estate/db';

const expectedEnabledModules = [
  'at_a_glance',
  'schools',
  'taxes',
  'walk_score',
  'points_of_interest',
  'listings',
] as const;

async function main(): Promise<void> {
  const moduleMap = await getModuleEnabledMapByTenantId('tenant_fairfield');

  for (const moduleKey of expectedEnabledModules) {
    if (!moduleMap[moduleKey]) {
      throw new Error(`Expected module "${moduleKey}" to be enabled for tenant_fairfield.`);
    }
  }

  console.log('Tenant module toggle checks passed.');
}

void main();
