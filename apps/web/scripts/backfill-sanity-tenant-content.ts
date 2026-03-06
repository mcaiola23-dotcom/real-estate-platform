/**
 * Backfill tenant metadata onto tenant-owned Sanity documents.
 *
 * Usage:
 *   node --import tsx apps/web/scripts/backfill-sanity-tenant-content.ts --dry-run
 *   node --import tsx apps/web/scripts/backfill-sanity-tenant-content.ts
 *
 * Optional tenant override:
 *   node --import tsx apps/web/scripts/backfill-sanity-tenant-content.ts \
 *     --tenant-id tenant_new \
 *     --tenant-slug new-tenant \
 *     --tenant-domain new-tenant.localhost \
 *     --types town,neighborhood,post,userProfile \
 *     --dry-run
 */

import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import { getDefaultTenantWebsiteConfig } from "../app/lib/tenant/website-profile";

type TenantOwnedDocType = "town" | "neighborhood" | "post" | "userProfile";

type TenantBackfillCandidate = {
  _id: string;
  tenantId?: string;
  tenantSlug?: string;
  tenantDomain?: string;
};

type ParsedArgs = Record<string, string | boolean>;

const TENANT_OWNED_DOC_TYPES: TenantOwnedDocType[] = ["town", "neighborhood", "post", "userProfile"];

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

function getStringArg(args: ParsedArgs, key: string): string | undefined {
  const value = args[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseDocTypes(value: string | undefined): TenantOwnedDocType[] {
  if (!value) {
    return TENANT_OWNED_DOC_TYPES;
  }

  const requested = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is TenantOwnedDocType => entry.length > 0 && TENANT_OWNED_DOC_TYPES.includes(entry as TenantOwnedDocType));

  const invalidRequested = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && !TENANT_OWNED_DOC_TYPES.includes(entry as TenantOwnedDocType));

  if (invalidRequested.length > 0) {
    throw new Error(`Invalid --types values: ${invalidRequested.join(", ")}. Allowed: ${TENANT_OWNED_DOC_TYPES.join(", ")}`);
  }

  if (requested.length === 0) {
    throw new Error(`No valid types provided via --types. Allowed: ${TENANT_OWNED_DOC_TYPES.join(", ")}`);
  }

  return requested;
}

function loadEnvFiles(): void {
  const envFiles = [".env.local", ".env"];
  for (const fileName of envFiles) {
    const envPath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(envPath)) {
      continue;
    }

    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const [rawKey, ...rawValues] = trimmed.split("=");
      const key = rawKey?.trim();
      if (!key || rawValues.length === 0 || process.env[key]) {
        continue;
      }

      process.env[key] = rawValues.join("=").trim().replace(/(^"|"$)/g, "");
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

async function getBackfillCandidates(
  client: ReturnType<typeof createClient>,
  docType: TenantOwnedDocType
): Promise<TenantBackfillCandidate[]> {
  if (docType === "userProfile") {
    return client.fetch(
      `*[
        _type == $docType &&
        (!defined(tenantId) || !defined(tenantSlug) || !defined(tenantDomain))
      ]{
        _id,
        tenantId,
        tenantSlug,
        tenantDomain
      }`,
      { docType }
    );
  }

  return client.fetch(
    `*[
      _type == $docType &&
      (!defined(tenantId) || !defined(tenantSlug))
    ]{
      _id,
      tenantId,
      tenantSlug
    }`,
    { docType }
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = args["dry-run"] === true;

  loadEnvFiles();

  const projectId = requireEnv("NEXT_PUBLIC_SANITY_PROJECT_ID");
  const dataset = requireEnv("NEXT_PUBLIC_SANITY_DATASET");
  const token = requireEnv("SANITY_API_WRITE_TOKEN");

  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2024-01-01",
    token,
    useCdn: false,
  });

  const defaultTenantWebsiteConfig = getDefaultTenantWebsiteConfig();
  const tenantId = getStringArg(args, "tenant-id") ?? defaultTenantWebsiteConfig.tenantId;
  const tenantSlug = getStringArg(args, "tenant-slug") ?? defaultTenantWebsiteConfig.tenantSlug;
  const tenantDomain =
    getStringArg(args, "tenant-domain") ??
    process.env.NEXT_PUBLIC_SITE_DOMAIN?.trim() ??
    `${defaultTenantWebsiteConfig.tenantSlug}.localhost`;
  const docTypes = parseDocTypes(getStringArg(args, "types"));

  let totalPatched = 0;
  let totalCandidates = 0;

  console.log(
    `[tenant-backfill] starting (${dryRun ? "dry-run" : "apply"}) for tenantId=${tenantId} tenantSlug=${tenantSlug} tenantDomain=${tenantDomain} types=${docTypes.join(",")}`
  );

  for (const docType of docTypes) {
    const candidates = await getBackfillCandidates(client, docType);
    totalCandidates += candidates.length;

    if (candidates.length === 0) {
      console.log(`[tenant-backfill] ${docType}: 0 candidates`);
      continue;
    }

    console.log(`[tenant-backfill] ${docType}: ${candidates.length} candidates`);

    for (const candidate of candidates) {
      const setFields: Record<string, string> = {};

      if (!candidate.tenantId) {
        setFields.tenantId = tenantId;
      }
      if (!candidate.tenantSlug) {
        setFields.tenantSlug = tenantSlug;
      }
      if (docType === "userProfile" && !candidate.tenantDomain) {
        setFields.tenantDomain = tenantDomain;
      }

      if (Object.keys(setFields).length === 0) {
        continue;
      }

      if (dryRun) {
        console.log(`[tenant-backfill] would patch ${docType}:${candidate._id} -> ${JSON.stringify(setFields)}`);
      } else {
        await client.patch(candidate._id).set(setFields).commit();
        console.log(`[tenant-backfill] patched ${docType}:${candidate._id}`);
      }

      totalPatched += 1;
    }
  }

  console.log(`[tenant-backfill] done. candidates=${totalCandidates} ${dryRun ? "would-patch" : "patched"}=${totalPatched}`);
}

main().catch((error) => {
  console.error("[tenant-backfill] failed:", error);
  process.exitCode = 1;
});
