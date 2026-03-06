const PLACEHOLDER_PATTERNS = [
  'changeme',
  'replace',
  'example',
  'placeholder',
  'your_',
  '<',
  'todo',
];

function isPlaceholderValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return PLACEHOLDER_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function isEnabled(value: string | undefined): boolean {
  return value === 'true';
}

function shouldValidateStrictly(): boolean {
  const explicit = process.env.WEB_RUNTIME_VALIDATE_ENV;
  if (explicit === 'true') {
    return true;
  }
  if (explicit === 'false') {
    return false;
  }
  return process.env.NODE_ENV === 'production';
}

let cachedRuntimeEnvError: string | null | undefined;

export function getWebsiteRuntimeEnvError(): string | null {
  if (cachedRuntimeEnvError !== undefined) {
    return cachedRuntimeEnvError;
  }

  if (!shouldValidateStrictly()) {
    cachedRuntimeEnvError = null;
    return cachedRuntimeEnvError;
  }

  const requiredEnvVars = [
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET',
    'NEXT_PUBLIC_SANITY_API_VERSION',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'SANITY_API_WRITE_TOKEN',
  ] as const;

  const missingVars: string[] = [];
  const placeholderVars: string[] = [];

  for (const name of requiredEnvVars) {
    const value = process.env[name];
    if (!value || !value.trim()) {
      missingVars.push(name);
      continue;
    }
    if (isPlaceholderValue(value)) {
      placeholderVars.push(name);
    }
  }

  if (isEnabled(process.env.DATA_ENABLE_GOOGLE_PLACES) && !process.env.GOOGLE_MAPS_API_KEY) {
    missingVars.push('GOOGLE_MAPS_API_KEY (required when DATA_ENABLE_GOOGLE_PLACES=true)');
  }

  if (isEnabled(process.env.DATA_ENABLE_WALKSCORE) && !process.env.WALKSCORE_API_KEY) {
    missingVars.push('WALKSCORE_API_KEY (required when DATA_ENABLE_WALKSCORE=true)');
  }

  if (isEnabled(process.env.WEB_API_REQUIRE_BOT_TOKEN) && !process.env.WEB_API_ALLOWED_ORIGINS) {
    missingVars.push('WEB_API_ALLOWED_ORIGINS (required when WEB_API_REQUIRE_BOT_TOKEN=true)');
  }

  const usingIdxProvider = process.env.NEXT_PUBLIC_LISTINGS_PROVIDER?.trim().toLowerCase() === 'idx';
  const idxFallbackDisabled = process.env.NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK === 'false';
  if (usingIdxProvider && idxFallbackDisabled) {
    if (!process.env.IDX_BRIDGE_URL?.trim()) {
      missingVars.push('IDX_BRIDGE_URL (required when NEXT_PUBLIC_LISTINGS_PROVIDER=idx and fallback is disabled)');
    }
    if (!process.env.IDX_BRIDGE_TOKEN?.trim()) {
      missingVars.push('IDX_BRIDGE_TOKEN (required when NEXT_PUBLIC_LISTINGS_PROVIDER=idx and fallback is disabled)');
    }
  }

  if (missingVars.length === 0 && placeholderVars.length === 0) {
    cachedRuntimeEnvError = null;
    return cachedRuntimeEnvError;
  }

  const parts: string[] = [];
  if (missingVars.length > 0) {
    parts.push(`Missing env vars: ${missingVars.join(', ')}`);
  }
  if (placeholderVars.length > 0) {
    parts.push(`Placeholder env values: ${placeholderVars.join(', ')}`);
  }

  cachedRuntimeEnvError = parts.join(' | ');
  return cachedRuntimeEnvError;
}
