type CheckResult = {
  path: string;
  status: number;
  ok: boolean;
  detail: string;
};

interface EndpointCheck {
  path: string;
  expectedStatus?: number;
  mustInclude?: string;
}

function getBaseUrl(): string {
  return process.env.WEB_VERIFY_BASE_URL || "http://localhost:3105";
}

function getExpectedBaseUrl(): string | null {
  const raw = process.env.SEO_VERIFY_EXPECT_BASE_URL;
  if (!raw) {
    return null;
  }
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function getTownSlug(): string {
  return process.env.WEB_VERIFY_TOWN_SLUG || "greenwich";
}

function getExpectedIndexing(): boolean {
  return process.env.SEO_VERIFY_EXPECT_INDEXING === "true";
}

async function runCheck(baseUrl: string, check: EndpointCheck): Promise<CheckResult> {
  const expectedStatus = check.expectedStatus ?? 200;
  const url = new URL(check.path, baseUrl).toString();
  const response = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
  });
  const body = await response.text();

  if (response.status !== expectedStatus) {
    return {
      path: check.path,
      status: response.status,
      ok: false,
      detail: `Expected status ${expectedStatus}, got ${response.status}`,
    };
  }

  if (check.mustInclude && !body.includes(check.mustInclude)) {
    return {
      path: check.path,
      status: response.status,
      ok: false,
      detail: `Response missing expected marker: ${check.mustInclude}`,
    };
  }

  return {
    path: check.path,
    status: response.status,
    ok: true,
    detail: "OK",
  };
}

function validateRobots(
  robotsBody: string,
  expectIndexing: boolean,
  expectedBaseUrl: string | null
): string[] {
  const errors: string[] = [];
  const disallowAll = /^Disallow:\s*\/\s*$/m.test(robotsBody);
  const hasSitemap = /(^|\n)Sitemap:\s+/m.test(robotsBody);

  if (expectIndexing && disallowAll) {
    errors.push("robots.txt is blocking all crawling while indexing is expected.");
  }
  if (!expectIndexing && !disallowAll) {
    errors.push("robots.txt is not blocking all crawling while indexing is expected to be disabled.");
  }

  if (expectIndexing && !hasSitemap) {
    errors.push("robots.txt is missing sitemap entry while indexing is expected.");
  }
  if (expectIndexing && expectedBaseUrl) {
    const expectedSitemap = `${expectedBaseUrl}/sitemap.xml`;
    if (!robotsBody.includes(expectedSitemap)) {
      errors.push(`robots.txt is missing expected sitemap URL: ${expectedSitemap}`);
    }
  }

  return errors;
}

function validateSitemap(
  sitemapBody: string,
  expectIndexing: boolean,
  expectedBaseUrl: string | null
): string[] {
  const errors: string[] = [];
  const hasUrlLoc = /<loc>[\s\S]*<\/loc>/.test(sitemapBody);

  if (!expectIndexing && hasUrlLoc) {
    errors.push("sitemap.xml includes URLs while indexing is expected to be disabled.");
  }
  if (expectIndexing && !hasUrlLoc) {
    errors.push("sitemap.xml does not include URLs while indexing is expected.");
  }

  if (expectIndexing && expectedBaseUrl && !sitemapBody.includes(expectedBaseUrl)) {
    errors.push(`sitemap.xml does not contain expected base URL: ${expectedBaseUrl}`);
  }

  return errors;
}

function validateLlmManifest(
  llmJsonBody: string,
  expectIndexing: boolean,
  expectedBaseUrl: string | null
): string[] {
  const errors: string[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(llmJsonBody) as unknown;
  } catch {
    return ["llm.json payload is not valid JSON."];
  }

  if (!parsed || typeof parsed !== "object") {
    return ["llm.json payload is not an object."];
  }

  const root = parsed as Record<string, unknown>;
  const seo = root.seo as Record<string, unknown> | undefined;
  const indexingEnabled = seo?.indexingEnabled;
  const metadataBaseUrl = seo?.metadataBaseUrl;

  if (typeof indexingEnabled !== "boolean") {
    errors.push("llm.json missing boolean `seo.indexingEnabled`.");
  } else if (indexingEnabled !== expectIndexing) {
    errors.push(
      `llm.json indexingEnabled mismatch: expected ${expectIndexing}, got ${indexingEnabled}.`
    );
  }

  if (expectedBaseUrl) {
    if (typeof metadataBaseUrl !== "string") {
      errors.push("llm.json missing string `seo.metadataBaseUrl`.");
    } else {
      const normalized = metadataBaseUrl.endsWith("/")
        ? metadataBaseUrl.slice(0, -1)
        : metadataBaseUrl;
      if (normalized !== expectedBaseUrl) {
        errors.push(
          `llm.json metadataBaseUrl mismatch: expected ${expectedBaseUrl}, got ${normalized}.`
        );
      }
    }
  }

  return errors;
}

async function main() {
  const baseUrl = getBaseUrl();
  const expectedBaseUrl = getExpectedBaseUrl();
  const townSlug = getTownSlug();
  const expectIndexing = getExpectedIndexing();
  const checks: EndpointCheck[] = [
    { path: "/robots.txt", mustInclude: "User-Agent:" },
    { path: "/sitemap.xml", mustInclude: "<urlset" },
    { path: "/llms.txt", mustInclude: "LLM Content Directory" },
    { path: "/.well-known/llms.txt", mustInclude: "LLM Content Directory" },
    { path: "/.well-known/llm.json", mustInclude: "\"schemaVersion\"" },
    { path: "/api/content/agent.md", mustInclude: "# " },
    { path: "/api/content/market.md", mustInclude: "# " },
    { path: `/api/content/towns/${townSlug}`, mustInclude: "Real Estate Overview" },
    { path: "/home-search", mustInclude: "noindex, follow" },
  ];

  console.log(`[verify-seo-aeo] Base URL: ${baseUrl}`);
  console.log(`[verify-seo-aeo] Expected indexing enabled: ${expectIndexing}`);
  if (expectedBaseUrl) {
    console.log(`[verify-seo-aeo] Expected metadata base URL: ${expectedBaseUrl}`);
  }
  console.log(`[verify-seo-aeo] Town slug: ${townSlug}`);

  const results = await Promise.all(checks.map((check) => runCheck(baseUrl, check)));
  let hasFailures = false;

  for (const result of results) {
    const marker = result.ok ? "PASS" : "FAIL";
    console.log(`[verify-seo-aeo] ${marker} ${result.path} (status=${result.status}) - ${result.detail}`);
    if (!result.ok) {
      hasFailures = true;
    }
  }

  const byPath = new Map(results.map((result) => [result.path, result]));
  const robots = byPath.get("/robots.txt");
  const sitemap = byPath.get("/sitemap.xml");
  const llmJson = byPath.get("/.well-known/llm.json");

  if (robots?.ok) {
    const robotsUrl = new URL("/robots.txt", baseUrl).toString();
    const robotsBody = await fetch(robotsUrl, { cache: "no-store" }).then((res) => res.text());
    for (const error of validateRobots(robotsBody, expectIndexing, expectedBaseUrl)) {
      hasFailures = true;
      console.log(`[verify-seo-aeo] FAIL /robots.txt (status=${robots.status}) - ${error}`);
    }
  }

  if (sitemap?.ok) {
    const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();
    const sitemapBody = await fetch(sitemapUrl, { cache: "no-store" }).then((res) => res.text());
    for (const error of validateSitemap(sitemapBody, expectIndexing, expectedBaseUrl)) {
      hasFailures = true;
      console.log(`[verify-seo-aeo] FAIL /sitemap.xml (status=${sitemap.status}) - ${error}`);
    }
  }

  if (llmJson?.ok) {
    const llmJsonUrl = new URL("/.well-known/llm.json", baseUrl).toString();
    const llmJsonBody = await fetch(llmJsonUrl, { cache: "no-store" }).then((res) => res.text());
    for (const error of validateLlmManifest(llmJsonBody, expectIndexing, expectedBaseUrl)) {
      hasFailures = true;
      console.log(`[verify-seo-aeo] FAIL /.well-known/llm.json (status=${llmJson.status}) - ${error}`);
    }
  }

  if (hasFailures) {
    console.error("[verify-seo-aeo] One or more endpoint checks failed.");
    process.exit(1);
  }

  console.log("[verify-seo-aeo] All endpoint checks passed.");
}

main().catch((error) => {
  console.error("[verify-seo-aeo] Unexpected error:", error);
  process.exit(1);
});

export {};
