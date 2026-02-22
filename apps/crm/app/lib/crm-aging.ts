/**
 * Pipeline aging threshold calculator.
 * Determines how long a lead has been in its current state.
 */

export type AgingLevel = 'fresh' | 'warm' | 'stale' | 'critical';

interface AgingResult {
  daysInStage: number;
  level: AgingLevel;
  label: string;
}

export function computeLeadAging(updatedAt: string): AgingResult {
  const now = Date.now();
  const updated = new Date(updatedAt).getTime();
  const daysInStage = Math.floor((now - updated) / (1000 * 60 * 60 * 24));

  if (daysInStage >= 30) {
    return { daysInStage, level: 'critical', label: `${daysInStage}d` };
  }
  if (daysInStage >= 14) {
    return { daysInStage, level: 'stale', label: `${daysInStage}d` };
  }
  if (daysInStage >= 7) {
    return { daysInStage, level: 'warm', label: `${daysInStage}d` };
  }
  return { daysInStage, level: 'fresh', label: '' };
}

export function estimateDealValue(priceMin: number | null, priceMax: number | null): number {
  if (priceMin && priceMax) return (priceMin + priceMax) / 2;
  if (priceMax) return priceMax;
  if (priceMin) return priceMin;
  return 0;
}

export function formatDealValue(amount: number): string {
  if (amount === 0) return '';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}

export function formatCommission(amount: number, rate = 0.03): string {
  const commission = amount * rate;
  if (commission === 0) return '';
  if (commission >= 1_000) return `$${Math.round(commission / 1_000)}K`;
  return `$${Math.round(commission)}`;
}
