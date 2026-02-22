/**
 * Versioned CRM prompt templates with fallback text.
 *
 * Each prompt has:
 * - A version identifier for provenance tracking
 * - A template function that interpolates context
 * - A fallback function for when AI services are unavailable
 */

import type { AiTonePreset } from '../types';

// ---------------------------------------------------------------------------
// Prompt version registry
// ---------------------------------------------------------------------------

export const PROMPT_VERSIONS = {
  LEAD_SCORE_EXPLAIN: 'crm.lead_score_explain.v1',
  LEAD_SUMMARY: 'crm.lead_summary.v1',
  NEXT_ACTION_ENHANCE: 'crm.next_action_enhance.v1',
  DRAFT_MESSAGE: 'crm.draft_message.v1',
  EXTRACT_INSIGHTS: 'crm.extract_insights.v1',
  MARKET_DIGEST: 'crm.market_digest.v1',
  LISTING_DESCRIPTION: 'crm.listing_description.v1',
  PREDICTIVE_SCORE: 'crm.predictive_score.v1',
  LEAD_ROUTING: 'crm.lead_routing.v1',
} as const;

// ---------------------------------------------------------------------------
// Lead Score Explanation
// ---------------------------------------------------------------------------

export interface ScoreExplainContext {
  score: number;
  label: string;
  recencyScore: number;
  frequencyScore: number;
  intentScore: number;
  profileScore: number;
  recentActivityCount: number;
  daysSinceLastActivity: number | null;
  favoriteCount: number;
  viewCount: number;
  hasContact: boolean;
  hasAddress: boolean;
  hasTimeframe: boolean;
}

export function buildScoreExplainPrompt(ctx: ScoreExplainContext): string {
  return `You are a real estate CRM assistant. Explain this lead's engagement score in 2-3 concise sentences that a busy agent can scan quickly.

Score: ${ctx.score}/100 (${ctx.label})
Breakdown:
- Recency: ${ctx.recencyScore.toFixed(0)}/100 (${ctx.daysSinceLastActivity !== null ? `${ctx.daysSinceLastActivity.toFixed(0)} days since last activity` : 'no activity recorded'})
- Frequency: ${ctx.frequencyScore.toFixed(0)}/100 (${ctx.recentActivityCount} activities in 30 days)
- Intent: ${ctx.intentScore.toFixed(0)}/100 (${ctx.favoriteCount} favorites, ${ctx.viewCount} views)
- Profile: ${ctx.profileScore.toFixed(0)}/100 (contact: ${ctx.hasContact ? 'yes' : 'no'}, address: ${ctx.hasAddress ? 'yes' : 'no'}, timeframe: ${ctx.hasTimeframe ? 'yes' : 'no'})

Write a natural explanation citing the most important signals. Do not repeat the raw numbers — interpret them.`;
}

export function buildScoreExplainFallback(ctx: ScoreExplainContext): string {
  const parts: string[] = [];

  if (ctx.recencyScore >= 70) {
    parts.push('Recently active on the website');
  } else if (ctx.daysSinceLastActivity !== null && ctx.daysSinceLastActivity > 14) {
    parts.push(`Inactive for ${Math.round(ctx.daysSinceLastActivity)} days`);
  }

  if (ctx.favoriteCount > 0) {
    parts.push(`Favorited ${ctx.favoriteCount} listing${ctx.favoriteCount > 1 ? 's' : ''}`);
  }

  if (ctx.frequencyScore >= 60) {
    parts.push('High activity frequency');
  }

  if (!ctx.hasContact) {
    parts.push('No contact info linked');
  }

  if (parts.length === 0) {
    return `This lead has a ${ctx.label.toLowerCase()} engagement level with a score of ${ctx.score}/100.`;
  }

  return `${ctx.label} engagement (${ctx.score}/100). ${parts.join('. ')}.`;
}

// ---------------------------------------------------------------------------
// Lead Summary
// ---------------------------------------------------------------------------

export interface LeadSummaryContext {
  contactName: string | null;
  status: string;
  source: string;
  leadType: string;
  listingAddress: string | null;
  propertyType: string | null;
  priceRange: string | null;
  timeframe: string | null;
  daysSinceCreated: number;
  activityCount: number;
  recentActivities: string[]; // Last 5 activity summaries
  favoriteCount: number;
  searchCount: number;
  tags: string[];
}

export function buildLeadSummaryPrompt(ctx: LeadSummaryContext): string {
  const lines = [
    'You are a real estate CRM assistant. Provide a brief lead summary (3-4 sentences) and list 2-4 key signals. Also suggest a recommended approach in one sentence.',
    '',
    `Lead: ${ctx.contactName || 'Unknown'} (${ctx.status}, ${ctx.source})`,
    `Type: ${ctx.leadType}`,
  ];

  if (ctx.listingAddress) lines.push(`Property interest: ${ctx.listingAddress}`);
  if (ctx.propertyType) lines.push(`Property type: ${ctx.propertyType}`);
  if (ctx.priceRange) lines.push(`Budget: ${ctx.priceRange}`);
  if (ctx.timeframe) lines.push(`Timeframe: ${ctx.timeframe}`);
  lines.push(`Days in pipeline: ${ctx.daysSinceCreated}`);
  lines.push(`Total activities: ${ctx.activityCount}`);
  if (ctx.favoriteCount > 0) lines.push(`Favorites: ${ctx.favoriteCount}`);
  if (ctx.searchCount > 0) lines.push(`Searches: ${ctx.searchCount}`);
  if (ctx.tags.length > 0) lines.push(`Tags: ${ctx.tags.join(', ')}`);

  if (ctx.recentActivities.length > 0) {
    lines.push('', 'Recent activity:');
    ctx.recentActivities.forEach((a) => lines.push(`- ${a}`));
  }

  lines.push('', 'Respond as JSON: { "summary": "...", "keySignals": ["..."], "recommendedApproach": "..." }');

  return lines.join('\n');
}

export function buildLeadSummaryFallback(ctx: LeadSummaryContext): {
  summary: string;
  keySignals: string[];
  recommendedApproach: string | null;
} {
  const name = ctx.contactName || 'This lead';
  const parts: string[] = [];

  parts.push(`${name} is a ${ctx.status} ${ctx.leadType.replace('_', ' ')} from ${ctx.source}.`);

  if (ctx.listingAddress) {
    parts.push(`Interested in ${ctx.listingAddress}.`);
  }

  if (ctx.activityCount > 0) {
    parts.push(`${ctx.activityCount} activities over ${ctx.daysSinceCreated} days.`);
  } else {
    parts.push(`Created ${ctx.daysSinceCreated} days ago with no recorded activity.`);
  }

  const signals: string[] = [];
  if (ctx.favoriteCount > 0) signals.push(`${ctx.favoriteCount} favorited listings`);
  if (ctx.searchCount > 0) signals.push(`${ctx.searchCount} property searches`);
  if (ctx.priceRange) signals.push(`Budget: ${ctx.priceRange}`);
  if (ctx.timeframe) signals.push(`Timeframe: ${ctx.timeframe}`);
  if (signals.length === 0) signals.push('Limited engagement data available');

  return {
    summary: parts.join(' '),
    keySignals: signals,
    recommendedApproach: ctx.activityCount === 0
      ? 'Initial outreach recommended to establish contact.'
      : null,
  };
}

// ---------------------------------------------------------------------------
// Next Action Enhancement
// ---------------------------------------------------------------------------

export interface NextActionEnhanceContext {
  action: string;
  reason: string;
  contactName: string | null;
  status: string;
  recentActivities: string[];
}

export function buildNextActionEnhancePrompt(ctx: NextActionEnhanceContext): string {
  return `You are a real estate CRM assistant. Enhance this suggested action with personalized context in 1-2 sentences.

Suggested action: ${ctx.action}
Reason: ${ctx.reason}
Lead: ${ctx.contactName || 'Unknown'} (${ctx.status})
Recent activity: ${ctx.recentActivities.slice(0, 3).join('; ') || 'None'}

Write a brief, actionable enhancement. Do not repeat the original action.`;
}

// ---------------------------------------------------------------------------
// Draft Message
// ---------------------------------------------------------------------------

export interface DraftMessageContext {
  contactName: string | null;
  agentName: string | null;
  messageType: 'email' | 'sms' | 'note';
  tone: AiTonePreset;
  context: string;
  leadStatus: string;
  recentActivities: string[];
  propertyInterest: string | null;
}

export function buildDraftMessagePrompt(ctx: DraftMessageContext): string {
  const lines = [
    `You are a real estate agent's assistant. Draft a ${ctx.messageType} in a ${ctx.tone} tone.`,
    '',
    `To: ${ctx.contactName || 'Client'}`,
    `From: ${ctx.agentName || 'Agent'}`,
    `Lead status: ${ctx.leadStatus}`,
    `Context: ${ctx.context}`,
  ];

  if (ctx.propertyInterest) lines.push(`Property interest: ${ctx.propertyInterest}`);
  if (ctx.recentActivities.length > 0) {
    lines.push(`Recent activity: ${ctx.recentActivities.slice(0, 3).join('; ')}`);
  }

  if (ctx.messageType === 'email') {
    lines.push('', 'Respond as JSON: { "subject": "...", "body": "..." }');
  } else {
    lines.push('', 'Respond as JSON: { "body": "..." }');
  }

  return lines.join('\n');
}

export function buildDraftMessageFallback(ctx: DraftMessageContext): {
  subject: string | null;
  body: string;
} {
  const greeting = ctx.tone === 'casual' ? 'Hi' : ctx.tone === 'friendly' ? 'Hello' : 'Dear';
  const name = ctx.contactName || 'there';
  const signoff = ctx.tone === 'casual' ? 'Best' : ctx.tone === 'friendly' ? 'Warm regards' : 'Sincerely';
  const agent = ctx.agentName || 'Your Agent';

  const body = `${greeting} ${name},\n\n${ctx.context}\n\n${signoff},\n${agent}`;

  return {
    subject: ctx.messageType === 'email' ? `Following up — ${ctx.propertyInterest || 'your property search'}` : null,
    body,
  };
}

// ---------------------------------------------------------------------------
// Extract Insights
// ---------------------------------------------------------------------------

export interface ExtractInsightsContext {
  conversationText: string;
  leadContext: string | null;
}

export function buildExtractInsightsPrompt(ctx: ExtractInsightsContext): string {
  const lines = [
    'You are a real estate CRM assistant. Extract structured insights from this conversation or note text.',
    '',
    `Text: "${ctx.conversationText}"`,
  ];

  if (ctx.leadContext) {
    lines.push(`Lead context: ${ctx.leadContext}`);
  }

  lines.push('', 'Respond as JSON array: [{ "category": "preference|timeline|budget|concern|requirement|sentiment", "value": "...", "confidence": 0.0-1.0 }]');

  return lines.join('\n');
}
