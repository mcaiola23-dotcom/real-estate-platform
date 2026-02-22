/**
 * Escalation engine — computes progressive escalation levels for overdue or cold leads.
 *
 * Escalation severity increases with time since the last expected follow-up:
 *   Level 0: on-time (no escalation)
 *   Level 1: amber — 1-3 days overdue
 *   Level 2: red — 4-7 days overdue
 *   Level 3: red banner — 8-14 days overdue
 *   Level 4: persistent alert — 14+ days overdue
 *
 * The engine also computes score decay for overdue leads (used by crm-scoring.ts).
 */

import type { CrmActivity, CrmLead } from '@real-estate/types/crm';

import { getAiConfigForTenant, isAiServiceAvailable } from '../config';
import { callAiCompletion } from '../llm-client';
import type { AiProvenance } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EscalationLevel = 0 | 1 | 2 | 3 | 4;

export type EscalationTrigger =
  | 'overdue_followup'
  | 'no_contact_extended'
  | 'declining_engagement'
  | 'cold_lead_no_action';

export interface EscalationResult {
  leadId: string;
  tenantId: string;
  level: EscalationLevel;
  triggers: EscalationTriggerDetail[];
  scoreDecayPercent: number;
  recommendation: string;
  aiRecommendation: string | null;
  provenance: AiProvenance;
}

export interface EscalationTriggerDetail {
  trigger: EscalationTrigger;
  detail: string;
  daysOverdue: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROMPT_VERSION = 'crm.escalation.v1';

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

// ---------------------------------------------------------------------------
// Core escalation logic
// ---------------------------------------------------------------------------

function computeEscalationLevel(daysOverdue: number): EscalationLevel {
  if (daysOverdue <= 0) return 0;
  if (daysOverdue <= 3) return 1;
  if (daysOverdue <= 7) return 2;
  if (daysOverdue <= 14) return 3;
  return 4;
}

/**
 * Score decay percentage based on days overdue.
 * Returns 0-50 (max 50% score decay for severely overdue leads).
 */
export function computeScoreDecay(daysOverdue: number): number {
  if (daysOverdue <= 0) return 0;
  if (daysOverdue <= 1) return 5;
  if (daysOverdue <= 3) return 10;
  if (daysOverdue <= 7) return 20;
  if (daysOverdue <= 14) return 35;
  return 50;
}

function buildRecommendation(
  level: EscalationLevel,
  triggers: EscalationTriggerDetail[],
): string {
  if (level === 0) return 'Lead is on track — no action needed.';

  const primary = triggers[0];
  if (!primary) return 'Follow up with this lead.';

  switch (level) {
    case 1:
      return `Gentle reminder: ${primary.detail} Consider reaching out today.`;
    case 2:
      return `Action needed: ${primary.detail} This lead needs attention this week.`;
    case 3:
      return `Urgent: ${primary.detail} Risk of losing this lead without immediate contact.`;
    case 4:
      return `Critical: ${primary.detail} This lead may be lost. Prioritize immediate outreach or reassess.`;
    default:
      return 'Follow up with this lead.';
  }
}

function detectTriggers(
  lead: CrmLead,
  activities: CrmActivity[],
): EscalationTriggerDetail[] {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const triggers: EscalationTriggerDetail[] = [];

  // 1. Overdue follow-up
  if (lead.nextActionAt) {
    const nextActionTime = new Date(lead.nextActionAt).getTime();
    if (nextActionTime < now) {
      const daysOverdue = Math.floor((now - nextActionTime) / oneDayMs);
      triggers.push({
        trigger: 'overdue_followup',
        detail: `Follow-up is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue.`,
        daysOverdue,
      });
    }
  }

  // 2. No contact for extended period (14+ days) on active leads
  if (lead.status !== 'won' && lead.status !== 'lost') {
    const lastContactTime = lead.lastContactAt
      ? new Date(lead.lastContactAt).getTime()
      : null;

    if (lastContactTime) {
      const daysSinceContact = (now - lastContactTime) / oneDayMs;
      if (daysSinceContact >= 14) {
        triggers.push({
          trigger: 'no_contact_extended',
          detail: `No agent contact in ${Math.round(daysSinceContact)} days.`,
          daysOverdue: Math.round(daysSinceContact - 14),
        });
      }
    } else {
      // No contact ever recorded
      const leadAge = (now - new Date(lead.createdAt).getTime()) / oneDayMs;
      if (leadAge >= 7) {
        triggers.push({
          trigger: 'no_contact_extended',
          detail: `Lead is ${Math.round(leadAge)} days old with no recorded contact.`,
          daysOverdue: Math.round(leadAge - 7),
        });
      }
    }
  }

  // 3. Declining engagement
  if (activities.length > 0 && lead.status !== 'won' && lead.status !== 'lost') {
    const sorted = [...activities].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
    const lastActivityTime = new Date(sorted[0]!.occurredAt).getTime();
    const daysSinceActivity = (now - lastActivityTime) / oneDayMs;

    if (daysSinceActivity >= 14 && !lead.nextActionAt) {
      triggers.push({
        trigger: 'declining_engagement',
        detail: `No website activity in ${Math.round(daysSinceActivity)} days and no follow-up scheduled.`,
        daysOverdue: Math.round(daysSinceActivity - 14),
      });
    }
  }

  // 4. Cold lead with no planned action
  if (
    lead.status === 'new' &&
    !lead.nextActionAt &&
    activities.length === 0
  ) {
    const leadAge = (now - new Date(lead.createdAt).getTime()) / oneDayMs;
    if (leadAge >= 3) {
      triggers.push({
        trigger: 'cold_lead_no_action',
        detail: `New lead has been idle for ${Math.round(leadAge)} days with no activity or follow-up.`,
        daysOverdue: Math.round(leadAge - 3),
      });
    }
  }

  // Sort by daysOverdue descending
  triggers.sort((a, b) => b.daysOverdue - a.daysOverdue);

  return triggers;
}

// ---------------------------------------------------------------------------
// AI enhancement
// ---------------------------------------------------------------------------

async function enhanceRecommendation(
  tenantId: string,
  lead: CrmLead,
  level: EscalationLevel,
  triggers: EscalationTriggerDetail[],
): Promise<string | null> {
  if (level === 0 || !isAiServiceAvailable()) return null;

  const config = getAiConfigForTenant(tenantId);
  if (!config.enabled) return null;

  const triggerSummary = triggers
    .slice(0, 3)
    .map((t) => `- ${t.detail}`)
    .join('\n');

  const prompt = `You are a real estate CRM assistant. A lead needs escalated attention. Provide a specific, actionable recommendation in 2-3 sentences.

Lead: ${lead.listingAddress || 'Unknown property interest'} (Status: ${lead.status})
Escalation level: ${level}/4
Issues:
${triggerSummary}

Suggest what the agent should do right now, including specific talking points or message approach. Be concise and practical.`;

  const result = await callAiCompletion(tenantId, prompt, {
    maxTokens: 120,
    temperature: 0.6,
  });

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function evaluateEscalation(
  tenantId: string,
  lead: CrmLead,
  activities: CrmActivity[],
): Promise<EscalationResult> {
  const startMs = Date.now();

  const triggers = detectTriggers(lead, activities);

  // Determine overall level from the worst trigger
  const maxDaysOverdue = triggers.length > 0
    ? Math.max(...triggers.map((t) => t.daysOverdue))
    : 0;
  const level = computeEscalationLevel(maxDaysOverdue);
  const scoreDecayPercent = computeScoreDecay(maxDaysOverdue);

  const recommendation = buildRecommendation(level, triggers);
  const aiRecommendation = await enhanceRecommendation(tenantId, lead, level, triggers);

  const config = getAiConfigForTenant(tenantId);

  return {
    leadId: lead.id,
    tenantId,
    level,
    triggers,
    scoreDecayPercent,
    recommendation,
    aiRecommendation,
    provenance: makeProvenance(
      aiRecommendation ? 'ai' : 'rule_engine',
      aiRecommendation ? config.model : null,
      startMs,
    ),
  };
}

/**
 * Batch escalation check — computes escalation level for multiple leads.
 * Used by dashboard to flag overdue/cold leads without full AI enhancement.
 */
export function computeLeadEscalationLevel(lead: CrmLead): {
  level: EscalationLevel;
  daysOverdue: number;
  scoreDecayPercent: number;
} {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  let daysOverdue = 0;

  if (lead.nextActionAt) {
    const nextActionTime = new Date(lead.nextActionAt).getTime();
    if (nextActionTime < now) {
      daysOverdue = Math.floor((now - nextActionTime) / oneDayMs);
    }
  }

  return {
    level: computeEscalationLevel(daysOverdue),
    daysOverdue,
    scoreDecayPercent: computeScoreDecay(daysOverdue),
  };
}
