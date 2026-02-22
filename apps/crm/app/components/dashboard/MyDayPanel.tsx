'use client';

import { memo, useState } from 'react';
import type { CrmLead, CrmContact, CrmActivity } from '@real-estate/types/crm';

interface MyDayPanelProps {
  greeting: string;
  agentName: string;
  leads: CrmLead[];
  activities: CrmActivity[];
  contactById: Map<string, CrmContact>;
  onOpenLead: (leadId: string) => void;
}

function getLeadLabel(lead: CrmLead, contactById: Map<string, CrmContact>): string {
  if (lead.contactId) {
    const contact = contactById.get(lead.contactId);
    if (contact?.fullName) return contact.fullName;
  }
  return lead.listingAddress || 'Lead';
}

function formatDueDate(dateStr: string): string {
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays}d`;
}

export const MyDayPanel = memo(function MyDayPanel({
  greeting,
  agentName,
  leads,
  activities,
  contactById,
  onOpenLead,
}: MyDayPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const now = new Date();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const overdueLeads = leads.filter((l) => {
    if (!l.nextActionAt || l.status === 'won' || l.status === 'lost') return false;
    return new Date(l.nextActionAt).getTime() < startOfToday.getTime();
  });

  const todayLeads = leads.filter((l) => {
    if (!l.nextActionAt || l.status === 'won' || l.status === 'lost') return false;
    const d = new Date(l.nextActionAt);
    return d.getTime() >= startOfToday.getTime() && d.getTime() <= endOfToday.getTime();
  });

  const hotLeads = leads
    .filter((l) => {
      if (l.status === 'won' || l.status === 'lost') return false;
      const recentActivity = activities.find(
        (a) => a.leadId === l.id && new Date(a.occurredAt).getTime() > now.getTime() - 3 * 24 * 60 * 60 * 1000
      );
      return !!recentActivity;
    })
    .filter((l) => !overdueLeads.includes(l) && !todayLeads.includes(l))
    .slice(0, 5);

  // Quick stats
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newLeadsThisWeek = leads.filter(
    (l) => new Date(l.createdAt).getTime() > oneWeekAgo.getTime()
  ).length;
  const followUpsToday = todayLeads.length + overdueLeads.length;
  const pipelineDeals = leads.filter(
    (l) => l.status !== 'won' && l.status !== 'lost' && l.status !== 'new'
  ).length;

  const hasItems = overdueLeads.length > 0 || todayLeads.length > 0 || hotLeads.length > 0;

  return (
    <section className={`crm-myday ${collapsed ? 'crm-myday--collapsed' : ''}`}>
      <div className="crm-myday__header">
        <div className="crm-myday__greeting">
          <h2 className="crm-myday__title">{greeting}{agentName ? `, ${agentName}` : ''}</h2>
          <div className="crm-myday__stats">
            <span className="crm-myday__stat">
              <strong>{newLeadsThisWeek}</strong> new this week
            </span>
            <span className="crm-myday__stat-sep" />
            <span className="crm-myday__stat">
              <strong>{followUpsToday}</strong> follow-ups today
            </span>
            <span className="crm-myday__stat-sep" />
            <span className="crm-myday__stat">
              <strong>{pipelineDeals}</strong> pipeline deals
            </span>
          </div>
        </div>
        <button
          className="crm-myday__toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand My Day' : 'Collapse My Day'}
        >
          {collapsed ? '▸' : '▾'}
        </button>
      </div>

      {!collapsed && hasItems && (
        <div className="crm-myday__body">
          {overdueLeads.length > 0 && (
            <div className="crm-myday__section crm-myday__section--overdue">
              <h3 className="crm-myday__section-title">
                Overdue
                <span className="crm-myday__section-count">{overdueLeads.length}</span>
              </h3>
              <ul className="crm-myday__list">
                {overdueLeads.slice(0, 5).map((lead) => (
                  <li key={lead.id} className="crm-myday__item">
                    <button
                      type="button"
                      className="crm-myday__item-link"
                      onClick={() => onOpenLead(lead.id)}
                    >
                      <span className="crm-myday__item-name">{getLeadLabel(lead, contactById)}</span>
                      <span className="crm-myday__item-note">{lead.nextActionNote || 'Follow-up needed'}</span>
                      {lead.nextActionAt && (
                        <span className="crm-myday__item-due crm-myday__item-due--overdue">
                          {formatDueDate(lead.nextActionAt)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {todayLeads.length > 0 && (
            <div className="crm-myday__section crm-myday__section--today">
              <h3 className="crm-myday__section-title">
                Today
                <span className="crm-myday__section-count">{todayLeads.length}</span>
              </h3>
              <ul className="crm-myday__list">
                {todayLeads.slice(0, 5).map((lead) => (
                  <li key={lead.id} className="crm-myday__item">
                    <button
                      type="button"
                      className="crm-myday__item-link"
                      onClick={() => onOpenLead(lead.id)}
                    >
                      <span className="crm-myday__item-name">{getLeadLabel(lead, contactById)}</span>
                      <span className="crm-myday__item-note">{lead.nextActionNote || 'Follow-up scheduled'}</span>
                      <span className="crm-myday__item-due crm-myday__item-due--today">Today</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hotLeads.length > 0 && (
            <div className="crm-myday__section crm-myday__section--hot">
              <h3 className="crm-myday__section-title">
                Hot Leads
                <span className="crm-myday__section-count">{hotLeads.length}</span>
              </h3>
              <ul className="crm-myday__list">
                {hotLeads.map((lead) => (
                  <li key={lead.id} className="crm-myday__item">
                    <button
                      type="button"
                      className="crm-myday__item-link"
                      onClick={() => onOpenLead(lead.id)}
                    >
                      <span className="crm-myday__item-name">{getLeadLabel(lead, contactById)}</span>
                      <span className="crm-myday__item-note">Recent activity detected</span>
                      <span className="crm-myday__item-due crm-myday__item-due--hot">Active</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!collapsed && !hasItems && (
        <div className="crm-myday__empty">
          All caught up. No overdue follow-ups or hot leads today.
        </div>
      )}
    </section>
  );
});
