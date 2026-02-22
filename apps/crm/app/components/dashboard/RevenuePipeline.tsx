'use client';

import { memo } from 'react';
import type { CrmLead } from '@real-estate/types/crm';

interface RevenuePipelineProps {
  leads: CrmLead[];
  commissionRate?: number;
}

interface PipelineStage {
  key: string;
  label: string;
  value: number;
  count: number;
}

function estimateDealValue(lead: CrmLead): number {
  if (lead.priceMin && lead.priceMax) return (lead.priceMin + lead.priceMax) / 2;
  if (lead.priceMax) return lead.priceMax;
  if (lead.priceMin) return lead.priceMin;
  return 0;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export const RevenuePipeline = memo(function RevenuePipeline({
  leads,
  commissionRate = 0.03,
}: RevenuePipelineProps) {
  const statusOrder = ['new', 'qualified', 'nurturing'];
  const statusLabels: Record<string, string> = {
    new: 'New',
    qualified: 'Qualified',
    nurturing: 'Nurturing',
  };

  const stages: PipelineStage[] = statusOrder.map((status) => {
    const inStage = leads.filter((l) => l.status === status);
    const totalValue = inStage.reduce((sum, l) => sum + estimateDealValue(l), 0);
    return {
      key: status,
      label: statusLabels[status],
      value: totalValue,
      count: inStage.length,
    };
  });

  const grandTotal = stages.reduce((sum, s) => sum + s.value, 0);
  const maxValue = Math.max(1, ...stages.map((s) => s.value));
  const commissionTotal = grandTotal * commissionRate;

  return (
    <div className="crm-revenue">
      <div className="crm-revenue__header">
        <h3 className="crm-revenue__title">Revenue Pipeline</h3>
        <div className="crm-revenue__totals">
          <span className="crm-revenue__grand">{formatCurrency(grandTotal)}</span>
          <span className="crm-revenue__commission">
            Est. Commission: {formatCurrency(commissionTotal)}
          </span>
        </div>
      </div>

      <div className="crm-revenue__bars">
        {stages.map((stage) => {
          const pct = (stage.value / maxValue) * 100;
          const commission = stage.value * commissionRate;
          return (
            <div key={stage.key} className="crm-revenue__bar-row">
              <span className="crm-revenue__bar-label">{stage.label}</span>
              <div className="crm-revenue__bar-track">
                <div
                  className="crm-revenue__bar-fill"
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
              <div className="crm-revenue__bar-values">
                <span className="crm-revenue__bar-total">{formatCurrency(stage.value)}</span>
                <span className="crm-revenue__bar-commission">{formatCurrency(commission)}</span>
              </div>
              <span className="crm-revenue__bar-count">{stage.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
