'use client';

import { useState } from 'react';
import type { DailyBreakdown } from '../../lib/crm-types';

const DAY_FMT = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export function SevenDayPulse({ days }: { days: DailyBreakdown[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const activeIndex = pinnedIndex ?? hoveredIndex;

  const width = 800;
  const height = 100;
  const padX = 32;
  const padY = 14;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const maxTotal = Math.max(1, ...days.map((d) => d.total));

  const points = days.map((day, i) => {
    const x = padX + (i / Math.max(1, days.length - 1)) * chartW;
    const y = padY + chartH - (day.total / maxTotal) * chartH;
    return { x, y, day };
  });

  // Angular straight-line path (heart-rate-monitor aesthetic)
  const pathD = points.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');

  const areaD = `${pathD} L ${points[points.length - 1]!.x} ${height - padY} L ${points[0]!.x} ${height - padY} Z`;

  return (
    <div className="crm-pulse-container">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="crm-pulse-svg"
        aria-label="7-day Pulse"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="pulse-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--crm-accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--crm-accent)" stopOpacity="0.01" />
          </linearGradient>
          <filter id="pulse-glow">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <path d={areaD} fill="url(#pulse-fill)" />
        <path d={pathD} fill="none" stroke="var(--crm-accent)" strokeWidth="5" strokeLinecap="round" filter="url(#pulse-glow)" opacity={0.35} />
        <path d={pathD} fill="none" stroke="var(--crm-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="miter" />

        {/* hover columns */}
        {points.map((pt, i) => (
          <rect
            key={`hover-${i}`}
            x={pt.x - chartW / days.length / 2}
            y={0}
            width={chartW / days.length}
            height={height}
            fill={activeIndex === i ? 'rgba(0,0,0,0.04)' : 'transparent'}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => setPinnedIndex((prev) => (prev === i ? null : i))}
            style={{ cursor: 'crosshair' }}
          />
        ))}

        {/* data points */}
        {points.map((pt, i) => (
          <circle
            key={`dot-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={activeIndex === i ? 6 : 3.5}
            fill={pinnedIndex === i ? 'var(--crm-accent)' : 'var(--crm-surface)'}
            stroke="var(--crm-accent)"
            strokeWidth={activeIndex === i ? 2.5 : 2}
            className={i === points.length - 1 ? 'crm-pulse-dot-live' : ''}
            style={{ transition: 'all 0.15s ease', pointerEvents: 'none' }}
          />
        ))}

        {/* day labels — full date format */}
        {points.map((pt, i) => (
          <text key={`lbl-${i}`} x={pt.x} y={height - 2} textAnchor="middle" className="crm-pulse-day-label">
            {DAY_FMT.format(days[i]!.date)}
          </text>
        ))}
      </svg>

      {activeIndex !== null && points[activeIndex] ? (
        <div
          className={`crm-pulse-tooltip${pinnedIndex !== null ? ' is-pinned' : ''}`}
          style={{
            left: `${(points[activeIndex]!.x / width) * 100}%`,
          }}
        >
          <div className="crm-pulse-tooltip-header">
            <span>{DAY_FMT.format(days[activeIndex]!.date)}</span>
            <strong>{days[activeIndex]!.total} events</strong>
          </div>
          <div className="crm-pulse-tooltip-grid">
            <span className="crm-pulse-tooltip-row"><span className="crm-pulse-icon crm-pulse-icon-leads" />{days[activeIndex]!.newLeads} New Leads</span>
            <span className="crm-pulse-tooltip-row"><span className="crm-pulse-icon crm-pulse-icon-status" />{days[activeIndex]!.statusChanges} Status Changes</span>
            <span className="crm-pulse-tooltip-row"><span className="crm-pulse-icon crm-pulse-icon-views" />{days[activeIndex]!.listingViews} Listings Viewed</span>
            <span className="crm-pulse-tooltip-row"><span className="crm-pulse-icon crm-pulse-icon-search" />{days[activeIndex]!.searches} Searches</span>
            <span className="crm-pulse-tooltip-row"><span className="crm-pulse-icon crm-pulse-icon-fav" />{days[activeIndex]!.favorites} Favorites</span>
            <span className="crm-pulse-tooltip-row"><span className="crm-pulse-icon crm-pulse-icon-notes" />{days[activeIndex]!.notes} Notes</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
