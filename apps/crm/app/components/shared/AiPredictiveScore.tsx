'use client';

import { memo, useCallback, useState } from 'react';
import type { PredictiveScoreResult, PredictiveScoreFactor } from '@real-estate/ai/types';

interface AiPredictiveScoreProps {
  leadId: string;
  tenantId: string;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export const AiPredictiveScore = memo(function AiPredictiveScore({
  leadId,
  tenantId,
}: AiPredictiveScoreProps) {
  const [state, setState] = useState<LoadState>('idle');
  const [prediction, setPrediction] = useState<PredictiveScoreResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchPrediction = useCallback(async () => {
    if (state === 'loaded' && prediction) {
      setExpanded(!expanded);
      return;
    }

    setState('loading');
    setExpanded(true);

    try {
      const res = await fetch(`/api/ai/predictive-score/${leadId}`, {
        headers: { 'x-tenant-id': tenantId },
      });

      if (!res.ok) {
        setState('error');
        return;
      }

      const data = (await res.json()) as { ok: boolean; prediction?: PredictiveScoreResult };
      if (data.ok && data.prediction) {
        setPrediction(data.prediction);
        setState('loaded');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }, [leadId, tenantId, state, prediction, expanded]);

  return (
    <div className="crm-predictive-score">
      <button
        type="button"
        className="crm-predictive-score__trigger"
        onClick={fetchPrediction}
        title="Predict conversion likelihood"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M2 14l4-5 3 3 5-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="crm-predictive-score__label">
          {state === 'loading' ? 'Predicting...' : 'AI Prediction'}
        </span>
      </button>

      {expanded && (
        <div className="crm-predictive-score__panel">
          {state === 'loading' && (
            <p className="crm-predictive-score__loading">Analyzing conversion likelihood...</p>
          )}

          {state === 'error' && (
            <p className="crm-predictive-score__error">
              Could not load prediction.
              <button type="button" className="crm-predictive-score__retry" onClick={() => { setState('idle'); fetchPrediction(); }}>
                Retry
              </button>
            </p>
          )}

          {state === 'loaded' && prediction && (
            <>
              {prediction.insufficient ? (
                <div className="crm-predictive-score__insufficient">
                  <p>{prediction.explanation}</p>
                </div>
              ) : (
                <>
                  <div className="crm-predictive-score__result">
                    <span className={`crm-predictive-score__badge crm-predictive-score__badge--${getBadgeLevel(prediction.conversionProbability)}`}>
                      {prediction.conversionProbability}% likely to convert
                    </span>
                    <span className="crm-predictive-score__confidence">
                      {prediction.confidence} confidence
                    </span>
                  </div>

                  {prediction.explanation && (
                    <p className="crm-predictive-score__explanation">{prediction.explanation}</p>
                  )}

                  {prediction.topFactors.length > 0 && (
                    <div className="crm-predictive-score__factors">
                      {prediction.topFactors.slice(0, 3).map((factor) => (
                        <FactorRow key={factor.feature} factor={factor} />
                      ))}
                    </div>
                  )}

                  {prediction.dataStats && (
                    <span className="crm-predictive-score__stats">
                      Based on {prediction.dataStats.totalWon + prediction.dataStats.totalLost} historical leads
                    </span>
                  )}
                </>
              )}

              {prediction.provenance && (
                <span className="crm-predictive-score__provenance">
                  {prediction.provenance.source === 'ai' ? 'AI-enhanced' : 'Statistical model'}
                  {prediction.provenance.latencyMs > 0 && ` · ${prediction.provenance.latencyMs}ms`}
                </span>
              )}
            </>
          )}

          <button
            type="button"
            className="crm-predictive-score__close"
            onClick={() => setExpanded(false)}
            aria-label="Close prediction"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
});

function FactorRow({ factor }: { factor: PredictiveScoreFactor }) {
  const dirClass =
    factor.direction === 'positive' ? 'crm-predictive-score__factor--positive' :
    factor.direction === 'negative' ? 'crm-predictive-score__factor--negative' :
    'crm-predictive-score__factor--neutral';

  return (
    <div className={`crm-predictive-score__factor ${dirClass}`}>
      <span className="crm-predictive-score__factor-icon">
        {factor.direction === 'positive' ? '+' : factor.direction === 'negative' ? '-' : '·'}
      </span>
      <span className="crm-predictive-score__factor-detail">{factor.detail}</span>
    </div>
  );
}

function getBadgeLevel(probability: number): string {
  if (probability >= 70) return 'high';
  if (probability >= 40) return 'medium';
  return 'low';
}
