'use client';

import { useMemo } from 'react';
import type { CrmLead } from '@real-estate/types/crm';

interface ForecastPanelProps {
  leads: CrmLead[];
}

interface ForecastBucket {
  label: string;
  pipelineValue: number;
  weightedValue: number;
  count: number;
}

export function ForecastPanel({ leads }: ForecastPanelProps) {
  const forecast = useMemo(() => {
    const now = new Date();
    const buckets: ForecastBucket[] = [
      { label: 'This Month', pipelineValue: 0, weightedValue: 0, count: 0 },
      { label: 'Next Month', pipelineValue: 0, weightedValue: 0, count: 0 },
      { label: '2-3 Months', pipelineValue: 0, weightedValue: 0, count: 0 },
      { label: '3+ Months', pipelineValue: 0, weightedValue: 0, count: 0 },
    ];

    const winProbability: Record<string, number> = {
      new: 0.1,
      qualified: 0.3,
      nurturing: 0.5,
      won: 1.0,
      lost: 0,
    };

    const activeLeads = leads.filter(
      (l) => l.status !== 'won' && l.status !== 'lost' && (l.priceMin || l.priceMax)
    );

    for (const lead of activeLeads) {
      const value = lead.priceMax || lead.priceMin || 0;
      const prob = winProbability[lead.status] ?? 0.1;
      const weighted = Math.round(value * prob);

      let bucketIndex = 3;
      if (lead.nextActionAt) {
        const actionDate = new Date(lead.nextActionAt);
        const monthsDiff =
          (actionDate.getFullYear() - now.getFullYear()) * 12 +
          (actionDate.getMonth() - now.getMonth());
        if (monthsDiff <= 0) bucketIndex = 0;
        else if (monthsDiff === 1) bucketIndex = 1;
        else if (monthsDiff <= 3) bucketIndex = 2;
        else bucketIndex = 3;
      }

      buckets[bucketIndex].pipelineValue += value;
      buckets[bucketIndex].weightedValue += weighted;
      buckets[bucketIndex].count += 1;
    }

    const totalPipeline = buckets.reduce((s, b) => s + b.pipelineValue, 0);
    const totalWeighted = buckets.reduce((s, b) => s + b.weightedValue, 0);

    return { buckets, totalPipeline, totalWeighted };
  }, [leads]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const maxWeighted = Math.max(...forecast.buckets.map((b) => b.weightedValue), 1);

  return (
    <div className="crm-forecast-panel">
      <div className="crm-forecast-header">
        <h4>Revenue Forecast</h4>
        <div className="crm-forecast-totals">
          <div className="crm-forecast-total">
            <span className="crm-muted">Pipeline</span>
            <strong>{formatCurrency(forecast.totalPipeline)}</strong>
          </div>
          <div className="crm-forecast-total">
            <span className="crm-muted">Weighted</span>
            <strong>{formatCurrency(forecast.totalWeighted)}</strong>
          </div>
        </div>
      </div>

      <div className="crm-forecast-bars">
        {forecast.buckets.map((bucket) => (
          <div key={bucket.label} className="crm-forecast-bar-row">
            <div className="crm-forecast-bar-label">
              <span>{bucket.label}</span>
              <span className="crm-muted">{bucket.count} leads</span>
            </div>
            <div className="crm-forecast-bar-track">
              <div
                className="crm-forecast-bar-fill"
                style={{ width: `${(bucket.weightedValue / maxWeighted) * 100}%` }}
              />
            </div>
            <span className="crm-forecast-bar-value">{formatCurrency(bucket.weightedValue)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
