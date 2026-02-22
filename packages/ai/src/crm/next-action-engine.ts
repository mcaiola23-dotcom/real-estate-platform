/**
 * Next Best Action engine — rule-based patterns with optional AI enhancement.
 *
 * Six rule-based patterns fire deterministically based on lead/activity data.
 * When AI services are available, suggestions are enriched with natural language context.
 * When AI is unavailable, rule-based suggestions are returned as-is.
 */

import type { CrmActivity, CrmLead } from '@real-estate/types/crm';

import { getAiConfigForTenant, isAiServiceAvailable } from '../config';
import { callAiCompletion } from '../llm-client';
import {
  buildNextActionEnhancePrompt,
  PROMPT_VERSIONS,
} from '../prompts/crm-prompts';
import type {
  AiProvenance,
  NextActionPatternId,
  NextActionResult,
  NextActionSuggestion,
  NextActionUrgency,
} from '../types';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makeProvenance(
  source: AiProvenance['source'],
  model: string | null,
  startMs: number,
): AiProvenance {
  return {
    source,
    model,
    promptVersion: PROMPT_VERSIONS.NEXT_ACTION_ENHANCE,
    generatedAt: new Date().toISOString(),
    latencyMs: Date.now() - startMs,
    cached: false,
  };
}

// ---------------------------------------------------------------------------
// Signal extractors (from activities)
// ---------------------------------------------------------------------------

interface LeadSignals {
  daysSinceLastActivity: number | null;
  daysSinceLastContact: number | null;
  recentActivityCount: number;
  weekOverWeekDrop: boolean;
  favoritesByZip: Map<string, number>;
  repeatedListingViews: Map<string, number>;
  priceRangeShifted: boolean;
  isOverdue: boolean;
}

export function extractLeadSignals(
  lead: CrmLead,
  activities: CrmActivity[],
): LeadSignals {
  const now = Date.now();
  const fiveDays = 5 * 24 * 60 * 60 * 1000;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  // Sort activities newest-first
  const sorted = [...activities].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  // Recency
  const lastActivityTime = sorted.length > 0
    ? new Date(sorted[0]!.occurredAt).getTime()
    : null;
  const daysSinceLastActivity = lastActivityTime
    ? (now - lastActivityTime) / (24 * 60 * 60 * 1000)
    : null;

  // Contact recency
  const lastContactTime = lead.lastContactAt
    ? new Date(lead.lastContactAt).getTime()
    : null;
  const daysSinceLastContact = lastContactTime
    ? (now - lastContactTime) / (24 * 60 * 60 * 1000)
    : null;

  // Recent activity count (30 days)
  const recentActivityCount = sorted.filter(
    (a) => now - new Date(a.occurredAt).getTime() < thirtyDays,
  ).length;

  // Week-over-week drop (>50%)
  const thisWeek = sorted.filter(
    (a) => now - new Date(a.occurredAt).getTime() < sevenDays,
  ).length;
  const lastWeek = sorted.filter((a) => {
    const age = now - new Date(a.occurredAt).getTime();
    return age >= sevenDays && age < sevenDays * 2;
  }).length;
  const weekOverWeekDrop = lastWeek > 0 && thisWeek < lastWeek * 0.5;

  // Favorites by zip (from metadata)
  const favoritesByZip = new Map<string, number>();
  const repeatedListingViews = new Map<string, number>();

  for (const activity of sorted) {
    let meta: Record<string, unknown> | null = null;
    if (activity.metadataJson) {
      try {
        meta = JSON.parse(activity.metadataJson) as Record<string, unknown>;
      } catch {
        // skip malformed metadata
      }
    }

    if (activity.activityType === 'listing_favorited' && meta) {
      const zip = (meta.zip as string) || (meta.zipCode as string) || 'unknown';
      favoritesByZip.set(zip, (favoritesByZip.get(zip) ?? 0) + 1);
    }

    if (activity.activityType === 'listing_viewed' && meta) {
      const listingId = (meta.listingId as string) || (meta.url as string) || '';
      if (listingId) {
        repeatedListingViews.set(listingId, (repeatedListingViews.get(listingId) ?? 0) + 1);
      }
    }
  }

  // Price range shift: compare early searches to recent searches
  const priceRangeShifted = detectPriceShift(sorted);

  // Overdue follow-up
  const isOverdue = !!(lead.nextActionAt && new Date(lead.nextActionAt).getTime() < now);

  return {
    daysSinceLastActivity,
    daysSinceLastContact,
    recentActivityCount,
    weekOverWeekDrop,
    favoritesByZip,
    repeatedListingViews,
    priceRangeShifted,
    isOverdue,
  };
}

function detectPriceShift(sortedActivities: CrmActivity[]): boolean {
  const searches = sortedActivities
    .filter((a) => a.activityType === 'search_performed' && a.metadataJson)
    .map((a) => {
      try {
        const meta = JSON.parse(a.metadataJson!) as Record<string, unknown>;
        return { time: new Date(a.occurredAt).getTime(), priceMax: meta.priceMax as number | undefined };
      } catch {
        return null;
      }
    })
    .filter((s): s is { time: number; priceMax: number } => s !== null && typeof s.priceMax === 'number');

  if (searches.length < 2) return false;

  // Compare earliest vs most recent
  const earliest = searches[searches.length - 1]!;
  const latest = searches[0]!;

  return latest.priceMax > earliest.priceMax * 1.15; // 15%+ increase
}

// ---------------------------------------------------------------------------
// Rule-based pattern matching
// ---------------------------------------------------------------------------

interface PatternMatch {
  patternId: NextActionPatternId;
  action: string;
  reason: string;
  urgency: NextActionUrgency;
}

export function evaluatePatterns(
  lead: CrmLead,
  signals: LeadSignals,
): PatternMatch[] {
  const matches: PatternMatch[] = [];

  // 1. Overdue follow-up (highest urgency)
  if (signals.isOverdue) {
    matches.push({
      patternId: 'overdue_followup',
      action: `Overdue: Follow up with ${lead.listingAddress || 'this lead'}`,
      reason: 'Scheduled follow-up date has passed.',
      urgency: 'high',
    });
  }

  // 2. Active browser, no recent contact
  if (
    signals.daysSinceLastActivity !== null &&
    signals.daysSinceLastActivity < 5 &&
    (signals.daysSinceLastContact === null || signals.daysSinceLastContact > 5)
  ) {
    matches.push({
      patternId: 'active_browser_no_contact',
      action: 'Call — lead is actively searching',
      reason: 'Recent website activity detected but no agent contact in 5+ days.',
      urgency: 'high',
    });
  }

  // 3. Multi-favorite same area
  for (const [zip, count] of signals.favoritesByZip) {
    if (count >= 3 && zip !== 'unknown') {
      matches.push({
        patternId: 'multi_favorite_same_area',
        action: `Send curated list for ${zip} area`,
        reason: `${count} favorites in the same zip code — strong area preference.`,
        urgency: 'medium',
      });
      break; // One match per pattern type
    }
  }

  // 4. Declining frequency
  if (signals.weekOverWeekDrop && signals.recentActivityCount > 0) {
    matches.push({
      patternId: 'declining_frequency',
      action: 'Re-engage with market update',
      reason: 'Activity dropped over 50% week-over-week.',
      urgency: 'medium',
    });
  }

  // 5. Price range shift
  if (signals.priceRangeShifted) {
    matches.push({
      patternId: 'price_range_shift',
      action: 'Discuss expanded budget',
      reason: 'Recent searches show 15%+ increase in price ceiling.',
      urgency: 'medium',
    });
  }

  // 6. Repeated listing views
  for (const [listingId, count] of signals.repeatedListingViews) {
    if (count >= 3) {
      matches.push({
        patternId: 'repeated_listing_views',
        action: 'Discuss making an offer on frequently viewed listing',
        reason: `Same listing viewed ${count} times — high interest signal.`,
        urgency: 'medium',
      });
      break; // One match per pattern type
    }
  }

  // Sort by urgency
  const urgencyOrder: Record<NextActionUrgency, number> = { high: 0, medium: 1, low: 2 };
  matches.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return matches;
}

// ---------------------------------------------------------------------------
// AI enhancement layer
// ---------------------------------------------------------------------------

async function enhanceWithAi(
  tenantId: string,
  matches: PatternMatch[],
  lead: CrmLead,
  activities: CrmActivity[],
): Promise<(string | null)[]> {
  if (!isAiServiceAvailable() || matches.length === 0) {
    return matches.map(() => null);
  }

  const config = getAiConfigForTenant(tenantId);
  if (!config.enabled) {
    return matches.map(() => null);
  }

  const recentActivities = activities
    .slice(0, 5)
    .map((a) => a.summary || a.activityType);

  // Enhance top 3 suggestions only (rate limit consideration)
  const results = await Promise.allSettled(
    matches.slice(0, 3).map(async (match) => {
      const prompt = buildNextActionEnhancePrompt({
        action: match.action,
        reason: match.reason,
        contactName: null, // Resolved at route level
        status: lead.status,
        recentActivities,
      });

      const result = await callAiCompletion(tenantId, prompt, {
        maxTokens: 100,
        temperature: 0.6,
      });

      return result;
    }),
  );

  const enhancements: (string | null)[] = [];
  for (let i = 0; i < matches.length; i++) {
    if (i < results.length) {
      const result = results[i]!;
      enhancements.push(result.status === 'fulfilled' ? result.value : null);
    } else {
      enhancements.push(null);
    }
  }

  return enhancements;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function computeNextActions(
  tenantId: string,
  lead: CrmLead,
  activities: CrmActivity[],
): Promise<NextActionResult> {
  const startMs = Date.now();

  const signals = extractLeadSignals(lead, activities);
  const matches = evaluatePatterns(lead, signals);

  // Attempt AI enhancement
  const enhancements = await enhanceWithAi(tenantId, matches, lead, activities);

  const hasAiEnhancement = enhancements.some((e) => e !== null);
  const config = getAiConfigForTenant(tenantId);

  const suggestions: NextActionSuggestion[] = matches.map((match, i) => ({
    patternId: match.patternId,
    action: match.action,
    reason: match.reason,
    urgency: match.urgency,
    aiEnhancedReason: enhancements[i] ?? null,
    provenance: makeProvenance(
      enhancements[i] ? 'ai' : 'rule_engine',
      enhancements[i] ? config.model : null,
      startMs,
    ),
  }));

  return {
    leadId: lead.id,
    tenantId,
    suggestions,
    provenance: makeProvenance(
      hasAiEnhancement ? 'ai' : 'rule_engine',
      hasAiEnhancement ? config.model : null,
      startMs,
    ),
  };
}
