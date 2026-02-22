'use client';

import { memo, useCallback, useState } from 'react';
import type { LeadRoutingResult, RoutingRecommendation, RoutingFactor } from '@real-estate/ai/types';

interface AiLeadRoutingProps {
  leadId: string;
  tenantId: string;
  currentAssignee: string | null;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export const AiLeadRouting = memo(function AiLeadRouting({
  leadId,
  tenantId,
  currentAssignee,
}: AiLeadRoutingProps) {
  const [state, setState] = useState<LoadState>('idle');
  const [routing, setRouting] = useState<LeadRoutingResult | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const fetchRouting = useCallback(async () => {
    if (state === 'loaded' && routing) {
      setExpanded(!expanded);
      return;
    }

    setState('loading');
    setExpanded(true);

    try {
      const res = await fetch(`/api/ai/lead-routing/${leadId}`, {
        headers: { 'x-tenant-id': tenantId },
      });

      if (!res.ok) {
        setState('error');
        return;
      }

      const data = (await res.json()) as { ok: boolean; routing?: LeadRoutingResult };
      if (data.ok && data.routing) {
        setRouting(data.routing);
        setState('loaded');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }, [leadId, tenantId, state, routing, expanded]);

  return (
    <div className="crm-lead-routing">
      <button
        type="button"
        className="crm-lead-routing__trigger"
        onClick={fetchRouting}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="4" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <path d="M6.5 7L10 4.5M6.5 9L10 11.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
        {state === 'loading' ? 'Analyzing...' : 'Smart Routing'}
      </button>

      {expanded && (
        <div className="crm-lead-routing__panel">
          {state === 'loading' && (
            <p className="crm-lead-routing__loading">Evaluating agent fit...</p>
          )}

          {state === 'error' && (
            <p className="crm-lead-routing__error">
              Could not load routing analysis.
              <button type="button" className="crm-lead-routing__retry" onClick={() => { setState('idle'); fetchRouting(); }}>
                Retry
              </button>
            </p>
          )}

          {state === 'loaded' && routing && (
            <>
              <div className="crm-lead-routing__header">
                <span className="crm-lead-routing__mode">
                  {routing.mode === 'team' ? 'Team Routing' : 'Self-Assessment'}
                </span>
              </div>

              {routing.explanation && (
                <p className="crm-lead-routing__explanation">{routing.explanation}</p>
              )}

              <div className="crm-lead-routing__recommendations">
                {routing.recommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.agentId}
                    recommendation={rec}
                    isExpanded={expandedAgent === rec.agentId}
                    onToggle={() => setExpandedAgent(expandedAgent === rec.agentId ? null : rec.agentId)}
                    isSolo={routing.mode === 'solo'}
                  />
                ))}
              </div>

              {routing.provenance && (
                <span className="crm-lead-routing__provenance">
                  {routing.provenance.source === 'ai' ? 'AI-enhanced' : 'Rule-based'}
                  {routing.provenance.latencyMs > 0 && ` · ${routing.provenance.latencyMs}ms`}
                </span>
              )}
            </>
          )}

          <button
            type="button"
            className="crm-lead-routing__close"
            onClick={() => setExpanded(false)}
            aria-label="Close routing"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
});

function RecommendationCard({
  recommendation,
  isExpanded,
  onToggle,
  isSolo,
}: {
  recommendation: RoutingRecommendation;
  isExpanded: boolean;
  onToggle: () => void;
  isSolo: boolean;
}) {
  return (
    <div className={`crm-lead-routing__card ${recommendation.isCurrentAssignee ? 'crm-lead-routing__card--current' : ''}`}>
      <button
        type="button"
        className="crm-lead-routing__card-header"
        onClick={onToggle}
      >
        <span className="crm-lead-routing__agent-name">
          {isSolo ? 'Your Fit' : recommendation.agentName}
        </span>
        <span className={`crm-lead-routing__composite crm-lead-routing__composite--${getScoreLevel(recommendation.compositeScore)}`}>
          {recommendation.compositeScore}/100
        </span>
        {recommendation.isCurrentAssignee && (
          <span className="crm-lead-routing__current-badge">Current</span>
        )}
      </button>

      {isExpanded && (
        <div className="crm-lead-routing__factors">
          {recommendation.factors.map((factor) => (
            <FactorBar key={factor.factor} factor={factor} />
          ))}
        </div>
      )}
    </div>
  );
}

function FactorBar({ factor }: { factor: RoutingFactor }) {
  return (
    <div className="crm-lead-routing__factor">
      <div className="crm-lead-routing__factor-header">
        <span className="crm-lead-routing__factor-name">{factor.factor}</span>
        <span className="crm-lead-routing__factor-score">{factor.score}/100</span>
      </div>
      <div className="crm-lead-routing__factor-bar">
        <div
          className="crm-lead-routing__factor-fill"
          style={{ width: `${Math.min(100, Math.max(0, factor.score))}%` }}
        />
      </div>
      <span className="crm-lead-routing__factor-detail">{factor.detail}</span>
    </div>
  );
}

function getScoreLevel(score: number): string {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
