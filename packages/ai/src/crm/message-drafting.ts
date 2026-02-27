/**
 * Communication drafting service with tone presets and fallback templates.
 */

import { getAiConfigForTenant, isAiServiceAvailable } from '../config';
import { callAiCompletion } from '../llm-client';
import {
  buildDraftMessageFallback,
  buildDraftMessagePrompt,
  PROMPT_VERSIONS,
  type DraftMessageContext,
} from '../prompts/crm-prompts';
import type { AiProvenance, DraftMessageInput, DraftMessageResult } from '../types';

function makeProvenance(
  source: AiProvenance['source'],
  model: string | null,
  startMs: number,
): AiProvenance {
  return {
    source,
    model,
    promptVersion: PROMPT_VERSIONS.DRAFT_MESSAGE,
    generatedAt: new Date().toISOString(),
    latencyMs: Date.now() - startMs,
    cached: false,
  };
}

export async function draftMessage(
  input: DraftMessageInput & {
    agentName?: string | null;
    leadStatus?: string;
    recentActivities?: string[];
    propertyInterest?: string | null;
  },
): Promise<DraftMessageResult> {
  const startMs = Date.now();

  const ctx: DraftMessageContext = {
    contactName: input.contactName,
    agentName: input.agentName ?? null,
    messageType: input.messageType,
    tone: input.tone,
    context: input.context,
    leadStatus: input.leadStatus ?? 'unknown',
    recentActivities: input.recentActivities ?? [],
    propertyInterest: input.propertyInterest ?? null,
  };

  if (isAiServiceAvailable()) {
    const config = getAiConfigForTenant(input.tenantId);
    if (config.enabled) {
      const prompt = buildDraftMessagePrompt(ctx);
      const aiResult = await callAiCompletion(input.tenantId, prompt, {
        maxTokens: 400,
        temperature: 0.7,
      });

      if (aiResult) {
        try {
          const parsed = JSON.parse(aiResult) as {
            subject?: string;
            body?: string;
          };

          if (parsed.body) {
            return {
              subject: parsed.subject ?? null,
              body: parsed.body,
              tone: input.tone,
              provenance: makeProvenance('ai', config.model, startMs),
            };
          }
        } catch {
          // JSON parse failed — fall through to fallback
        }
      }
    }
  }

  const fallback = buildDraftMessageFallback(ctx);

  return {
    subject: fallback.subject,
    body: fallback.body,
    tone: input.tone,
    provenance: makeProvenance('fallback', null, startMs),
  };
}

/**
 * Generate multiple draft variations for the same context.
 * Returns 2-3 drafts with slightly different approaches.
 */
export async function draftMultipleMessages(
  input: DraftMessageInput & {
    agentName?: string | null;
    leadStatus?: string;
    recentActivities?: string[];
    propertyInterest?: string | null;
    communicationHistory?: string[];
    count?: number;
  },
): Promise<DraftMessageResult[]> {
  const count = Math.min(Math.max(input.count ?? 3, 1), 3);
  const toneVariations: DraftMessageInput['tone'][] = ['professional', 'friendly', 'casual'];

  const results: DraftMessageResult[] = [];
  // First draft uses requested tone
  results.push(await draftMessage(input));

  // Additional drafts use different tones
  for (let i = 1; i < count; i++) {
    const altTone = toneVariations[i % toneVariations.length];
    if (altTone === input.tone) continue;
    results.push(await draftMessage({ ...input, tone: altTone }));
  }

  return results;
}

/**
 * Draft a message starting from a template as the base.
 */
export async function draftFromTemplate(
  input: DraftMessageInput & {
    agentName?: string | null;
    leadStatus?: string;
    recentActivities?: string[];
    propertyInterest?: string | null;
    communicationHistory?: string[];
    templateBody: string;
    templateSubject?: string | null;
  },
): Promise<DraftMessageResult> {
  const startMs = Date.now();

  const ctx: DraftMessageContext = {
    contactName: input.contactName,
    agentName: input.agentName ?? null,
    messageType: input.messageType,
    tone: input.tone,
    context: input.context || 'Personalize this template for the lead',
    leadStatus: input.leadStatus ?? 'unknown',
    recentActivities: input.recentActivities ?? [],
    propertyInterest: input.propertyInterest ?? null,
    communicationHistory: input.communicationHistory,
    templateBase: input.templateBody,
  };

  if (isAiServiceAvailable()) {
    const config = getAiConfigForTenant(input.tenantId);
    if (config.enabled) {
      const prompt = buildDraftMessagePrompt(ctx);
      const aiResult = await callAiCompletion(input.tenantId, prompt, {
        maxTokens: 500,
        temperature: 0.6,
      });

      if (aiResult) {
        try {
          const parsed = JSON.parse(aiResult) as { subject?: string; body?: string };
          if (parsed.body) {
            return {
              subject: parsed.subject ?? input.templateSubject ?? null,
              body: parsed.body,
              tone: input.tone,
              provenance: makeProvenance('ai', config.model, startMs),
            };
          }
        } catch {
          // Fall through
        }
      }
    }
  }

  // Fallback: return template as-is
  return {
    subject: input.templateSubject ?? null,
    body: input.templateBody,
    tone: input.tone,
    provenance: makeProvenance('fallback', null, startMs),
  };
}
