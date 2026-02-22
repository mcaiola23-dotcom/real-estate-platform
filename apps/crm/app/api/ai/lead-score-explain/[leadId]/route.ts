import type { TenantContext } from '@real-estate/types';
import { getLeadByIdForTenant, listActivitiesByTenantId } from '@real-estate/db/crm';
import { explainLeadScore } from '@real-estate/ai/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ leadId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface ScoreExplainDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getLeadByIdForTenant: typeof getLeadByIdForTenant;
  listActivitiesByTenantId: typeof listActivitiesByTenantId;
  explainLeadScore: typeof explainLeadScore;
}

const defaultDeps: ScoreExplainDeps = {
  requireTenantContext,
  getLeadByIdForTenant,
  listActivitiesByTenantId,
  explainLeadScore,
};

export function createScoreExplainGetHandler(deps: ScoreExplainDeps = defaultDeps) {
  return async function GET(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { leadId } = await context.params;
    const lead = await deps.getLeadByIdForTenant(tenantContext.tenantId, leadId);
    if (!lead) {
      return NextResponse.json({ ok: false, error: 'Lead not found.' }, { status: 404 });
    }

    const activities = await deps.listActivitiesByTenantId(tenantContext.tenantId, {
      leadId,
      limit: 100,
      offset: 0,
    });

    // Count listing signals from activities
    const favoriteCount = activities.filter((a) => a.activityType === 'listing_favorited').length;
    const viewCount = activities.filter((a) => a.activityType === 'listing_viewed').length;

    // Compute score locally (matching crm-scoring.ts)
    const score = computeQuickScore(activities, favoriteCount, viewCount, lead);

    const explanation = await deps.explainLeadScore(tenantContext.tenantId, {
      score: score.score,
      label: score.label,
      activities,
      lead,
      favoriteCount,
      viewCount,
    });

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      explanation,
    });
  };
}

// Lightweight score computation (server-side mirror of crm-scoring.ts)
function computeQuickScore(
  activities: Array<{ occurredAt: string; activityType: string }>,
  favoriteCount: number,
  viewCount: number,
  lead: { contactId: string | null; listingAddress: string | null; propertyType: string | null; timeframe: string | null },
): { score: number; label: string } {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  let recencyScore = 0;
  if (activities.length > 0) {
    const sorted = [...activities].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
    const last = new Date(sorted[0]!.occurredAt).getTime();
    const daysSince = (now - last) / (24 * 60 * 60 * 1000);
    recencyScore = Math.max(0, 100 - daysSince * 3.3);
  }

  const recentCount = activities.filter(
    (a) => now - new Date(a.occurredAt).getTime() < thirtyDays,
  ).length;
  const frequencyScore = Math.min(100, recentCount * 8);

  const favRatio = viewCount > 0 ? (favoriteCount / viewCount) * 100 : 0;
  const searchCount = activities.filter((a) => a.activityType === 'search_performed').length;
  const intentScore = favRatio * 0.6 + Math.min(100, searchCount * 12) * 0.4;

  let profileScore = 0;
  if (lead.listingAddress) profileScore += 30;
  if (lead.propertyType) profileScore += 20;
  if (lead.timeframe) profileScore += 20;
  if (lead.contactId) profileScore += 30;

  const total = Math.round(
    recencyScore * 0.25 + frequencyScore * 0.25 + intentScore * 0.3 + profileScore * 0.2,
  );
  const score = Math.max(0, Math.min(100, total));
  const label =
    score >= 80 ? 'Hot' : score >= 60 ? 'Warm' : score >= 40 ? 'Interested' : score >= 20 ? 'Cool' : 'Cold';

  return { score, label };
}

export const GET = createScoreExplainGetHandler();
