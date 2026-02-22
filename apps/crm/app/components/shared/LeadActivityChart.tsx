'use client';

import { useMemo, useState } from 'react';
import type { CrmActivity } from '@real-estate/types/crm';

const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_DAYS = 30;

export function LeadActivityChart({ activities }: { activities: CrmActivity[] }) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const buckets = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- Date.now() is acceptable for time-based bucket computation
    const now = Date.now();
    const b = Array.from({ length: CHART_DAYS }, (_, i) => {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - (CHART_DAYS - 1 - i));
      return {
        date: dayStart,
        total: 0,
        notes: 0,
        statusChanges: 0,
        listingViews: 0,
        searches: 0,
        favorites: 0,
      };
    });

    for (const activity of activities) {
      const ago = now - new Date(activity.occurredAt).getTime();
      const dayIndex = Math.floor(ago / DAY_MS);
      if (dayIndex >= 0 && dayIndex < CHART_DAYS) {
        const bucket = b[CHART_DAYS - 1 - dayIndex]!;
        bucket.total++;
        if (activity.activityType === 'note') bucket.notes++;
        else if (activity.activityType === 'lead_status_changed') bucket.statusChanges++;
        else if (activity.activityType === 'website_listing_viewed') bucket.listingViews++;
        else if (activity.activityType === 'website_search_performed') bucket.searches++;
        else if (activity.activityType === 'website_listing_favorited') bucket.favorites++;
      }
    }
    return b;
  }, [activities]);

  const maxVal = Math.max(1, ...buckets.map((b) => b.total));
  const barWidth = 8;
  const gap = 2;
  const chartWidth = CHART_DAYS * (barWidth + gap);
  const chartHeight = 60;

  const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="crm-activity-chart">
      <span className="crm-chart-label">Activity (30 days)</span>
      <div className="crm-activity-chart-wrap">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" aria-label="Lead activity chart">
          {buckets.map((bucket, i) => {
            const barH = bucket.total > 0 ? Math.max(6, (bucket.total / maxVal) * (chartHeight - 4)) : 3;
            return (
              <rect
                key={i}
                x={i * (barWidth + gap)}
                y={chartHeight - barH}
                width={barWidth}
                height={barH}
                rx={2}
                fill={hoveredBar === i ? 'var(--crm-accent)' : bucket.total > 0 ? 'var(--crm-accent)' : 'var(--crm-border)'}
                opacity={hoveredBar === i ? 1 : bucket.total > 0 ? 0.7 : 0.25}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ cursor: bucket.total > 0 ? 'crosshair' : 'default', transition: 'opacity 0.1s ease' }}
              />
            );
          })}
        </svg>
        {hoveredBar !== null && buckets[hoveredBar] ? (
          <div
            className="crm-activity-chart-tooltip"
            style={{ left: `${((hoveredBar * (barWidth + gap) + barWidth / 2) / chartWidth) * 100}%` }}
          >
            <strong>{dateFmt.format(buckets[hoveredBar]!.date)}</strong>
            <span>{buckets[hoveredBar]!.total} total</span>
            {buckets[hoveredBar]!.notes > 0 && <span>📝 {buckets[hoveredBar]!.notes} notes</span>}
            {buckets[hoveredBar]!.statusChanges > 0 && <span>🔄 {buckets[hoveredBar]!.statusChanges} status</span>}
            {buckets[hoveredBar]!.listingViews > 0 && <span>🏠 {buckets[hoveredBar]!.listingViews} views</span>}
            {buckets[hoveredBar]!.searches > 0 && <span>🔎 {buckets[hoveredBar]!.searches} search</span>}
            {buckets[hoveredBar]!.favorites > 0 && <span>⭐ {buckets[hoveredBar]!.favorites} favs</span>}
          </div>
        ) : null}
      </div>
    </div>
  );
}
