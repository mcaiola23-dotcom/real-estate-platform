'use client';

import { memo, useMemo } from 'react';
import type { CrmActivity, CrmContact, CrmLead } from '@real-estate/types/crm';
import { computeLeadEscalationLevel } from '@real-estate/ai/crm/escalation-engine';
import { formatTimeAgo } from '../../lib/crm-formatters';

interface NeedsAttentionProps {
  leads: CrmLead[];
  activities: CrmActivity[];
  contactById: Map<string, CrmContact>;
  onOpenLead: (leadId: string) => void;
}

interface AttentionItem {
  lead: CrmLead;
  contactName: string;
  reason: string;
  reasonType: 'stale' | 'aging' | 'escalated' | 'untouched';
  sortKey: number;
}

/**
 * Compact "Needs Attention" list for the dashboard — shows 5-8 actionable leads.
 * Priority: (1) stale overdue, (2) aging new, (3) high escalation, (4) least recently touched.
 */
export const NeedsAttention = memo(function NeedsAttention({
  leads,
  activities,
  contactById,
  onOpenLead,
}: NeedsAttentionProps) {
  const items = useMemo(() => {
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Build last-activity-time map
    const lastActivityByLead = new Map<string, number>();
    for (const a of activities) {
      if (!a.leadId) continue;
      const t = new Date(a.occurredAt).getTime();
      const prev = lastActivityByLead.get(a.leadId) ?? 0;
      if (t > prev) lastActivityByLead.set(a.leadId, t);
    }

    const result: AttentionItem[] = [];

    for (const lead of leads) {
      if (lead.status === 'won' || lead.status === 'lost') continue;

      const contact = lead.contactId ? contactById.get(lead.contactId) : undefined;
      const contactName = contact?.fullName || lead.listingAddress || 'Lead';
      const esc = computeLeadEscalationLevel(lead);
      const lastActivity = lastActivityByLead.get(lead.id) ?? new Date(lead.createdAt).getTime();
      const daysSinceActivity = (now - lastActivity) / oneDayMs;
      const ageMs = now - new Date(lead.createdAt).getTime();

      // (1) Stale overdue: has nextActionAt in the past AND no activity in 3 days
      if (lead.nextActionAt && new Date(lead.nextActionAt).getTime() < now && (now - lastActivity) > threeDaysMs) {
        result.push({ lead, contactName, reason: `No activity in ${Math.floor(daysSinceActivity)}d`, reasonType: 'stale', sortKey: 400 + daysSinceActivity });
        continue;
      }

      // (2) Aging new leads (>24h in 'new' status)
      if (lead.status === 'new' && ageMs > oneDayMs) {
        const hoursOld = Math.floor(ageMs / (60 * 60 * 1000));
        result.push({ lead, contactName, reason: hoursOld >= 48 ? `New for ${Math.floor(hoursOld / 24)}d` : `New for ${hoursOld}h`, reasonType: 'aging', sortKey: 300 + hoursOld });
        continue;
      }

      // (3) High escalation level
      if (esc.level >= 2) {
        result.push({ lead, contactName, reason: `Escalation L${esc.level}`, reasonType: 'escalated', sortKey: 200 + esc.level * 10 + esc.daysOverdue });
        continue;
      }

      // (4) Least recently touched (not in first 3 categories, but stale enough)
      if (daysSinceActivity > 5) {
        result.push({ lead, contactName, reason: `Untouched ${Math.floor(daysSinceActivity)}d`, reasonType: 'untouched', sortKey: 100 + daysSinceActivity });
      }
    }

    return result.sort((a, b) => b.sortKey - a.sortKey).slice(0, 8);
  }, [leads, activities, contactById]);

  if (items.length === 0) return null;

  return (
    <section className="crm-needs-attention crm-panel crm-panel--tertiary" aria-label="Needs Attention">
      <div className="crm-panel-head">
        <h3>Needs Attention</h3>
        <span className="crm-muted">{items.length} leads</span>
      </div>
      <ul className="crm-needs-attention__list">
        {items.map(({ lead, contactName, reason, reasonType }) => (
          <li key={lead.id} className="crm-needs-attention__row">
            <span className={`crm-needs-attention__dot crm-needs-attention__dot--${reasonType}`} />
            <button
              type="button"
              className="crm-needs-attention__name"
              onClick={() => onOpenLead(lead.id)}
            >
              {contactName}
            </button>
            <span className={`crm-needs-attention__badge crm-needs-attention__badge--${reasonType}`}>
              {reason}
            </span>
            <span className="crm-muted crm-needs-attention__time">
              {lead.updatedAt ? formatTimeAgo(lead.updatedAt) : ''}
            </span>
            <button
              type="button"
              className="crm-needs-attention__view"
              onClick={() => onOpenLead(lead.id)}
              aria-label={`View ${contactName}`}
            >
              View
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
});
