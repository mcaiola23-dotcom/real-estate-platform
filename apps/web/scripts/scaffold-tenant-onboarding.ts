/**
 * Scaffold a new tenant website profile + onboarding artifacts.
 *
 * Usage (dry-run):
 *   node --import tsx scripts/scaffold-tenant-onboarding.ts \
 *     --slug westport \
 *     --brand-name "Westport Coastal Homes" \
 *     --agent-name "Jane Doe" \
 *     --email "jane@example.com" \
 *     --phone-display "203-555-1212" \
 *     --phone-e164 "+12035551212" \
 *     --primary-domain "westport.localhost"
 *
 * Usage (write files):
 *   node --import tsx scripts/scaffold-tenant-onboarding.ts ... --write
 *
 * Optional DB provisioning:
 *   node --import tsx scripts/scaffold-tenant-onboarding.ts ... --write --provision-db
 */

import fs from "fs";
import path from "path";

import { provisionTenant } from "@real-estate/db/control-plane";
import type { TenantWebsiteConfig, TenantWebsiteTownLink } from "@real-estate/types";

import { FAIRFIELD_TENANT_WEBSITE_CONFIG } from "../app/lib/tenant/configs/fairfield";

type ParsedArgs = Record<string, string | boolean>;

const SCRIPT_NAME = "tenant-onboard";
const INDEX_FILE_PATH = path.resolve(process.cwd(), "app/lib/tenant/configs/index.ts");

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2).trim();
    if (!key) {
      throw new Error(`Invalid option: ${token}`);
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function usage(): string {
  return [
    `Usage: ${SCRIPT_NAME} --slug <slug> --brand-name <brand> --agent-name <name> --email <email> --phone-display <display> --phone-e164 <e164> --primary-domain <domain> [options]`,
    "",
    "Options:",
    "  --write                  Write generated files (default is dry-run).",
    "  --force                  Overwrite existing generated tenant config file.",
    "  --provision-db           Provision tenant/domain/settings in DB using @real-estate/db.",
    "  --tenant-id <tenantId>   Override tenant id (default: tenant_<slug>).",
    "  --agent-first-name <x>   Override first name (default: first token of --agent-name).",
    "  --plan-code <code>       Plan code for provisioning payload (default: starter).",
    "  --feature-flags <a,b>    Comma-separated feature flags for provisioning payload.",
    "  --region-label <label>   Service area label (default: inherited baseline).",
    "  --state-code <code>      State code (default: inherited baseline).",
    "  --city-names <a,b>       Comma-separated service cities.",
    "  --featured-towns <name:slug,name:slug>",
    "                          Optional explicit featured towns.",
    "  --metadata-base-url <u>  SEO metadata base URL (default: https://<primary-domain>).",
    "  --brokerage-name <name>  Brokerage name (default: inherited baseline).",
    "  --brokerage-website-url <url>",
    "                          Brokerage website URL (default: inherited baseline).",
  ].join("\n");
}

function getStringArg(args: ParsedArgs, key: string, required = false): string | undefined {
  const value = args[key];
  if (typeof value !== "string") {
    if (required) {
      throw new Error(`Missing required option --${key}`);
    }
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    if (required) {
      throw new Error(`Option --${key} cannot be empty.`);
    }
    return undefined;
  }

  return trimmed;
}

function parseCsv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function slugifyLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toConstName(slug: string): string {
  return `${slug.replace(/[^a-z0-9]/g, "_").toUpperCase()}_TENANT_WEBSITE_CONFIG`;
}

function parseFeaturedTownPairs(value: string | undefined, fallbackCityNames: string[]): TenantWebsiteTownLink[] {
  if (!value) {
    return fallbackCityNames.slice(0, 5).map((name) => ({
      name,
      slug: slugifyLabel(name),
    }));
  }

  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (entries.length === 0) {
    return fallbackCityNames.slice(0, 5).map((name) => ({
      name,
      slug: slugifyLabel(name),
    }));
  }

  return entries.map((entry) => {
    const [nameRaw, slugRaw] = entry.split(":").map((part) => part?.trim());
    if (!nameRaw) {
      throw new Error(`Invalid featured town format: ${entry}. Expected name:slug.`);
    }

    const slug = slugRaw ? normalizeSlug(slugRaw) : normalizeSlug(nameRaw);
    if (!slug) {
      throw new Error(`Invalid featured town slug in: ${entry}.`);
    }

    return {
      name: nameRaw,
      slug,
    };
  });
}

function buildTenantConfig(input: {
  tenantId: string;
  tenantSlug: string;
  brandName: string;
  agentName: string;
  agentFirstName: string;
  email: string;
  phoneDisplay: string;
  phoneE164: string;
  primaryDomain: string;
  metadataBaseUrl: string;
  brokerageName: string;
  brokerageWebsiteUrl: string;
  regionLabel: string;
  stateCode: string;
  cityNames: string[];
  featuredTowns: TenantWebsiteTownLink[];
}): TenantWebsiteConfig {
  const fallback = FAIRFIELD_TENANT_WEBSITE_CONFIG;
  const regionLine = `${input.regionLabel}, ${input.stateCode}`;

  return {
    tenantId: input.tenantId,
    tenantSlug: input.tenantSlug,
    brandName: input.brandName,
    agentName: input.agentName,
    agentFirstName: input.agentFirstName,
    logos: {
      primary: {
        src: `/brand/${input.tenantSlug}-logo.png`,
        alt: input.brandName,
      },
      brokerage: {
        src: "/brand/higgins-lockup.jpg",
        alt: input.brokerageName,
      },
      headshot: {
        src: `/brand/${input.tenantSlug}-headshot.jpg`,
        alt: input.agentName,
      },
    },
    contact: {
      phoneDisplay: input.phoneDisplay,
      phoneE164: input.phoneE164,
      email: input.email,
    },
    brokerage: {
      name: input.brokerageName,
      websiteUrl: input.brokerageWebsiteUrl,
      address: {
        streetAddress: fallback.brokerage.address.streetAddress,
        city: fallback.brokerage.address.city,
        region: fallback.brokerage.address.region,
        postalCode: fallback.brokerage.address.postalCode,
        country: fallback.brokerage.address.country,
      },
      contactPhoneE164: input.phoneE164,
    },
    serviceArea: {
      regionLabel: input.regionLabel,
      stateCode: input.stateCode,
      cityNames: input.cityNames,
      featuredTowns: input.featuredTowns,
    },
    seo: {
      defaultTitle: `${input.agentName} | Real Estate | ${regionLine}`,
      titleTemplate: `%s | ${input.agentName} | ${input.regionLabel} Real Estate`,
      description: `${input.agentName} offers expert real estate guidance in ${regionLine}. Serving ${input.cityNames.join(
        ", "
      )}.`,
      metadataBaseUrl: input.metadataBaseUrl,
      siteName: input.brandName,
      openGraphImage: {
        src: "/visual/home/hero-1.jpg",
        alt: `${input.agentName} - ${input.regionLabel} real estate`,
      },
      keywords: [
        `${input.regionLabel} Real Estate`,
        `${input.stateCode} Realtor`,
        `${input.agentName} Real Estate`,
      ],
    },
    theme: fallback.theme,
    legal: {
      footerDescription: `Personalized real estate services in ${regionLine}. Your goals, my commitment.`,
      licensedWithLabel: `Licensed with ${input.brokerageName}`,
      equalHousingLabel: "Equal Housing Opportunity",
      designerLabel: fallback.legal.designerLabel,
      designerUrl: fallback.legal.designerUrl,
      rightsReservedLabel: "All rights reserved.",
    },
    cta: {
      contactAgentLabel: `Contact ${input.agentFirstName}`,
      callAgentLabel: `Call ${input.agentFirstName}`,
      homeValueLabel: "Home Value",
      homeSearchLabel: "Search",
    },
    content: {
      hero: {
        eyebrow: input.brandName,
        headline: `${input.regionLabel} Real Estate`,
        subheadline: `White-glove representation for buying, selling, and investing in ${regionLine}.`,
      },
      agentIntro: {
        eyebrow: `Your ${input.regionLabel} Expert`,
        summaryPrimary: `${input.agentName} combines local market knowledge with hands-on support for every client relationship.`,
        summarySecondary: `Whether you're buying, selling, or investing in ${input.regionLabel}, ${input.agentFirstName} manages the details so you can make confident decisions.`,
        aboutCtaLabel: `Learn More About ${input.agentFirstName}`,
      },
      footerCta: {
        heading: "Ready to make a move?",
        body: `Whether you're curious about your home's value or ready to tour properties, ${input.agentFirstName} is ready to help with the next step.`,
        primaryLabel: "Get Home Estimate",
        secondaryLabel: `Contact ${input.agentFirstName}`,
      },
      search: {
        pageTitle: `Home Search | ${input.regionLabel} Real Estate`,
        pageDescription: `Explore listings in ${input.regionLabel} with map-based browsing and thoughtful filters.`,
        listingInquiryTitle: `Contact ${input.agentFirstName}`,
        listingInquirySuccessTemplate: `Thanks for your interest in {address}. ${input.agentFirstName} will reach out to you shortly.`,
      },
    },
  };
}

function renderTenantConfigSource(constName: string, config: TenantWebsiteConfig): string {
  return [
    'import type { TenantWebsiteConfig } from "@real-estate/types";',
    "",
    `export const ${constName}: TenantWebsiteConfig = ${JSON.stringify(config, null, 2)};`,
    "",
  ].join("\n");
}

function upsertLineBetweenMarkers(source: string, startMarker: string, endMarker: string, line: string): string {
  const lines = source.split("\n");
  const startIndex = lines.findIndex((entry) => entry.trim() === startMarker);
  const endIndex = lines.findIndex((entry, index) => index > startIndex && entry.trim() === endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error(`Unable to update index file markers: ${startMarker} / ${endMarker}`);
  }

  const block = lines
    .slice(startIndex + 1, endIndex)
    .filter((entry) => entry.trim().length > 0);

  if (!block.includes(line)) {
    block.push(line);
    block.sort((a, b) => a.localeCompare(b));
  }

  return [...lines.slice(0, startIndex + 1), ...block, ...lines.slice(endIndex)].join("\n");
}

function buildOnboardingReadme(input: {
  tenantId: string;
  tenantSlug: string;
  primaryDomain: string;
  configFilePath: string;
  provisionPayloadPath: string;
}): string {
  const relativeConfigPath = path.relative(process.cwd(), input.configFilePath).replaceAll("\\", "/");
  const relativeProvisionPayloadPath = path
    .relative(process.cwd(), input.provisionPayloadPath)
    .replaceAll("\\", "/");

  return [
    `# Tenant Onboarding: ${input.tenantSlug}`,
    "",
    "1. Review and tailor the generated website config file:",
    `   - ${relativeConfigPath}`,
    "2. Add/replace tenant brand assets referenced by the config:",
    `   - /public/brand/${input.tenantSlug}-logo.png`,
    `   - /public/brand/${input.tenantSlug}-headshot.jpg`,
    "3. Provision the tenant in control-plane persistence (via Admin API or local script), using payload:",
    `   - ${relativeProvisionPayloadPath}`,
    "4. After importing/copying tenant-owned Sanity content, run tenant metadata backfill:",
    `   - npm run sanity:tenant-backfill --workspace @real-estate/web -- --tenant-id ${input.tenantId} --tenant-slug ${input.tenantSlug} --tenant-domain ${input.primaryDomain} --dry-run`,
    `   - npm run sanity:tenant-backfill --workspace @real-estate/web -- --tenant-id ${input.tenantId} --tenant-slug ${input.tenantSlug} --tenant-domain ${input.primaryDomain}`,
    "5. Validate web app quality gates:",
    "   - npm run lint --workspace @real-estate/web",
    "   - npx tsc --noEmit --project apps/web/tsconfig.json",
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help === true || args.h === true) {
    console.log(usage());
    return;
  }

  const slugInput = getStringArg(args, "slug", true)!;
  const tenantSlug = normalizeSlug(slugInput);
  if (!tenantSlug) {
    throw new Error("--slug must contain at least one alphanumeric character.");
  }

  const tenantId = getStringArg(args, "tenant-id") ?? `tenant_${tenantSlug}`;
  const brandName = getStringArg(args, "brand-name", true)!;
  const agentName = getStringArg(args, "agent-name", true)!;
  const agentFirstName =
    getStringArg(args, "agent-first-name") ?? agentName.split(/\s+/).filter(Boolean)[0] ?? agentName;
  const email = getStringArg(args, "email", true)!;
  const phoneDisplay = getStringArg(args, "phone-display", true)!;
  const phoneE164 = getStringArg(args, "phone-e164", true)!;
  const primaryDomain = getStringArg(args, "primary-domain", true)!.toLowerCase();
  if (!/^[a-z0-9.-]+$/.test(primaryDomain)) {
    throw new Error("--primary-domain may only include lowercase letters, numbers, dots, and hyphens.");
  }

  const regionLabel = getStringArg(args, "region-label") ?? FAIRFIELD_TENANT_WEBSITE_CONFIG.serviceArea.regionLabel;
  const stateCode = getStringArg(args, "state-code") ?? FAIRFIELD_TENANT_WEBSITE_CONFIG.serviceArea.stateCode;
  const cityNames = parseCsv(getStringArg(args, "city-names"));
  const resolvedCityNames = cityNames.length > 0 ? cityNames : FAIRFIELD_TENANT_WEBSITE_CONFIG.serviceArea.cityNames;
  const featuredTowns = parseFeaturedTownPairs(getStringArg(args, "featured-towns"), resolvedCityNames);

  const brokerageName = getStringArg(args, "brokerage-name") ?? FAIRFIELD_TENANT_WEBSITE_CONFIG.brokerage.name;
  const brokerageWebsiteUrl =
    getStringArg(args, "brokerage-website-url") ?? FAIRFIELD_TENANT_WEBSITE_CONFIG.brokerage.websiteUrl;
  const metadataBaseUrl = getStringArg(args, "metadata-base-url") ?? `https://${primaryDomain}`;

  const planCode = getStringArg(args, "plan-code") ?? "starter";
  const featureFlags = parseCsv(getStringArg(args, "feature-flags"));

  const shouldWrite = args.write === true;
  const forceOverwrite = args.force === true;
  const shouldProvisionDb = args["provision-db"] === true;

  const constName = toConstName(tenantSlug);
  const tenantConfig = buildTenantConfig({
    tenantId,
    tenantSlug,
    brandName,
    agentName,
    agentFirstName,
    email,
    phoneDisplay,
    phoneE164,
    primaryDomain,
    metadataBaseUrl,
    brokerageName,
    brokerageWebsiteUrl,
    regionLabel,
    stateCode,
    cityNames: resolvedCityNames,
    featuredTowns,
  });

  const configFilePath = path.resolve(process.cwd(), `app/lib/tenant/configs/${tenantSlug}.ts`);
  const onboardingDir = path.resolve(process.cwd(), `scripts/content/tenant-onboarding/${tenantSlug}`);
  const provisionPayloadPath = path.resolve(onboardingDir, "provision-request.json");
  const tenantDefaultsPath = path.resolve(onboardingDir, "sanity-tenant-defaults.json");
  const onboardingReadmePath = path.resolve(onboardingDir, "README.md");

  if (fs.existsSync(configFilePath) && !forceOverwrite) {
    throw new Error(`Tenant config already exists at ${configFilePath}. Use --force to overwrite.`);
  }

  const configSource = renderTenantConfigSource(constName, tenantConfig);

  const provisionPayload = {
    name: brandName,
    slug: tenantSlug,
    primaryDomain,
    planCode,
    featureFlags,
  };

  const tenantDefaults = {
    tenantId,
    tenantSlug,
    tenantDomain: primaryDomain,
  };

  const onboardingReadme = buildOnboardingReadme({
    tenantId,
    tenantSlug,
    primaryDomain,
    configFilePath,
    provisionPayloadPath,
  });

  let nextIndexSource = fs.readFileSync(INDEX_FILE_PATH, "utf8");
  nextIndexSource = upsertLineBetweenMarkers(
    nextIndexSource,
    "// tenant-config-imports-start",
    "// tenant-config-imports-end",
    `import { ${constName} } from "./${tenantSlug}";`
  );
  nextIndexSource = upsertLineBetweenMarkers(
    nextIndexSource,
    "// tenant-config-list-start",
    "// tenant-config-list-end",
    `  ${constName},`
  );

  if (!shouldWrite) {
    console.log("[tenant-onboard] dry-run; no files were written.");
    console.log(`[tenant-onboard] would write: ${path.relative(process.cwd(), configFilePath)}`);
    console.log(`[tenant-onboard] would update: ${path.relative(process.cwd(), INDEX_FILE_PATH)}`);
    console.log(`[tenant-onboard] would write: ${path.relative(process.cwd(), provisionPayloadPath)}`);
    console.log(`[tenant-onboard] would write: ${path.relative(process.cwd(), tenantDefaultsPath)}`);
    console.log(`[tenant-onboard] would write: ${path.relative(process.cwd(), onboardingReadmePath)}`);

    if (shouldProvisionDb) {
      console.log("[tenant-onboard] would provision tenant in DB (--provision-db).\n");
    }

    console.log("[tenant-onboard] generated provisioning payload preview:");
    console.log(JSON.stringify(provisionPayload, null, 2));
    return;
  }

  fs.mkdirSync(path.dirname(configFilePath), { recursive: true });
  fs.mkdirSync(onboardingDir, { recursive: true });

  fs.writeFileSync(configFilePath, configSource, "utf8");
  fs.writeFileSync(INDEX_FILE_PATH, nextIndexSource, "utf8");
  fs.writeFileSync(provisionPayloadPath, `${JSON.stringify(provisionPayload, null, 2)}\n`, "utf8");
  fs.writeFileSync(tenantDefaultsPath, `${JSON.stringify(tenantDefaults, null, 2)}\n`, "utf8");
  fs.writeFileSync(onboardingReadmePath, onboardingReadme, "utf8");

  console.log(`[tenant-onboard] wrote tenant config: ${path.relative(process.cwd(), configFilePath)}`);
  console.log(`[tenant-onboard] updated config registry: ${path.relative(process.cwd(), INDEX_FILE_PATH)}`);
  console.log(`[tenant-onboard] wrote onboarding artifacts: ${path.relative(process.cwd(), onboardingDir)}`);

  if (shouldProvisionDb) {
    console.log("[tenant-onboard] provisioning tenant in DB...");
    const snapshot = await provisionTenant({
      name: brandName,
      slug: tenantSlug,
      primaryDomain,
      planCode,
      featureFlags,
    });

    console.log(
      `[tenant-onboard] provisioned tenant: ${snapshot.tenant.id} (${snapshot.tenant.slug}) with ${snapshot.domains.length} domain(s)`
    );
  }

  console.log("[tenant-onboard] done.");
}

main().catch((error) => {
  console.error("[tenant-onboard] failed:", error instanceof Error ? error.message : error);
  console.error(usage());
  process.exitCode = 1;
});
