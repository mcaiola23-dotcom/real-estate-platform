type RateLimitPolicy = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_STORE_KEY = "__portalRateLimitStore__";

const POLICIES = {
  aiSearch: { windowMs: 60_000, maxRequests: 20 },
  authCredentials: { windowMs: 60_000, maxRequests: 10 },
  authRegister: { windowMs: 60_000, maxRequests: 6 },
  leadSubmit: { windowMs: 60_000, maxRequests: 15 },
  leadRead: { windowMs: 60_000, maxRequests: 30 },
  favorites: { windowMs: 60_000, maxRequests: 120 },
  savedSearches: { windowMs: 60_000, maxRequests: 80 },
  alerts: { windowMs: 60_000, maxRequests: 60 },
} as const;

type PolicyName = keyof typeof POLICIES;

function getStore(): Map<string, Bucket> {
  const globalWithStore = globalThis as typeof globalThis & {
    [RATE_LIMIT_STORE_KEY]?: Map<string, Bucket>;
  };

  if (!globalWithStore[RATE_LIMIT_STORE_KEY]) {
    globalWithStore[RATE_LIMIT_STORE_KEY] = new Map<string, Bucket>();
  }

  return globalWithStore[RATE_LIMIT_STORE_KEY]!;
}

function resolveClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) return firstIp.trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return "unknown";
}

export function makeRateLimitKey(args: {
  scope: string;
  headers: Headers;
  method?: string;
  identity?: string | null;
}): string {
  const method = (args.method ?? "GET").toUpperCase();
  const ip = resolveClientIp(args.headers);
  const identity = args.identity?.trim() ? args.identity.trim() : "anon";
  return `${args.scope}:${method}:${ip}:${identity}`;
}

export function enforceRateLimit(args: {
  key: string;
  policy: RateLimitPolicy;
  now?: number;
}): RateLimitResult {
  const now = args.now ?? Date.now();
  const store = getStore();
  const existing = store.get(args.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + args.policy.windowMs;
    store.set(args.key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: args.policy.maxRequests,
      remaining: Math.max(args.policy.maxRequests - 1, 0),
      resetAt,
    };
  }

  const nextCount = existing.count + 1;
  existing.count = nextCount;
  store.set(args.key, existing);

  const allowed = nextCount <= args.policy.maxRequests;
  return {
    allowed,
    limit: args.policy.maxRequests,
    remaining: Math.max(args.policy.maxRequests - nextCount, 0),
    resetAt: existing.resetAt,
  };
}

export function enforceNamedRateLimit(args: {
  policyName: PolicyName;
  key: string;
  now?: number;
}): RateLimitResult {
  return enforceRateLimit({
    key: args.key,
    policy: POLICIES[args.policyName],
    now: args.now,
  });
}

export function getNamedRateLimitPolicy(policyName: PolicyName): RateLimitPolicy {
  return POLICIES[policyName];
}

export type { PolicyName, RateLimitPolicy, RateLimitResult };
