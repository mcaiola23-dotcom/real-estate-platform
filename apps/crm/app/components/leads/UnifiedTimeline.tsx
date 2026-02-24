'use client';

import { useMemo, useState } from 'react';
import type { CrmActivity } from '@real-estate/types/crm';
import type { LeadSearchSignal, LeadListingSignal } from '../../lib/crm-types';
import { formatActivityTypeLabel } from '../../lib/crm-display';
import { TimelineEvent, type TimelineEventData, type TimelineEventCategory } from './TimelineEvent';

interface UnifiedTimelineProps {
  activities: CrmActivity[];
  searchSignals: LeadSearchSignal[];
  listingSignals: LeadListingSignal[];
  onListingClick?: (listingId: string) => void;
}

const CATEGORY_FILTERS: Array<{ id: TimelineEventCategory; label: string }> = [
  { id: 'website', label: 'Website' },
  { id: 'communication', label: 'Comms' },
  { id: 'status', label: 'Status' },
  { id: 'note', label: 'Notes' },
  { id: 'system', label: 'System' },
];

function categorizeActivity(activityType: string): TimelineEventCategory {
  if (activityType === 'lead_status_changed') return 'status';
  if (activityType === 'note') return 'note';
  if (['call_logged', 'text_logged', 'email_logged'].includes(activityType)) return 'communication';
  if (['lead_submitted', 'valuation_requested'].includes(activityType)) return 'system';
  if (activityType.startsWith('website_')) return 'website';
  return 'system';
}

function getActivityIcon(activityType: string): string {
  switch (activityType) {
    case 'lead_status_changed': return '◆';
    case 'note': return '✎';
    case 'call_logged': return '✆';
    case 'text_logged': return '✉';
    case 'email_logged': return '▸';
    case 'lead_submitted': return '⊕';
    case 'valuation_requested': return '◎';
    case 'website_search_performed': return '⌕';
    case 'website_listing_viewed': return '◉';
    case 'website_listing_favorited': return '★';
    case 'website_listing_unfavorited': return '☆';
    default: return '·';
  }
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayLabel(dayKey: string): string {
  const today = getDayKey(new Date().toISOString());
  if (dayKey === today) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey === getDayKey(yesterday.toISOString())) return 'Yesterday';

  const d = new Date(dayKey + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatListingDetail(signal: LeadListingSignal): string {
  const parts: string[] = [];
  if (signal.price) parts.push(`$${signal.price.toLocaleString()}`);
  if (signal.beds) parts.push(`${signal.beds} bed`);
  if (signal.baths) parts.push(`${signal.baths} bath`);
  if (signal.sqft) parts.push(`${signal.sqft.toLocaleString()} sqft`);
  return parts.join(' · ');
}

export function UnifiedTimeline({ activities, searchSignals, listingSignals, onListingClick }: UnifiedTimelineProps) {
  const [hiddenCategories, setHiddenCategories] = useState<Set<TimelineEventCategory>>(new Set());

  const allEvents: TimelineEventData[] = useMemo(() => {
    const events: TimelineEventData[] = [];

    for (const a of activities) {
      events.push({
        id: `act-${a.id}`,
        category: categorizeActivity(a.activityType),
        icon: getActivityIcon(a.activityType),
        label: formatActivityTypeLabel(a.activityType),
        summary: a.summary,
        occurredAt: a.occurredAt,
      });
    }

    for (const s of searchSignals) {
      events.push({
        id: `search-${s.id}`,
        category: 'website',
        icon: '⌕',
        label: 'Website Search',
        summary: s.query || 'General search',
        detail: s.filterSummary ? `${s.filterSummary} · ${s.resultCount ?? 0} results` : undefined,
        occurredAt: s.occurredAt,
      });
    }

    for (const l of listingSignals) {
      const actionLabel = l.action === 'viewed' ? 'Listing Viewed'
        : l.action === 'favorited' ? 'Listing Favorited'
        : 'Listing Unfavorited';
      const icon = l.action === 'viewed' ? '◉' : l.action === 'favorited' ? '★' : '☆';
      events.push({
        id: `listing-${l.id}`,
        category: 'website',
        icon,
        label: actionLabel,
        summary: l.address || 'Unknown property',
        detail: formatListingDetail(l) || undefined,
        occurredAt: l.occurredAt,
        listingId: l.listingId,
      });
    }

    events.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    return events;
  }, [activities, searchSignals, listingSignals]);

  const filteredEvents = useMemo(
    () => allEvents.filter((e) => !hiddenCategories.has(e.category)),
    [allEvents, hiddenCategories]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEventData[]>();
    for (const event of filteredEvents) {
      const key = getDayKey(event.occurredAt);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filteredEvents]);

  function toggleCategory(cat: TimelineEventCategory) {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  const categoryCounts = useMemo(() => {
    const counts = new Map<TimelineEventCategory, number>();
    for (const e of allEvents) {
      counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    }
    return counts;
  }, [allEvents]);

  return (
    <section className="crm-timeline">
      <div className="crm-timeline-header">
        <h4 className="crm-timeline-title">Activity Timeline</h4>
        <span className="crm-timeline-count">{filteredEvents.length} events</span>
      </div>

      <div className="crm-timeline-filters">
        {CATEGORY_FILTERS.map((f) => {
          const count = categoryCounts.get(f.id) ?? 0;
          if (count === 0) return null;
          const active = !hiddenCategories.has(f.id);
          return (
            <button
              key={f.id}
              type="button"
              className={`crm-timeline-filter crm-timeline-filter--${f.id} ${active ? 'is-active' : ''}`}
              onClick={() => toggleCategory(f.id)}
            >
              {f.label}
              <span className="crm-timeline-filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="crm-timeline-feed">
        {grouped.length === 0 ? (
          <p className="crm-timeline-empty">No activity recorded yet.</p>
        ) : (
          grouped.map(([dayKey, events]) => (
            <div key={dayKey} className="crm-timeline-day">
              <div className="crm-timeline-day-header">
                <span className="crm-timeline-day-label">{getDayLabel(dayKey)}</span>
                <span className="crm-timeline-day-rule" />
              </div>
              {events.map((event) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  formatTime={formatRelativeTime}
                  onListingClick={onListingClick}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
