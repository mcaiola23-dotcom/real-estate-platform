/**
 * AI Market Digest — generates weekly market briefings from listing data.
 *
 * Rule-based baseline computes market stats from available listings.
 * AI enhancement generates natural-language editorial narrative.
 */

import type { AiProvenance } from '../types';
import { callAiCompletion } from '../llm-client';
import { getAiConfigForTenant } from '../config';
import { PROMPT_VERSIONS } from '../prompts/crm-prompts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketDigestListing {
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: string;
  propertyType: string;
  city: string;
  listedAt: string;
  updatedAt: string;
}

export interface MarketDigestInput {
  listings: MarketDigestListing[];
  agentName: string | null;
  territory: string | null; // e.g. "Fairfield County, CT"
}

export interface MarketStats {
  totalActive: number;
  totalPending: number;
  totalSold: number;
  medianPrice: number | null;
  averagePrice: number | null;
  medianSqft: number | null;
  pricePerSqft: number | null;
  newListingsThisWeek: number;
  priceRange: { min: number; max: number } | null;
  byPropertyType: Record<string, number>;
  byCity: Record<string, number>;
  highestPrice: { price: number; city: string } | null;
  lowestPrice: { price: number; city: string } | null;
}

export interface MarketDigestResult {
  tenantId: string;
  stats: MarketStats;
  narrative: string;
  highlights: string[];
  agentTakeaway: string | null;
  provenance: AiProvenance;
}

// ---------------------------------------------------------------------------
// Stats computation (deterministic)
// ---------------------------------------------------------------------------

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeMarketStats(listings: MarketDigestListing[]): MarketStats {
  const active = listings.filter((l) => l.status === 'active');
  const pending = listings.filter((l) => l.status === 'pending');
  const sold = listings.filter((l) => l.status === 'sold');

  const activePrices = active.map((l) => l.price);
  const activeSqft = active.map((l) => l.sqft).filter((s) => s > 0);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = listings.filter((l) => new Date(l.listedAt).getTime() >= weekAgo);

  const byPropertyType: Record<string, number> = {};
  const byCity: Record<string, number> = {};
  for (const l of active) {
    byPropertyType[l.propertyType] = (byPropertyType[l.propertyType] ?? 0) + 1;
    byCity[l.city] = (byCity[l.city] ?? 0) + 1;
  }

  const medPrice = median(activePrices);
  const avgPrice = activePrices.length > 0
    ? Math.round(activePrices.reduce((s, p) => s + p, 0) / activePrices.length)
    : null;
  const medSqft = median(activeSqft);
  const ppsf = medPrice && medSqft ? Math.round(medPrice / medSqft) : null;

  let highestPrice: MarketStats['highestPrice'] = null;
  let lowestPrice: MarketStats['lowestPrice'] = null;
  if (active.length > 0) {
    const sorted = [...active].sort((a, b) => b.price - a.price);
    highestPrice = { price: sorted[0].price, city: sorted[0].city };
    lowestPrice = { price: sorted[sorted.length - 1].price, city: sorted[sorted.length - 1].city };
  }

  return {
    totalActive: active.length,
    totalPending: pending.length,
    totalSold: sold.length,
    medianPrice: medPrice,
    averagePrice: avgPrice,
    medianSqft: medSqft,
    pricePerSqft: ppsf,
    newListingsThisWeek: newThisWeek.length,
    priceRange: activePrices.length > 0
      ? { min: Math.min(...activePrices), max: Math.max(...activePrices) }
      : null,
    byPropertyType,
    byCity,
    highestPrice,
    lowestPrice,
  };
}

// ---------------------------------------------------------------------------
// Fallback narrative (rule-based)
// ---------------------------------------------------------------------------

function buildFallbackNarrative(stats: MarketStats, territory: string | null): {
  narrative: string;
  highlights: string[];
  agentTakeaway: string | null;
} {
  const area = territory || 'the local market';
  const parts: string[] = [];
  const highlights: string[] = [];

  parts.push(`${area} currently has ${stats.totalActive} active listing${stats.totalActive !== 1 ? 's' : ''}.`);

  if (stats.totalPending > 0) {
    parts.push(`${stats.totalPending} ${stats.totalPending === 1 ? 'property is' : 'properties are'} pending.`);
  }

  if (stats.medianPrice) {
    parts.push(`The median asking price is $${stats.medianPrice.toLocaleString()}.`);
    highlights.push(`Median price: $${stats.medianPrice.toLocaleString()}`);
  }

  if (stats.pricePerSqft) {
    highlights.push(`Price per sq ft: $${stats.pricePerSqft}`);
  }

  if (stats.newListingsThisWeek > 0) {
    highlights.push(`${stats.newListingsThisWeek} new listing${stats.newListingsThisWeek !== 1 ? 's' : ''} this week`);
  }

  if (stats.highestPrice) {
    highlights.push(`Highest: $${stats.highestPrice.price.toLocaleString()} in ${stats.highestPrice.city}`);
  }

  const cityNames = Object.keys(stats.byCity);
  if (cityNames.length > 1) {
    parts.push(`Listings span ${cityNames.length} communities: ${cityNames.join(', ')}.`);
  }

  return {
    narrative: parts.join(' '),
    highlights,
    agentTakeaway: stats.totalActive > 0
      ? 'Review new listings and share relevant matches with active leads.'
      : 'No active listings available. Consider expanding search criteria for clients.',
  };
}

// ---------------------------------------------------------------------------
// AI-enhanced narrative
// ---------------------------------------------------------------------------

function buildMarketDigestPrompt(stats: MarketStats, territory: string | null, agentName: string | null): string {
  const area = territory || 'the local market';
  const agent = agentName || 'Agent';

  const lines = [
    `You are a luxury real estate market analyst. Write a brief, insightful weekly market digest for ${agent} covering ${area}.`,
    '',
    'Market data:',
    `- Active listings: ${stats.totalActive}`,
    `- Pending: ${stats.totalPending}`,
    `- Sold: ${stats.totalSold}`,
  ];

  if (stats.medianPrice) lines.push(`- Median price: $${stats.medianPrice.toLocaleString()}`);
  if (stats.averagePrice) lines.push(`- Average price: $${stats.averagePrice.toLocaleString()}`);
  if (stats.pricePerSqft) lines.push(`- Price/sqft: $${stats.pricePerSqft}`);
  if (stats.newListingsThisWeek > 0) lines.push(`- New this week: ${stats.newListingsThisWeek}`);
  if (stats.priceRange) lines.push(`- Price range: $${stats.priceRange.min.toLocaleString()} – $${stats.priceRange.max.toLocaleString()}`);

  const cities = Object.entries(stats.byCity).map(([c, n]) => `${c}: ${n}`);
  if (cities.length > 0) lines.push(`- By city: ${cities.join(', ')}`);

  const types = Object.entries(stats.byPropertyType).map(([t, n]) => `${t}: ${n}`);
  if (types.length > 0) lines.push(`- By type: ${types.join(', ')}`);

  lines.push('');
  lines.push('Respond as JSON: { "narrative": "3-4 sentence editorial summary", "highlights": ["3-5 bullet points"], "agentTakeaway": "1 sentence actionable recommendation" }');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateMarketDigest(
  tenantId: string,
  input: MarketDigestInput,
): Promise<MarketDigestResult> {
  const startMs = Date.now();
  const config = getAiConfigForTenant(tenantId);
  const stats = computeMarketStats(input.listings);

  // Try AI enhancement
  const prompt = buildMarketDigestPrompt(stats, input.territory, input.agentName);
  const raw = await callAiCompletion(tenantId, prompt, { maxTokens: 600 });

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        narrative?: string;
        highlights?: string[];
        agentTakeaway?: string;
      };
      if (parsed.narrative) {
        return {
          tenantId,
          stats,
          narrative: parsed.narrative,
          highlights: parsed.highlights ?? [],
          agentTakeaway: parsed.agentTakeaway ?? null,
          provenance: {
            source: 'ai',
            model: config.model,
            promptVersion: PROMPT_VERSIONS.MARKET_DIGEST,
            generatedAt: new Date().toISOString(),
            latencyMs: Date.now() - startMs,
            cached: false,
          },
        };
      }
    } catch {
      // JSON parse failed — fall through to fallback
    }
  }

  // Fallback: rule-based narrative
  const fallback = buildFallbackNarrative(stats, input.territory);
  return {
    tenantId,
    stats,
    narrative: fallback.narrative,
    highlights: fallback.highlights,
    agentTakeaway: fallback.agentTakeaway,
    provenance: {
      source: 'fallback',
      model: null,
      promptVersion: PROMPT_VERSIONS.MARKET_DIGEST,
      generatedAt: new Date().toISOString(),
      latencyMs: Date.now() - startMs,
      cached: false,
    },
  };
}
