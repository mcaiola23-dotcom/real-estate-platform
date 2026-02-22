'use client';

import { useMemo, useState } from 'react';
import type { CrmLead, CrmActivity, CrmContact } from '@real-estate/types/crm';
import { estimateDealValue } from '../../lib/crm-aging';
import { exportLeadsCsv } from '../../lib/crm-export';
import { SourceRoiChart, type SourceRoiData } from './SourceRoiChart';

interface AnalyticsViewProps {
  leads: CrmLead[];
  activities: CrmActivity[];
  contactById: Map<string, CrmContact>;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

function filterByRange<T extends { createdAt: string }>(items: T[], range: TimeRange): T[] {
  if (range === 'all') return items;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return items.filter((item) => new Date(item.createdAt).getTime() > cutoff);
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${Math.round(amount)}`;
}

export function AnalyticsView({ leads, activities, contactById }: AnalyticsViewProps) {
  const [range, setRange] = useState<TimeRange>('30d');

  const filteredLeads = useMemo(() => filterByRange(leads, range), [leads, range]);
  const filteredActivities = useMemo(() => filterByRange(activities, range), [activities, range]);

  const metrics = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const wonLeads = filteredLeads.filter((l) => l.status === 'won').length;
    const lostLeads = filteredLeads.filter((l) => l.status === 'lost').length;
    const closedLeads = wonLeads + lostLeads;
    const winRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    const pipelineLeads = filteredLeads.filter(
      (l) => l.status !== 'won' && l.status !== 'lost'
    );
    const activePipelineValue = pipelineLeads.reduce(
      (sum, l) => sum + estimateDealValue(l.priceMin, l.priceMax), 0
    );

    // Activity volume
    const activityCount = filteredActivities.length;

    // Avg days to close
    const closedWithDates = filteredLeads.filter(
      (l) => l.status === 'won' || l.status === 'lost'
    );
    const avgDaysToClose = closedWithDates.length > 0
      ? Math.round(
          closedWithDates.reduce((sum, l) => {
            const created = new Date(l.createdAt).getTime();
            const updated = new Date(l.updatedAt).getTime();
            return sum + (updated - created) / (1000 * 60 * 60 * 24);
          }, 0) / closedWithDates.length
        )
      : 0;

    // Source breakdown
    const sourceMap = new Map<string, { total: number; won: number }>();
    for (const lead of filteredLeads) {
      const existing = sourceMap.get(lead.source) || { total: 0, won: 0 };
      existing.total += 1;
      if (lead.status === 'won') existing.won += 1;
      sourceMap.set(lead.source, existing);
    }
    const sourceBreakdown = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        total: data.total,
        won: data.won,
        rate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalLeads,
      wonLeads,
      lostLeads,
      winRate,
      conversionRate,
      activePipelineValue,
      pipelineCount: pipelineLeads.length,
      activityCount,
      avgDaysToClose,
      sourceBreakdown,
    };
  }, [filteredLeads, filteredActivities]);

  const sourceRoiData: SourceRoiData[] = useMemo(() => {
    const map = new Map<string, SourceRoiData>();
    for (const lead of filteredLeads) {
      const existing = map.get(lead.source) ?? { source: lead.source, total: 0, won: 0, estimatedRevenue: 0 };
      existing.total += 1;
      if (lead.status === 'won') {
        existing.won += 1;
        existing.estimatedRevenue += estimateDealValue(lead.priceMin, lead.priceMax);
      }
      map.set(lead.source, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
  }, [filteredLeads]);

  const rangeOptions: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <section className="crm-analytics-view">
      <div className="crm-analytics-toolbar">
        <h2 className="crm-analytics-title">Performance Analytics</h2>
        <div className="crm-analytics-controls">
          <div className="crm-analytics-range">
            {rangeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`crm-analytics-range__btn ${range === opt.value ? 'crm-analytics-range__btn--active' : ''}`}
                onClick={() => setRange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="crm-export-btn"
            onClick={() => exportLeadsCsv(leads, contactById)}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="crm-analytics-grid">
        <div className="crm-metric-card">
          <span className="crm-metric-card__label">Total Leads</span>
          <span className="crm-metric-card__value">{metrics.totalLeads}</span>
        </div>
        <div className="crm-metric-card">
          <span className="crm-metric-card__label">Win Rate</span>
          <span className="crm-metric-card__value">{metrics.winRate}%</span>
        </div>
        <div className="crm-metric-card">
          <span className="crm-metric-card__label">Conversion Rate</span>
          <span className="crm-metric-card__value">{metrics.conversionRate}%</span>
        </div>
        <div className="crm-metric-card">
          <span className="crm-metric-card__label">Pipeline Value</span>
          <span className="crm-metric-card__value crm-metric-card__value--emerald">
            {formatCurrency(metrics.activePipelineValue)}
          </span>
          <span className="crm-metric-card__sub">{metrics.pipelineCount} deals</span>
        </div>
        <div className="crm-metric-card">
          <span className="crm-metric-card__label">Avg. Days to Close</span>
          <span className="crm-metric-card__value">{metrics.avgDaysToClose}d</span>
        </div>
        <div className="crm-metric-card">
          <span className="crm-metric-card__label">Activity Volume</span>
          <span className="crm-metric-card__value">{metrics.activityCount}</span>
          <span className="crm-metric-card__sub">interactions</span>
        </div>
      </div>

      <div className="crm-analytics-section">
        <h3 className="crm-analytics-section__title">Win Rate by Source</h3>
        <div className="crm-source-table">
          <div className="crm-source-table__header">
            <span>Source</span>
            <span>Leads</span>
            <span>Won</span>
            <span>Win Rate</span>
          </div>
          {metrics.sourceBreakdown.length === 0 ? (
            <div className="crm-source-table__empty">No lead data available</div>
          ) : (
            metrics.sourceBreakdown.map((row) => (
              <div key={row.source} className="crm-source-table__row">
                <span className="crm-source-table__source">{row.source}</span>
                <span className="crm-source-table__num">{row.total}</span>
                <span className="crm-source-table__num">{row.won}</span>
                <span className="crm-source-table__rate">{row.rate}%</span>
              </div>
            ))
          )}
        </div>
      </div>

      <SourceRoiChart sourceData={sourceRoiData} />
    </section>
  );
}
