'use client';

import { memo, useEffect, useRef, useState } from 'react';
import type { CrmContact, CrmLead } from '@real-estate/types/crm';

interface ConversionFunnelProps {
  leads: CrmLead[];
  contactById?: Map<string, CrmContact>;
  onClickStatus?: (status: string) => void;
}

interface FunnelStage {
  key: string;
  label: string;
  count: number;
  pct: number;
  avgDays: number;
  color: string;
}

function avgDaysInStatus(leads: CrmLead[], status: string): number {
  const matching = leads.filter((l) => l.status === status);
  if (matching.length === 0) return 0;
  const now = Date.now();
  const total = matching.reduce((sum, l) => {
    const created = new Date(l.createdAt).getTime();
    return sum + (now - created) / (1000 * 60 * 60 * 24);
  }, 0);
  return Math.round(total / matching.length);
}

export const ConversionFunnel = memo(function ConversionFunnel({ leads, contactById, onClickStatus }: ConversionFunnelProps) {
  const [animated, setAnimated] = useState(false);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const total = leads.length || 1;
  const countByStatus = {
    new: leads.filter((l) => l.status === 'new').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    nurturing: leads.filter((l) => l.status === 'nurturing').length,
    won: leads.filter((l) => l.status === 'won').length,
    lost: leads.filter((l) => l.status === 'lost').length,
  };

  const stages: FunnelStage[] = [
    {
      key: 'new',
      label: 'New',
      count: countByStatus.new,
      pct: Math.round((countByStatus.new / total) * 100),
      avgDays: avgDaysInStatus(leads, 'new'),
      color: 'var(--status-new)',
    },
    {
      key: 'qualified',
      label: 'Qualified',
      count: countByStatus.qualified,
      pct: Math.round((countByStatus.qualified / total) * 100),
      avgDays: avgDaysInStatus(leads, 'qualified'),
      color: 'var(--status-qualified)',
    },
    {
      key: 'nurturing',
      label: 'Nurturing',
      count: countByStatus.nurturing,
      pct: Math.round((countByStatus.nurturing / total) * 100),
      avgDays: avgDaysInStatus(leads, 'nurturing'),
      color: 'var(--status-nurturing)',
    },
    {
      key: 'won',
      label: 'Won',
      count: countByStatus.won,
      pct: Math.round((countByStatus.won / total) * 100),
      avgDays: avgDaysInStatus(leads, 'won'),
      color: 'var(--status-won)',
    },
    {
      key: 'lost',
      label: 'Lost',
      count: countByStatus.lost,
      pct: Math.round((countByStatus.lost / total) * 100),
      avgDays: avgDaysInStatus(leads, 'lost'),
      color: 'var(--status-lost)',
    },
  ];

  // Helper: get first N lead names for tooltip
  const getLeadNames = (status: string, max: number) => {
    const matching = leads.filter((l) => l.status === status).slice(0, max);
    return matching.map((l) => {
      const contact = l.contactId && contactById ? contactById.get(l.contactId) : undefined;
      return contact?.fullName || l.listingAddress || 'Lead';
    });
  };

  // SVG dimensions
  const svgW = 520;
  const svgH = 160;
  const stageW = svgW / stages.length;
  const maxBarH = 140;

  return (
    <div ref={ref} className={`crm-funnel ${animated ? 'crm-funnel--animated' : ''}`}>
      <h3 className="crm-funnel__title">Conversion Funnel</h3>
      <div className="crm-funnel__chart">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="crm-funnel__svg" aria-hidden="true">
          {stages.map((stage, i) => {
            const barH = Math.max(8, (stage.count / total) * maxBarH);
            const x = i * stageW + stageW * 0.1;
            const w = stageW * 0.8;
            const y = svgH - barH - 10;
            return (
              <g
                key={stage.key}
                className="crm-funnel__bar-group"
                onMouseEnter={() => setHoveredStage(stage.key)}
                onMouseLeave={() => setHoveredStage(null)}
                onClick={() => onClickStatus?.(stage.key)}
                style={{ cursor: onClickStatus ? 'pointer' : undefined }}
              >
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={barH}
                  rx={4}
                  fill={stage.color}
                  className="crm-funnel__bar"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
                <text x={x + w / 2} y={y - 6} textAnchor="middle" className="crm-funnel__bar-label">
                  {stage.count}
                </text>
                <text x={x + w / 2} y={svgH - 1} textAnchor="middle" className="crm-funnel__stage-label">
                  {stage.label}
                </text>
                {i < stages.length - 1 && (
                  <path
                    d={`M${(i + 1) * stageW},${svgH * 0.3} L${(i + 1) * stageW},${svgH * 0.7}`}
                    stroke="var(--crm-border)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltips (rendered outside SVG) */}
        {hoveredStage && (() => {
          const idx = stages.findIndex((s) => s.key === hoveredStage);
          if (idx < 0) return null;
          const stage = stages[idx]!;
          const names = getLeadNames(stage.key, 5);
          const remaining = stage.count - names.length;
          return (
            <div
              className="crm-funnel__tooltip"
              style={{ left: `${((idx + 0.5) / stages.length) * 100}%` }}
            >
              <strong>{stage.label} ({stage.count})</strong>
              {names.map((name, ni) => (
                <span key={ni} className="crm-funnel__tooltip-name">{name}</span>
              ))}
              {remaining > 0 && <span className="crm-muted">+{remaining} more</span>}
              {onClickStatus && <span className="crm-funnel__tooltip-cta">Click to view all</span>}
            </div>
          );
        })()}
      </div>

      <div className="crm-funnel__legend">
        {stages.map((stage) => (
          <span key={stage.key} className="crm-funnel__legend-item">
            <span className="crm-funnel__legend-dot" style={{ background: stage.color }} />
            {stage.label}: {stage.pct}% &middot; ~{stage.avgDays}d avg
          </span>
        ))}
      </div>
    </div>
  );
});
