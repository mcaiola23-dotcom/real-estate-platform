'use client';

import { memo, useEffect, useState } from 'react';
import type { NextActionResult } from '@real-estate/ai/types';
import { AiActionCard } from '../shared/AiActionCard';

interface AiNextActionsProps {
  leadId: string;
  tenantId: string;
  onOpenLead?: (leadId: string) => void;
  compact?: boolean;
}

export const AiNextActions = memo(function AiNextActions({
  leadId,
  tenantId,
  onOpenLead,
  compact = false,
}: AiNextActionsProps) {
  const [result, setResult] = useState<NextActionResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/ai/next-action/${leadId}`, {
      headers: { 'x-tenant-id': tenantId },
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ok: boolean; result?: NextActionResult } | null) => {
        if (!cancelled && data?.ok && data.result) {
          setResult(data.result);
        }
      })
      .catch(() => {
        // Graceful — no error state for AI suggestions
      });

    return () => { cancelled = true; };
  }, [leadId, tenantId]);

  if (!result || result.suggestions.length === 0) {
    return null;
  }

  return (
    <div className="crm-ai-next-actions">
      <div className="crm-ai-next-actions__header">
        <span className="crm-ai-next-actions__icon" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" opacity="0.9" />
          </svg>
        </span>
        <span className="crm-ai-next-actions__title">Suggested Actions</span>
        <span className="crm-ai-next-actions__count">{result.suggestions.length}</span>
      </div>
      <div className="crm-ai-next-actions__list">
        {result.suggestions.map((suggestion) => (
          <AiActionCard
            key={suggestion.patternId}
            suggestion={suggestion}
            compact={compact}
            onTakeAction={onOpenLead ? () => onOpenLead(leadId) : undefined}
          />
        ))}
      </div>
    </div>
  );
});
