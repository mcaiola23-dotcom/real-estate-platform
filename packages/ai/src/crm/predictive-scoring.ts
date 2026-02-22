/**
 * Predictive Lead Scoring Engine
 *
 * Statistical conversion prediction using Naive Bayes classification over
 * historical Won/Lost lead data. Rule-based with optional AI enhancement
 * for natural-language explanations.
 *
 * Minimum data threshold: 50 closed leads (Won+Lost), at least 10 per outcome.
 */

import type { AiProvenance, PredictiveScoreFeatures, PredictiveScoreFactor, PredictiveScoreResult } from '../types';
import { callAiCompletion } from '../llm-client';
import { getAiConfigForTenant, isAiServiceAvailable } from '../config';
import { PROMPT_VERSIONS } from '../prompts/crm-prompts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeadInput {
  id: string;
  tenantId: string;
  status: string;
  leadType: string;
  source: string;
  contactId: string | null;
  listingAddress: string | null;
  propertyType: string | null;
  timeframe: string | null;
  priceMin: number | null;
  priceMax: number | null;
  createdAt: string;
  closedAt: string | null;
}

interface ActivityInput {
  activityType: string;
  occurredAt: string;
  leadId: string | null;
}

interface ClosedLeadBundle {
  lead: LeadInput;
  activities: ActivityInput[];
}

interface FeatureDistribution {
  won: Record<string, number>;
  lost: Record<string, number>;
}

interface HistoricalDistribution {
  tenantId: string;
  totalWon: number;
  totalLost: number;
  featureDistributions: Record<string, FeatureDistribution>;
  computedAt: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_CLOSED_LEADS = 50;
const MIN_PER_OUTCOME = 10;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const FEATURE_NAMES: (keyof PredictiveScoreFeatures)[] = [
  'activityFrequency', 'recencyBucket', 'favoritesRatio',
  'daysInPipeline', 'source', 'propertyType', 'leadType',
  'hasContact', 'profileCompleteness',
];

const FEATURE_LABELS: Record<string, string> = {
  activityFrequency: 'Activity Frequency',
  recencyBucket: 'Recency',
  favoritesRatio: 'Favorites Ratio',
  daysInPipeline: 'Time in Pipeline',
  source: 'Lead Source',
  propertyType: 'Property Type',
  leadType: 'Lead Type',
  hasContact: 'Contact Info',
  profileCompleteness: 'Profile Completeness',
};

// ---------------------------------------------------------------------------
// In-memory distribution cache (keyed by tenantId)
// ---------------------------------------------------------------------------

const distributionCache = new Map<string, HistoricalDistribution>();

// ---------------------------------------------------------------------------
// Feature extraction
// ---------------------------------------------------------------------------

export function extractPredictiveFeatures(
  lead: LeadInput,
  activities: ActivityInput[],
): PredictiveScoreFeatures {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  // Activity frequency in last 30 days (bucketed)
  const recentCount = activities.filter(
    (a) => now - new Date(a.occurredAt).getTime() < thirtyDays,
  ).length;
  const activityFrequency =
    recentCount === 0 ? '0' :
    recentCount <= 3 ? '1-3' :
    recentCount <= 8 ? '4-8' :
    recentCount <= 15 ? '9-15' : '16+';

  // Recency (days since last activity)
  let recencyBucket = '30d+';
  if (activities.length > 0) {
    const sorted = [...activities].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
    const daysSince = (now - new Date(sorted[0]!.occurredAt).getTime()) / (24 * 60 * 60 * 1000);
    recencyBucket =
      daysSince <= 2 ? '0-2d' :
      daysSince <= 7 ? '3-7d' :
      daysSince <= 14 ? '8-14d' :
      daysSince <= 30 ? '15-30d' : '30d+';
  }

  // Favorites-to-views ratio
  const favCount = activities.filter((a) => a.activityType === 'listing_favorited').length;
  const viewCount = activities.filter((a) => a.activityType === 'listing_viewed').length;
  const ratio = viewCount > 0 ? favCount / viewCount : 0;
  const favoritesRatio =
    ratio === 0 ? '0' :
    ratio <= 0.1 ? '0.01-0.1' :
    ratio <= 0.3 ? '0.1-0.3' : '0.3+';

  // Days in pipeline (from creation to close or now)
  const endDate = lead.closedAt ? new Date(lead.closedAt).getTime() : now;
  const pipelineDays = (endDate - new Date(lead.createdAt).getTime()) / (24 * 60 * 60 * 1000);
  const daysInPipeline =
    pipelineDays <= 7 ? '0-7' :
    pipelineDays <= 14 ? '8-14' :
    pipelineDays <= 30 ? '15-30' :
    pipelineDays <= 60 ? '31-60' : '60+';

  // Source normalization
  const sourceNorm = lead.source || 'unknown';
  const source =
    sourceNorm.includes('website') || sourceNorm.includes('valuation') ? 'website' :
    sourceNorm.includes('referral') ? 'referral' :
    sourceNorm.includes('manual') || sourceNorm === 'crm_manual' ? 'manual' :
    sourceNorm.includes('idx') ? 'idx' : 'other';

  // Property type
  const propertyType = lead.propertyType || 'unspecified';

  // Lead type
  const leadType = lead.leadType || 'unknown';

  // Has contact
  const hasContact = lead.contactId ? 'yes' : 'no';

  // Profile completeness (count of filled fields)
  let completeness = 0;
  if (lead.contactId) completeness++;
  if (lead.listingAddress) completeness++;
  if (lead.propertyType) completeness++;
  if (lead.timeframe) completeness++;
  const profileCompleteness = String(completeness);

  return {
    activityFrequency,
    recencyBucket,
    favoritesRatio,
    daysInPipeline,
    source,
    propertyType,
    leadType,
    hasContact,
    profileCompleteness,
  };
}

// ---------------------------------------------------------------------------
// Historical distribution computation
// ---------------------------------------------------------------------------

export function buildHistoricalDistribution(
  closedLeads: ClosedLeadBundle[],
): HistoricalDistribution | null {
  const wonLeads = closedLeads.filter((cl) => cl.lead.status === 'won');
  const lostLeads = closedLeads.filter((cl) => cl.lead.status === 'lost');

  if (closedLeads.length < MIN_CLOSED_LEADS) return null;
  if (wonLeads.length < MIN_PER_OUTCOME || lostLeads.length < MIN_PER_OUTCOME) return null;

  const featureDistributions: Record<string, FeatureDistribution> = {};

  for (const featureName of FEATURE_NAMES) {
    featureDistributions[featureName] = { won: {}, lost: {} };
  }

  for (const bundle of closedLeads) {
    const features = extractPredictiveFeatures(bundle.lead, bundle.activities);
    const outcome = bundle.lead.status === 'won' ? 'won' : 'lost';

    for (const featureName of FEATURE_NAMES) {
      const value = features[featureName];
      const dist = featureDistributions[featureName]!;
      dist[outcome][value] = (dist[outcome][value] || 0) + 1;
    }
  }

  return {
    tenantId: closedLeads[0]!.lead.tenantId,
    totalWon: wonLeads.length,
    totalLost: lostLeads.length,
    featureDistributions,
    computedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Conversion probability computation (Naive Bayes)
// ---------------------------------------------------------------------------

export function computeConversionProbability(
  features: PredictiveScoreFeatures,
  distribution: HistoricalDistribution,
): { probability: number; confidence: 'high' | 'medium' | 'low'; factors: PredictiveScoreFactor[] } {
  const { totalWon, totalLost, featureDistributions } = distribution;
  const totalClosed = totalWon + totalLost;

  // Prior log-odds
  let logOdds = Math.log(totalWon / totalLost);

  const factors: PredictiveScoreFactor[] = [];

  for (const featureName of FEATURE_NAMES) {
    const value = features[featureName];
    const dist = featureDistributions[featureName]!;

    // Unique bucket count for Laplace smoothing
    const allBuckets = new Set([...Object.keys(dist.won), ...Object.keys(dist.lost)]);
    const numBuckets = Math.max(allBuckets.size, 1);

    // Laplace-smoothed conditional probabilities
    const pWon = ((dist.won[value] || 0) + 1) / (totalWon + numBuckets);
    const pLost = ((dist.lost[value] || 0) + 1) / (totalLost + numBuckets);

    const contribution = Math.log(pWon / pLost);
    logOdds += contribution;

    const absImpact = Math.abs(contribution);
    factors.push({
      feature: FEATURE_LABELS[featureName] || featureName,
      direction: contribution > 0.05 ? 'positive' : contribution < -0.05 ? 'negative' : 'neutral',
      impact: Math.round(absImpact * 100) / 100,
      detail: `${FEATURE_LABELS[featureName] || featureName}: ${value}`,
    });
  }

  // Convert log-odds to probability
  const rawProbability = 1 / (1 + Math.exp(-logOdds));
  const probability = Math.round(rawProbability * 100);

  // Confidence based on total closed leads
  const confidence: 'high' | 'medium' | 'low' =
    totalClosed >= 200 ? 'high' :
    totalClosed >= 100 ? 'medium' : 'low';

  // Sort factors by impact (descending)
  factors.sort((a, b) => b.impact - a.impact);

  return { probability, confidence, factors };
}

// ---------------------------------------------------------------------------
// AI-enhanced explanation
// ---------------------------------------------------------------------------

function buildPredictiveExplainPrompt(
  probability: number,
  confidence: string,
  topFactors: PredictiveScoreFactor[],
  leadType: string,
  source: string,
): string {
  const factorLines = topFactors.slice(0, 5).map(
    (f) => `- ${f.feature}: ${f.detail} (${f.direction})`,
  ).join('\n');

  return `You are a real estate CRM assistant. Explain this lead's conversion prediction in 2-3 concise sentences for a busy agent.

Predicted conversion probability: ${probability}%
Confidence: ${confidence}
Lead type: ${leadType}
Source: ${source}
Top contributing factors:
${factorLines}

Interpret the key factors that drive this prediction. Be specific about what makes this lead more or less likely to convert compared to historical patterns.`;
}

function buildPredictiveExplainFallback(
  probability: number,
  confidence: string,
  topFactors: PredictiveScoreFactor[],
): string {
  const positives = topFactors.filter((f) => f.direction === 'positive').slice(0, 2);
  const negatives = topFactors.filter((f) => f.direction === 'negative').slice(0, 2);

  const parts: string[] = [];
  parts.push(`${probability}% conversion likelihood (${confidence} confidence).`);

  if (positives.length > 0) {
    parts.push(
      `Favorable: ${positives.map((f) => f.detail).join(', ')}.`,
    );
  }
  if (negatives.length > 0) {
    parts.push(
      `Concerns: ${negatives.map((f) => f.detail).join(', ')}.`,
    );
  }

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function predictLeadConversion(
  tenantId: string,
  lead: LeadInput,
  activities: ActivityInput[],
  closedLeads: ClosedLeadBundle[],
): Promise<PredictiveScoreResult> {
  const start = Date.now();

  // Check cache for distribution
  let distribution = distributionCache.get(tenantId);
  if (distribution && (Date.now() - distribution.computedAt) > CACHE_TTL_MS) {
    distributionCache.delete(tenantId);
    distribution = undefined;
  }

  if (!distribution) {
    distribution = buildHistoricalDistribution(closedLeads) ?? undefined;
    if (distribution) {
      distributionCache.set(tenantId, distribution);
    }
  }

  const makeProvenance = (source: AiProvenance['source'], model: string | null): AiProvenance => ({
    source,
    model,
    promptVersion: PROMPT_VERSIONS.PREDICTIVE_SCORE,
    generatedAt: new Date().toISOString(),
    latencyMs: Date.now() - start,
    cached: false,
  });

  // Insufficient data
  if (!distribution) {
    const wonCount = closedLeads.filter((cl) => cl.lead.status === 'won').length;
    const lostCount = closedLeads.filter((cl) => cl.lead.status === 'lost').length;
    return {
      leadId: lead.id,
      tenantId,
      conversionProbability: 0,
      confidence: 'low',
      insufficient: true,
      dataStats: { totalWon: wonCount, totalLost: lostCount },
      topFactors: [],
      explanation: `Insufficient historical data for prediction. Need at least ${MIN_CLOSED_LEADS} closed leads (${MIN_PER_OUTCOME}+ Won and ${MIN_PER_OUTCOME}+ Lost). Current: ${wonCount} Won, ${lostCount} Lost.`,
      provenance: makeProvenance('rule_engine', null),
    };
  }

  // Extract features and compute probability
  const features = extractPredictiveFeatures(lead, activities);
  const { probability, confidence, factors } = computeConversionProbability(features, distribution);

  // Attempt AI enhancement for explanation
  let explanation: string | null = null;
  let provenanceSource: AiProvenance['source'] = 'rule_engine';
  let model: string | null = null;

  if (isAiServiceAvailable()) {
    const config = getAiConfigForTenant(tenantId);
    if (config.enabled) {
      const prompt = buildPredictiveExplainPrompt(
        probability, confidence, factors, lead.leadType, lead.source,
      );
      const aiResult = await callAiCompletion(tenantId, prompt, {
        maxTokens: 200,
        temperature: 0.6,
      });
      if (aiResult) {
        explanation = aiResult.trim();
        provenanceSource = 'ai';
        model = config.model;
      }
    }
  }

  if (!explanation) {
    explanation = buildPredictiveExplainFallback(probability, confidence, factors);
    provenanceSource = 'fallback';
  }

  return {
    leadId: lead.id,
    tenantId,
    conversionProbability: probability,
    confidence,
    insufficient: false,
    dataStats: { totalWon: distribution.totalWon, totalLost: distribution.totalLost },
    topFactors: factors.slice(0, 5),
    explanation,
    provenance: makeProvenance(provenanceSource, model),
  };
}
