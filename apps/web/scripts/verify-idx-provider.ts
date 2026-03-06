interface ProbeRequest {
  action: "listNeighborhoods" | "searchListings";
  payload: Record<string, unknown>;
}

function getBaseUrl(): string {
  return process.env.WEB_VERIFY_BASE_URL || "http://localhost:3105";
}

function expectConfigured(): boolean {
  return process.env.IDX_VERIFY_EXPECT_CONFIGURED !== "false";
}

function getTownSlugs(): string[] | undefined {
  const raw = process.env.IDX_VERIFY_TOWN_SLUGS;
  if (!raw) {
    return undefined;
  }
  const slugs = raw
    .split(",")
    .map((slug) => slug.trim())
    .filter((slug) => slug.length > 0);
  return slugs.length > 0 ? slugs : undefined;
}

async function postProbe(baseUrl: string, request: ProbeRequest) {
  const response = await fetch(new URL("/api/listings/provider", baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
    },
    body: JSON.stringify(request),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { response, data };
}

function getErrorMessage(data: unknown): string {
  if (data && typeof data === "object" && "error" in data) {
    const value = (data as { error?: unknown }).error;
    if (typeof value === "string") {
      return value;
    }
  }
  return "";
}

function isBridgeNotConfiguredError(errorMessage: string): boolean {
  return errorMessage.toLowerCase().includes("idx bridge is not configured");
}

function isOkEnvelope(data: unknown): boolean {
  if (!data || typeof data !== "object") {
    return false;
  }
  const value = (data as { ok?: unknown }).ok;
  return value === true;
}

async function main() {
  const baseUrl = getBaseUrl();
  const configured = expectConfigured();
  const townSlugs = getTownSlugs();
  const probes: ProbeRequest[] = [
    {
      action: "listNeighborhoods",
      payload: townSlugs ? { townSlugs } : {},
    },
    {
      action: "searchListings",
      payload: {
        scope: "global",
        pageSize: 1,
      },
    },
  ];

  console.log(`[verify-idx-provider] Base URL: ${baseUrl}`);
  console.log(`[verify-idx-provider] Expect configured IDX bridge: ${configured}`);

  let hasFailures = false;

  for (const probe of probes) {
    const { response, data } = await postProbe(baseUrl, probe);
    const status = response.status;
    const errorMessage = getErrorMessage(data);

    if (configured) {
      const ok = status === 200 && isOkEnvelope(data);
      const marker = ok ? "PASS" : "FAIL";
      console.log(
        `[verify-idx-provider] ${marker} ${probe.action} status=${status}${errorMessage ? ` error="${errorMessage}"` : ""}`
      );
      if (!ok) {
        hasFailures = true;
      }
      continue;
    }

    const expectedNotConfigured = status === 503 && isBridgeNotConfiguredError(errorMessage);
    const marker = expectedNotConfigured ? "PASS" : "FAIL";
    console.log(
      `[verify-idx-provider] ${marker} ${probe.action} status=${status}${errorMessage ? ` error="${errorMessage}"` : ""}`
    );
    if (!expectedNotConfigured) {
      hasFailures = true;
    }
  }

  if (hasFailures) {
    console.error("[verify-idx-provider] Probe validation failed.");
    process.exit(1);
  }

  console.log("[verify-idx-provider] Probe validation passed.");
}

main().catch((error) => {
  console.error("[verify-idx-provider] Unexpected error:", error);
  process.exit(1);
});

export {};
