const WEAK_SECRET_MARKERS = [
  "dev-secret-change-in-production-12345",
  "change-me",
  "placeholder",
  "example",
  "default",
];

function isNonLocalEnvironment(): boolean {
  const nodeEnv = (process.env.NODE_ENV ?? "development").toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV ?? "").toLowerCase();

  if (vercelEnv && vercelEnv !== "development") {
    return true;
  }

  return nodeEnv === "production" || nodeEnv === "staging";
}

function isWeakSecret(secret: string): boolean {
  const normalized = secret.trim().toLowerCase();
  if (normalized.length < 32) return true;
  return WEAK_SECRET_MARKERS.some((marker) => normalized.includes(marker));
}

export function assertPortalAuthSecretIsSafe(): void {
  if (!isNonLocalEnvironment()) {
    return;
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret?.trim()) {
    throw new Error("NEXTAUTH_SECRET is required in non-local environments.");
  }

  if (isWeakSecret(secret)) {
    throw new Error(
      "NEXTAUTH_SECRET is too weak or placeholder-like for non-local environments."
    );
  }
}
