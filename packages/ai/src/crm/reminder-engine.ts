/**
 * Smart Follow-Up Reminder engine — suggests optimal reminder timing and channel
 * based on lead activity patterns and behavioral signals.
 *
 * Rule-based timing logic fires deterministically; optional AI enhancement
 * adds natural-language context when services are available.
 */

import type { CrmActivity, CrmLead } from '@real-estate/types/crm';

import { getAiConfigForTenant, isAiServiceAvailable } from '../config';
import { callAiCompletion } from '../llm-client';
import { PROMPT_VERSIONS } from '../prompts/crm-prompts';
import type { AiProvenance } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReminderChannel = 'call' | 'email' | 'text' | 'any';
export type ReminderUrgency = 'overdue' | 'today' | 'soon' | 'scheduled';

export interface ReminderSuggestion {
  suggestedAt: string; // ISO-8601 datetime
  channel: ReminderChannel;
  urgency: ReminderUrgency;
  reason: string;
  aiEnhancedReason: string | null;
  snoozeOptions: SnoozeOption[];
  provenance: AiProvenance;
}

export interface SnoozeOption {
  label: string;
  durationMs: number;
}

export interface ReminderResult {
  leadId: string;
  tenantId: string;
  suggestions: ReminderSuggestion[];
  provenance: AiProvenance;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SNOOZE_1_HOUR: SnoozeOption = { label: '1 hour', durationMs: 60 * 60 * 1000 };
const SNOOZE_TOMORROW: SnoozeOption = { label: 'Tomorrow', durationMs: 24 * 60 * 60 * 1000 };
const SNOOZE_NEXT_WEEK: SnoozeOption = { label: 'Next week', durationMs: 7 * 24 * 60 * 60 * 1000 };
const DEFAULT_SNOOZE_OPTIONS = [SNOOZE_1_HOUR, SNOOZE_TOMORROW, SNOOZE_NEXT_WEEK];

const PROMPT_VERSION = 'crm.reminder_suggest.v1';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProvenance(
  source: AiProvenance['source'],
  model: string | null,
  startMs: number,
): AiProvenance {
  return {
    source,
    model,
    promptVersion: PROMPT_VERSION,
    generatedAt: new Date().toISOString(),
    latencyMs: Date.now() - startMs,
    cached: false,
  };
}

function getPreferredChannel(activities: CrmActivity[]): ReminderChannel {
  const channelCounts: Record<string, number> = {};
  for (const a of activities) {
    if (a.activityType === 'call_logged') channelCounts['call'] = (channelCounts['call'] ?? 0) + 1;
    if (a.activityType === 'email_logged') channelCounts['email'] = (channelCounts['email'] ?? 0) + 1;
    if (a.activityType === 'text_logged') channelCounts['text'] = (channelCounts['text'] ?? 0) + 1;
  }

  let max = 0;
  let preferred: ReminderChannel = 'any';
  for (const [channel, count] of Object.entries(channelCounts)) {
    if (count > max) {
      max = count;
      preferred = channel as ReminderChannel;
    }
  }
  return preferred;
}

// ---------------------------------------------------------------------------
// Rule-based suggestion logic
// ---------------------------------------------------------------------------

interface ReminderSignals {
  isOverdue: boolean;
  isDueToday: boolean;
  daysSinceLastContact: number | null;
  daysSinceLastActivity: number | null;
  activityFrequency: number; // activities per week (last 30 days)
  preferredChannel: ReminderChannel;
  isSnoozed: boolean;
  leadStatus: string;
}

function extractReminderSignals(lead: CrmLead, activities: CrmActivity[]): ReminderSignals {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const oneDayMs = 24 * 60 * 60 * 1000;

  const sorted = [...activities].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  const lastActivityTime = sorted.length > 0
    ? new Date(sorted[0]!.occurredAt).getTime()
    : null;
  const daysSinceLastActivity = lastActivityTime
    ? (now - lastActivityTime) / oneDayMs
    : null;

  const lastContactTime = lead.lastContactAt
    ? new Date(lead.lastContactAt).getTime()
    : null;
  const daysSinceLastContact = lastContactTime
    ? (now - lastContactTime) / oneDayMs
    : null;

  const recentActivities = sorted.filter(
    (a) => now - new Date(a.occurredAt).getTime() < thirtyDays,
  );
  const activityFrequency = recentActivities.length / (30 / 7); // per week

  const nextActionTime = lead.nextActionAt ? new Date(lead.nextActionAt).getTime() : null;
  const isOverdue = nextActionTime !== null && nextActionTime < now;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart.getTime() + oneDayMs);
  const isDueToday = nextActionTime !== null && nextActionTime >= todayStart.getTime() && nextActionTime < todayEnd.getTime();

  const snoozedUntil = lead.reminderSnoozedUntil
    ? new Date(lead.reminderSnoozedUntil).getTime()
    : null;
  const isSnoozed = snoozedUntil !== null && snoozedUntil > now;

  return {
    isOverdue,
    isDueToday,
    daysSinceLastContact,
    daysSinceLastActivity,
    activityFrequency,
    preferredChannel: getPreferredChannel(sorted.slice(0, 20)),
    isSnoozed,
    leadStatus: lead.status,
  };
}

function computeSuggestions(
  lead: CrmLead,
  signals: ReminderSignals,
): Array<{ suggestedAt: string; channel: ReminderChannel; urgency: ReminderUrgency; reason: string }> {
  const suggestions: Array<{ suggestedAt: string; channel: ReminderChannel; urgency: ReminderUrgency; reason: string }> = [];
  const now = new Date();

  // Skip suggestions if snoozed
  if (signals.isSnoozed) return suggestions;

  // 1. Overdue follow-up
  if (signals.isOverdue && lead.nextActionAt) {
    suggestions.push({
      suggestedAt: lead.nextActionAt,
      channel: (lead.nextActionChannel as ReminderChannel) || signals.preferredChannel,
      urgency: 'overdue',
      reason: 'Scheduled follow-up is overdue.',
    });
  }

  // 2. Due today
  if (signals.isDueToday && lead.nextActionAt) {
    suggestions.push({
      suggestedAt: lead.nextActionAt,
      channel: (lead.nextActionChannel as ReminderChannel) || signals.preferredChannel,
      urgency: 'today',
      reason: 'Follow-up is scheduled for today.',
    });
  }

  // 3. No contact in 7+ days for active leads
  if (
    !signals.isOverdue &&
    !signals.isDueToday &&
    signals.daysSinceLastContact !== null &&
    signals.daysSinceLastContact >= 7 &&
    signals.leadStatus !== 'won' &&
    signals.leadStatus !== 'lost'
  ) {
    const suggestedTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    suggestions.push({
      suggestedAt: suggestedTime.toISOString(),
      channel: signals.preferredChannel,
      urgency: 'soon',
      reason: `No contact in ${Math.round(signals.daysSinceLastContact)} days — time to reach out.`,
    });
  }

  // 4. Active website browsing but no scheduled follow-up
  if (
    !lead.nextActionAt &&
    signals.daysSinceLastActivity !== null &&
    signals.daysSinceLastActivity < 3 &&
    signals.activityFrequency >= 2 &&
    signals.leadStatus !== 'won' &&
    signals.leadStatus !== 'lost'
  ) {
    const suggestedTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    suggestions.push({
      suggestedAt: suggestedTime.toISOString(),
      channel: 'call',
      urgency: 'soon',
      reason: 'Lead is actively browsing — strike while interest is high.',
    });
  }

  // 5. Declining engagement — schedule re-engagement
  if (
    signals.activityFrequency < 1 &&
    signals.daysSinceLastActivity !== null &&
    signals.daysSinceLastActivity > 7 &&
    signals.daysSinceLastActivity < 30 &&
    !lead.nextActionAt &&
    signals.leadStatus !== 'won' &&
    signals.leadStatus !== 'lost'
  ) {
    const suggestedTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    suggestions.push({
      suggestedAt: suggestedTime.toISOString(),
      channel: 'email',
      urgency: 'scheduled',
      reason: 'Engagement is declining — a re-engagement touchpoint may rekindle interest.',
    });
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// AI enhancement
// ---------------------------------------------------------------------------

async function enhanceWithAi(
  tenantId: string,
  suggestions: Array<{ reason: string; channel: ReminderChannel; urgency: ReminderUrgency }>,
  lead: CrmLead,
): Promise<(string | null)[]> {
  if (!isAiServiceAvailable() || suggestions.length === 0) {
    return suggestions.map(() => null);
  }

  const config = getAiConfigForTenant(tenantId);
  if (!config.enabled) {
    return suggestions.map(() => null);
  }

  const results = await Promise.allSettled(
    suggestions.slice(0, 2).map(async (s) => {
      const prompt = `You are a real estate CRM assistant. Enhance this follow-up reminder suggestion with personalized context in 1-2 sentences.

Reminder: ${s.reason}
Channel: ${s.channel}
Urgency: ${s.urgency}
Lead status: ${lead.status}
Property interest: ${lead.listingAddress || 'Not specified'}

Write a brief, actionable enhancement that helps the agent prepare for the contact. Do not repeat the original reason.`;

      const result = await callAiCompletion(tenantId, prompt, {
        maxTokens: 80,
        temperature: 0.6,
      });
      return result;
    }),
  );

  const enhancements: (string | null)[] = [];
  for (let i = 0; i < suggestions.length; i++) {
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

export async function computeSmartReminders(
  tenantId: string,
  lead: CrmLead,
  activities: CrmActivity[],
): Promise<ReminderResult> {
  const startMs = Date.now();

  const signals = extractReminderSignals(lead, activities);
  const rawSuggestions = computeSuggestions(lead, signals);

  const enhancements = await enhanceWithAi(tenantId, rawSuggestions, lead);

  const hasAi = enhancements.some((e) => e !== null);
  const config = getAiConfigForTenant(tenantId);

  const suggestions: ReminderSuggestion[] = rawSuggestions.map((s, i) => ({
    suggestedAt: s.suggestedAt,
    channel: s.channel,
    urgency: s.urgency,
    reason: s.reason,
    aiEnhancedReason: enhancements[i] ?? null,
    snoozeOptions: DEFAULT_SNOOZE_OPTIONS,
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
      hasAi ? 'ai' : 'rule_engine',
      hasAi ? config.model : null,
      startMs,
    ),
  };
}
