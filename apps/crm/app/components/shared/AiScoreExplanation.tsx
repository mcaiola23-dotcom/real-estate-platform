'use client';

import { memo, useCallback, useState } from 'react';
import type { LeadScoreExplanation } from '@real-estate/ai/types';

interface AiScoreExplanationProps {
  leadId: string;
  tenantId: string;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export const AiScoreExplanation = memo(function AiScoreExplanation({
  leadId,
  tenantId,
}: AiScoreExplanationProps) {
  const [state, setState] = useState<LoadState>('idle');
  const [explanation, setExplanation] = useState<LeadScoreExplanation | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchExplanation = useCallback(async () => {
    if (state === 'loaded' && explanation) {
      setExpanded(!expanded);
      return;
    }

    setState('loading');
    setExpanded(true);

    try {
      const res = await fetch(`/api/ai/lead-score-explain/${leadId}`, {
        headers: { 'x-tenant-id': tenantId },
      });

      if (!res.ok) {
        setState('error');
        return;
      }

      const data = (await res.json()) as { ok: boolean; explanation?: LeadScoreExplanation };
      if (data.ok && data.explanation) {
        setExplanation(data.explanation);
        setState('loaded');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }, [leadId, tenantId, state, explanation, expanded]);

  return (
    <div className="crm-score-explain">
      <button
        type="button"
        className="crm-score-explain__trigger"
        onClick={fetchExplanation}
        title="Explain this score"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M8 7v4M8 4.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {expanded && (
        <div className="crm-score-explain__panel">
          {state === 'loading' && (
            <p className="crm-score-explain__loading">Analyzing score...</p>
          )}

          {state === 'error' && (
            <p className="crm-score-explain__error">
              Could not load explanation.
              <button type="button" className="crm-score-explain__retry" onClick={() => { setState('idle'); fetchExplanation(); }}>
                Retry
              </button>
            </p>
          )}

          {state === 'loaded' && explanation && (
            <>
              <p className="crm-score-explain__text">{explanation.naturalLanguage}</p>

              <div className="crm-score-explain__breakdown">
                {explanation.breakdown.map((item) => (
                  <div key={item.factor} className="crm-score-explain__factor">
                    <div className="crm-score-explain__factor-header">
                      <span className="crm-score-explain__factor-name">{item.factor}</span>
                      <span className="crm-score-explain__factor-score">
                        {Math.round(item.rawScore)}/100
                      </span>
                    </div>
                    <div className="crm-score-explain__factor-bar">
                      <div
                        className="crm-score-explain__factor-fill"
                        style={{ width: `${Math.min(100, Math.max(0, item.rawScore))}%` }}
                      />
                    </div>
                    <span className="crm-score-explain__factor-detail">{item.detail}</span>
                  </div>
                ))}
              </div>

              {explanation.provenance && (
                <span className="crm-score-explain__provenance">
                  {explanation.provenance.source === 'ai' ? 'AI-enhanced' : 'Auto-generated'}
                  {explanation.provenance.latencyMs > 0 && ` · ${explanation.provenance.latencyMs}ms`}
                </span>
              )}
            </>
          )}

          <button
            type="button"
            className="crm-score-explain__close"
            onClick={() => setExpanded(false)}
            aria-label="Close explanation"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
});
