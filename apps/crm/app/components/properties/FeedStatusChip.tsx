'use client';

import { useEffect, useState } from 'react';

interface FeedStatus {
  lastSyncAt: string | null;
  status: 'healthy' | 'stale' | 'unknown';
  staleSinceHours: number | null;
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function FeedStatusChip() {
  const [feed, setFeed] = useState<FeedStatus | null>(null);

  useEffect(() => {
    fetch('/api/properties/feed-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok) {
          setFeed({
            lastSyncAt: data.lastSyncAt,
            status: data.status,
            staleSinceHours: data.staleSinceHours,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!feed) return null;

  const statusClass =
    feed.status === 'healthy'
      ? 'crm-feed-chip--healthy'
      : feed.status === 'stale'
        ? 'crm-feed-chip--stale'
        : 'crm-feed-chip--unknown';

  const label =
    feed.status === 'healthy' && feed.lastSyncAt
      ? `Listings updated ${formatTimeAgo(feed.lastSyncAt)}`
      : feed.status === 'stale'
        ? `Feed stale — last update ${feed.staleSinceHours?.toFixed(0)}h ago`
        : 'Feed status unknown';

  return (
    <span className={`crm-feed-chip ${statusClass}`} title={feed.lastSyncAt ?? 'No sync data'}>
      <span className="crm-feed-chip__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
