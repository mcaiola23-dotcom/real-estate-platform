import type { TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface NlRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
}

const defaultDeps: NlRouteDeps = { requireTenantContext };

/**
 * Natural language query endpoint.
 * Parses user queries like "show me leads from Zillow" or "leads not contacted in 2 weeks"
 * and returns structured filter/navigation intent.
 */
export function createNlQueryPostHandler(deps: NlRouteDeps = defaultDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const payload = (await request.json().catch(() => null)) as { query?: string } | null;
    if (!payload?.query?.trim()) {
      return NextResponse.json({ ok: false, error: 'query is required.' }, { status: 400 });
    }

    const query = payload.query.trim().toLowerCase();

    // Rule-based NL parsing (AI integration can be added later)
    const intent = parseNaturalLanguageQuery(query);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      intent,
    });
  };
}

interface NlIntent {
  action: 'filter' | 'navigate' | 'search';
  view?: string;
  filters?: Record<string, string>;
  searchTerm?: string;
  description: string;
}

function parseNaturalLanguageQuery(query: string): NlIntent {
  // Source-based queries
  const sourceMatch = query.match(/(?:from|source)\s+(zillow|realtor|facebook|google|instagram|referral|website)/i);
  if (sourceMatch) {
    return {
      action: 'filter',
      view: 'leads',
      filters: { source: sourceMatch[1].toLowerCase() },
      description: `Filtering leads from ${sourceMatch[1]}`,
    };
  }

  // Status-based queries
  const statusMatch = query.match(/(?:show|find|get)\s+(?:me\s+)?(?:all\s+)?(new|qualified|nurturing|won|lost)\s+leads/i);
  if (statusMatch) {
    return {
      action: 'filter',
      view: 'leads',
      filters: { status: statusMatch[1].toLowerCase() },
      description: `Showing ${statusMatch[1]} leads`,
    };
  }

  // Time-based queries
  if (query.includes('not contacted') || query.includes('no contact')) {
    const daysMatch = query.match(/(\d+)\s*(day|week|month)/i);
    let days = 14;
    if (daysMatch) {
      const num = parseInt(daysMatch[1], 10);
      const unit = daysMatch[2].toLowerCase();
      days = unit === 'week' ? num * 7 : unit === 'month' ? num * 30 : num;
    }
    return {
      action: 'filter',
      view: 'leads',
      filters: { noContactDays: String(days) },
      description: `Leads not contacted in ${days} days`,
    };
  }

  // Overdue follow-ups
  if (query.includes('overdue') || query.includes('follow up') || query.includes('followup')) {
    return {
      action: 'filter',
      view: 'leads',
      filters: { overdue: 'true' },
      description: 'Leads with overdue follow-ups',
    };
  }

  // Navigation queries
  if (query.includes('dashboard')) return { action: 'navigate', view: 'dashboard', description: 'Going to dashboard' };
  if (query.includes('pipeline')) return { action: 'navigate', view: 'pipeline', description: 'Going to pipeline' };
  if (query.includes('analytics')) return { action: 'navigate', view: 'analytics', description: 'Going to analytics' };
  if (query.includes('campaign')) return { action: 'navigate', view: 'campaigns', description: 'Going to campaigns' };
  if (query.includes('settings')) return { action: 'navigate', view: 'settings', description: 'Going to settings' };

  // Fallback to search
  return {
    action: 'search',
    searchTerm: query,
    description: `Searching for "${query}"`,
  };
}

export const POST = createNlQueryPostHandler();
