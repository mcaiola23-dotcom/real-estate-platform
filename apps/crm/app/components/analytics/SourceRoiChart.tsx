'use client';

import { useMemo, useState, useCallback } from 'react';

export interface SourceRoiData {
  source: string;
  total: number;
  won: number;
  estimatedRevenue: number;
}

interface SourceRoiChartProps {
  sourceData: SourceRoiData[];
  onCostChange?: (source: string, cost: number) => void;
}

interface RoiRow extends SourceRoiData {
  cost: number;
  roi: number | null;
  profit: number;
}

function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${Math.round(amount).toLocaleString()}`;
}

function formatRoi(roi: number | null): string {
  if (roi === null) return '--';
  const sign = roi > 0 ? '+' : '';
  return `${sign}${Math.round(roi)}%`;
}

function getRoiTier(roi: number | null): string {
  if (roi === null) return 'neutral';
  if (roi > 200) return 'exceptional';
  if (roi > 50) return 'strong';
  if (roi > 0) return 'positive';
  if (roi === 0) return 'neutral';
  return 'negative';
}

export function SourceRoiChart({ sourceData, onCostChange }: SourceRoiChartProps) {
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [editingSource, setEditingSource] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const rows: RoiRow[] = useMemo(() => {
    return sourceData
      .map((s) => {
        const cost = costs[s.source] ?? 0;
        const profit = s.estimatedRevenue - cost;
        const roi = cost > 0 ? ((s.estimatedRevenue - cost) / cost) * 100 : null;
        return { ...s, cost, roi, profit };
      })
      .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
  }, [sourceData, costs]);

  const maxAbsRoi = useMemo(() => {
    const vals = rows.map((r) => Math.abs(r.roi ?? 0)).filter((v) => v > 0);
    return vals.length > 0 ? Math.max(...vals) : 100;
  }, [rows]);

  const totals = useMemo(() => {
    const totalRevenue = rows.reduce((s, r) => s + r.estimatedRevenue, 0);
    const totalCost = rows.reduce((s, r) => s + r.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const totalRoi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : null;
    return { totalRevenue, totalCost, totalProfit, totalRoi };
  }, [rows]);

  const handleStartEdit = useCallback((source: string, currentCost: number) => {
    setEditingSource(source);
    setEditValue(currentCost > 0 ? String(currentCost) : '');
  }, []);

  const handleCommitEdit = useCallback((source: string) => {
    const parsed = Number(editValue);
    const newCost = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    setCosts((prev) => ({ ...prev, [source]: newCost }));
    onCostChange?.(source, newCost);
    setEditingSource(null);
    setEditValue('');
  }, [editValue, onCostChange]);

  if (sourceData.length === 0) {
    return null;
  }

  return (
    <div className="crm-roi">
      <div className="crm-roi-header">
        <h3 className="crm-roi-title">Source ROI Analysis</h3>
        <span className="crm-roi-subtitle">Click cost fields to enter ad spend and referral fees</span>
      </div>

      {/* ROI Table */}
      <div className="crm-roi-table-wrap">
        <div className="crm-roi-table">
          <div className="crm-roi-table__head">
            <span className="crm-roi-th crm-roi-th--source">Source</span>
            <span className="crm-roi-th crm-roi-th--num">Leads</span>
            <span className="crm-roi-th crm-roi-th--num">Won</span>
            <span className="crm-roi-th crm-roi-th--num">Revenue</span>
            <span className="crm-roi-th crm-roi-th--num crm-roi-th--editable">Cost</span>
            <span className="crm-roi-th crm-roi-th--num">Profit</span>
            <span className="crm-roi-th crm-roi-th--num">ROI</span>
          </div>

          {rows.map((row) => {
            const tier = getRoiTier(row.roi);
            return (
              <div key={row.source} className="crm-roi-table__row">
                <span className="crm-roi-td crm-roi-td--source">{row.source}</span>
                <span className="crm-roi-td crm-roi-td--num">{row.total}</span>
                <span className="crm-roi-td crm-roi-td--num">{row.won}</span>
                <span className="crm-roi-td crm-roi-td--num crm-roi-td--revenue">
                  {formatCompactCurrency(row.estimatedRevenue)}
                </span>
                <span className="crm-roi-td crm-roi-td--num crm-roi-td--cost">
                  {editingSource === row.source ? (
                    <input
                      type="number"
                      className="crm-roi-cost-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleCommitEdit(row.source)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommitEdit(row.source);
                        if (e.key === 'Escape') { setEditingSource(null); setEditValue(''); }
                      }}
                      autoFocus
                      min={0}
                      placeholder="0"
                    />
                  ) : (
                    <button
                      type="button"
                      className="crm-roi-cost-btn"
                      onClick={() => handleStartEdit(row.source, row.cost)}
                      title="Click to enter cost"
                    >
                      {row.cost > 0 ? formatCompactCurrency(row.cost) : '--'}
                    </button>
                  )}
                </span>
                <span className={`crm-roi-td crm-roi-td--num crm-roi-td--profit crm-roi-td--${tier}`}>
                  {row.cost > 0 ? formatCompactCurrency(row.profit) : '--'}
                </span>
                <span className={`crm-roi-td crm-roi-td--num crm-roi-td--roi crm-roi-td--${tier}`}>
                  {formatRoi(row.roi)}
                </span>
              </div>
            );
          })}

          {/* Totals row */}
          <div className="crm-roi-table__row crm-roi-table__totals">
            <span className="crm-roi-td crm-roi-td--source crm-roi-td--total-label">Total</span>
            <span className="crm-roi-td crm-roi-td--num">
              {rows.reduce((s, r) => s + r.total, 0)}
            </span>
            <span className="crm-roi-td crm-roi-td--num">
              {rows.reduce((s, r) => s + r.won, 0)}
            </span>
            <span className="crm-roi-td crm-roi-td--num crm-roi-td--revenue">
              {formatCompactCurrency(totals.totalRevenue)}
            </span>
            <span className="crm-roi-td crm-roi-td--num crm-roi-td--cost">
              {totals.totalCost > 0 ? formatCompactCurrency(totals.totalCost) : '--'}
            </span>
            <span className={`crm-roi-td crm-roi-td--num crm-roi-td--profit crm-roi-td--${getRoiTier(totals.totalRoi)}`}>
              {totals.totalCost > 0 ? formatCompactCurrency(totals.totalProfit) : '--'}
            </span>
            <span className={`crm-roi-td crm-roi-td--num crm-roi-td--roi crm-roi-td--${getRoiTier(totals.totalRoi)}`}>
              {formatRoi(totals.totalRoi)}
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      {rows.some((r) => r.roi !== null) ? (
        <div className="crm-roi-chart">
          <h4 className="crm-roi-chart-title">ROI by Source</h4>
          <div className="crm-roi-chart-body">
            {rows.filter((r) => r.roi !== null).map((row) => {
              const pct = maxAbsRoi > 0 ? Math.min(Math.abs(row.roi!) / maxAbsRoi, 1) * 100 : 0;
              const isNeg = (row.roi ?? 0) < 0;
              const tier = getRoiTier(row.roi);
              return (
                <div key={row.source} className="crm-roi-bar-row">
                  <span className="crm-roi-bar-label">{row.source}</span>
                  <div className="crm-roi-bar-track">
                    <div className="crm-roi-bar-center" />
                    <div
                      className={`crm-roi-bar-fill crm-roi-bar-fill--${tier} ${isNeg ? 'crm-roi-bar-fill--neg' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`crm-roi-bar-value crm-roi-td--${tier}`}>
                    {formatRoi(row.roi)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
