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
