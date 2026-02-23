'use client';

import { useMemo } from 'react';
import type { CrmLead, CrmActivity } from '@real-estate/types/crm';

interface BenchmarkPanelProps {
  leads: CrmLead[];
  activities: CrmActivity[];
}

interface BenchmarkMetric {
  label: string;
  yourValue: number;
  industryAvg: number;
  unit: string;
  lowerIsBetter?: boolean;
}

// NAR industry benchmark data (hardcoded)
const INDUSTRY_BENCHMARKS = {
  speedToLeadMinutes: 15,
  conversionRate: 2.5,
  avgActivitiesPerLead: 8,
  avgDaysToClose: 45,
};

export function BenchmarkPanel({ leads, activities }: BenchmarkPanelProps) {
  const metrics = useMemo(() => {
    const results: BenchmarkMetric[] = [];

    // Speed-to-lead: average minutes from lead creation to first activity
    const leadsWithActivity = leads.filter((l) => {
      const leadActivities = activities.filter((a) => a.leadId === l.id);
      return leadActivities.length > 0;
    });

    if (leadsWithActivity.length > 0) {
      const responseTimes = leadsWithActivity.map((lead) => {
        const firstActivity = activities
          .filter((a) => a.leadId === lead.id)
          .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())[0];
        if (!firstActivity) return 0;
        return (new Date(firstActivity.occurredAt).getTime() - new Date(lead.createdAt).getTime()) / 60000;
      });
      const avgResponse = responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length;
      results.push({
        label: 'Speed to Lead',
        yourValue: Math.round(avgResponse),
        industryAvg: INDUSTRY_BENCHMARKS.speedToLeadMinutes,
        unit: 'min',
        lowerIsBetter: true,
      });
    }

    // Conversion rate
    const wonLeads = leads.filter((l) => l.status === 'won').length;
    const totalLeads = leads.length;
    if (totalLeads > 0) {
      results.push({
        label: 'Conversion Rate',
        yourValue: Math.round((wonLeads / totalLeads) * 1000) / 10,
        industryAvg: INDUSTRY_BENCHMARKS.conversionRate,
        unit: '%',
      });
    }

    // Activities per lead
    if (totalLeads > 0) {
      results.push({
        label: 'Activities per Lead',
        yourValue: Math.round((activities.length / totalLeads) * 10) / 10,
        industryAvg: INDUSTRY_BENCHMARKS.avgActivitiesPerLead,
        unit: '',
      });
    }

    // Days to close
    const closedLeads = leads.filter((l) => l.closedAt);
    if (closedLeads.length > 0) {
      const daysToClose = closedLeads.map((l) => {
        return (new Date(l.closedAt!).getTime() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      });
      const avgDays = daysToClose.reduce((s, v) => s + v, 0) / daysToClose.length;
      results.push({
        label: 'Days to Close',
        yourValue: Math.round(avgDays),
        industryAvg: INDUSTRY_BENCHMARKS.avgDaysToClose,
        unit: 'days',
        lowerIsBetter: true,
      });
    }

    return results;
  }, [leads, activities]);

  const getComparison = (metric: BenchmarkMetric) => {
    const diff = metric.lowerIsBetter
      ? metric.industryAvg - metric.yourValue
      : metric.yourValue - metric.industryAvg;
    if (diff > 0) return 'better';
    if (diff < 0) return 'worse';
    return 'same';
  };

  if (metrics.length === 0) {
    return null;
  }

  return (
    <div className="crm-benchmark-panel">
      <h4>Performance Benchmarks</h4>
      <span className="crm-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
        Compared to NAR industry averages
      </span>

      <div className="crm-benchmark-grid">
        {metrics.map((metric) => {
          const comparison = getComparison(metric);
          return (
            <div key={metric.label} className={`crm-benchmark-item crm-benchmark--${comparison}`}>
              <span className="crm-benchmark-label">{metric.label}</span>
              <div className="crm-benchmark-values">
                <div className="crm-benchmark-yours">
                  <span className="crm-benchmark-value">
                    {metric.yourValue}{metric.unit}
                  </span>
                  <span className="crm-muted">You</span>
                </div>
                <span className="crm-benchmark-vs">vs</span>
                <div className="crm-benchmark-industry">
                  <span className="crm-benchmark-value">
                    {metric.industryAvg}{metric.unit}
                  </span>
                  <span className="crm-muted">Avg</span>
                </div>
              </div>
              <span className={`crm-benchmark-indicator crm-benchmark-indicator--${comparison}`}>
                {comparison === 'better' ? '↑ Above' : comparison === 'worse' ? '↓ Below' : '= On par'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
