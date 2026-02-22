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
