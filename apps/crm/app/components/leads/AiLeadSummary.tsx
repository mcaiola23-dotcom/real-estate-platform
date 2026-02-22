'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import type { LeadSummary } from '@real-estate/ai/types';

interface AiLeadSummaryProps {
  leadId: string;
  tenantId: string;
}

type LoadState = 'loading' | 'loaded' | 'error';

export const AiLeadSummary = memo(function AiLeadSummary({
  leadId,
  tenantId,
}: AiLeadSummaryProps) {
  const [state, setState] = useState<LoadState>('loading');
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/ai/lead-summary/${leadId}`, {
      headers: { 'x-tenant-id': tenantId },
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ok: boolean; summary?: LeadSummary; error?: string } | null) => {
        if (cancelled) return;
        if (data?.ok && data.summary) {
          setSummary(data.summary);
          setState('loaded');
        } else {
          setState('error');
          setError(data?.error ?? 'Failed to load summary');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState('error');
          setError('Network error');
        }
      });

    return () => { cancelled = true; };
  }, [leadId, tenantId]);

  const handleRetry = useCallback(() => {
    setState('loading');
    setError(null);
    fetch(`/api/ai/lead-summary/${leadId}`, {
      headers: { 'x-tenant-id': tenantId },
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ok: boolean; summary?: LeadSummary; error?: string } | null) => {
        if (data?.ok && data.summary) {
          setSummary(data.summary);
          setState('loaded');
        } else {
          setState('error');
          setError(data?.error ?? 'Failed to load summary');
        }
      })
      .catch(() => {
        setState('error');
        setError('Network error');
      });
  }, [leadId, tenantId]);

  return (
    <div className="crm-ai-summary">
      <div className="crm-ai-summary__header">
        <span className="crm-ai-summary__icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" opacity="0.9" />
          </svg>
        </span>
        <span className="crm-ai-summary__title">AI Summary</span>
        {summary?.provenance && (
          <span className="crm-ai-summary__provenance">
            {summary.provenance.source === 'ai' ? 'AI-generated' : 'Auto-generated'}
          </span>
        )}
      </div>

      {state === 'loading' && (
        <div className="crm-ai-summary__loading">
          <span className="crm-ai-summary__loading-dot" />
          <span className="crm-ai-summary__loading-dot" />
          <span className="crm-ai-summary__loading-dot" />
        </div>
      )}

      {state === 'error' && (
        <div className="crm-ai-summary__error">
          <span>{error}</span>
          <button
            type="button"
            className="crm-ai-summary__retry"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      )}

      {state === 'loaded' && summary && (
        <div className="crm-ai-summary__body">
          <p className="crm-ai-summary__text">{summary.summary}</p>

          {summary.keySignals.length > 0 && (
            <div className="crm-ai-summary__signals">
              <span className="crm-ai-summary__signals-label">Key signals</span>
              <ul className="crm-ai-summary__signals-list">
                {summary.keySignals.map((signal: string, i: number) => (
                  <li key={i} className="crm-ai-summary__signal">{signal}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.recommendedApproach && (
            <p className="crm-ai-summary__approach">
              <span className="crm-ai-summary__approach-label">Recommended</span>
              {summary.recommendedApproach}
            </p>
          )}
        </div>
      )}
    </div>
  );
});
