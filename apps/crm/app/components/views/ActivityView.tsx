'use client';

import { memo, useMemo, useState } from 'react';
import type { CrmActivity, CrmContact, CrmLead } from '@real-estate/types/crm';
import { formatActivityTypeLabel } from '../../lib/crm-display';
import { formatDateTime, formatTimeAgo } from '../../lib/crm-formatters';

type ActivityTypeFilter = 'all' | 'note' | 'lead_status_changed' | 'lead_created' | 'website_listing_viewed' | 'website_listing_favorited' | 'website_search_performed';
type SortDirection = 'newest' | 'oldest';

interface ActivityViewProps {
  activities: CrmActivity[];
  leads: CrmLead[];
  contacts: CrmContact[];
  contactById: Map<string, CrmContact>;
  leadById: Map<string, CrmLead>;
  onOpenLead: (leadId: string) => void;
}

const FILTER_OPTIONS: Array<{ value: ActivityTypeFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'note', label: 'Notes' },
  { value: 'lead_status_changed', label: 'Status Changes' },
  { value: 'lead_created', label: 'Lead Created' },
  { value: 'website_listing_viewed', label: 'Listing Views' },
  { value: 'website_listing_favorited', label: 'Favorites' },
  { value: 'website_search_performed', label: 'Searches' },
];

export const ActivityView = memo(function ActivityView({
  activities,
  contactById,
  leadById,
  onOpenLead,
}: ActivityViewProps) {
  const [filter, setFilter] = useState<ActivityTypeFilter>('all');
  const [sortDir, setSortDir] = useState<SortDirection>('newest');

  const filteredActivities = useMemo(() => {
    let list = [...activities];
    if (filter !== 'all') {
      list = list.filter((a) => a.activityType === filter);
    }
    list.sort((a, b) => {
      const diff = new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
      return sortDir === 'newest' ? diff : -diff;
    });
    return list;
  }, [activities, filter, sortDir]);

  return (
    <section className="crm-panel crm-activity-view">
      <div className="crm-panel-head">
        <div>
          <h3>Activity Log</h3>
          <span className="crm-muted">{activities.length} total activities</span>
        </div>
        <div className="crm-activity-view__controls">
          <button
            type="button"
            className={`crm-sort-toggle ${sortDir === 'newest' ? 'is-active' : ''}`}
            onClick={() => setSortDir('newest')}
          >
            Newest
          </button>
          <button
            type="button"
            className={`crm-sort-toggle ${sortDir === 'oldest' ? 'is-active' : ''}`}
            onClick={() => setSortDir('oldest')}
          >
            Oldest
          </button>
        </div>
      </div>

      <div className="crm-activity-view__filters">
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

      <div className="crm-activity-view__list">
        {filteredActivities.length === 0 ? (
          <p className="crm-muted" style={{ padding: '2rem', textAlign: 'center' }}>
            No activities match the current filter.
          </p>
        ) : (
          filteredActivities.map((activity) => {
            const lead = activity.leadId ? leadById.get(activity.leadId) : null;
            const contact = activity.contactId ? contactById.get(activity.contactId) : null;
            const linkedName = contact?.fullName || lead?.listingAddress || null;

            return (
              <div key={activity.id} className="crm-activity-view__row">
                <div className="crm-activity-view__summary">
                  <span>{activity.summary || formatActivityTypeLabel(activity.activityType)}</span>
                </div>
                <span className={`crm-activity-view__badge crm-activity-badge--${activity.activityType.replace(/_/g, '-')}`}>
                  {formatActivityTypeLabel(activity.activityType)}
                </span>
                {lead && linkedName ? (
                  <button
                    type="button"
                    className="crm-inline-link crm-activity-view__lead"
                    onClick={() => onOpenLead(lead.id)}
                  >
                    {linkedName}
                  </button>
                ) : (
                  <span className="crm-activity-view__lead crm-muted">—</span>
                )}
                <span className="crm-activity-view__time" title={formatDateTime(activity.occurredAt)}>
                  {formatTimeAgo(activity.occurredAt)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
});
