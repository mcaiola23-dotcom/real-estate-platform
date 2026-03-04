'use client';

import { useState, useEffect } from 'react';

const API_BASE = '/api/portal';

interface AreaStats {
  name: string;
  median_sale_price: number | null;
  avg_sale_price: number | null;
  total_sales_12m: number;
  median_dom: number | null;
  avg_price_per_sqft: number | null;
  inventory_count: number;
  price_trend_yoy: number | null;
}

interface MarketStatsData {
  town: AreaStats;
  neighborhood: AreaStats | null;
  source: string;
  as_of: string;
}

interface MarketStatsSectionProps {
  town: string;
  neighborhood?: string;
}

function formatPrice(value: number | null): string {
  if (value == null) return '\u2014';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value.toLocaleString()}`;
}

function formatTrend(value: number | null): { text: string; className: string } {
  if (value == null) return { text: '\u2014', className: 'text-stone-500' };
  const pct = Math.abs(value * 100).toFixed(1);
  if (value >= 0) {
    return { text: `\u2191 ${pct}%`, className: 'text-teal-700' };
  }
  return { text: `\u2193 ${pct}%`, className: 'text-rose-600' };
}

interface RowDef {
  label: string;
  getValue: (stats: AreaStats) => string;
  getTrend?: boolean;
}

const rows: RowDef[] = [
  { label: 'Median Price', getValue: (s) => formatPrice(s.median_sale_price) },
  { label: 'Sales (12 mo)', getValue: (s) => s.total_sales_12m ? String(s.total_sales_12m) : '\u2014' },
  { label: 'Median DOM', getValue: (s) => s.median_dom != null ? `${s.median_dom} days` : '\u2014' },
  { label: '$/sqft', getValue: (s) => s.avg_price_per_sqft != null ? `$${s.avg_price_per_sqft}` : '\u2014' },
  { label: 'Inventory', getValue: (s) => s.inventory_count ? String(s.inventory_count) : '\u2014' },
  { label: 'Price Trend', getValue: () => '', getTrend: true },
];

function SkeletonTable({ hasNeighborhood }: { hasNeighborhood: boolean }) {
  return (
    <div className="bg-stone-50 rounded-xl border border-stone-100 overflow-hidden animate-pulse">
      <div className="grid grid-cols-3 gap-4 px-4 py-3 border-b border-stone-200">
        <div className="h-3 w-20 bg-stone-200 rounded" />
        {hasNeighborhood && <div className="h-3 w-16 bg-stone-200 rounded ml-auto" />}
        <div className="h-3 w-16 bg-stone-200 rounded ml-auto" />
      </div>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="grid grid-cols-3 gap-4 px-4 py-2.5">
          <div className="h-3 w-20 bg-stone-200 rounded" />
          {hasNeighborhood && <div className="h-3 w-14 bg-stone-200 rounded ml-auto" />}
          <div className="h-3 w-14 bg-stone-200 rounded ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function MarketStatsSection({ town, neighborhood }: MarketStatsSectionProps) {
  const [data, setData] = useState<MarketStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!town) return;

    const fetchStats = async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({ town });
        if (neighborhood) params.set('neighborhood', neighborhood);
        const response = await fetch(`${API_BASE}/api/market/stats?${params}`);
        if (!response.ok) throw new Error('Failed to fetch market stats');
        setData(await response.json());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [town, neighborhood]);

  if (error) {
    return (
      <div className="bg-stone-50 rounded-xl p-6 border border-stone-100 text-center">
        <p className="text-sm text-stone-500">Market statistics are not available at this time.</p>
      </div>
    );
  }

  const hasNeighborhood = !!neighborhood;
  const neighborhoodData = data?.neighborhood;

  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-900 mb-3">Market Statistics</h3>
      {loading ? (
        <SkeletonTable hasNeighborhood={hasNeighborhood} />
      ) : data ? (
        <div className="bg-stone-50 rounded-xl border border-stone-100 overflow-hidden">
          {/* Header row */}
          <div
            className={`grid ${hasNeighborhood ? 'grid-cols-3' : 'grid-cols-2'} gap-4 px-4 py-2.5 border-b border-stone-200 bg-stone-100/50`}
          >
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide" />
            {hasNeighborhood && (
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide text-right">
                {neighborhoodData?.name || neighborhood}
              </div>
            )}
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide text-right">
              {data.town.name}
            </div>
          </div>
          {/* Data rows */}
          {rows.map((row) => {
            const trend = row.getTrend;
            const townTrend = trend ? formatTrend(data.town.price_trend_yoy) : null;
            const neighTrend = trend && neighborhoodData ? formatTrend(neighborhoodData.price_trend_yoy) : null;

            return (
              <div
                key={row.label}
                className={`grid ${hasNeighborhood ? 'grid-cols-3' : 'grid-cols-2'} gap-4 px-4 py-2 border-b border-stone-100 last:border-b-0`}
              >
                <span className="text-xs text-stone-500">{row.label}</span>
                {hasNeighborhood && (
                  <span className={`text-sm font-semibold text-right ${trend && neighTrend ? neighTrend.className : 'text-stone-900'}`}>
                    {trend
                      ? (neighTrend ? neighTrend.text : '\u2014')
                      : (neighborhoodData ? row.getValue(neighborhoodData) : '\u2014')}
                  </span>
                )}
                <span className={`text-sm font-semibold text-right ${trend && townTrend ? townTrend.className : 'text-stone-900'}`}>
                  {trend
                    ? (townTrend ? townTrend.text : '\u2014')
                    : row.getValue(data.town)}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
      {data && (
        <p className="text-[0.65rem] text-stone-400 mt-2">
          Based on {data.source === 'internal' ? 'MLS listing' : data.source} data as of{' '}
          {new Date(data.as_of).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      )}
    </div>
  );
}
