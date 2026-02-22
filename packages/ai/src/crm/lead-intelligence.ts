/**
 * Lead intelligence orchestration — score explanation and lead summary generation.
 *
 * Provides AI-enhanced explanations with deterministic fallbacks.
 */

import type { CrmActivity, CrmLead } from '@real-estate/types/crm';

import { getAiConfigForTenant, isAiServiceAvailable } from '../config';
import { callAiCompletion } from '../llm-client';
import {
  buildLeadSummaryFallback,
  buildLeadSummaryPrompt,
  buildScoreExplainFallback,
  buildScoreExplainPrompt,
  PROMPT_VERSIONS,
  type LeadSummaryContext,
  type ScoreExplainContext,
} from '../prompts/crm-prompts';
import type {
  AiProvenance,
  LeadScoreExplanation,
  LeadSummary,
  ScoreBreakdown,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProvenance(
  source: AiProvenance['source'],
  model: string | null,
  promptVersion: string,
  startMs: number,
): AiProvenance {
  return {
    source,
    model,
    promptVersion,
    generatedAt: new Date().toISOString(),
    latencyMs: Date.now() - startMs,
    cached: false,
  };
}

// ---------------------------------------------------------------------------
// Score Explanation
// ---------------------------------------------------------------------------

export interface ScoreInput {
  score: number;
  label: string;
  activities: CrmActivity[];
  lead: CrmLead;
  favoriteCount: number;
  viewCount: number;
}

export function buildScoreContext(input: ScoreInput): ScoreExplainContext {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  const sorted = [...input.activities].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  const lastActivityTime = sorted.length > 0
    ? new Date(sorted[0]!.occurredAt).getTime()
    : null;
  const daysSinceLastActivity = lastActivityTime
    ? (now - lastActivityTime) / (24 * 60 * 60 * 1000)
    : null;

  const recentActivityCount = sorted.filter(
    (a) => now - new Date(a.occurredAt).getTime() < thirtyDays,
  ).length;

  // Recompute sub-scores (matching crm-scoring.ts logic)
  let recencyScore = 0;
  if (daysSinceLastActivity !== null) {
    recencyScore = Math.max(0, 100 - daysSinceLastActivity * 3.3);
  }

  const frequencyScore = Math.min(100, recentActivityCount * 8);

  const views = input.viewCount;
  const favorites = input.favoriteCount;
  const favRatio = views > 0 ? (favorites / views) * 100 : 0;
  const searchSpecificity = sorted.filter((a) => a.activityType === 'search_performed').length;
  const intentScore = favRatio * 0.6 + Math.min(100, searchSpecificity * 12) * 0.4;

  let profileScore = 0;
  if (input.lead.listingAddress) profileScore += 30;
  if (input.lead.propertyType) profileScore += 20;
  if (input.lead.timeframe) profileScore += 20;
  if (input.lead.contactId) profileScore += 30;

  return {
    score: input.score,
    label: input.label,
    recencyScore,
    frequencyScore,
    intentScore,
    profileScore,
    recentActivityCount,
    daysSinceLastActivity,
    favoriteCount: favorites,
    viewCount: views,
    hasContact: !!input.lead.contactId,
    hasAddress: !!input.lead.listingAddress,
    hasTimeframe: !!input.lead.timeframe,
  };
}

export async function explainLeadScore(
  tenantId: string,
  input: ScoreInput,
): Promise<LeadScoreExplanation> {
  const startMs = Date.now();
  const ctx = buildScoreContext(input);

  const breakdown: ScoreBreakdown[] = [
    { factor: 'Recency', weight: 0.25, rawScore: ctx.recencyScore, weightedScore: ctx.recencyScore * 0.25, detail: ctx.daysSinceLastActivity !== null ? `${Math.round(ctx.daysSinceLastActivity)}d since last activity` : 'No activity' },
    { factor: 'Frequency', weight: 0.25, rawScore: ctx.frequencyScore, weightedScore: ctx.frequencyScore * 0.25, detail: `${ctx.recentActivityCount} activities in 30d` },
    { factor: 'Intent', weight: 0.30, rawScore: ctx.intentScore, weightedScore: ctx.intentScore * 0.30, detail: `${ctx.favoriteCount} favorites, ${ctx.viewCount} views` },
    { factor: 'Profile', weight: 0.20, rawScore: ctx.profileScore, weightedScore: ctx.profileScore * 0.20, detail: `Contact: ${ctx.hasContact ? 'yes' : 'no'}, address: ${ctx.hasAddress ? 'yes' : 'no'}` },
  ];

  let naturalLanguage: string | null = null;

  if (isAiServiceAvailable()) {
    const config = getAiConfigForTenant(tenantId);
    if (config.enabled) {
      const prompt = buildScoreExplainPrompt(ctx);
      naturalLanguage = await callAiCompletion(tenantId, prompt, {
        maxTokens: 150,
        temperature: 0.5,
      });
    }
  }

  // Fallback
  if (!naturalLanguage) {
    naturalLanguage = buildScoreExplainFallback(ctx);
  }

  return {
    leadId: input.lead.id,
    tenantId,
    score: input.score,
    label: input.label,
    breakdown,
    naturalLanguage,
    provenance: makeProvenance(
      isAiServiceAvailable() && naturalLanguage !== buildScoreExplainFallback(ctx) ? 'ai' : 'fallback',
      isAiServiceAvailable() ? getAiConfigForTenant(tenantId).model : null,
      PROMPT_VERSIONS.LEAD_SCORE_EXPLAIN,
      startMs,
    ),
  };
}

// ---------------------------------------------------------------------------
// Lead Summary
// ---------------------------------------------------------------------------

export interface SummaryInput {
  lead: CrmLead;
  contactName: string | null;
  activities: CrmActivity[];
  favoriteCount: number;
  searchCount: number;
}

function formatPriceRange(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} — ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export async function generateLeadSummary(
  tenantId: string,
  input: SummaryInput,
): Promise<LeadSummary> {
  const startMs = Date.now();

  const now = Date.now();
  const daysSinceCreated = Math.floor(
    (now - new Date(input.lead.createdAt).getTime()) / (24 * 60 * 60 * 1000),
  );

  let tags: string[] = [];
  if (input.lead.tags) {
    tags = Array.isArray(input.lead.tags) ? input.lead.tags : [];
  }

  const ctx: LeadSummaryContext = {
    contactName: input.contactName,
    status: input.lead.status,
    source: input.lead.source || 'unknown',
    leadType: input.lead.leadType,
    listingAddress: input.lead.listingAddress,
    propertyType: input.lead.propertyType,
    priceRange: formatPriceRange(input.lead.priceMin, input.lead.priceMax),
    timeframe: input.lead.timeframe,
    daysSinceCreated,
    activityCount: input.activities.length,
    recentActivities: input.activities
      .slice(0, 5)
      .map((a) => a.summary || a.activityType),
    favoriteCount: input.favoriteCount,
    searchCount: input.searchCount,
    tags,
  };

  // Attempt AI generation
  if (isAiServiceAvailable()) {
    const config = getAiConfigForTenant(tenantId);
    if (config.enabled) {
      const prompt = buildLeadSummaryPrompt(ctx);
      const aiResult = await callAiCompletion(tenantId, prompt, {
        maxTokens: 300,
        temperature: 0.6,
      });

      if (aiResult) {
        try {
          const parsed = JSON.parse(aiResult) as {
            summary?: string;
            keySignals?: string[];
            recommendedApproach?: string;
          };

          if (parsed.summary) {
            return {
              leadId: input.lead.id,
              tenantId,
              summary: parsed.summary,
              keySignals: parsed.keySignals ?? [],
              recommendedApproach: parsed.recommendedApproach ?? null,
              provenance: makeProvenance('ai', config.model, PROMPT_VERSIONS.LEAD_SUMMARY, startMs),
            };
          }
        } catch {
          // JSON parse failed — fall through to fallback
        }
      }
    }
  }

  // Fallback
  const fallback = buildLeadSummaryFallback(ctx);

  return {
    leadId: input.lead.id,
    tenantId,
    summary: fallback.summary,
    keySignals: fallback.keySignals,
    recommendedApproach: fallback.recommendedApproach,
    provenance: makeProvenance('fallback', null, PROMPT_VERSIONS.LEAD_SUMMARY, startMs),
  };
}
