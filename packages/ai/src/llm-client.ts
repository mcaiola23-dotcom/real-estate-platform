/**
 * LLM client abstraction.
 *
 * Wraps the OpenAI-compatible chat completions API with:
 * - Tenant-scoped rate limiting (in-memory token bucket)
 * - Timeout and error handling
 * - Graceful degradation (returns null on failure, never throws)
 */

import { getAiApiKey, getAiBaseUrl, getAiConfigForTenant } from './config';

// ---------------------------------------------------------------------------
// Rate limiter (in-memory token bucket per tenant)
// ---------------------------------------------------------------------------

const rateBuckets = new Map<string, { tokens: number; lastRefill: number }>();

function checkRateLimit(tenantId: string, limit: number): boolean {
  const now = Date.now();
  let bucket = rateBuckets.get(tenantId);

  if (!bucket) {
    bucket = { tokens: limit, lastRefill: now };
    rateBuckets.set(tenantId, bucket);
  }

  // Refill: 1 token per (60000 / limit) ms
  const elapsed = now - bucket.lastRefill;
  const refill = Math.floor(elapsed / (60000 / limit));
  if (refill > 0) {
    bucket.tokens = Math.min(limit, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) return false;

  bucket.tokens -= 1;
  return true;
}

// ---------------------------------------------------------------------------
// Completion call
// ---------------------------------------------------------------------------

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export async function callAiCompletion(
  tenantId: string,
  prompt: string,
  options: CompletionOptions = {},
): Promise<string | null> {
  const apiKey = getAiApiKey();
  if (!apiKey) return null;

  const config = getAiConfigForTenant(tenantId);
  if (!config.enabled) return null;

  if (!checkRateLimit(tenantId, config.rateLimitPerMinute)) {
    return null; // Rate limited — graceful degradation
  }

  const baseUrl = getAiBaseUrl();
  const timeoutMs = options.timeoutMs ?? 10000;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens ?? config.maxTokens,
        temperature: options.temperature ?? config.temperature,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    // Network error, timeout, etc. — graceful degradation
    return null;
  }
}
