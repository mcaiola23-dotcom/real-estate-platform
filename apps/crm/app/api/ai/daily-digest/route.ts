import { listLeadsByTenantId, listActivitiesByTenantId } from '@real-estate/db/crm';
import type { TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface DigestRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listLeadsByTenantId: typeof listLeadsByTenantId;
  listActivitiesByTenantId: typeof listActivitiesByTenantId;
}

const defaultDeps: DigestRouteDeps = {
  requireTenantContext,
  listLeadsByTenantId,
  listActivitiesByTenantId,
};

export function createDailyDigestGetHandler(deps: DigestRouteDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const [leads, activities] = await Promise.all([
      deps.listLeadsByTenantId(tenantContext.tenantId, { limit: 200 }),
      deps.listActivitiesByTenantId(tenantContext.tenantId, { limit: 200 }),
    ]);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    interface DigestItem {
      type: 'overdue' | 'new_lead' | 'hot_lead' | 'milestone';
      label: string;
      detail: string;
      leadId?: string;
      priority: number;
    }

    const items: DigestItem[] = [];

    // New leads in last 24h
    const newLeads = leads.filter(
      (l) => l.status === 'new' && new Date(l.createdAt) >= oneDayAgo
    );
    for (const lead of newLeads) {
      items.push({
        type: 'new_lead',
        label: lead.listingAddress || 'New Lead',
        detail: `Created ${new Date(lead.createdAt).toLocaleTimeString()}`,
        leadId: lead.id,
        priority: 8,
      });
    }

    // Overdue follow-ups
    const overdueLeads = leads.filter(
      (l) =>
        l.status !== 'won' &&
        l.status !== 'lost' &&
        l.nextActionAt &&
        new Date(l.nextActionAt) < now
    );
    for (const lead of overdueLeads) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(lead.nextActionAt!).getTime()) / (1000 * 60 * 60 * 24)
      );
      items.push({
        type: 'overdue',
        label: lead.listingAddress || 'Lead',
        detail: `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
        leadId: lead.id,
        priority: 10,
      });
    }

    // Hot leads (qualified with recent activity)
    const hotLeads = leads.filter((l) => {
      if (l.status !== 'qualified') return false;
      const recentActivity = activities.find(
        (a) => a.leadId === l.id && new Date(a.occurredAt) >= twoDaysAgo
      );
      return !!recentActivity;
    });
    for (const lead of hotLeads) {
      items.push({
        type: 'hot_lead',
        label: lead.listingAddress || 'Hot Lead',
        detail: 'Qualified with recent activity',
        leadId: lead.id,
        priority: 7,
      });
    }

    // Milestones
    const recentWins = leads.filter(
      (l) => l.status === 'won' && l.closedAt && new Date(l.closedAt) >= oneDayAgo
    );
    for (const lead of recentWins) {
      items.push({
        type: 'milestone',
        label: lead.listingAddress || 'Deal Won',
        detail: 'Closed today',
        leadId: lead.id,
        priority: 5,
      });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      items: items.sort((a, b) => b.priority - a.priority).slice(0, 15),
      generatedAt: now.toISOString(),
    });
  };
}

export const GET = createDailyDigestGetHandler();
