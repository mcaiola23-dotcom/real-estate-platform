import type { CrmActivity, CrmLead } from '@real-estate/types/crm';

/**
 * Calculate elapsed time since lead creation to first activity (agent response time).
 */
export function getLeadResponseTime(lead: CrmLead): number | null {
  // If lead has lastContactAt, that's when the agent first responded
  if (lead.lastContactAt) {
    return new Date(lead.lastContactAt).getTime() - new Date(lead.createdAt).getTime();
  }
  return null;
}

/**
 * Calculate elapsed time since lead was created (for unclaimed leads).
 */
export function getElapsedSinceCreation(lead: CrmLead): number {
  return Date.now() - new Date(lead.createdAt).getTime();
}

/**
 * Get urgency level based on elapsed time.
 * Green: <5 min, Yellow: <15 min, Red: >15 min
 */
export function getSpeedUrgency(elapsedMs: number): 'green' | 'yellow' | 'red' {
  const minutes = elapsedMs / (1000 * 60);
  if (minutes < 5) return 'green';
  if (minutes < 15) return 'yellow';
  return 'red';
}

/**
 * Format elapsed time into a human-readable string (e.g., "2m 30s", "1h 15m").
 */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Aggregate speed-to-lead statistics for the dashboard.
 */
export interface SpeedToLeadStats {
  averageResponseMs: number | null;
  medianResponseMs: number | null;
  unclaimedCount: number;
  respondedWithin5Min: number;
  respondedWithin15Min: number;
  respondedAfter15Min: number;
  totalWithResponse: number;
}

export function getSpeedToLeadStats(
  leads: CrmLead[],
  activities: CrmActivity[]
): SpeedToLeadStats {
  const responseTimes: number[] = [];
  let unclaimedCount = 0;

  // Build a map of first contact activity per lead
  const firstContactByLeadId = new Map<string, string>();
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );
  for (const activity of sortedActivities) {
    if (!activity.leadId) continue;
    if (activity.activityType !== 'note' && activity.activityType !== 'lead_status_changed') continue;
    if (!firstContactByLeadId.has(activity.leadId)) {
      firstContactByLeadId.set(activity.leadId, activity.occurredAt);
    }
  }

  for (const lead of leads) {
    if (lead.status === 'won' || lead.status === 'lost') continue;

    const firstContact = firstContactByLeadId.get(lead.id) ?? lead.lastContactAt;
    if (firstContact) {
      const responseTime = new Date(firstContact).getTime() - new Date(lead.createdAt).getTime();
      if (responseTime >= 0) {
        responseTimes.push(responseTime);
      }
    } else {
      unclaimedCount++;
    }
  }

  if (responseTimes.length === 0) {
    return {
      averageResponseMs: null,
      medianResponseMs: null,
      unclaimedCount,
      respondedWithin5Min: 0,
      respondedWithin15Min: 0,
      respondedAfter15Min: 0,
      totalWithResponse: 0,
    };
  }

  responseTimes.sort((a, b) => a - b);

  const sum = responseTimes.reduce((acc, t) => acc + t, 0);
  const avg = sum / responseTimes.length;
  const mid = Math.floor(responseTimes.length / 2);
  const median = responseTimes.length % 2 === 0
    ? (responseTimes[mid - 1] + responseTimes[mid]) / 2
    : responseTimes[mid];

  const fiveMin = 5 * 60 * 1000;
  const fifteenMin = 15 * 60 * 1000;

  return {
    averageResponseMs: avg,
    medianResponseMs: median,
    unclaimedCount,
    respondedWithin5Min: responseTimes.filter(t => t < fiveMin).length,
    respondedWithin15Min: responseTimes.filter(t => t >= fiveMin && t < fifteenMin).length,
    respondedAfter15Min: responseTimes.filter(t => t >= fifteenMin).length,
    totalWithResponse: responseTimes.length,
  };
}
