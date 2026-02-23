'use client';

import { useMemo, useState } from 'react';
import type { CrmActivity, CrmLead, CrmContact } from '@real-estate/types/crm';
import { formatActivityTypeLabel } from '../../lib/crm-display';
import { formatTimeAgo } from '../../lib/crm-formatters';

interface FloatingActivityLogProps {
  activities: CrmActivity[];
  leadById: Map<string, CrmLead>;
  contactById: Map<string, CrmContact>;
  onOpenLead: (leadId: string) => void;
}

type ActivityFilter = 'all' | 'note' | 'lead_status_changed' | 'lead_created' | 'website_listing_viewed' | 'website_listing_favorited';

const FILTER_OPTIONS: Array<{ value: ActivityFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'note', label: 'Notes' },
  { value: 'lead_status_changed', label: 'Status' },
  { value: 'lead_created', label: 'Created' },
  { value: 'website_listing_viewed', label: 'Views' },
  { value: 'website_listing_favorited', label: 'Favorites' },
];

export function FloatingActivityLog({
  activities,
  leadById,
  contactById,
  onOpenLead,
}: FloatingActivityLogProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filteredActivities = useMemo(() => {
    const sorted = [...activities].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
    if (filter === 'all') return sorted.slice(0, 20);
    return sorted.filter(a => a.activityType === filter).slice(0, 20);
  }, [activities, filter]);

  return (
    <div className={`crm-floating-activity-log ${collapsed ? 'crm-floating-activity-log--collapsed' : ''}`}>
      <button
        type="button"
        className="crm-floating-activity-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Open activity log' : 'Close activity log'}
      >
        <span className="crm-floating-activity-toggle-icon">↻</span>
        {collapsed && <span className="crm-floating-activity-badge">{activities.length}</span>}
      </button>

      {!collapsed && (
        <div className="crm-floating-activity-panel">
          <div className="crm-floating-activity-header">
            <h4>Activity Feed</h4>
            <button type="button" className="crm-icon-button" onClick={() => setCollapsed(true)} aria-label="Close">✕</button>
          </div>

          <div className="crm-floating-activity-filters">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`crm-sort-toggle ${filter === opt.value ? 'is-active' : ''}`}
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="crm-floating-activity-list">
            {filteredActivities.length === 0 ? (
              <p className="crm-muted" style={{ padding: '1rem', textAlign: 'center' }}>No activities match the filter.</p>
            ) : (
              filteredActivities.map((activity) => {
                const lead = activity.leadId ? leadById.get(activity.leadId) : null;
                const contact = activity.contactId ? contactById.get(activity.contactId) : null;

                return (
                  <div key={activity.id} className="crm-floating-activity-item">
                    <div className="crm-floating-activity-content">
                      <p className="crm-floating-activity-summary">{activity.summary || formatActivityTypeLabel(activity.activityType)}</p>
                      <span className="crm-muted">
                        {formatActivityTypeLabel(activity.activityType)} · {formatTimeAgo(activity.occurredAt)}
                        {lead && (
                          <>
                            {' · '}
                            <button type="button" className="crm-inline-link" onClick={() => onOpenLead(lead.id)}>
                              {contact?.fullName || lead.listingAddress || 'View lead'}
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
