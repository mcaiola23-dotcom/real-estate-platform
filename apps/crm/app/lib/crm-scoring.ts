import type { CrmActivity, CrmLead } from '@real-estate/types/crm';
import type { LeadListingSignal, LeadSearchSignal } from './crm-types';

/**
 * Compute escalation-based score decay for overdue follow-ups.
 * Returns a percentage (0-50) to subtract from the base score.
 */
function computeOverdueDecay(lead: CrmLead): number {
  if (!lead.nextActionAt) return 0;
  const now = Date.now();
  const nextActionTime = new Date(lead.nextActionAt).getTime();
  if (nextActionTime >= now) return 0;

  const daysOverdue = (now - nextActionTime) / (24 * 60 * 60 * 1000);
  if (daysOverdue <= 1) return 5;
  if (daysOverdue <= 3) return 10;
  if (daysOverdue <= 7) return 20;
  if (daysOverdue <= 14) return 35;
  return 50;
}

export function calculateLeadScore(
  activities: CrmActivity[],
  searchSignals: LeadSearchSignal[],
  listingSignals: LeadListingSignal[],
  lead: CrmLead | null,
): { score: number; label: string; decayApplied: number } {
  if (!lead) {
    return { score: 0, label: 'No Data', decayApplied: 0 };
  }

  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  // Recency (25%): days since last activity
  let recencyScore = 0;
  if (activities.length > 0) {
    const lastActivity = new Date(activities[0]!.occurredAt).getTime();
    const daysSince = (now - lastActivity) / (24 * 60 * 60 * 1000);
    recencyScore = Math.max(0, 100 - daysSince * 3.3); // 0 after ~30 days
  }

  // Frequency (25%): total activities in last 30 days
  const recentActivities = activities.filter(
    (a) => now - new Date(a.occurredAt).getTime() < thirtyDays
  );
  const frequencyScore = Math.min(100, recentActivities.length * 8);

  // Intent (30%): favorites-to-views ratio + search specificity
  const views = listingSignals.filter((s) => s.action === 'viewed').length;
  const favorites = listingSignals.filter((s) => s.action === 'favorited').length;
  const favRatio = views > 0 ? (favorites / views) * 100 : 0;
  const searchSpecificity = searchSignals.length > 0 ? Math.min(100, searchSignals.length * 12) : 0;
  const intentScore = (favRatio * 0.6 + searchSpecificity * 0.4);

  // Profile completeness (20%)
  let profileScore = 0;
  if (lead.listingAddress) profileScore += 30;
  if (lead.propertyType) profileScore += 20;
  if (lead.timeframe) profileScore += 20;
  if (lead.contactId) profileScore += 30;

  const baseTotal = Math.round(
    recencyScore * 0.25 +
    frequencyScore * 0.25 +
    intentScore * 0.30 +
    profileScore * 0.20
  );

  // Apply escalation decay for overdue follow-ups
  const decayPercent = computeOverdueDecay(lead);
  const decayPoints = Math.round(baseTotal * (decayPercent / 100));
  const total = baseTotal - decayPoints;

  const score = Math.max(0, Math.min(100, total));
  const label =
    score >= 80 ? 'Hot' :
      score >= 60 ? 'Warm' :
        score >= 40 ? 'Interested' :
          score >= 20 ? 'Cool' : 'Cold';

  return { score, label, decayApplied: decayPoints };
}
