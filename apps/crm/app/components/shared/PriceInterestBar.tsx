import type { LeadListingSignal } from '../../lib/crm-types';

export function PriceInterestBar({ signals }: { signals: LeadListingSignal[] }) {
  const prices = signals
    .map((s) => s.price)
    .filter((p): p is number => p !== null && p > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    return null;
  }

  const min = prices[0]!;
  const max = prices[prices.length - 1]!;
  const median = prices[Math.floor(prices.length / 2)]!;
  const range = max - min || 1;
  const medianPct = ((median - min) / range) * 100;

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : `$${Math.round(n / 1000)}K`;

  return (
    <div className="crm-price-bar">
      <span className="crm-chart-label">Price Interest Range</span>
      <div className="crm-price-bar-track">
        <div className="crm-price-bar-fill" style={{ left: '0%', width: '100%' }} />
        <div
          className="crm-price-bar-marker"
          style={{ left: `${Math.max(2, Math.min(98, medianPct))}%` }}
          title={`Most viewed: ${fmt(median)}`}
        />
      </div>
      <div className="crm-price-bar-labels">
        <span>{fmt(min)}</span>
        <span style={{ fontWeight: 600 }}>{fmt(median)}</span>
        <span>{fmt(max)}</span>
      </div>
    </div>
  );
}
