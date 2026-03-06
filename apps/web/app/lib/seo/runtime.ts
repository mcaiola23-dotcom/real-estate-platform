interface SeoRuntimeConfig {
  indexingEnabled: boolean;
  metadataBaseUrl: string;
}

function parseBooleanEnv(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function normalizeMetadataBaseUrl(
  candidates: Array<string | undefined>,
  fallback: string
): string {
  for (const candidate of [...candidates, fallback]) {
    const value = candidate?.trim();
    if (!value) {
      continue;
    }
    try {
      return new URL(value).origin;
    } catch {
      // Skip invalid URL candidates and continue fallback chain.
    }
  }
  return fallback;
}

export function getSeoRuntimeConfig(defaultMetadataBaseUrl: string): SeoRuntimeConfig {
  const isProduction = process.env.NODE_ENV === "production";
  const indexingFlagEnabled = parseBooleanEnv(process.env.SEO_ENABLE_INDEXING);
  const indexingEnabled = isProduction && indexingFlagEnabled;

  const metadataBaseUrl = normalizeMetadataBaseUrl(
    [process.env.SEO_METADATA_BASE_URL, process.env.NEXT_PUBLIC_SITE_URL],
    defaultMetadataBaseUrl
  );

  return {
    indexingEnabled,
    metadataBaseUrl,
  };
}
