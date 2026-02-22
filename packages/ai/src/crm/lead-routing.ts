/**
 * Smart Lead Routing Engine
 *
 * Advisory agent-to-lead matching using 5 weighted routing factors:
 * - Geographic Specialization (25%): Area overlap between lead and agent history
 * - Property Type Expertise (20%): Property type match from agent's Won leads
 * - Pipeline Load (20%): Inverse of agent's active lead count vs team average
 * - Historical Conversion Rate (20%): Agent's Won/(Won+Lost) ratio
 * - Response Time (15%): Average hours from lead creation to first contact
 *
 * Modes:
 * - team (2+ actors): Ranks all agents with composite scores
 * - solo (0-1 actors): Returns self-assessment with factor insights
 */

import type {
  AiProvenance,
  RoutingFactor,
  RoutingRecommendation,
  AgentRoutingProfile,
  LeadRoutingResult,
} from '../types';
import { callAiCompletion } from '../llm-client';
import { getAiConfigForTenant, isAiServiceAvailable } from '../config';
import { PROMPT_VERSIONS } from '../prompts/crm-prompts';

// ---------------------------------------------------------------------------
// Types (internal)
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
  assignedTo: string | null;
  createdAt: string;
  closedAt: string | null;
}

interface ActivityInput {
  activityType: string;
  occurredAt: string;
  leadId: string | null;
}

interface ActorInput {
  actorId: string;
  displayName: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEIGHTS = {
  geoSpecialization: 0.25,
  propertyTypeExpertise: 0.20,
  pipelineLoad: 0.20,
  conversionRate: 0.20,
  responseTime: 0.15,
} as const;

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Agent profile building
// ---------------------------------------------------------------------------

export function buildAgentRoutingProfile(
  actor: ActorInput,
  allLeads: LeadInput[],
  allActivities: ActivityInput[],
): AgentRoutingProfile {
  const nintyDaysAgo = Date.now() - NINETY_DAYS_MS;

  // Filter leads assigned to this actor
  const agentLeads = allLeads.filter((l) => l.assignedTo === actor.actorId);
  const activeLeads = agentLeads.filter(
    (l) => l.status !== 'won' && l.status !== 'lost' && l.status !== 'archived',
  );

  // Recent closed leads (90 days)
  const recentClosed = agentLeads.filter(
    (l) =>
      (l.status === 'won' || l.status === 'lost') &&
      l.closedAt &&
      new Date(l.closedAt).getTime() >= nintyDaysAgo,
  );

  const wonLeads = recentClosed.filter((l) => l.status === 'won');
  const lostLeads = recentClosed.filter((l) => l.status === 'lost');

  // Area distributions (extracted from listingAddress — city or first comma-delimited segment)
  const leadsByArea: Record<string, number> = {};
  const wonByArea: Record<string, number> = {};
  const leadsByPropertyType: Record<string, number> = {};
  const wonByPropertyType: Record<string, number> = {};

  for (const lead of agentLeads) {
    const area = extractArea(lead.listingAddress);
    if (area) {
      leadsByArea[area] = (leadsByArea[area] || 0) + 1;
      if (lead.status === 'won') {
        wonByArea[area] = (wonByArea[area] || 0) + 1;
      }
    }

    const pt = lead.propertyType || 'unspecified';
    leadsByPropertyType[pt] = (leadsByPropertyType[pt] || 0) + 1;
    if (lead.status === 'won') {
      wonByPropertyType[pt] = (wonByPropertyType[pt] || 0) + 1;
    }
  }

  // Average response time: time from lead creation to first activity by this agent
  const responseTimes: number[] = [];
  for (const lead of agentLeads) {
    const leadActivities = allActivities.filter((a) => a.leadId === lead.id);
    if (leadActivities.length > 0) {
      const sorted = [...leadActivities].sort(
        (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
      );
      const hours =
        (new Date(sorted[0]!.occurredAt).getTime() - new Date(lead.createdAt).getTime()) /
        (1000 * 60 * 60);
      if (hours >= 0) responseTimes.push(hours);
    }
  }

  const avgResponseHours =
    responseTimes.length > 0
      ? Math.round((responseTimes.reduce((s, h) => s + h, 0) / responseTimes.length) * 10) / 10
      : null;

  return {
    actorId: actor.actorId,
    displayName: actor.displayName || actor.actorId,
    activeLeadCount: activeLeads.length,
    wonCount: wonLeads.length,
    lostCount: lostLeads.length,
    avgResponseHours,
    leadsByArea,
    leadsByPropertyType,
    wonByArea,
    wonByPropertyType,
  };
}

function extractArea(address: string | null): string | null {
  if (!address) return null;
  // Try to extract city from "123 Main St, Fairfield, CT" → "Fairfield"
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length >= 2) return parts[1]!;
  return parts[0]!;
}

// ---------------------------------------------------------------------------
// Scoring an agent for a specific lead
// ---------------------------------------------------------------------------

export function scoreAgentForLead(
  lead: LeadInput,
  profile: AgentRoutingProfile,
  teamAverages: {
    avgActiveLeads: number;
    avgConversionRate: number;
    avgResponseHours: number;
  },
): RoutingRecommendation {
  const factors: RoutingFactor[] = [];

  // 1. Geographic Specialization (25%)
  const leadArea = extractArea(lead.listingAddress);
  let geoScore = 50; // default if no area info
  if (leadArea) {
    const wonInArea = profile.wonByArea[leadArea] || 0;
    const totalWon = Object.values(profile.wonByArea).reduce((s, n) => s + n, 0);
    geoScore = totalWon > 0 ? Math.min(100, Math.round((wonInArea / totalWon) * 200)) : 30;
  }
  factors.push({
    factor: 'Geographic Specialization',
    weight: WEIGHTS.geoSpecialization,
    score: geoScore,
    detail: leadArea
      ? `${profile.wonByArea[leadArea] || 0} wins in ${leadArea}`
      : 'No area data available',
  });

  // 2. Property Type Expertise (20%)
  const leadPt = lead.propertyType || 'unspecified';
  const wonInType = profile.wonByPropertyType[leadPt] || 0;
  const totalWonPt = Object.values(profile.wonByPropertyType).reduce((s, n) => s + n, 0);
  const ptScore = totalWonPt > 0 ? Math.min(100, Math.round((wonInType / totalWonPt) * 200)) : 40;
  factors.push({
    factor: 'Property Type Expertise',
    weight: WEIGHTS.propertyTypeExpertise,
    score: ptScore,
    detail: `${wonInType} wins with ${leadPt}`,
  });

  // 3. Pipeline Load (20%) — lower active count = higher score
  let loadScore = 80;
  if (teamAverages.avgActiveLeads > 0) {
    const ratio = profile.activeLeadCount / teamAverages.avgActiveLeads;
    loadScore = Math.max(0, Math.min(100, Math.round(100 - (ratio - 1) * 50)));
  }
  factors.push({
    factor: 'Pipeline Load',
    weight: WEIGHTS.pipelineLoad,
    score: loadScore,
    detail: `${profile.activeLeadCount} active leads`,
  });

  // 4. Historical Conversion Rate (20%)
  const totalClosed = profile.wonCount + profile.lostCount;
  const convRate = totalClosed > 0 ? profile.wonCount / totalClosed : 0;
  const convScore = totalClosed >= 5
    ? Math.min(100, Math.round(convRate * 150))
    : 50; // insufficient data
  factors.push({
    factor: 'Conversion Rate',
    weight: WEIGHTS.conversionRate,
    score: convScore,
    detail: totalClosed >= 5
      ? `${Math.round(convRate * 100)}% (${profile.wonCount}W/${profile.lostCount}L)`
      : 'Insufficient closed leads',
  });

  // 5. Response Time (15%) — faster = higher score
  let responseScore = 50;
  if (profile.avgResponseHours !== null) {
    // Under 4 hours = 100, over 48 hours = 0, linear in between
    responseScore = Math.max(0, Math.min(100, Math.round(100 - ((profile.avgResponseHours - 4) / 44) * 100)));
  }
  factors.push({
    factor: 'Response Time',
    weight: WEIGHTS.responseTime,
    score: responseScore,
    detail: profile.avgResponseHours !== null
      ? `${profile.avgResponseHours}h avg response`
      : 'No response data',
  });

  // Composite score
  const compositeScore = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0),
  );

  return {
    agentId: profile.actorId,
    agentName: profile.displayName,
    compositeScore,
    factors,
    isCurrentAssignee: lead.assignedTo === profile.actorId,
  };
}

// ---------------------------------------------------------------------------
// AI-enhanced explanation
// ---------------------------------------------------------------------------

function buildRoutingExplainPrompt(
  lead: LeadInput,
  topRecommendation: RoutingRecommendation,
  mode: 'team' | 'solo',
): string {
  const factorLines = topRecommendation.factors
    .map((f) => `- ${f.factor}: ${f.score}/100 — ${f.detail}`)
    .join('\n');

  const modeContext = mode === 'team'
    ? `This is a team routing recommendation. The top-ranked agent is ${topRecommendation.agentName}.`
    : `This is a solo-agent self-assessment for ${topRecommendation.agentName}.`;

  return `You are a real estate CRM assistant. Explain this lead routing recommendation in 2-3 concise sentences for a busy agent.

${modeContext}
Lead type: ${lead.leadType}
Source: ${lead.source}
Property: ${lead.propertyType || 'unspecified'}
Area: ${extractArea(lead.listingAddress) || 'unknown'}
Composite score: ${topRecommendation.compositeScore}/100

Routing factors:
${factorLines}

Interpret the key strengths and any concerns. Be specific about why this agent is a good fit.`;
}

function buildRoutingFallbackExplanation(
  recommendation: RoutingRecommendation,
  mode: 'team' | 'solo',
): string {
  const strengths = recommendation.factors
    .filter((f) => f.score >= 70)
    .slice(0, 2)
    .map((f) => f.detail);
  const weaknesses = recommendation.factors
    .filter((f) => f.score < 40)
    .slice(0, 1)
    .map((f) => f.detail);

  const parts: string[] = [];
  if (mode === 'solo') {
    parts.push(`Self-assessment score: ${recommendation.compositeScore}/100.`);
  } else {
    parts.push(`${recommendation.agentName}: ${recommendation.compositeScore}/100 match.`);
  }

  if (strengths.length > 0) {
    parts.push(`Strengths: ${strengths.join(', ')}.`);
  }
  if (weaknesses.length > 0) {
    parts.push(`Consider: ${weaknesses.join(', ')}.`);
  }

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function computeLeadRouting(
  tenantId: string,
  lead: LeadInput,
  actors: ActorInput[],
  allLeads: LeadInput[],
  allActivities: ActivityInput[],
): Promise<LeadRoutingResult> {
  const start = Date.now();

  const mode: 'team' | 'solo' = actors.length >= 2 ? 'team' : 'solo';

  const makeProvenance = (source: AiProvenance['source'], model: string | null): AiProvenance => ({
    source,
    model,
    promptVersion: PROMPT_VERSIONS.LEAD_ROUTING,
    generatedAt: new Date().toISOString(),
    latencyMs: Date.now() - start,
    cached: false,
  });

  // Build profiles for all actors
  const profiles = actors.map((actor) =>
    buildAgentRoutingProfile(actor, allLeads, allActivities),
  );

  // Compute team averages for normalization
  const teamAverages = {
    avgActiveLeads:
      profiles.length > 0
        ? profiles.reduce((s, p) => s + p.activeLeadCount, 0) / profiles.length
        : 1,
    avgConversionRate:
      profiles.length > 0
        ? profiles.reduce((s, p) => {
            const total = p.wonCount + p.lostCount;
            return s + (total > 0 ? p.wonCount / total : 0);
          }, 0) / profiles.length
        : 0,
    avgResponseHours:
      profiles.length > 0
        ? profiles.reduce((s, p) => s + (p.avgResponseHours ?? 24), 0) / profiles.length
        : 24,
  };

  // Score each agent
  const recommendations = profiles
    .map((profile) => scoreAgentForLead(lead, profile, teamAverages))
    .sort((a, b) => b.compositeScore - a.compositeScore);

  // AI-enhanced explanation
  let explanation: string | null = null;
  let provenanceSource: AiProvenance['source'] = 'rule_engine';
  let model: string | null = null;

  const topRec = recommendations[0];
  if (topRec && isAiServiceAvailable()) {
    const config = getAiConfigForTenant(tenantId);
    if (config.enabled) {
      const prompt = buildRoutingExplainPrompt(lead, topRec, mode);
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

  if (!explanation && topRec) {
    explanation = buildRoutingFallbackExplanation(topRec, mode);
    provenanceSource = 'fallback';
  }

  return {
    leadId: lead.id,
    tenantId,
    mode,
    recommendations,
    explanation,
    provenance: makeProvenance(provenanceSource, model),
  };
}
