/**
 * Tenant-scoped AI configuration with sensible defaults.
 *
 * In production, config would be loaded from TenantControlSettings.
 * For now, provides in-memory defaults with per-tenant override support.
 */

import type { AiTenantConfig, AiTonePreset } from './types';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_MAX_TOKENS = 512;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_RATE_LIMIT = 30; // requests per minute per tenant
const DEFAULT_TONE: AiTonePreset = 'professional';

const defaultConfig: Omit<AiTenantConfig, 'tenantId'> = {
  enabled: true,
  model: DEFAULT_MODEL,
  maxTokens: DEFAULT_MAX_TOKENS,
  temperature: DEFAULT_TEMPERATURE,
  rateLimitPerMinute: DEFAULT_RATE_LIMIT,
  tonePreset: DEFAULT_TONE,
};

// ---------------------------------------------------------------------------
// Tenant config store (in-memory; production: DB-backed)
// ---------------------------------------------------------------------------

const tenantOverrides = new Map<string, Partial<Omit<AiTenantConfig, 'tenantId'>>>();

export function getAiConfigForTenant(tenantId: string): AiTenantConfig {
  const overrides = tenantOverrides.get(tenantId) ?? {};
  return {
    tenantId,
    ...defaultConfig,
    ...overrides,
  };
}

export function setAiConfigOverride(
  tenantId: string,
  overrides: Partial<Omit<AiTenantConfig, 'tenantId'>>,
): void {
  const existing = tenantOverrides.get(tenantId) ?? {};
  tenantOverrides.set(tenantId, { ...existing, ...overrides });
}

// ---------------------------------------------------------------------------
// AI service availability check
// ---------------------------------------------------------------------------

export function isAiServiceAvailable(): boolean {
  // In production, check for API key and service health.
  // For MVP, AI enhancement is opt-in — rule-based fallback is always available.
  return !!getAiApiKey();
}

export function getAiApiKey(): string | null {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY ?? null;
  }
  return null;
}

export function getAiBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env?.AI_BASE_URL) {
    return process.env.AI_BASE_URL;
  }
  return 'https://api.openai.com/v1';
}
