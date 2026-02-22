/**
 * Structured insight extraction from conversation notes and transcripts.
 */

import { getAiConfigForTenant, isAiServiceAvailable } from '../config';
import { callAiCompletion } from '../llm-client';
import {
  buildExtractInsightsPrompt,
  PROMPT_VERSIONS,
} from '../prompts/crm-prompts';
import type {
  AiProvenance,
  ExtractedInsight,
  InsightExtractionResult,
} from '../types';

function makeProvenance(
  source: AiProvenance['source'],
  model: string | null,
  startMs: number,
): AiProvenance {
  return {
    source,
    model,
    promptVersion: PROMPT_VERSIONS.EXTRACT_INSIGHTS,
    generatedAt: new Date().toISOString(),
    latencyMs: Date.now() - startMs,
    cached: false,
  };
}

// ---------------------------------------------------------------------------
// Keyword-based fallback extraction
// ---------------------------------------------------------------------------

const BUDGET_PATTERNS = [
  /\$[\d,]+k?/gi,
  /budget[:\s]+[\d,]+/gi,
  /(?:up to|around|about|max)\s+\$?[\d,]+k?/gi,
];

const TIMELINE_PATTERNS = [
  /(?:within|in|by)\s+(?:\d+\s+)?(?:month|week|year)s?/gi,
  /(?:asap|immediately|soon|next\s+(?:month|year|spring|summer|fall|winter))/gi,
];

const PREFERENCE_KEYWORDS = [
  'prefer', 'want', 'need', 'looking for', 'interested in',
  'must have', 'nice to have', 'would like',
];

const CONCERN_KEYWORDS = [
  'worried', 'concern', 'issue', 'problem', 'hesitant',
  'unsure', 'not sure', 'afraid', 'risk',
];

function extractKeywordInsights(text: string): ExtractedInsight[] {
  const insights: ExtractedInsight[] = [];
  const lower = text.toLowerCase();

  // Budget
  for (const pattern of BUDGET_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      insights.push({
        category: 'budget',
        value: match[0]!,
        confidence: 0.7,
      });
      break;
    }
  }

  // Timeline
  for (const pattern of TIMELINE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      insights.push({
        category: 'timeline',
        value: match[0]!,
        confidence: 0.7,
      });
      break;
    }
  }

  // Preferences
  for (const keyword of PREFERENCE_KEYWORDS) {
    const idx = lower.indexOf(keyword);
    if (idx >= 0) {
      // Extract surrounding sentence
      const sentenceEnd = text.indexOf('.', idx);
      const value = text.slice(idx, sentenceEnd > idx ? sentenceEnd : idx + 80).trim();
      if (value.length > 5) {
        insights.push({
          category: 'preference',
          value,
          confidence: 0.5,
        });
        break;
      }
    }
  }

  // Concerns
  for (const keyword of CONCERN_KEYWORDS) {
    const idx = lower.indexOf(keyword);
    if (idx >= 0) {
      const sentenceEnd = text.indexOf('.', idx);
      const value = text.slice(idx, sentenceEnd > idx ? sentenceEnd : idx + 80).trim();
      if (value.length > 5) {
        insights.push({
          category: 'concern',
          value,
          confidence: 0.5,
        });
        break;
      }
    }
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function extractInsights(
  tenantId: string,
  conversationText: string,
  leadId: string | null = null,
  leadContext: string | null = null,
): Promise<InsightExtractionResult> {
  const startMs = Date.now();

  if (isAiServiceAvailable()) {
    const config = getAiConfigForTenant(tenantId);
    if (config.enabled) {
      const prompt = buildExtractInsightsPrompt({ conversationText, leadContext });
      const aiResult = await callAiCompletion(tenantId, prompt, {
        maxTokens: 300,
        temperature: 0.3,
      });

      if (aiResult) {
        try {
          const parsed = JSON.parse(aiResult) as ExtractedInsight[];
          if (Array.isArray(parsed)) {
            const validInsights = parsed.filter(
              (i) =>
                i &&
                typeof i.category === 'string' &&
                typeof i.value === 'string' &&
                typeof i.confidence === 'number',
            );

            if (validInsights.length > 0) {
              return {
                tenantId,
                leadId,
                insights: validInsights,
                provenance: makeProvenance('ai', config.model, startMs),
              };
            }
          }
        } catch {
          // JSON parse failed — fall through to fallback
        }
      }
    }
  }

  // Fallback: keyword-based extraction
  const insights = extractKeywordInsights(conversationText);

  return {
    tenantId,
    leadId,
    insights,
    provenance: makeProvenance('fallback', null, startMs),
  };
}
