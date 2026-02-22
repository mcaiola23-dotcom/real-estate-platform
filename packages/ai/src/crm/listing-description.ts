/**
 * AI Listing Description Generator — creates MLS-ready property descriptions.
 *
 * Rule-based fallback assembles a structured description from property data.
 * AI enhancement generates polished editorial copy with tone control.
 */

import type { AiProvenance } from '../types';
import { callAiCompletion } from '../llm-client';
import { getAiConfigForTenant } from '../config';
import { PROMPT_VERSIONS } from '../prompts/crm-prompts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ListingDescriptionTone =
  | 'luxury'
  | 'family-friendly'
  | 'investment-focused'
  | 'first-time-buyer';

export interface ListingDescriptionInput {
  address: string;
  propertyType: string;
  beds: number;
  baths: number;
  sqft: number;
  lotAcres?: number | null;
  price?: number | null;
  features: string[]; // e.g. ["updated kitchen", "pool", "waterfront"]
  agentNotes?: string | null;
  tone: ListingDescriptionTone;
}

export interface ListingDescriptionResult {
  tenantId: string;
  description: string;
  wordCount: number;
  tone: ListingDescriptionTone;
  provenance: AiProvenance;
}

// ---------------------------------------------------------------------------
// Tone labels
// ---------------------------------------------------------------------------

const TONE_LABELS: Record<ListingDescriptionTone, string> = {
  'luxury': 'luxury and sophistication',
  'family-friendly': 'warm family appeal',
  'investment-focused': 'investment value and ROI',
  'first-time-buyer': 'accessible and welcoming for first-time buyers',
};

// ---------------------------------------------------------------------------
// Feature descriptions for fallback
// ---------------------------------------------------------------------------

const FEATURE_PHRASES: Record<string, string> = {
  'updated kitchen': 'a beautifully updated kitchen',
  'pool': 'a private pool',
  'waterfront': 'stunning waterfront views',
  'garage': 'an attached garage',
  'fireplace': 'a cozy fireplace',
  'hardwood floors': 'gleaming hardwood floors',
  'open floor plan': 'an open-concept floor plan',
  'new roof': 'a recently replaced roof',
  'finished basement': 'a finished basement',
  'central air': 'central air conditioning',
  'deck': 'an expansive deck',
  'patio': 'a private patio',
  'walk-in closet': 'generous walk-in closets',
  'stainless appliances': 'stainless steel appliances',
  'granite countertops': 'granite countertops',
  'smart home': 'smart home technology',
  'wine cellar': 'a wine cellar',
  'home office': 'a dedicated home office',
  'mudroom': 'a practical mudroom',
  'solar panels': 'energy-efficient solar panels',
};

// ---------------------------------------------------------------------------
// Fallback description (rule-based)
// ---------------------------------------------------------------------------

function buildFallbackDescription(input: ListingDescriptionInput): string {
  const parts: string[] = [];

  // Opening
  const typeLabel = input.propertyType.replace(/-/g, ' ');
  parts.push(`Welcome to ${input.address}.`);
  parts.push(`This ${input.beds}-bedroom, ${input.baths}-bathroom ${typeLabel} offers ${input.sqft.toLocaleString()} square feet of living space.`);

  if (input.lotAcres && input.lotAcres > 0) {
    parts.push(`Set on ${input.lotAcres} acres.`);
  }

  // Features
  if (input.features.length > 0) {
    const described = input.features.map((f) => {
      const lower = f.toLowerCase().trim();
      return FEATURE_PHRASES[lower] ?? f;
    });

    if (described.length === 1) {
      parts.push(`Highlights include ${described[0]}.`);
    } else if (described.length === 2) {
      parts.push(`Highlights include ${described[0]} and ${described[1]}.`);
    } else {
      const last = described.pop();
      parts.push(`Highlights include ${described.join(', ')}, and ${last}.`);
    }
  }

  // Tone-specific closing
  switch (input.tone) {
    case 'luxury':
      parts.push('A rare opportunity for discerning buyers seeking refined living.');
      break;
    case 'family-friendly':
      parts.push('An ideal setting for creating lasting family memories.');
      break;
    case 'investment-focused':
      parts.push('A strong investment opportunity in a desirable location.');
      break;
    case 'first-time-buyer':
      parts.push('A wonderful place to call home — perfect for first-time buyers.');
      break;
  }

  if (input.agentNotes) {
    parts.push(input.agentNotes);
  }

  if (input.price) {
    parts.push(`Offered at $${input.price.toLocaleString()}.`);
  }

  parts.push('Schedule your private showing today.');

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// AI prompt
// ---------------------------------------------------------------------------

function buildListingDescriptionPrompt(input: ListingDescriptionInput): string {
  const lines = [
    `You are a professional real estate copywriter. Write an MLS-ready property description (150-300 words) with a tone of ${TONE_LABELS[input.tone]}.`,
    '',
    `Property: ${input.address}`,
    `Type: ${input.propertyType.replace(/-/g, ' ')}`,
    `Specs: ${input.beds} beds, ${input.baths} baths, ${input.sqft.toLocaleString()} sqft`,
  ];

  if (input.lotAcres) lines.push(`Lot: ${input.lotAcres} acres`);
  if (input.price) lines.push(`Price: $${input.price.toLocaleString()}`);
  if (input.features.length > 0) lines.push(`Features: ${input.features.join(', ')}`);
  if (input.agentNotes) lines.push(`Agent notes: ${input.agentNotes}`);

  lines.push('');
  lines.push('Write compelling, professional copy. Do not use excessive exclamation marks. Avoid phrases like "welcome home" as an opening. Focus on what makes this property special.');
  lines.push('');
  lines.push('Respond as JSON: { "description": "..." }');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateListingDescription(
  tenantId: string,
  input: ListingDescriptionInput,
): Promise<ListingDescriptionResult> {
  const startMs = Date.now();
  const config = getAiConfigForTenant(tenantId);

  // Try AI generation
  const prompt = buildListingDescriptionPrompt(input);
  const raw = await callAiCompletion(tenantId, prompt, { maxTokens: 600 });

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { description?: string };
      if (parsed.description) {
        const wordCount = parsed.description.split(/\s+/).length;
        return {
          tenantId,
          description: parsed.description,
          wordCount,
          tone: input.tone,
          provenance: {
            source: 'ai',
            model: config.model,
            promptVersion: PROMPT_VERSIONS.LISTING_DESCRIPTION,
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

  // Fallback: rule-based description
  const description = buildFallbackDescription(input);
  const wordCount = description.split(/\s+/).length;

  return {
    tenantId,
    description,
    wordCount,
    tone: input.tone,
    provenance: {
      source: 'fallback',
      model: null,
      promptVersion: PROMPT_VERSIONS.LISTING_DESCRIPTION,
      generatedAt: new Date().toISOString(),
      latencyMs: Date.now() - startMs,
      cached: false,
    },
  };
}
