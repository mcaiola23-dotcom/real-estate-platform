/**
 * AI response contracts and provenance metadata.
 *
 * All AI-generated content must carry provenance metadata per non-negotiable rules.
 */

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

export interface AiProvenance {
  source: 'ai' | 'rule_engine' | 'fallback';
  model: string | null;
  promptVersion: string;
  generatedAt: string; // ISO-8601
  latencyMs: number;
  cached: boolean;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export type AiTonePreset = 'professional' | 'friendly' | 'casual';

export interface AiTenantConfig {
  tenantId: string;
  enabled: boolean;
  model: string;
  maxTokens: number;
  temperature: number;
  rateLimitPerMinute: number;
  tonePreset: AiTonePreset;
}

// ---------------------------------------------------------------------------
// Next-Action Engine
// ---------------------------------------------------------------------------

export type NextActionPatternId =
  | 'active_browser_no_contact'
  | 'multi_favorite_same_area'
  | 'declining_frequency'
  | 'price_range_shift'
  | 'repeated_listing_views'
  | 'overdue_followup';

export type NextActionUrgency = 'high' | 'medium' | 'low';

export interface NextActionSuggestion {
  patternId: NextActionPatternId;
  action: string;
  reason: string;
  urgency: NextActionUrgency;
  aiEnhancedReason: string | null;
  provenance: AiProvenance;
}

export interface NextActionResult {
  leadId: string;
  tenantId: string;
  suggestions: NextActionSuggestion[];
  provenance: AiProvenance;
}

// ---------------------------------------------------------------------------
// Lead Score Explanation
// ---------------------------------------------------------------------------

export interface ScoreBreakdown {
  factor: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  detail: string;
}

export interface LeadScoreExplanation {
  leadId: string;
  tenantId: string;
  score: number;
  label: string;
  breakdown: ScoreBreakdown[];
  naturalLanguage: string | null;
  provenance: AiProvenance;
}

// ---------------------------------------------------------------------------
// Lead Summary
// ---------------------------------------------------------------------------

export interface LeadSummary {
  leadId: string;
  tenantId: string;
  summary: string;
  keySignals: string[];
  recommendedApproach: string | null;
  provenance: AiProvenance;
}

// ---------------------------------------------------------------------------
// Message Drafting
// ---------------------------------------------------------------------------

export interface DraftMessageInput {
  tenantId: string;
  leadId: string;
  contactName: string | null;
  context: string;
  tone: AiTonePreset;
  messageType: 'email' | 'sms' | 'note';
}

export interface DraftMessageResult {
  subject: string | null;
  body: string;
  tone: AiTonePreset;
  provenance: AiProvenance;
}

// ---------------------------------------------------------------------------
// Conversation Insight Extraction
// ---------------------------------------------------------------------------

export interface ExtractedInsight {
  category: 'preference' | 'timeline' | 'budget' | 'concern' | 'requirement' | 'sentiment';
  value: string;
  confidence: number; // 0-1
}

export interface InsightExtractionResult {
  tenantId: string;
  leadId: string | null;
  insights: ExtractedInsight[];
  provenance: AiProvenance;
}

// ---------------------------------------------------------------------------
// Predictive Lead Scoring
// ---------------------------------------------------------------------------

export interface PredictiveScoreFeatures {
  activityFrequency: string; // bucketed: '0' | '1-3' | '4-8' | '9-15' | '16+'
  recencyBucket: string;     // '0-2d' | '3-7d' | '8-14d' | '15-30d' | '30d+'
  favoritesRatio: string;    // '0' | '0.01-0.1' | '0.1-0.3' | '0.3+'
  daysInPipeline: string;    // '0-7' | '8-14' | '15-30' | '31-60' | '60+'
  source: string;
  propertyType: string;
  leadType: string;
  hasContact: string;        // 'yes' | 'no'
  profileCompleteness: string; // '0' | '1' | '2' | '3' | '4'
}

export interface PredictiveScoreFactor {
  feature: string;
  direction: 'positive' | 'negative' | 'neutral';
  impact: number; // log-odds contribution (absolute value)
  detail: string;
}

export interface PredictiveScoreResult {
  leadId: string;
  tenantId: string;
  conversionProbability: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  insufficient: boolean;
  dataStats: { totalWon: number; totalLost: number } | null;
  topFactors: PredictiveScoreFactor[];
  explanation: string | null;
  provenance: AiProvenance;
}

// ---------------------------------------------------------------------------
// Smart Lead Routing
// ---------------------------------------------------------------------------

export interface RoutingFactor {
  factor: string;
  weight: number;
  score: number; // 0-100
  detail: string;
}

export interface RoutingRecommendation {
  agentId: string;
  agentName: string;
  compositeScore: number; // 0-100
  factors: RoutingFactor[];
  isCurrentAssignee: boolean;
}

export interface AgentRoutingProfile {
  actorId: string;
  displayName: string;
  activeLeadCount: number;
  wonCount: number;
  lostCount: number;
  avgResponseHours: number | null;
  leadsByArea: Record<string, number>;
  leadsByPropertyType: Record<string, number>;
  wonByArea: Record<string, number>;
  wonByPropertyType: Record<string, number>;
}

export interface LeadRoutingResult {
  leadId: string;
  tenantId: string;
  mode: 'team' | 'solo';
  recommendations: RoutingRecommendation[];
  explanation: string | null;
  provenance: AiProvenance;
}
