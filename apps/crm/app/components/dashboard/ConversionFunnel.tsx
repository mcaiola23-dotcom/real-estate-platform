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
}

// Warm stone palette — graduated from dark to light, with muted earth tones
const STAGE_COLORS: Record<string, { bar: string; barHover: string }> = {
  new:       { bar: '#78716c', barHover: '#57534e' },
  qualified: { bar: '#8b7e74', barHover: '#6b5f55' },
  nurturing: { bar: '#a39585', barHover: '#8b7d6d' },
  won:       { bar: '#6b7c5e', barHover: '#566947' },
  lost:      { bar: '#b8a99a', barHover: '#9c8d7e' },
};

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
    { key: 'new', label: 'New', count: countByStatus.new, pct: Math.round((countByStatus.new / total) * 100), avgDays: avgDaysInStatus(leads, 'new') },
    { key: 'qualified', label: 'Qualified', count: countByStatus.qualified, pct: Math.round((countByStatus.qualified / total) * 100), avgDays: avgDaysInStatus(leads, 'qualified') },
    { key: 'nurturing', label: 'Nurturing', count: countByStatus.nurturing, pct: Math.round((countByStatus.nurturing / total) * 100), avgDays: avgDaysInStatus(leads, 'nurturing') },
    { key: 'won', label: 'Won', count: countByStatus.won, pct: Math.round((countByStatus.won / total) * 100), avgDays: avgDaysInStatus(leads, 'won') },
    { key: 'lost', label: 'Lost', count: countByStatus.lost, pct: Math.round((countByStatus.lost / total) * 100), avgDays: avgDaysInStatus(leads, 'lost') },
  ];

  const getLeadNames = (status: string, max: number) => {
    const matching = leads.filter((l) => l.status === status).slice(0, max);
    return matching.map((l) => {
      const contact = l.contactId && contactById ? contactById.get(l.contactId) : undefined;
      return contact?.fullName || l.listingAddress || 'Lead';
    });
  };

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div ref={ref} className={`crm-funnel ${animated ? 'crm-funnel--animated' : ''}`}>
      <h3 className="crm-funnel__title">Conversion Funnel</h3>

      <div className="crm-funnel__bars">
        {stages.map((stage, i) => {
          const colors = STAGE_COLORS[stage.key] ?? STAGE_COLORS.new;
          const heightPct = Math.max(6, (stage.count / maxCount) * 100);
          const isHovered = hoveredStage === stage.key;
          return (
            <div
              key={stage.key}
              className="crm-funnel__col"
              onMouseEnter={() => setHoveredStage(stage.key)}
              onMouseLeave={() => setHoveredStage(null)}
              onClick={() => onClickStatus?.(stage.key)}
              style={{ cursor: onClickStatus ? 'pointer' : undefined }}
            >
              <span className="crm-funnel__count">{stage.count}</span>
              <div className="crm-funnel__bar-track">
                <div
                  className="crm-funnel__bar"
                  style={{
                    height: animated ? `${heightPct}%` : '0%',
                    background: isHovered ? colors.barHover : colors.bar,
                    transitionDelay: `${i * 80}ms`,
                  }}
                />
              </div>
              <span className="crm-funnel__label">{stage.label}</span>
              <span className="crm-funnel__meta">{stage.pct}% · {stage.avgDays}d</span>

              {isHovered && (() => {
                const names = getLeadNames(stage.key, 5);
                const remaining = stage.count - names.length;
                return (
                  <div className="crm-funnel__tooltip">
                    <strong>{stage.label} ({stage.count})</strong>
                    {names.map((name, ni) => (
                      <span key={ni} className="crm-funnel__tooltip-name">{name}</span>
                    ))}
                    {remaining > 0 && <span className="crm-funnel__tooltip-more">+{remaining} more</span>}
                    {onClickStatus && <span className="crm-funnel__tooltip-cta">Click to view</span>}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
});
