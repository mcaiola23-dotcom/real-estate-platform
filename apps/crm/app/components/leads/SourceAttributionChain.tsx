'use client';

import { useMemo } from 'react';
import type { CrmActivity } from '@real-estate/types/crm';
import { formatLeadSourceLabel } from '../../lib/crm-display';

interface SourceAttributionChainProps {
  source: string;
  activities: CrmActivity[];
}

const MAX_VISIBLE = 6;

function activityToTouchpoint(activityType: string): string | null {
  switch (activityType) {
    case 'website_search_performed': return 'Search';
    case 'website_listing_viewed': return 'Listing View';
    case 'website_listing_favorited': return 'Favorited';
    case 'website_listing_unfavorited': return 'Unfavorited';
    case 'lead_submitted': return 'Inquiry';
    case 'valuation_requested': return 'Valuation';
    case 'call_logged': return 'Call';
    case 'text_logged': return 'Text';
    case 'email_logged': return 'Email';
    case 'note': return 'Note';
    case 'lead_status_changed': return 'Status Change';
    default: return null;
  }
}

interface ChainNode {
  label: string;
  count: number;
  isSource: boolean;
}

export function SourceAttributionChain({ source, activities }: SourceAttributionChainProps) {
  const chain = useMemo(() => {
    const nodes: ChainNode[] = [];

    // First node: the lead source
    nodes.push({
      label: formatLeadSourceLabel(source),
      count: 1,
      isSource: true,
    });

    // Sort activities chronologically (oldest first)
    const sorted = [...activities].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );

    for (const activity of sorted) {
      const touchpoint = activityToTouchpoint(activity.activityType);
      if (!touchpoint) continue;

      const last = nodes[nodes.length - 1];
      if (last && !last.isSource && last.label === touchpoint) {
        last.count += 1;
      } else {
        nodes.push({ label: touchpoint, count: 1, isSource: false });
      }
    }

    return nodes;
  }, [source, activities]);

  if (chain.length <= 1) return null;

  const visible = chain.slice(0, MAX_VISIBLE);
  const overflow = chain.length - MAX_VISIBLE;

  return (
    <div className="crm-attribution-chain" aria-label="Lead attribution path">
      <span className="crm-attribution-line" aria-hidden="true" />
      {visible.map((node, i) => (
        <span key={`${node.label}-${i}`} className="crm-attribution-stop">
          <span
            className={`crm-attribution-dot ${node.isSource ? 'crm-attribution-dot--origin' : ''}`}
            aria-hidden="true"
          />
          <span className={`crm-attribution-label ${node.isSource ? 'crm-attribution-label--origin' : ''}`}>
            {node.label}
            {node.count > 1 && (
              <span className="crm-attribution-count">{node.count}</span>
            )}
          </span>
        </span>
      ))}
      {overflow > 0 && (
        <span className="crm-attribution-overflow">+{overflow}</span>
      )}
    </div>
  );
}
