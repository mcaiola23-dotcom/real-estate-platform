export type BillingDriftRemediationMode = 'missing' | 'extra' | 'all';

interface ComputeBillingDriftRemediationInput {
  baselineFlags: string[];
  missingFlags: string[];
  extraFlags: string[];
  mode: BillingDriftRemediationMode;
}

export interface BillingDriftRemediationResult {
  actionable: boolean;
  shouldArmEntitlementSync: boolean;
  nextFlags: string[];
  addedCount: number;
  removedCount: number;
}

function normalizeFlags(flags: string[]): string[] {
  return flags.map((flag) => flag.trim()).filter((flag) => flag.length > 0);
}

export function computeBillingDriftRemediation(
  input: ComputeBillingDriftRemediationInput
): BillingDriftRemediationResult {
  const baselineFlags = normalizeFlags(input.baselineFlags);
  const missingFlags = input.mode === 'extra' ? [] : normalizeFlags(input.missingFlags);
  const extraFlags = input.mode === 'missing' ? [] : normalizeFlags(input.extraFlags);

  if (missingFlags.length === 0 && extraFlags.length === 0) {
    return {
      actionable: false,
      shouldArmEntitlementSync: false,
      nextFlags: Array.from(new Set(baselineFlags)),
      addedCount: 0,
      removedCount: 0,
    };
  }

  const nextFlagSet = new Set(baselineFlags);
  let addedCount = 0;
  let removedCount = 0;

  for (const flag of missingFlags) {
    if (!nextFlagSet.has(flag)) {
      nextFlagSet.add(flag);
      addedCount += 1;
    }
  }

  for (const flag of extraFlags) {
    if (nextFlagSet.delete(flag)) {
      removedCount += 1;
    }
  }

  return {
    actionable: true,
    shouldArmEntitlementSync: true,
    nextFlags: Array.from(nextFlagSet),
    addedCount,
    removedCount,
  };
}
