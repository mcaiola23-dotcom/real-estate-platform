'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface MarketStats {
  totalActive: number;
  totalPending: number;
  totalSold: number;
  medianPrice: number | null;
  averagePrice: number | null;
  pricePerSqft: number | null;
  newListingsThisWeek: number;
  priceRange: { min: number; max: number } | null;
  byPropertyType: Record<string, number>;
  byCity: Record<string, number>;
  highestPrice: { price: number; city: string } | null;
  lowestPrice: { price: number; city: string } | null;
}

interface MarketDigestData {
  stats: MarketStats;
  narrative: string;
  highlights: string[];
  agentTakeaway: string | null;
  provenance: { source: string; latencyMs: number };
}

export const MarketDigest = memo(function MarketDigest() {
  const [digest, setDigest] = useState<MarketDigestData | null>(null);
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [collapsed, setCollapsed] = useState(false);

  const fetchDigest = useCallback(() => {
    setState('loading');
    fetch('/api/ai/market-digest', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { ok?: boolean; digest?: MarketDigestData } | null) => {
        if (data?.ok && data.digest) {
          setDigest(data.digest);
          setState('loaded');
        } else {
          setState('error');
        }
      })
      .catch(() => setState('error'));
  }, []);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  if (state === 'loading') {
    return (
      <section className="crm-market-digest crm-market-digest--loading">
        <div className="crm-market-digest__header">
          <h3 className="crm-market-digest__title">
            <Sparkles size={14} className="crm-ai-glyph" /> Market Digest
          </h3>
        </div>
        <div className="crm-market-digest__shimmer" />
      </section>
    );
  }

  if (state === 'error' || !digest) {
    return (
      <section className="crm-market-digest crm-market-digest--error">
        <div className="crm-market-digest__header">
          <h3 className="crm-market-digest__title">
            <Sparkles size={14} className="crm-ai-glyph" /> Market Digest
          </h3>
          <button className="crm-btn crm-btn-ghost crm-btn-sm" onClick={fetchDigest}>
            Retry
          </button>
        </div>
        <p className="crm-muted">Unable to generate market digest.</p>
      </section>
    );
  }

  const { stats } = digest;
  const fmtPrice = (n: number) => `$${n.toLocaleString()}`;

  return (
    <section className="crm-market-digest crm-panel--ai-accent">
      <div className="crm-market-digest__header">
        <h3 className="crm-market-digest__title">
          <Sparkles size={14} className="crm-ai-glyph" /> Weekly Market Digest
        </h3>
        <div className="crm-market-digest__actions">
          <button
            className="crm-btn crm-btn-ghost crm-btn-sm"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? 'Show' : 'Hide'}
          </button>
          <button className="crm-btn crm-btn-ghost crm-btn-sm" onClick={fetchDigest}>
            Refresh
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* KPI strip */}
          <div className="crm-market-digest__kpis">
            <div className="crm-market-digest__kpi">
              <span className="crm-market-digest__kpi-value">{stats.totalActive}</span>
              <span className="crm-market-digest__kpi-label">Active</span>
            </div>
            <div className="crm-market-digest__kpi">
              <span className="crm-market-digest__kpi-value">{stats.totalPending}</span>
              <span className="crm-market-digest__kpi-label">Pending</span>
            </div>
            {stats.medianPrice && (
              <div className="crm-market-digest__kpi">
                <span className="crm-market-digest__kpi-value">{fmtPrice(stats.medianPrice)}</span>
                <span className="crm-market-digest__kpi-label">Median</span>
              </div>
            )}
            {stats.pricePerSqft && (
              <div className="crm-market-digest__kpi">
                <span className="crm-market-digest__kpi-value">${stats.pricePerSqft}</span>
                <span className="crm-market-digest__kpi-label">$/sqft</span>
              </div>
            )}
            {stats.newListingsThisWeek > 0 && (
              <div className="crm-market-digest__kpi">
                <span className="crm-market-digest__kpi-value">{stats.newListingsThisWeek}</span>
                <span className="crm-market-digest__kpi-label">New this week</span>
              </div>
            )}
          </div>

          {/* Narrative */}
          <p className="crm-market-digest__narrative">{digest.narrative}</p>

          {/* Highlights */}
          {digest.highlights.length > 0 && (
            <ul className="crm-market-digest__highlights">
              {digest.highlights.map((h, i) => (
                <li key={i} className="crm-market-digest__highlight">{h}</li>
              ))}
            </ul>
          )}

          {/* Takeaway */}
          {digest.agentTakeaway && (
            <div className="crm-market-digest__takeaway">
              <strong>Takeaway:</strong> {digest.agentTakeaway}
            </div>
          )}

          {/* Provenance */}
          <span className="crm-market-digest__provenance">
            {digest.provenance.source === 'ai' ? 'AI-generated' : 'Auto-generated'} · {digest.provenance.latencyMs}ms
          </span>
        </>
      )}
    </section>
  );
});
