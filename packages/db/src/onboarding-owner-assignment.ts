import type { ControlPlaneActorRole, TenantOnboardingOwnerRole } from '@real-estate/types/control-plane';

export function isTenantActorRoleCompatibleWithOnboardingOwnerRole(
  actorRole: ControlPlaneActorRole,
  ownerRole: TenantOnboardingOwnerRole
): boolean {
  if (ownerRole === 'client') {
    return false;
  }
  if (actorRole === 'admin') {
    return true;
  }
  if (ownerRole === 'ops') {
    return actorRole === 'operator' || actorRole === 'support';
  }
  if (ownerRole === 'sales' || ownerRole === 'build') {
    return actorRole === 'operator';
  }
  return false;
}
