'use client';

import { memo, useMemo, useState } from 'react';
import type { CrmContact, CrmLead } from '@real-estate/types/crm';
import { computeLeadEscalationLevel } from '@real-estate/ai/crm/escalation-engine';
import { formatTimeAgo } from '../../lib/crm-formatters';
import { SpeedToLeadTimer } from './SpeedToLeadTimer';

type ActionTab = 'overdue' | 'today' | 'unclaimed';

interface ActionCenterProps {
  greeting: string;
  agentName: string;
  leads: CrmLead[];
  activities: { id: string; occurredAt: string }[];
  contactById: Map<string, CrmContact>;
  onOpenLead: (leadId: string) => void;
  /** Quick stats */
  newThisWeek: number;
  followUpsToday: number;
  pipelineDeals: number;
  onClickNewThisWeek?: () => void;
  onClickFollowUps?: () => void;
  onClickPipelineDeals?: () => void;
}

/**
 * Consolidated Action Center — replaces MyDayPanel, EscalationAlertBanner,
 * Unclaimed Leads, and Urgent Follow-Ups with a single tabbed section.
 */
export const ActionCenter = memo(function ActionCenter({
  greeting,
  agentName,
  leads,
  activities,
  contactById,
  onOpenLead,
  newThisWeek,
  followUpsToday,
  pipelineDeals,
  onClickNewThisWeek,
  onClickFollowUps,
  onClickPipelineDeals,
}: ActionCenterProps) {
  const [activeTab, setActiveTab] = useState<ActionTab>('overdue');
  const [hotLeadsCollapsed, setHotLeadsCollapsed] = useState(true);

  // ── Overdue leads (deduplicated) ──
  const overdueLeads = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const seen = new Set<string>();
    const result: Array<{
      lead: CrmLead;
      contact: CrmContact | undefined;
      escalationLevel: number;
      daysOverdue: number;
      reason: string;
    }> = [];

    for (const lead of leads) {
      if (lead.status === 'won' || lead.status === 'lost') continue;
      if (seen.has(lead.id)) continue;

      const esc = computeLeadEscalationLevel(lead);
      const isOverdue = lead.nextActionAt && new Date(lead.nextActionAt).getTime() <= now.getTime();

      if (esc.level >= 1 || isOverdue) {
        seen.add(lead.id);
        const contact = lead.contactId ? contactById.get(lead.contactId) : undefined;
        result.push({
          lead,
          contact,
          escalationLevel: esc.level,
          daysOverdue: esc.daysOverdue,
          reason: esc.level >= 3 ? 'Critical' : esc.level >= 2 ? 'Action Required' : isOverdue ? 'Overdue' : 'Needs Attention',
        });
      }
    }

    return result
      .sort((a, b) => b.escalationLevel - a.escalationLevel || b.daysOverdue - a.daysOverdue)
      .slice(0, 8);
  }, [leads, contactById]);

  // ── Today's follow-ups ──
  const todayLeads = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return leads
      .filter((l) => {
        if (l.status === 'won' || l.status === 'lost') return false;
        if (!l.nextActionAt) return false;
        const d = new Date(l.nextActionAt).getTime();
        return d >= startOfToday.getTime() && d <= endOfToday.getTime();
      })
      .map((lead) => ({
        lead,
        contact: lead.contactId ? contactById.get(lead.contactId) : undefined,
      }))
      .slice(0, 8);
  }, [leads, contactById]);

  // ── Unclaimed leads (new, no first contact) ──
  const unclaimedLeads = useMemo(() => {
    return leads
      .filter((l) => l.status === 'new' && !l.lastContactAt)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 8);
  }, [leads]);

  // ── Hot leads (recent activity in last 3 days) ──
  const hotLeads = useMemo(() => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const recentLeadIds = new Set<string>();

    for (const a of activities) {
      if (new Date(a.occurredAt).getTime() >= threeDaysAgo && 'leadId' in a && (a as { leadId?: string }).leadId) {
        recentLeadIds.add((a as { leadId?: string }).leadId!);
      }
    }

    return leads
      .filter((l) => recentLeadIds.has(l.id) && l.status !== 'won' && l.status !== 'lost')
      .slice(0, 5);
  }, [leads, activities]);

  const tabCounts = {
    overdue: overdueLeads.length,
    today: todayLeads.length,
    unclaimed: unclaimedLeads.length,
  };

  const tabs: Array<{ id: ActionTab; label: string; badgeClass: string }> = [
    { id: 'overdue', label: 'Overdue', badgeClass: 'crm-action-center__tab-badge--overdue' },
    { id: 'today', label: 'Today', badgeClass: 'crm-action-center__tab-badge--today' },
    { id: 'unclaimed', label: 'Unclaimed', badgeClass: 'crm-action-center__tab-badge--unclaimed' },
  ];

  return (
    <section className="crm-action-center crm-panel crm-panel--primary" aria-label="Action Center">
      {/* Greeting row */}
      <div className="crm-action-center__greeting">
        <div>
          <h3 className="crm-action-center__hello">{greeting}, {agentName || 'there'}</h3>
        </div>
        <div className="crm-action-center__stats">
          <button type="button" className="crm-action-center__stat crm-action-center__stat--clickable" onClick={onClickNewThisWeek}>
            <strong>{newThisWeek}</strong> new this week
          </button>
          <button type="button" className="crm-action-center__stat crm-action-center__stat--clickable" onClick={onClickFollowUps}>
            <strong>{followUpsToday}</strong> follow-ups today
          </button>
          <button type="button" className="crm-action-center__stat crm-action-center__stat--clickable" onClick={onClickPipelineDeals}>
            <strong>{pipelineDeals}</strong> pipeline deals
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="crm-action-center__tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`crm-action-center__tab ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tabCounts[tab.id] > 0 && (
              <span className={`crm-action-center__tab-badge ${tab.badgeClass}`}>
                {tabCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="crm-action-center__list" role="tabpanel">
        {activeTab === 'overdue' && (
          overdueLeads.length === 0 ? (
            <p className="crm-action-center__empty">All caught up — no overdue items.</p>
          ) : (
            <ul>
              {overdueLeads.map(({ lead, contact, escalationLevel, daysOverdue, reason }) => (
                <li key={lead.id} className="crm-action-center__item">
                  <span className={`crm-action-center__dot crm-action-center__dot--level-${Math.min(escalationLevel, 4)}`} />
                  <button type="button" className="crm-action-center__lead-name" onClick={() => onOpenLead(lead.id)}>
                    {contact?.fullName || lead.listingAddress || 'Lead'}
                  </button>
                  <span className={`crm-action-center__reason crm-action-center__reason--${escalationLevel >= 3 ? 'critical' : escalationLevel >= 2 ? 'warning' : 'info'}`}>
                    {reason}
                  </span>
                  <span className="crm-muted">
                    {daysOverdue > 0 ? `${daysOverdue}d overdue` : lead.nextActionAt ? formatTimeAgo(lead.nextActionAt) : ''}
                  </span>
                </li>
              ))}
            </ul>
          )
        )}

        {activeTab === 'today' && (
          todayLeads.length === 0 ? (
            <p className="crm-action-center__empty">No follow-ups scheduled for today.</p>
          ) : (
            <ul>
              {todayLeads.map(({ lead, contact }) => (
                <li key={lead.id} className="crm-action-center__item">
                  <span className="crm-action-center__dot crm-action-center__dot--today" />
                  <button type="button" className="crm-action-center__lead-name" onClick={() => onOpenLead(lead.id)}>
                    {contact?.fullName || lead.listingAddress || 'Lead'}
                  </button>
                  <span className="crm-muted">
                    {lead.nextActionNote || 'Follow-up scheduled'}
                  </span>
                </li>
              ))}
            </ul>
          )
        )}

        {activeTab === 'unclaimed' && (
          unclaimedLeads.length === 0 ? (
            <p className="crm-action-center__empty">No unclaimed leads right now.</p>
          ) : (
            <div className="crm-unclaimed-leads-list">
              {unclaimedLeads.map((lead) => (
                <SpeedToLeadTimer
                  key={lead.id}
                  lead={lead}
                  contactById={contactById}
                  onClaim={(leadId) => onOpenLead(leadId)}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Hot leads row */}
      {hotLeads.length > 0 && (
        <div className="crm-action-center__hot">
          <button
            type="button"
            className="crm-action-center__hot-toggle"
            onClick={() => setHotLeadsCollapsed(!hotLeadsCollapsed)}
          >
            Hot leads ({hotLeads.length}) {hotLeadsCollapsed ? '▸' : '▾'}
          </button>
          {!hotLeadsCollapsed && (
            <div className="crm-action-center__hot-chips">
              {hotLeads.map((lead) => {
                const contact = lead.contactId ? contactById.get(lead.contactId) : undefined;
                return (
                  <button
                    key={lead.id}
                    type="button"
                    className="crm-action-center__hot-chip"
                    onClick={() => onOpenLead(lead.id)}
                  >
                    {contact?.fullName || lead.listingAddress || 'Lead'}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
});
