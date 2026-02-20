'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import type { CrmActivity, CrmContact, CrmLead, CrmLeadIngestionSummary, CrmLeadStatus } from '@real-estate/types/crm';
import type { TenantContext } from '@real-estate/types/tenant';
import Image from 'next/image';

import {
  formatActivityTypeLabel,
  formatLeadSourceLabel,
  formatLeadStatusLabel,
  formatLeadTypeLabel,
} from '../lib/crm-display';
import {
  doesStatusMatchPreset,
  getPipelineMoveNotice,
  resolveViewFromNav,
  toggleTableSortState,
  type LeadsTableSort,
  type LeadsTableSortColumn,
  type TableStatusPreset,
  type WorkspaceNav,
  type WorkspaceView,
} from '../lib/workspace-interactions';

interface CrmWorkspaceProps {
  tenantContext: TenantContext;
  hasClerkKey: boolean;
  devAuthBypassEnabled: boolean;
  initialSummary: CrmLeadIngestionSummary;
}

interface WorkspaceToast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

interface LeadDraft {
  status: CrmLeadStatus;
  notes: string;
  timeframe: string;
  listingAddress: string;
  propertyType: string;
  beds: string;
  baths: string;
  sqft: string;
}

interface ContactDraft {
  fullName: string;
  email: string;
  phone: string;
}

interface LeadSearchSignal {
  id: string;
  occurredAt: string;
  query: string | null;
  filterSummary: string | null;
  resultCount: number | null;
  source: string | null;
}

interface LeadListingSignal {
  id: string;
  occurredAt: string;
  action: 'viewed' | 'favorited' | 'unfavorited';
  address: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  source: string | null;
}

interface LeadSearchSuggestion {
  id: string;
  leadId: string;
  label: string;
  detail: string;
  meta: string;
  status: CrmLeadStatus;
}

interface LeadBehaviorStats {
  viewedCount: number;
  favoritedCount: number;
  unfavoritedCount: number;
  lastBehaviorAt: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}

interface BrandPreferences {
  brandName: string;
  accentColor: string;
  surfaceTint: string;
  customLogoUrl: string;
  useWebsiteFavicon: boolean;
  showTexture: boolean;
}

interface AgentProfile {
  fullName: string;
  email: string;
  phone: string;
  brokerage: string;
  licenseNumber: string;
  headshotUrl: string;
  bio: string;
}

type ThemeStyleVars = CSSProperties & Record<`--${string}`, string>;

const LEAD_STATUSES: CrmLeadStatus[] = ['new', 'qualified', 'nurturing', 'won', 'lost'];
const ALL_STATUS_FILTER = 'all';
const ALL_SOURCE_FILTER = 'all';
const ALL_LEAD_TYPE_FILTER = 'all';

type LeadStatusFilter = CrmLeadStatus | typeof ALL_STATUS_FILTER;
type LeadSourceFilter = string | typeof ALL_SOURCE_FILTER;
type LeadTypeFilter = CrmLead['leadType'] | typeof ALL_LEAD_TYPE_FILTER;

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((entry) => entry.charAt(0).toUpperCase() + entry.slice(1))
    .join(' ');
}

function getBrandInitials(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return 'CRM';
  }
  const parts = normalized.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function normalizeHexColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#([0-9a-fA-F]{6})$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return fallback;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHexColor(hex, '#1c1917').slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(red: number, green: number, blue: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  const toHex = (value: number) => clamp(value).toString(16).padStart(2, '0');
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function shiftHexColor(hex: string, shift: number): string {
  const { r, g, b } = hexToRgb(hex);
  if (shift >= 0) {
    const factor = shift / 100;
    return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
  }
  const factor = 1 + shift / 100;
  return rgbToHex(r * factor, g * factor, b * factor);
}

function withHexAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function StatusIcon({ status, size = 16 }: { status: CrmLeadStatus; size?: number }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true as const };
  switch (status) {
    case 'new':
      return (
        <svg {...props}>
          <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8L8 14l-6-4.8h7.6z" fill="var(--status-new)" />
        </svg>
      );
    case 'qualified':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" stroke="var(--status-qualified)" strokeWidth="2" />
          <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="var(--status-qualified)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'nurturing':
      return (
        <svg {...props}>
          <path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5A8.5 8.5 0 0121 11v.5z" stroke="var(--status-nurturing)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'won':
      return (
        <svg {...props}>
          <path d="M6 9V3h12v6" stroke="var(--status-won)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 9a6 6 0 006 6 6 6 0 006-6" stroke="var(--status-won)" strokeWidth="2" />
          <path d="M12 15v3M8 21h8M10 18h4" stroke="var(--status-won)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'lost':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--status-lost)" strokeWidth="2" />
          <path d="M8 12h8" stroke="var(--status-lost)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" fill="var(--crm-muted)" />
        </svg>
      );
  }
}

function getStatusGlyph(status: CrmLeadStatus): string {
  switch (status) {
    case 'new':
      return '★';
    case 'qualified':
      return '✓';
    case 'nurturing':
      return '◎';
    case 'won':
      return '🏆';
    case 'lost':
      return '—';
    default:
      return '•';
  }
}

function getTimeGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

function createDefaultBrandPreferences(tenantSlug: string): BrandPreferences {
  return {
    brandName: `${toTitleCase(tenantSlug)} Realty`,
    accentColor: '#1c1917',
    surfaceTint: '#d6cec4',
    customLogoUrl: '',
    useWebsiteFavicon: true,
    showTexture: true,
  };
}

function buildBrandThemeVars(preferences: BrandPreferences): ThemeStyleVars {
  const accent = normalizeHexColor(preferences.accentColor, '#1c1917');
  const surfaceTint = normalizeHexColor(preferences.surfaceTint, '#d6cec4');
  const highlight = shiftHexColor(accent, -8);
  const accentHover = shiftHexColor(accent, -20);

  return {
    '--crm-accent': accent,
    '--crm-accent-hover': accentHover,
    '--crm-highlight': highlight,
    '--crm-highlight-soft': withHexAlpha(accent, 0.18),
    '--crm-brand-tint': withHexAlpha(surfaceTint, 0.24),
    '--crm-brand-accent-soft': withHexAlpha(accent, 0.08),
  };
}

function KpiSparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="crm-kpi-sparkline" aria-hidden="true">
      {values.map((value, index) => (
        <span key={`${index}-${value}`} style={{ height: `${Math.max(12, (value / max) * 44)}px` }} />
      ))}
    </div>
  );
}

interface DailyBreakdown {
  date: Date;
  label: string;
  total: number;
  newLeads: number;
  statusChanges: number;
  listingViews: number;
  searches: number;
  favorites: number;
  notes: number;
}

function SevenDayPulse({ days }: { days: DailyBreakdown[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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

  const pathD = points
    .map((pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = points[i - 1]!;
      const cpx1 = prev.x + (pt.x - prev.x) * 0.4;
      const cpx2 = pt.x - (pt.x - prev.x) * 0.4;
      return `C ${cpx1} ${prev.y} ${cpx2} ${pt.y} ${pt.x} ${pt.y}`;
    })
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1]!.x} ${height - padY} L ${points[0]!.x} ${height - padY} Z`;

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const getDayLabel = (d: Date) => dayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1] ?? '';

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
        <path d={pathD} fill="none" stroke="var(--crm-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* hover columns */}
        {points.map((pt, i) => (
          <rect
            key={`hover-${i}`}
            x={pt.x - chartW / days.length / 2}
            y={0}
            width={chartW / days.length}
            height={height}
            fill={hoveredIndex === i ? 'rgba(0,0,0,0.04)' : 'transparent'}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: 'crosshair' }}
          />
        ))}

        {/* data points */}
        {points.map((pt, i) => (
          <circle
            key={`dot-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={hoveredIndex === i ? 6 : 3.5}
            fill="var(--crm-surface)"
            stroke="var(--crm-accent)"
            strokeWidth={hoveredIndex === i ? 2.5 : 2}
            className={i === points.length - 1 ? 'crm-pulse-dot-live' : ''}
            style={{ transition: 'all 0.15s ease', pointerEvents: 'none' }}
          />
        ))}

        {/* day labels */}
        {points.map((pt, i) => (
          <text key={`lbl-${i}`} x={pt.x} y={height - 2} textAnchor="middle" className="crm-pulse-day-label">
            {getDayLabel(days[i]!.date)}
          </text>
        ))}
      </svg>

      {hoveredIndex !== null && points[hoveredIndex] ? (
        <div
          className="crm-pulse-tooltip"
          style={{
            left: `${(points[hoveredIndex]!.x / width) * 100}%`,
          }}
        >
          <div className="crm-pulse-tooltip-header">
            <span>{days[hoveredIndex]!.label}</span>
            <strong>{days[hoveredIndex]!.total} events</strong>
          </div>
          <div className="crm-pulse-tooltip-grid">
            <span className="crm-pulse-tooltip-row"><span className="crm-pulse-icon crm-pulse-icon-leads" />{days[hoveredIndex]!.newLeads} New Leads</span>
            <span className="crm-pulse-tooltip-row"><span className="crm-pulse-icon crm-pulse-icon-status" />{days[hoveredIndex]!.statusChanges} Status Changes</span>
            <span className="crm-pulse-tooltip-row"><span className="crm-pulse-icon crm-pulse-icon-views" />{days[hoveredIndex]!.listingViews} Listings Viewed</span>
            <span className="crm-pulse-tooltip-row"><span className="crm-pulse-icon crm-pulse-icon-search" />{days[hoveredIndex]!.searches} Searches</span>
            <span className="crm-pulse-tooltip-row"><span className="crm-pulse-icon crm-pulse-icon-fav" />{days[hoveredIndex]!.favorites} Favorites</span>
            <span className="crm-pulse-tooltip-row"><span className="crm-pulse-icon crm-pulse-icon-notes" />{days[hoveredIndex]!.notes} Notes</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="crm-empty-state">
      <span aria-hidden="true">◌</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function passthroughImageLoader({ src }: { src: string }) {
  return src;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTimeAgo(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;

  if (elapsed < hour) {
    const minutes = Math.max(1, Math.floor(elapsed / minute));
    return `${minutes}m ago`;
  }

  if (elapsed < day) {
    return `${Math.floor(elapsed / hour)}h ago`;
  }

  return `${Math.floor(elapsed / day)}d ago`;
}

function normalizeOptionalNotes(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function buildLeadDraft(lead: CrmLead): LeadDraft {
  return {
    status: lead.status,
    notes: lead.notes ?? '',
    timeframe: lead.timeframe ?? '',
    listingAddress: lead.listingAddress ?? '',
    propertyType: lead.propertyType ?? '',
    beds: lead.beds === null ? '' : String(lead.beds),
    baths: lead.baths === null ? '' : String(lead.baths),
    sqft: lead.sqft === null ? '' : String(lead.sqft),
  };
}

function parseNullableNumber(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return Math.round(parsed);
}

function getLeadContactLabel(lead: CrmLead, contactById: Map<string, CrmContact>): string {
  if (!lead.contactId) {
    return 'No linked contact';
  }

  const linkedContact = contactById.get(lead.contactId);
  if (!linkedContact) {
    return 'Linked contact';
  }

  return linkedContact.fullName || linkedContact.email || linkedContact.phone || 'Linked contact';
}

function parseMetadataJson(metadataJson: string | null): Record<string, unknown> | null {
  if (!metadataJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadataJson) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function summarizeFilters(filtersJson: unknown): string | null {
  if (typeof filtersJson !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(filtersJson) as Record<string, unknown>;
    const entries = Object.entries(parsed)
      .filter(([, value]) => value !== null && value !== '' && value !== undefined)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`);
    return entries.length > 0 ? entries.join(', ') : 'No filters';
  } catch {
    return null;
  }
}

/* ── Lead Scoring ────────────────────────────────────────────── */

function calculateLeadScore(
  activities: CrmActivity[],
  searchSignals: LeadSearchSignal[],
  listingSignals: LeadListingSignal[],
  lead: CrmLead | null,
): { score: number; label: string } {
  if (!lead) {
    return { score: 0, label: 'No Data' };
  }

  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  // Recency (25%): days since last activity
  let recencyScore = 0;
  if (activities.length > 0) {
    const lastActivity = new Date(activities[0]!.occurredAt).getTime();
    const daysSince = (now - lastActivity) / (24 * 60 * 60 * 1000);
    recencyScore = Math.max(0, 100 - daysSince * 3.3); // 0 after ~30 days
  }

  // Frequency (25%): total activities in last 30 days
  const recentActivities = activities.filter(
    (a) => now - new Date(a.occurredAt).getTime() < thirtyDays
  );
  const frequencyScore = Math.min(100, recentActivities.length * 8);

  // Intent (30%): favorites-to-views ratio + search specificity
  const views = listingSignals.filter((s) => s.action === 'viewed').length;
  const favorites = listingSignals.filter((s) => s.action === 'favorited').length;
  const favRatio = views > 0 ? (favorites / views) * 100 : 0;
  const searchSpecificity = searchSignals.length > 0 ? Math.min(100, searchSignals.length * 12) : 0;
  const intentScore = (favRatio * 0.6 + searchSpecificity * 0.4);

  // Profile completeness (20%)
  let profileScore = 0;
  if (lead.listingAddress) profileScore += 30;
  if (lead.propertyType) profileScore += 20;
  if (lead.timeframe) profileScore += 20;
  if (lead.contactId) profileScore += 30;

  const total = Math.round(
    recencyScore * 0.25 +
    frequencyScore * 0.25 +
    intentScore * 0.30 +
    profileScore * 0.20
  );

  const score = Math.max(0, Math.min(100, total));
  const label =
    score >= 80 ? 'Hot' :
      score >= 60 ? 'Warm' :
        score >= 40 ? 'Interested' :
          score >= 20 ? 'Cool' : 'Cold';

  return { score, label };
}

/* ── SVG Chart Components ─────────────────────────────────── */

function LeadEngagementGauge({ score, label }: { score: number; label: string }) {
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score >= 80 ? '#16a34a' :
      score >= 60 ? '#ca8a04' :
        score >= 40 ? '#ea580c' :
          score >= 20 ? '#9333ea' : '#6b7280';

  return (
    <div className="crm-engagement-gauge">
      <svg viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--crm-border)" strokeWidth={strokeWidth} />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--crm-heading)">{score}</text>
        <text x="50" y="60" textAnchor="middle" fontSize="9" fill="var(--crm-muted-text)">{label}</text>
      </svg>
    </div>
  );
}

function LeadActivityChart({ activities }: { activities: CrmActivity[] }) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = 30;

  const buckets = useMemo(() => {
    const b = Array.from({ length: days }, (_, i) => {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - (days - 1 - i));
      return {
        date: dayStart,
        total: 0,
        notes: 0,
        statusChanges: 0,
        listingViews: 0,
        searches: 0,
        favorites: 0,
      };
    });

    for (const activity of activities) {
      const ago = now - new Date(activity.occurredAt).getTime();
      const dayIndex = Math.floor(ago / dayMs);
      if (dayIndex >= 0 && dayIndex < days) {
        const bucket = b[days - 1 - dayIndex]!;
        bucket.total++;
        if (activity.activityType === 'note') bucket.notes++;
        else if (activity.activityType === 'lead_status_changed') bucket.statusChanges++;
        else if (activity.activityType === 'website_listing_viewed') bucket.listingViews++;
        else if (activity.activityType === 'website_search_performed') bucket.searches++;
        else if (activity.activityType === 'website_listing_favorited') bucket.favorites++;
      }
    }
    return b;
  }, [activities, now]);

  const maxVal = Math.max(1, ...buckets.map((b) => b.total));
  const barWidth = 8;
  const gap = 2;
  const chartWidth = days * (barWidth + gap);
  const chartHeight = 60;

  const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="crm-activity-chart">
      <span className="crm-chart-label">Activity (30 days)</span>
      <div className="crm-activity-chart-wrap">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" aria-label="Lead activity chart">
          {buckets.map((bucket, i) => {
            const barH = bucket.total > 0 ? Math.max(6, (bucket.total / maxVal) * (chartHeight - 4)) : 3;
            return (
              <rect
                key={i}
                x={i * (barWidth + gap)}
                y={chartHeight - barH}
                width={barWidth}
                height={barH}
                rx={2}
                fill={hoveredBar === i ? 'var(--crm-accent)' : bucket.total > 0 ? 'var(--crm-accent)' : 'var(--crm-border)'}
                opacity={hoveredBar === i ? 1 : bucket.total > 0 ? 0.7 : 0.25}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ cursor: bucket.total > 0 ? 'crosshair' : 'default', transition: 'opacity 0.1s ease' }}
              />
            );
          })}
        </svg>
        {hoveredBar !== null && buckets[hoveredBar] ? (
          <div
            className="crm-activity-chart-tooltip"
            style={{ left: `${((hoveredBar * (barWidth + gap) + barWidth / 2) / chartWidth) * 100}%` }}
          >
            <strong>{dateFmt.format(buckets[hoveredBar]!.date)}</strong>
            <span>{buckets[hoveredBar]!.total} total</span>
            {buckets[hoveredBar]!.notes > 0 && <span>📝 {buckets[hoveredBar]!.notes} notes</span>}
            {buckets[hoveredBar]!.statusChanges > 0 && <span>🔄 {buckets[hoveredBar]!.statusChanges} status</span>}
            {buckets[hoveredBar]!.listingViews > 0 && <span>🏠 {buckets[hoveredBar]!.listingViews} views</span>}
            {buckets[hoveredBar]!.searches > 0 && <span>🔎 {buckets[hoveredBar]!.searches} search</span>}
            {buckets[hoveredBar]!.favorites > 0 && <span>⭐ {buckets[hoveredBar]!.favorites} favs</span>}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PriceInterestBar({ signals }: { signals: LeadListingSignal[] }) {
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

function extractLeadSearchSignal(activity: CrmActivity): LeadSearchSignal | null {
  if (activity.activityType !== 'website_search_performed') {
    return null;
  }

  const metadata = parseMetadataJson(activity.metadataJson);
  if (!metadata) {
    return null;
  }

  const searchContext = readObject(metadata.searchContext);

  return {
    id: activity.id,
    occurredAt: activity.occurredAt,
    query: readString(searchContext?.query ?? null),
    filterSummary: summarizeFilters(searchContext?.filtersJson),
    resultCount: readNumber(metadata.resultCount),
    source: readString(metadata.source),
  };
}

function extractLeadListingSignal(activity: CrmActivity): LeadListingSignal | null {
  let action: LeadListingSignal['action'];
  if (activity.activityType === 'website_listing_viewed') {
    action = 'viewed';
  } else if (activity.activityType === 'website_listing_favorited') {
    action = 'favorited';
  } else if (activity.activityType === 'website_listing_unfavorited') {
    action = 'unfavorited';
  } else {
    return null;
  }

  const metadata = parseMetadataJson(activity.metadataJson);
  if (!metadata) {
    return null;
  }

  const listing = readObject(metadata.listing);

  return {
    id: activity.id,
    occurredAt: activity.occurredAt,
    action,
    address: readString(listing?.address ?? null),
    price: readNumber(listing?.price),
    beds: readNumber(listing?.beds),
    baths: readNumber(listing?.baths),
    sqft: readNumber(listing?.sqft),
    source: readString(metadata.source),
  };
}

function matchesLeadFilters(
  lead: CrmLead,
  search: string,
  statusFilter: LeadStatusFilter,
  sourceFilter: LeadSourceFilter,
  leadTypeFilter: LeadTypeFilter,
  contactById: Map<string, CrmContact>,
  draft: LeadDraft
) {
  if (statusFilter !== ALL_STATUS_FILTER && draft.status !== statusFilter) {
    return false;
  }

  if (sourceFilter !== ALL_SOURCE_FILTER && lead.source !== sourceFilter) {
    return false;
  }

  if (leadTypeFilter !== ALL_LEAD_TYPE_FILTER && lead.leadType !== leadTypeFilter) {
    return false;
  }

  if (!search) {
    return true;
  }

  const linkedContact = lead.contactId ? contactById.get(lead.contactId) : null;
  const haystack = [
    draft.listingAddress,
    lead.listingId,
    lead.listingUrl,
    lead.source,
    draft.propertyType,
    draft.timeframe,
    draft.notes,
    linkedContact?.fullName,
    linkedContact?.email,
    linkedContact?.phone,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(search);
}

function formatPriceRange(minPrice: number | null, maxPrice: number | null): string {
  if (minPrice === null && maxPrice === null) {
    return '-';
  }

  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  if (minPrice !== null && maxPrice !== null) {
    if (minPrice === maxPrice) {
      return formatter.format(minPrice);
    }
    return `${formatter.format(minPrice)} - ${formatter.format(maxPrice)}`;
  }

  return formatter.format((minPrice ?? maxPrice) as number);
}

export function CrmWorkspace({
  tenantContext,
  hasClerkKey,
  devAuthBypassEnabled,
  initialSummary,
}: CrmWorkspaceProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMutations, setActiveMutations] = useState(0);

  const [draftByLeadId, setDraftByLeadId] = useState<Record<string, LeadDraft>>({});
  const [savingLeadIds, setSavingLeadIds] = useState<Record<string, true>>({});
  const [draftContactById, setDraftContactById] = useState<Record<string, ContactDraft>>({});
  const [savingContactIds, setSavingContactIds] = useState<Record<string, true>>({});

  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const [newActivitySummary, setNewActivitySummary] = useState('');
  const [newActivityLeadId, setNewActivityLeadId] = useState('');
  const [newActivityContactId, setNewActivityContactId] = useState('');
  const [activitySortMode, setActivitySortMode] = useState<'recent' | 'alpha'>('recent');

  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [newLeadAddress, setNewLeadAddress] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('crm_manual');
  const [newLeadType, setNewLeadType] = useState<'buyer' | 'seller'>('buyer');
  const [newLeadNotes, setNewLeadNotes] = useState('');
  const [newLeadTimeframe, setNewLeadTimeframe] = useState('');
  const [newLeadPropertyType, setNewLeadPropertyType] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false);

  const [dashboardStatusFilter, setDashboardStatusFilter] = useState<LeadStatusFilter>(ALL_STATUS_FILTER);
  const [dashboardSourceFilter, setDashboardSourceFilter] = useState<LeadSourceFilter>(ALL_SOURCE_FILTER);
  const [dashboardLeadTypeFilter, setDashboardLeadTypeFilter] = useState<LeadTypeFilter>(ALL_LEAD_TYPE_FILTER);

  const [pipelineStatusFilter, setPipelineStatusFilter] = useState<LeadStatusFilter>(ALL_STATUS_FILTER);
  const [pipelineSourceFilter, setPipelineSourceFilter] = useState<LeadSourceFilter>(ALL_SOURCE_FILTER);
  const [pipelineLeadTypeFilter, setPipelineLeadTypeFilter] = useState<LeadTypeFilter>(ALL_LEAD_TYPE_FILTER);
  const [pipelineFilterNotice, setPipelineFilterNotice] = useState<string | null>(null);

  const [tableStatusPreset, setTableStatusPreset] = useState<TableStatusPreset>('all');
  const [tableSort, setTableSort] = useState<LeadsTableSort>({ column: 'updatedAt', direction: 'desc' });

  const [toasts, setToasts] = useState<WorkspaceToast[]>([]);
  const [activeNav, setActiveNav] = useState<WorkspaceNav>('dashboard');
  const [activeView, setActiveView] = useState<WorkspaceView>('dashboard');
  const [activeLeadProfileId, setActiveLeadProfileId] = useState<string | null>(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [logoLoadErrored, setLogoLoadErrored] = useState(false);
  const [expandedBehaviorCard, setExpandedBehaviorCard] = useState<string | null>(null);
  const [brandPreferences, setBrandPreferences] = useState<BrandPreferences>(() =>
    createDefaultBrandPreferences(tenantContext.tenantSlug)
  );
  const [agentProfile, setAgentProfile] = useState<AgentProfile>({
    fullName: '',
    email: '',
    phone: '',
    brokerage: '',
    licenseNumber: '',
    headshotUrl: '',
    bio: '',
  });

  const contactPanelRef = useRef<HTMLElement | null>(null);
  const activityPanelRef = useRef<HTMLElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const pipelineBoardRef = useRef<HTMLDivElement | null>(null);

  const brandStorageKey = useMemo(() => `crm.branding.${tenantContext.tenantId}`, [tenantContext.tenantId]);
  const profileStorageKey = useMemo(() => `crm.profile.${tenantContext.tenantId}`, [tenantContext.tenantId]);
  const websiteFaviconUrl = useMemo(() => `https://${tenantContext.tenantDomain}/favicon.ico`, [tenantContext.tenantDomain]);
  const greetingLabel = useMemo(() => getTimeGreeting(), []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(brandStorageKey);
      if (!raw) {
        setBrandPreferences(createDefaultBrandPreferences(tenantContext.tenantSlug));
        return;
      }
      const parsed = JSON.parse(raw) as Partial<BrandPreferences>;
      setBrandPreferences({
        ...createDefaultBrandPreferences(tenantContext.tenantSlug),
        ...parsed,
      });
    } catch {
      setBrandPreferences(createDefaultBrandPreferences(tenantContext.tenantSlug));
    }
  }, [brandStorageKey, tenantContext.tenantSlug]);

  useEffect(() => {
    try {
      window.localStorage.setItem(brandStorageKey, JSON.stringify(brandPreferences));
    } catch {
      // Ignore storage errors for private/incognito browser modes.
    }
  }, [brandPreferences, brandStorageKey]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(profileStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AgentProfile>;
        setAgentProfile((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore parse errors.
    }
  }, [profileStorageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(profileStorageKey, JSON.stringify(agentProfile));
    } catch {
      // Ignore storage errors.
    }
  }, [agentProfile, profileStorageKey]);

  const resolvedLogoUrl = useMemo(() => {
    if (brandPreferences.useWebsiteFavicon) {
      return websiteFaviconUrl;
    }
    const custom = brandPreferences.customLogoUrl.trim();
    return custom.length > 0 ? custom : '';
  }, [brandPreferences.customLogoUrl, brandPreferences.useWebsiteFavicon, websiteFaviconUrl]);

  useEffect(() => {
    setLogoLoadErrored(false);
  }, [resolvedLogoUrl]);

  const brandThemeVars = useMemo(() => buildBrandThemeVars(brandPreferences), [brandPreferences]);
  const brandInitials = useMemo(() => getBrandInitials(brandPreferences.brandName), [brandPreferences.brandName]);
  const showBrandLogo = Boolean(resolvedLogoUrl) && !logoLoadErrored;

  const isMutating = activeMutations > 0;

  const leadById = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);
  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts]);

  const pushToast = useCallback((kind: WorkspaceToast['kind'], message: string) => {
    const toastId = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id: toastId, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 3200);
  }, []);

  const beginMutation = useCallback(() => {
    setActiveMutations((prev) => prev + 1);
  }, []);

  const endMutation = useCallback(() => {
    setActiveMutations((prev) => Math.max(0, prev - 1));
  }, []);

  const getLeadDraft = useCallback(
    (lead: CrmLead): LeadDraft => {
      return draftByLeadId[lead.id] ?? buildLeadDraft(lead);
    },
    [draftByLeadId]
  );

  const setLeadDraftField = useCallback(
    (leadId: string, field: keyof LeadDraft, value: string | CrmLeadStatus) => {
      const lead = leadById.get(leadId);
      if (!lead) {
        return;
      }
      setDraftByLeadId((prev) => {
        const current = prev[leadId] ?? buildLeadDraft(lead);
        return {
          ...prev,
          [leadId]: {
            ...current,
            [field]: value,
          },
        };
      });
    },
    [leadById]
  );

  const hasUnsavedLeadChange = useCallback(
    (lead: CrmLead) => {
      const draft = getLeadDraft(lead);
      return (
        draft.status !== lead.status ||
        normalizeOptionalNotes(draft.notes) !== normalizeOptionalNotes(lead.notes) ||
        normalizeOptionalString(draft.timeframe) !== normalizeOptionalString(lead.timeframe) ||
        normalizeOptionalString(draft.listingAddress) !== normalizeOptionalString(lead.listingAddress) ||
        normalizeOptionalString(draft.propertyType) !== normalizeOptionalString(lead.propertyType) ||
        parseNullableNumber(draft.beds) !== lead.beds ||
        parseNullableNumber(draft.baths) !== lead.baths ||
        parseNullableNumber(draft.sqft) !== lead.sqft
      );
    },
    [getLeadDraft]
  );

  const clearLeadDraft = useCallback((leadId: string) => {
    setDraftByLeadId((prev) => {
      if (!(leadId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[leadId];
      return next;
    });
  }, []);

  const sourceFilterOptions = useMemo(() => {
    return Array.from(new Set(leads.map((lead) => lead.source))).sort((left, right) => left.localeCompare(right));
  }, [leads]);

  const leadCountsByStatus = useMemo(() => {
    const counts: Record<CrmLeadStatus, number> = {
      new: 0,
      qualified: 0,
      nurturing: 0,
      won: 0,
      lost: 0,
    };

    for (const lead of leads) {
      counts[getLeadDraft(lead).status] += 1;
    }

    return counts;
  }, [getLeadDraft, leads]);

  const activePipelineCount = leadCountsByStatus.new + leadCountsByStatus.qualified + leadCountsByStatus.nurturing;
  const followUpCount = leadCountsByStatus.qualified + leadCountsByStatus.nurturing;
  const closedLeadTotal = leadCountsByStatus.won + leadCountsByStatus.lost;
  const winRate = closedLeadTotal > 0 ? Math.round((leadCountsByStatus.won / closedLeadTotal) * 100) : 0;

  const activityVolumeLast7Days = useMemo(() => {
    const buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return { date, count: 0 };
    });

    for (const activity of activities) {
      const occurredAt = new Date(activity.occurredAt);
      const occurredDay = new Date(occurredAt);
      occurredDay.setHours(0, 0, 0, 0);
      const bucket = buckets.find((entry) => entry.date.getTime() === occurredDay.getTime());
      if (bucket) {
        bucket.count += 1;
      }
    }

    return buckets.map((entry) => entry.count);
  }, [activities]);

  const heartbeatDays: DailyBreakdown[] = useMemo(() => {
    const dayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      let total = 0;
      let newLeads = 0;
      let statusChanges = 0;
      let listingViews = 0;
      let searches = 0;
      let favorites = 0;
      let notes = 0;

      for (const activity of activities) {
        const ts = new Date(activity.occurredAt).getTime();
        if (ts < date.getTime() || ts >= nextDay.getTime()) continue;
        total += 1;
        if (activity.activityType === 'lead_created') newLeads += 1;
        else if (activity.activityType === 'lead_status_changed') statusChanges += 1;
        else if (activity.activityType === 'website_listing_viewed') listingViews += 1;
        else if (activity.activityType === 'website_search_performed') searches += 1;
        else if (activity.activityType === 'website_listing_favorited') favorites += 1;
        else if (activity.activityType === 'note') notes += 1;
      }

      return { date, label: dayFmt.format(date), total, newLeads, statusChanges, listingViews, searches, favorites, notes };
    });
  }, [activities]);

  const kpiSeries = useMemo(() => {
    const openPipelineBaseline = [leadCountsByStatus.new, leadCountsByStatus.qualified, leadCountsByStatus.nurturing];
    const closedBaseline = [leadCountsByStatus.won, leadCountsByStatus.lost, winRate];

    return {
      newLeads: [leadCountsByStatus.new, ...activityVolumeLast7Days.slice(-5)],
      followUp: [leadCountsByStatus.qualified, leadCountsByStatus.nurturing, ...activityVolumeLast7Days.slice(-4)],
      openPipeline: [...openPipelineBaseline, ...activityVolumeLast7Days.slice(-4)],
      closed: [...closedBaseline, ...activityVolumeLast7Days.slice(-4)],
    };
  }, [activityVolumeLast7Days, leadCountsByStatus, winRate]);

  const leadByContactId = useMemo(() => {
    const map = new Map<string, CrmLead>();
    const sorted = [...leads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    for (const lead of sorted) {
      if (!lead.contactId || map.has(lead.contactId)) {
        continue;
      }
      map.set(lead.contactId, lead);
    }
    return map;
  }, [leads]);

  const leadsByContactId = useMemo(() => {
    const map = new Map<string, CrmLead[]>();
    for (const lead of leads) {
      if (!lead.contactId) {
        continue;
      }
      const entries = map.get(lead.contactId) ?? [];
      entries.push(lead);
      map.set(lead.contactId, entries);
    }

    for (const [contactId, contactLeads] of map.entries()) {
      const sorted = [...contactLeads].sort((a, b) => {
        if (activitySortMode === 'alpha') {
          return (a.listingAddress || '').localeCompare(b.listingAddress || '');
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      map.set(contactId, sorted);
    }

    return map;
  }, [activitySortMode, leads]);

  const leadBehaviorByLeadId = useMemo(() => {
    const map = new Map<string, LeadBehaviorStats>();

    for (const activity of activities) {
      if (
        activity.activityType !== 'website_search_performed' &&
        activity.activityType !== 'website_listing_viewed' &&
        activity.activityType !== 'website_listing_favorited' &&
        activity.activityType !== 'website_listing_unfavorited'
      ) {
        continue;
      }

      if (!activity.leadId) {
        continue;
      }

      const current =
        map.get(activity.leadId) ??
        ({
          viewedCount: 0,
          favoritedCount: 0,
          unfavoritedCount: 0,
          lastBehaviorAt: null,
          minPrice: null,
          maxPrice: null,
        } satisfies LeadBehaviorStats);

      if (!current.lastBehaviorAt || new Date(activity.occurredAt).getTime() > new Date(current.lastBehaviorAt).getTime()) {
        current.lastBehaviorAt = activity.occurredAt;
      }

      const listingSignal = extractLeadListingSignal(activity);
      const listingPrice = listingSignal?.price ?? null;
      if (listingPrice !== null) {
        current.minPrice = current.minPrice === null ? listingPrice : Math.min(current.minPrice, listingPrice);
        current.maxPrice = current.maxPrice === null ? listingPrice : Math.max(current.maxPrice, listingPrice);
      }

      if (activity.activityType === 'website_listing_viewed') {
        current.viewedCount += 1;
      }
      if (activity.activityType === 'website_listing_favorited') {
        current.favoritedCount += 1;
      }
      if (activity.activityType === 'website_listing_unfavorited') {
        current.unfavoritedCount += 1;
      }

      map.set(activity.leadId, current);
    }

    return map;
  }, [activities]);

  const lastContactByLeadId = useMemo(() => {
    const map = new Map<string, string>();

    for (const activity of activities) {
      if (!activity.leadId) {
        continue;
      }

      if (activity.activityType !== 'note' && activity.activityType !== 'lead_status_changed') {
        continue;
      }

      const existing = map.get(activity.leadId);
      if (!existing || new Date(activity.occurredAt).getTime() > new Date(existing).getTime()) {
        map.set(activity.leadId, activity.occurredAt);
      }
    }

    return map;
  }, [activities]);

  const unlinkedBehaviorCount = useMemo(() => {
    return activities.filter((activity) => {
      if (
        activity.activityType !== 'website_search_performed' &&
        activity.activityType !== 'website_listing_viewed' &&
        activity.activityType !== 'website_listing_favorited' &&
        activity.activityType !== 'website_listing_unfavorited'
      ) {
        return false;
      }
      return !activity.leadId && !activity.contactId;
    }).length;
  }, [activities]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const dashboardFilteredLeads = useMemo(() => {
    return leads.filter((lead) =>
      matchesLeadFilters(
        lead,
        normalizedSearch,
        dashboardStatusFilter,
        dashboardSourceFilter,
        dashboardLeadTypeFilter,
        contactById,
        getLeadDraft(lead)
      )
    );
  }, [
    contactById,
    dashboardLeadTypeFilter,
    dashboardSourceFilter,
    dashboardStatusFilter,
    getLeadDraft,
    leads,
    normalizedSearch,
  ]);

  const pipelineFilteredLeads = useMemo(() => {
    return leads.filter((lead) =>
      matchesLeadFilters(
        lead,
        normalizedSearch,
        pipelineStatusFilter,
        pipelineSourceFilter,
        pipelineLeadTypeFilter,
        contactById,
        getLeadDraft(lead)
      )
    );
  }, [
    contactById,
    getLeadDraft,
    leads,
    normalizedSearch,
    pipelineLeadTypeFilter,
    pipelineSourceFilter,
    pipelineStatusFilter,
  ]);

  const groupedPipelineLeads = useMemo(() => {
    const grouped: Record<CrmLeadStatus, CrmLead[]> = {
      new: [],
      qualified: [],
      nurturing: [],
      won: [],
      lost: [],
    };

    for (const lead of pipelineFilteredLeads) {
      grouped[getLeadDraft(lead).status].push(lead);
    }

    return grouped;
  }, [getLeadDraft, pipelineFilteredLeads]);

  const pendingLeadIds = useMemo(() => {
    return leads.filter((lead) => hasUnsavedLeadChange(lead)).map((lead) => lead.id);
  }, [hasUnsavedLeadChange, leads]);

  const searchSuggestions = useMemo(() => {
    if (!normalizedSearch) {
      return [] as LeadSearchSuggestion[];
    }

    const directLeadMatches: LeadSearchSuggestion[] = leads
      .filter((lead) => {
        const linkedContact = lead.contactId ? contactById.get(lead.contactId) : null;
        const leadSearchText = [
          lead.listingAddress,
          lead.listingId,
          lead.listingUrl,
          linkedContact?.fullName,
          linkedContact?.email,
          linkedContact?.phone,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return leadSearchText.includes(normalizedSearch);
      })
      .slice(0, 8)
      .map((lead) => {
        const behavior = leadBehaviorByLeadId.get(lead.id);
        const detail = getLeadContactLabel(lead, contactById);
        const meta = [formatLeadSourceLabel(lead.source), behavior?.favoritedCount ? `${behavior.favoritedCount} favorites` : null]
          .filter(Boolean)
          .join(' • ');

        return {
          id: `lead-${lead.id}`,
          leadId: lead.id,
          label: lead.listingAddress || 'Lead profile',
          detail,
          meta: meta || 'Lead record',
          status: getLeadDraft(lead).status,
        };
      });

    const matchedLeadIds = new Set(directLeadMatches.map((entry) => entry.leadId));

    const contactMatches: LeadSearchSuggestion[] = contacts
      .map((contact) => {
        const text = [contact.fullName, contact.email, contact.phone].filter(Boolean).join(' ').toLowerCase();
        if (!text.includes(normalizedSearch)) {
          return null;
        }

        const linkedLead = leadByContactId.get(contact.id);
        if (!linkedLead || matchedLeadIds.has(linkedLead.id)) {
          return null;
        }

        return {
          id: `contact-${contact.id}`,
          leadId: linkedLead.id,
          label: contact.fullName || contact.email || contact.phone || 'Contact',
          detail: linkedLead.listingAddress || 'Open linked lead profile',
          meta: formatLeadSourceLabel(linkedLead.source),
          status: getLeadDraft(linkedLead).status,
        } satisfies LeadSearchSuggestion;
      })
      .filter((entry): entry is LeadSearchSuggestion => Boolean(entry))
      .slice(0, 4);

    return [...directLeadMatches, ...contactMatches].slice(0, 8);
  }, [contactById, contacts, getLeadDraft, leadBehaviorByLeadId, leadByContactId, leads, normalizedSearch]);

  const activeLeadProfile = useMemo(() => {
    if (!activeLeadProfileId) {
      return null;
    }
    return leadById.get(activeLeadProfileId) ?? null;
  }, [activeLeadProfileId, leadById]);

  const activeLeadProfileActivities = useMemo(() => {
    if (!activeLeadProfile) {
      return [] as CrmActivity[];
    }

    const related = activities.filter((activity) => {
      if (activity.leadId === activeLeadProfile.id) {
        return true;
      }

      if (!activeLeadProfile.contactId) {
        return false;
      }

      return activity.contactId === activeLeadProfile.contactId;
    });

    return related.sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());
  }, [activeLeadProfile, activities]);

  const activeLeadSearchSignals = useMemo(() => {
    return activeLeadProfileActivities
      .map((activity) => extractLeadSearchSignal(activity))
      .filter((signal): signal is LeadSearchSignal => Boolean(signal));
  }, [activeLeadProfileActivities]);

  const activeLeadListingSignals = useMemo(() => {
    return activeLeadProfileActivities
      .map((activity) => extractLeadListingSignal(activity))
      .filter((signal): signal is LeadListingSignal => Boolean(signal));
  }, [activeLeadProfileActivities]);

  const leadScore = useMemo(() => {
    return calculateLeadScore(
      activeLeadProfileActivities,
      activeLeadSearchSignals,
      activeLeadListingSignals,
      activeLeadProfile,
    );
  }, [activeLeadProfileActivities, activeLeadSearchSignals, activeLeadListingSignals, activeLeadProfile]);

  const activeLeadLastContact = useMemo(() => {
    if (!activeLeadProfile) {
      return null;
    }
    return lastContactByLeadId.get(activeLeadProfile.id) ?? null;
  }, [activeLeadProfile, lastContactByLeadId]);

  const activeContact = useMemo(() => {
    if (!activeLeadProfile?.contactId) {
      return null;
    }
    return contactById.get(activeLeadProfile.contactId) ?? null;
  }, [activeLeadProfile, contactById]);

  const activeContactDraft = useMemo(() => {
    if (!activeContact) {
      return null;
    }
    return (
      draftContactById[activeContact.id] ?? {
        fullName: activeContact.fullName ?? '',
        email: activeContact.email ?? '',
        phone: activeContact.phone ?? '',
      }
    );
  }, [activeContact, draftContactById]);

  const hasUnsavedContactChange = useCallback(
    (contact: CrmContact) => {
      const draft = draftContactById[contact.id];
      if (!draft) {
        return false;
      }
      return (
        normalizeOptionalString(draft.fullName) !== normalizeOptionalString(contact.fullName) ||
        normalizeOptionalString(draft.email) !== normalizeOptionalString(contact.email) ||
        normalizeOptionalString(draft.phone) !== normalizeOptionalString(contact.phone)
      );
    },
    [draftContactById]
  );

  const leadsTableRows = useMemo(() => {
    let rows = leads.map((lead) => {
      const draft = getLeadDraft(lead);
      const behavior = leadBehaviorByLeadId.get(lead.id);
      const priceRange = formatPriceRange(behavior?.minPrice ?? null, behavior?.maxPrice ?? null);
      const lastContact = lastContactByLeadId.get(lead.id) ?? null;
      const contactLabel = getLeadContactLabel(lead, contactById);

      // Compute a per-lead score using activities for this lead
      const leadActivities = activities.filter((a) => a.leadId === lead.id || (lead.contactId && a.contactId === lead.contactId));
      const leadSearchSigs = leadActivities.map(extractLeadSearchSignal).filter((s): s is LeadSearchSignal => Boolean(s));
      const leadListingSigs = leadActivities.map(extractLeadListingSignal).filter((s): s is LeadListingSignal => Boolean(s));
      const score = calculateLeadScore(leadActivities, leadSearchSigs, leadListingSigs, lead);

      return {
        lead,
        draft,
        contactLabel,
        priceRange,
        location: draft.listingAddress || '-',
        lastContact,
        desired: `${draft.beds || '-'} / ${draft.baths || '-'} / ${draft.sqft || '-'}`,
        score,
        intentLabel:
          behavior && (behavior.favoritedCount > 0 || behavior.viewedCount > 0)
            ? `${behavior.favoritedCount > 0 ? 'Favorited' : 'Viewed'} recently`
            : 'No recent intent',
      };
    });

    rows = rows.filter((row) => doesStatusMatchPreset(row.draft.status, tableStatusPreset));

    rows.sort((left, right) => {
      const directionFactor = tableSort.direction === 'asc' ? 1 : -1;
      let comparison = 0;

      if (tableSort.column === 'name') {
        comparison = left.contactLabel.localeCompare(right.contactLabel);
      } else if (tableSort.column === 'leadType') {
        comparison = left.lead.leadType.localeCompare(right.lead.leadType);
      } else if (tableSort.column === 'status') {
        comparison = left.draft.status.localeCompare(right.draft.status);
      } else if (tableSort.column === 'priceRange') {
        comparison = left.priceRange.localeCompare(right.priceRange);
      } else if (tableSort.column === 'location') {
        comparison = left.location.localeCompare(right.location);
      } else if (tableSort.column === 'lastContact') {
        const leftTime = left.lastContact ? new Date(left.lastContact).getTime() : 0;
        const rightTime = right.lastContact ? new Date(right.lastContact).getTime() : 0;
        comparison = leftTime - rightTime;
      } else if (tableSort.column === 'desired') {
        comparison = left.desired.localeCompare(right.desired);
      } else if (tableSort.column === 'source') {
        comparison = left.lead.source.localeCompare(right.lead.source);
      } else if (tableSort.column === 'updatedAt') {
        comparison = new Date(left.lead.updatedAt).getTime() - new Date(right.lead.updatedAt).getTime();
      } else if (tableSort.column === 'score') {
        comparison = left.score.score - right.score.score;
      }

      return comparison * directionFactor;
    });

    return rows;
  }, [activities, contactById, getLeadDraft, lastContactByLeadId, leadBehaviorByLeadId, leads, tableSort, tableStatusPreset]);

  const sortedActivityLeads = useMemo(() => {
    const working = [...leads];
    working.sort((left, right) => {
      if (activitySortMode === 'alpha') {
        return (left.listingAddress || '').localeCompare(right.listingAddress || '');
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
    return working;
  }, [activitySortMode, leads]);

  const sortedActivityContacts = useMemo(() => {
    const working = [...contacts];
    working.sort((left, right) => {
      if (activitySortMode === 'alpha') {
        return (left.fullName || left.email || '').localeCompare(right.fullName || right.email || '');
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
    return working;
  }, [activitySortMode, contacts]);

  const activityLeadOptions = useMemo(() => {
    if (!newActivityContactId) {
      return sortedActivityLeads;
    }

    return leadsByContactId.get(newActivityContactId) ?? [];
  }, [leadsByContactId, newActivityContactId, sortedActivityLeads]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [leadsRes, contactsRes, activitiesRes] = await Promise.all([
        fetch('/api/leads?limit=200', { cache: 'no-store' }),
        fetch('/api/contacts?limit=200', { cache: 'no-store' }),
        fetch('/api/activities?limit=200', { cache: 'no-store' }),
      ]);

      if (!leadsRes.ok || !contactsRes.ok || !activitiesRes.ok) {
        throw new Error('Failed to load CRM workspace data.');
      }

      const leadsJson = (await leadsRes.json()) as { leads: CrmLead[] };
      const contactsJson = (await contactsRes.json()) as { contacts: CrmContact[] };
      const activitiesJson = (await activitiesRes.json()) as { activities: CrmActivity[] };

      setLeads(leadsJson.leads);
      setContacts(contactsJson.contacts);
      setActivities(activitiesJson.activities);
      setSummary((prev) => ({
        ...prev,
        leadCount: leadsJson.leads.length,
        contactCount: contactsJson.contacts.length,
        activityCount: activitiesJson.activities.length,
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown CRM load error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const openLeadProfile = useCallback(
    (leadId: string) => {
      setActiveLeadProfileId(leadId);
      setSearchSuggestionsOpen(false);

      void (async () => {
        try {
          const response = await fetch(`/api/leads/${leadId}`, { cache: 'no-store' });
          if (!response.ok) {
            return;
          }
          const json = (await response.json()) as { lead?: CrmLead };
          if (json.lead) {
            setLeads((prev) => prev.map((entry) => (entry.id === leadId ? json.lead! : entry)));
          }
        } catch {
          // Keep modal open with current local data.
        }
      })();
    },
    []
  );

  const closeLeadProfile = useCallback(() => {
    if (!activeLeadProfile) {
      setActiveLeadProfileId(null);
      return;
    }

    const hasLeadUnsaved = hasUnsavedLeadChange(activeLeadProfile);
    const hasContactUnsaved = activeContact ? hasUnsavedContactChange(activeContact) : false;

    if (hasLeadUnsaved || hasContactUnsaved) {
      const discard = window.confirm('Discard unsaved lead/profile changes?');
      if (!discard) {
        return;
      }
    }

    setActiveLeadProfileId(null);
  }, [activeContact, activeLeadProfile, hasUnsavedContactChange, hasUnsavedLeadChange]);

  useEffect(() => {
    if (!activeLeadProfileId) {
      return;
    }
    if (!leadById.has(activeLeadProfileId)) {
      setActiveLeadProfileId(null);
    }
  }, [activeLeadProfileId, leadById]);

  useEffect(() => {
    if (!activeLeadProfileId) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeLeadProfile();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeLeadProfileId, closeLeadProfile]);

  useEffect(() => {
    function onWindowPointerDown(event: MouseEvent) {
      const target = event.target as Node | null;

      if (searchPanelRef.current && target && !searchPanelRef.current.contains(target)) {
        setSearchSuggestionsOpen(false);
      }

      if (avatarMenuRef.current && target && !avatarMenuRef.current.contains(target)) {
        setAvatarMenuOpen(false);
      }

      if (notificationPanelRef.current && target && !notificationPanelRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    }

    window.addEventListener('mousedown', onWindowPointerDown);
    return () => window.removeEventListener('mousedown', onWindowPointerDown);
  }, []);

  async function updateLead(leadId: string) {
    const lead = leadById.get(leadId);
    if (!lead) {
      return;
    }

    const draft = getLeadDraft(lead);

    const payload: {
      status?: CrmLeadStatus;
      notes?: string | null;
      timeframe?: string | null;
      listingAddress?: string | null;
      propertyType?: string | null;
      beds?: number | null;
      baths?: number | null;
      sqft?: number | null;
    } = {};

    if (draft.status !== lead.status) {
      payload.status = draft.status;
    }

    if (normalizeOptionalNotes(draft.notes) !== normalizeOptionalNotes(lead.notes)) {
      payload.notes = normalizeOptionalNotes(draft.notes);
    }

    if (normalizeOptionalString(draft.timeframe) !== normalizeOptionalString(lead.timeframe)) {
      payload.timeframe = normalizeOptionalString(draft.timeframe);
    }

    if (normalizeOptionalString(draft.listingAddress) !== normalizeOptionalString(lead.listingAddress)) {
      payload.listingAddress = normalizeOptionalString(draft.listingAddress);
    }

    if (normalizeOptionalString(draft.propertyType) !== normalizeOptionalString(lead.propertyType)) {
      payload.propertyType = normalizeOptionalString(draft.propertyType);
    }

    const beds = parseNullableNumber(draft.beds);
    if (beds === undefined) {
      pushToast('error', 'Beds must be a whole number.');
      return;
    }
    if (beds !== lead.beds) {
      payload.beds = beds;
    }

    const baths = parseNullableNumber(draft.baths);
    if (baths === undefined) {
      pushToast('error', 'Baths must be a whole number.');
      return;
    }
    if (baths !== lead.baths) {
      payload.baths = baths;
    }

    const sqft = parseNullableNumber(draft.sqft);
    if (sqft === undefined) {
      pushToast('error', 'Sqft must be a whole number.');
      return;
    }
    if (sqft !== lead.sqft) {
      payload.sqft = sqft;
    }

    if (Object.keys(payload).length === 0) {
      pushToast('success', 'No unsaved lead changes.');
      return;
    }

    beginMutation();
    setSavingLeadIds((prev) => ({ ...prev, [leadId]: true }));
    setError(null);

    const optimisticLead: CrmLead = {
      ...lead,
      ...payload,
      updatedAt: new Date().toISOString(),
      notes: payload.notes === undefined ? lead.notes : payload.notes,
      timeframe: payload.timeframe === undefined ? lead.timeframe : payload.timeframe,
      listingAddress: payload.listingAddress === undefined ? lead.listingAddress : payload.listingAddress,
      propertyType: payload.propertyType === undefined ? lead.propertyType : payload.propertyType,
      beds: payload.beds === undefined ? lead.beds : payload.beds,
      baths: payload.baths === undefined ? lead.baths : payload.baths,
      sqft: payload.sqft === undefined ? lead.sqft : payload.sqft,
      status: payload.status === undefined ? lead.status : payload.status,
    };

    setLeads((prev) => prev.map((entry) => (entry.id === leadId ? optimisticLead : entry)));

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Lead update failed.');
      }

      const json = (await response.json()) as { lead?: CrmLead };

      if (json.lead) {
        setLeads((prev) => prev.map((entry) => (entry.id === leadId ? json.lead! : entry)));
      }

      clearLeadDraft(leadId);
      pushToast('success', `Saved ${lead.listingAddress || 'lead'} updates.`);
    } catch (mutationError) {
      setLeads((prev) => prev.map((entry) => (entry.id === leadId ? lead : entry)));
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown lead update error.';
      setError(message);
      pushToast('error', message);
    } finally {
      setSavingLeadIds((prev) => {
        const next = { ...prev };
        delete next[leadId];
        return next;
      });
      endMutation();
    }
  }

  async function updateContact(contactId: string) {
    const contact = contactById.get(contactId);
    const draft = draftContactById[contactId];
    if (!contact || !draft) {
      return;
    }

    const payload: { fullName?: string | null; email?: string | null; phone?: string | null } = {};

    if (normalizeOptionalString(draft.fullName) !== normalizeOptionalString(contact.fullName)) {
      payload.fullName = normalizeOptionalString(draft.fullName);
    }
    if (normalizeOptionalString(draft.email) !== normalizeOptionalString(contact.email)) {
      payload.email = normalizeOptionalString(draft.email);
    }
    if (normalizeOptionalString(draft.phone) !== normalizeOptionalString(contact.phone)) {
      payload.phone = normalizeOptionalString(draft.phone);
    }

    if (Object.keys(payload).length === 0) {
      pushToast('success', 'No unsaved contact changes.');
      return;
    }

    beginMutation();
    setSavingContactIds((prev) => ({ ...prev, [contactId]: true }));
    setError(null);

    const optimisticContact: CrmContact = {
      ...contact,
      fullName: payload.fullName === undefined ? contact.fullName : payload.fullName,
      email: payload.email === undefined ? contact.email : payload.email,
      phone: payload.phone === undefined ? contact.phone : payload.phone,
      updatedAt: new Date().toISOString(),
      emailNormalized:
        payload.email === undefined
          ? contact.emailNormalized
          : payload.email
            ? payload.email.trim().toLowerCase()
            : null,
      phoneNormalized:
        payload.phone === undefined ? contact.phoneNormalized : payload.phone ? payload.phone.replace(/\D/g, '') : null,
    };

    setContacts((prev) => prev.map((entry) => (entry.id === contactId ? optimisticContact : entry)));

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Contact update failed.');
      }

      const json = (await response.json()) as { contact?: CrmContact };
      if (json.contact) {
        setContacts((prev) => prev.map((entry) => (entry.id === contactId ? json.contact! : entry)));
      }

      setDraftContactById((prev) => {
        const next = { ...prev };
        delete next[contactId];
        return next;
      });

      pushToast('success', 'Contact updated.');
    } catch (mutationError) {
      setContacts((prev) => prev.map((entry) => (entry.id === contactId ? contact : entry)));
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown contact update error.';
      setError(message);
      pushToast('error', message);
    } finally {
      setSavingContactIds((prev) => {
        const next = { ...prev };
        delete next[contactId];
        return next;
      });
      endMutation();
    }
  }

  async function saveAllLeadDrafts() {
    if (pendingLeadIds.length === 0) {
      return;
    }

    await Promise.all(pendingLeadIds.map(async (leadId) => updateLead(leadId)));
  }

  function clearAllLeadDrafts() {
    setDraftByLeadId({});
  }

  async function createContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const optimisticId = `optimistic-contact-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const optimisticContact: CrmContact = {
      id: optimisticId,
      tenantId: tenantContext.tenantId,
      fullName: newContactName.trim() || null,
      email: newContactEmail.trim() || null,
      emailNormalized: newContactEmail.trim().toLowerCase() || null,
      phone: newContactPhone.trim() || null,
      phoneNormalized: newContactPhone.replace(/\D/g, '') || null,
      source: 'crm_manual',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setContacts((prev) => [optimisticContact, ...prev]);
    setSummary((prev) => ({ ...prev, contactCount: prev.contactCount + 1 }));

    beginMutation();

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newContactName,
          email: newContactEmail,
          phone: newContactPhone,
        }),
      });

      if (!response.ok) {
        throw new Error('Contact create failed.');
      }

      const json = (await response.json()) as { contact?: CrmContact };

      setNewContactName('');
      setNewContactEmail('');
      setNewContactPhone('');

      if (json.contact) {
        setContacts((prev) => prev.map((contact) => (contact.id === optimisticId ? json.contact! : contact)));
      } else {
        setContacts((prev) => prev.filter((contact) => contact.id !== optimisticId));
        setSummary((prev) => ({ ...prev, contactCount: Math.max(0, prev.contactCount - 1) }));
      }

      pushToast('success', 'Contact added.');
    } catch (mutationError) {
      setContacts((prev) => prev.filter((contact) => contact.id !== optimisticId));
      setSummary((prev) => ({ ...prev, contactCount: Math.max(0, prev.contactCount - 1) }));
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown contact create error.';
      setError(message);
      pushToast('error', message);
    } finally {
      endMutation();
    }
  }

  async function createActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nowIso = new Date().toISOString();
    const optimisticId = `optimistic-activity-${Date.now()}`;

    const optimisticActivity: CrmActivity = {
      id: optimisticId,
      tenantId: tenantContext.tenantId,
      contactId: newActivityContactId || null,
      leadId: newActivityLeadId || null,
      activityType: 'note',
      occurredAt: nowIso,
      summary: newActivitySummary.trim(),
      metadataJson: null,
      createdAt: nowIso,
    };

    setActivities((prev) => [optimisticActivity, ...prev]);
    setSummary((prev) => ({ ...prev, activityCount: prev.activityCount + 1 }));

    beginMutation();

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: 'note',
          summary: newActivitySummary,
          leadId: newActivityLeadId || undefined,
          contactId: newActivityContactId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Activity create failed.');
      }

      const json = (await response.json()) as { activity?: CrmActivity };

      setNewActivitySummary('');
      setNewActivityLeadId('');
      setNewActivityContactId('');

      if (json.activity) {
        setActivities((prev) => prev.map((activity) => (activity.id === optimisticId ? json.activity! : activity)));
      } else {
        setActivities((prev) => prev.filter((activity) => activity.id !== optimisticId));
        setSummary((prev) => ({ ...prev, activityCount: Math.max(0, prev.activityCount - 1) }));
      }

      pushToast('success', 'Activity logged.');
    } catch (mutationError) {
      setActivities((prev) => prev.filter((activity) => activity.id !== optimisticId));
      setSummary((prev) => ({ ...prev, activityCount: Math.max(0, prev.activityCount - 1) }));
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown activity create error.';
      setError(message);
      pushToast('error', message);
    } finally {
      endMutation();
    }
  }

  const openDashboard = useCallback(() => {
    setActiveNav('dashboard');
    setActiveView('dashboard');
  }, []);

  async function createLead() {
    if (!newLeadAddress.trim()) {
      pushToast('error', 'Listing address is required.');
      return;
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const optimisticLead: CrmLead = {
      id: optimisticId,
      tenantId: tenantContext.tenantId,
      contactId: null,
      status: 'new',
      leadType: (newLeadType || 'buyer') as CrmLead['leadType'],
      source: newLeadSource || 'crm_manual',
      timeframe: newLeadTimeframe.trim() || null,
      notes: newLeadNotes.trim() || null,
      listingId: null,
      listingUrl: null,
      listingAddress: newLeadAddress.trim(),
      propertyType: newLeadPropertyType || null,
      beds: null,
      baths: null,
      sqft: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setLeads((prev) => [optimisticLead, ...prev]);
    setSummary((prev) => ({ ...prev, leadCount: prev.leadCount + 1 }));
    beginMutation();

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingAddress: newLeadAddress.trim(),
          source: newLeadSource || 'crm_manual',
          leadType: newLeadType || 'buyer',
          notes: newLeadNotes.trim() || null,
          timeframe: newLeadTimeframe.trim() || null,
          propertyType: newLeadPropertyType || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Lead create failed.');
      }

      const json = (await response.json()) as { lead?: CrmLead };

      setNewLeadAddress('');
      setNewLeadSource('crm_manual');
      setNewLeadType('buyer');
      setNewLeadNotes('');
      setNewLeadTimeframe('');
      setNewLeadPropertyType('');
      setShowNewLeadForm(false);

      if (json.lead) {
        setLeads((prev) => prev.map((lead) => (lead.id === optimisticId ? json.lead! : lead)));
      } else {
        setLeads((prev) => prev.filter((lead) => lead.id !== optimisticId));
        setSummary((prev) => ({ ...prev, leadCount: Math.max(0, prev.leadCount - 1) }));
      }

      pushToast('success', 'Lead created successfully.');
    } catch (mutationError) {
      setLeads((prev) => prev.filter((lead) => lead.id !== optimisticId));
      setSummary((prev) => ({ ...prev, leadCount: Math.max(0, prev.leadCount - 1) }));
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown lead create error.';
      setError(message);
      pushToast('error', message);
    } finally {
      endMutation();
    }
  }

  const openPipeline = useCallback(() => {
    setActiveNav('pipeline');
    setActiveView('pipeline');
  }, []);

  const openLeadsTable = useCallback((preset: TableStatusPreset) => {
    setActiveNav('leads');
    setActiveView('leads');
    setTableStatusPreset(preset);
  }, []);

  const openProfile = useCallback(() => {
    setActiveNav('profile');
    setActiveView('profile');
  }, []);

  const handleNav = useCallback(
    (nav: WorkspaceNav) => {
      setActiveNav(nav);
      const nextView = resolveViewFromNav(nav);
      setActiveView(nextView);

      if (nextView !== 'dashboard') {
        return;
      }

      if (nav === 'contacts') {
        requestAnimationFrame(() => contactPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }

      if (nav === 'activity') {
        requestAnimationFrame(() => activityPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
    },
    []
  );

  const clearPipelineFilters = useCallback(() => {
    setPipelineStatusFilter(ALL_STATUS_FILTER);
    setPipelineSourceFilter(ALL_SOURCE_FILTER);
    setPipelineLeadTypeFilter(ALL_LEAD_TYPE_FILTER);
    setPipelineFilterNotice(null);
  }, []);

  const hasPipelineFiltersActive =
    pipelineStatusFilter !== ALL_STATUS_FILTER ||
    pipelineSourceFilter !== ALL_SOURCE_FILTER ||
    pipelineLeadTypeFilter !== ALL_LEAD_TYPE_FILTER;

  const resetBrandPreferences = useCallback(() => {
    setBrandPreferences(createDefaultBrandPreferences(tenantContext.tenantSlug));
  }, [tenantContext.tenantSlug]);

  const navItems: Array<{ id: WorkspaceNav; label: string; icon: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
    { id: 'pipeline', label: 'Pipeline', icon: '▦' },
    { id: 'leads', label: 'Lead Tracker', icon: '☰' },
    { id: 'contacts', label: 'Contacts', icon: '◉' },
    { id: 'activity', label: 'Activity', icon: '↻' },
    { id: 'profile', label: 'Profile', icon: '◯' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ];

  function toggleTableSort(column: LeadsTableSortColumn) {
    setTableSort((prev) => toggleTableSortState(prev, column));
  }

  return (
    <div className={`crm-shell-app ${brandPreferences.showTexture ? 'crm-shell-texture' : ''}`} style={brandThemeVars}>
      <aside className="crm-sidebar" aria-label="CRM navigation">
        <div className="crm-sidebar-brand">
          <div className="crm-brand-lockup">
            <span className="crm-brand-mark" aria-hidden="true">
              {showBrandLogo ? (
                <Image
                  loader={passthroughImageLoader}
                  src={resolvedLogoUrl}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  onError={() => setLogoLoadErrored(true)}
                />
              ) : (
                <span>{brandInitials}</span>
              )}
            </span>
            <div>
              <p className="crm-kicker">{brandPreferences.brandName}</p>
              <h1>CRM</h1>
            </div>
          </div>
          <span className="crm-tenant-domain">{tenantContext.tenantDomain}</span>
        </div>

        <nav className="crm-side-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`crm-side-nav-item ${activeNav === item.id ? 'is-active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              <span className="crm-side-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="crm-side-context">
          <span className="crm-chip">{tenantContext.tenantSlug}</span>
          <span className="crm-chip">{tenantContext.source}</span>
        </div>
      </aside>

      <div className="crm-main-shell">
        <header className="crm-shell-header">
          <div className="crm-shell-title">
            <span className="crm-brand-mark crm-brand-mark-small" aria-hidden="true">
              {showBrandLogo ? (
                <Image
                  loader={passthroughImageLoader}
                  src={resolvedLogoUrl}
                  alt=""
                  width={36}
                  height={36}
                  unoptimized
                  onError={() => setLogoLoadErrored(true)}
                />
              ) : (
                <span>{brandInitials}</span>
              )}
            </span>
            <div>
              <p className="crm-kicker">{greetingLabel}</p>
              <strong>{brandPreferences.brandName}</strong>
              <span className="crm-shell-subtitle">{toTitleCase(tenantContext.tenantSlug)} Workspace</span>
            </div>
          </div>
          <div className="crm-shell-links">
            <button type="button" className="crm-shell-link" onClick={openDashboard}>
              Dashboard
            </button>
            <button type="button" className="crm-shell-link" onClick={openPipeline}>
              Pipeline
            </button>
            <button type="button" className="crm-shell-link" onClick={() => openLeadsTable('all')}>
              Lead Tracker
            </button>
          </div>
        </header>

        <header className="crm-header">
          <div>
            <p className="crm-kicker">Workspace</p>
            <h2>
              {activeView === 'pipeline'
                ? 'Deal Pipeline'
                : activeView === 'leads'
                  ? 'Lead Tracker'
                  : activeView === 'settings'
                    ? 'Settings'
                    : activeView === 'profile'
                      ? 'My Profile'
                      : 'Dashboard'}
            </h2>
          </div>
          <div className="crm-header-tools">
            <div className="crm-search-wrap" ref={searchPanelRef}>
              <label className="crm-search">
                <span className="crm-search-icon" aria-hidden="true">
                  ⌕
                </span>
                <input
                  value={searchQuery}
                  onFocus={() => setSearchSuggestionsOpen(searchSuggestions.length > 0)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearchQuery(value);
                    setSearchSuggestionsOpen(value.trim().length > 0);
                  }}
                  placeholder="Search leads, contacts, addresses..."
                />
              </label>
              {searchSuggestionsOpen && searchSuggestions.length > 0 ? (
                <ul className="crm-search-suggestions" role="listbox" aria-label="Lead and contact suggestions">
                  {searchSuggestions.map((suggestion) => (
                    <li key={suggestion.id}>
                      <button
                        type="button"
                        className="crm-search-suggestion"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openLeadProfile(suggestion.leadId)}
                      >
                        <span>{suggestion.label}</span>
                        <span className="crm-muted">{suggestion.detail}</span>
                        <span className="crm-muted">{suggestion.meta}</span>
                        <span className={`crm-status-badge crm-status-${suggestion.status}`}>
                          {formatLeadStatusLabel(suggestion.status)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="crm-header-pop" ref={notificationPanelRef}>
              <button
                className="crm-icon-button"
                type="button"
                aria-label="Notifications"
                onClick={() => setNotificationsOpen((prev) => !prev)}
              >
                🔔
              </button>
              {notificationsOpen ? (
                <div className="crm-popover">
                  <p className="crm-kicker">Notifications</p>
                  <ul className="crm-compact-list">
                    <li>{pendingLeadIds.length} unsaved lead drafts</li>
                    <li>{followUpCount} leads need follow-up</li>
                    <li>{unlinkedBehaviorCount} unlinked behavior events</li>
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="crm-header-pop" ref={avatarMenuRef}>
              <button
                type="button"
                className="crm-avatar crm-avatar-button"
                aria-label="User actions"
                onClick={() => setAvatarMenuOpen((prev) => !prev)}
              >
                {agentProfile.headshotUrl ? (
                  <Image
                    loader={passthroughImageLoader}
                    src={agentProfile.headshotUrl}
                    alt=""
                    width={36}
                    height={36}
                    unoptimized
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  brandInitials
                )}
              </button>
              {avatarMenuOpen ? (
                <div className="crm-popover crm-avatar-menu">
                  <button
                    type="button"
                    className="crm-popover-action"
                    onClick={() => {
                      openProfile();
                      setAvatarMenuOpen(false);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    className="crm-popover-action"
                    onClick={() => {
                      handleNav('settings');
                      setAvatarMenuOpen(false);
                    }}
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    className="crm-popover-action"
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      window.location.href = '/sign-in';
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {!hasClerkKey && !devAuthBypassEnabled ? (
          <p className="crm-banner-warning">Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to enable sign-in UI in this environment.</p>
        ) : null}

        {error ? <p className="crm-error">{error}</p> : null}

        {loading ? <p className="crm-muted">Loading CRM data...</p> : null}

        {activeView === 'dashboard' ? (
          <section className="crm-dashboard-view">
            <section className="crm-kpi-grid" aria-label="Summary metrics">
              <button type="button" className="crm-kpi-card" onClick={() => openLeadsTable('new')}>
                <p>New Leads</p>
                <strong>{leadCountsByStatus.new}</strong>
                <KpiSparkline values={kpiSeries.newLeads} />
                <span>Open filtered table</span>
              </button>
              <button type="button" className="crm-kpi-card" onClick={() => openLeadsTable('follow_up')}>
                <p>Need Follow-up</p>
                <strong>{followUpCount}</strong>
                <KpiSparkline values={kpiSeries.followUp} />
                <span>Qualified + Nurturing</span>
              </button>
              <button type="button" className="crm-kpi-card" onClick={() => openLeadsTable('open_pipeline')}>
                <p>Open Pipeline</p>
                <strong>{activePipelineCount}</strong>
                <KpiSparkline values={kpiSeries.openPipeline} />
                <span>Active opportunities</span>
              </button>
              <button type="button" className="crm-kpi-card" onClick={() => openLeadsTable('closed')}>
                <p>Closed Win Rate</p>
                <strong>{winRate}%</strong>
                <KpiSparkline values={kpiSeries.closed} />
                <span>Won vs lost breakdown</span>
              </button>
            </section>

            <section className="crm-status-strip" aria-label="Lead status breakdown">
              {LEAD_STATUSES.map((status) => (
                <button
                  key={status}
                  className={`crm-status-pill crm-status-${status} ${dashboardStatusFilter === status ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => setDashboardStatusFilter(dashboardStatusFilter === status ? ALL_STATUS_FILTER : status)}
                >
                  <span>
                    {getStatusGlyph(status)} {formatLeadStatusLabel(status)}
                  </span>
                  <strong>{leadCountsByStatus[status]}</strong>
                </button>
              ))}
            </section>

            <section className="crm-momentum-strip" aria-label="7 day activity pulse">
              <p className="crm-kicker">7-day Pulse</p>
              <SevenDayPulse days={heartbeatDays} />
              <span className="crm-muted">
                Activity across the last week: {heartbeatDays.reduce((sum, d) => sum + d.total, 0)} total events.
              </span>
            </section>

            <section className="crm-overview-grid">
              <article className="crm-panel">
                <div className="crm-panel-head">
                  <h3>Recent Activity</h3>
                  <span className="crm-muted">Latest tenant-scoped updates</span>
                </div>
                {activities.length === 0 ? (
                  <EmptyState title="No activity yet" detail="Once calls, notes, and website events arrive, this feed will populate here." />
                ) : (
                  <ul className="crm-timeline">
                    {activities.slice(0, 8).map((activity) => {
                      const linkedLead = activity.leadId ? leadById.get(activity.leadId) : null;
                      return (
                        <li key={activity.id} className="crm-timeline-item">
                          <span className={`crm-timeline-dot crm-status-${linkedLead ? getLeadDraft(linkedLead).status : 'new'}`} />
                          <div>
                            <strong>{activity.summary}</strong>
                            <p>
                              {linkedLead ? (
                                <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(linkedLead.id)}>
                                  {linkedLead.listingAddress || 'View lead profile'}
                                </button>
                              ) : (
                                'General CRM activity'
                              )}{' '}
                              • {formatActivityTypeLabel(activity.activityType)} • {formatTimeAgo(activity.occurredAt)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>

              <article className="crm-panel">
                <div className="crm-panel-head">
                  <h3>Pipeline Snapshot</h3>
                  <span className="crm-muted">Current stage distribution</span>
                </div>

                <div className="crm-pipeline-bar" role="img" aria-label="Pipeline status distribution">
                  {LEAD_STATUSES.map((status) => {
                    const total = summary.leadCount || 1;
                    const segmentWidth = Math.max(leadCountsByStatus[status] / total, 0.08);

                    return (
                      <span
                        key={status}
                        className={`crm-pipeline-segment crm-status-${status}`}
                        style={{ flexGrow: segmentWidth }}
                        title={`${formatLeadStatusLabel(status)}: ${leadCountsByStatus[status]}`}
                      />
                    );
                  })}
                </div>

                <ul className="crm-legend">
                  {LEAD_STATUSES.map((status) => (
                    <li key={status}>
                      <span className={`crm-legend-swatch crm-status-${status}`} />
                      <span>
                        {getStatusGlyph(status)} {formatLeadStatusLabel(status)}
                      </span>
                      <strong>{leadCountsByStatus[status]}</strong>
                    </li>
                  ))}
                </ul>

                <div className="crm-quick-actions">
                  <button type="button" onClick={() => activityPanelRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                    Log Note
                  </button>
                  <button
                    type="button"
                    className="crm-secondary-button"
                    onClick={() => contactPanelRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Add Contact
                  </button>
                  <button type="button" className="crm-secondary-button" onClick={openPipeline}>
                    View Pipeline
                  </button>
                </div>

                <div className="crm-intent-banner">
                  <strong>{unlinkedBehaviorCount}</strong>
                  <span>Behavior events currently without linked lead/contact records.</span>
                </div>
              </article>
            </section>

            <section className="crm-work-grid">
              <article className="crm-panel crm-lead-panel">
                <div className="crm-panel-head">
                  <h3>Lead Queue</h3>
                  <span className="crm-muted">Prioritize and update your pipeline in one place.</span>
                </div>

                <div className="crm-filter-grid">
                  <label className="crm-field crm-field-grow">
                    Source
                    <select value={dashboardSourceFilter} onChange={(event) => setDashboardSourceFilter(event.target.value)}>
                      <option value={ALL_SOURCE_FILTER}>All sources</option>
                      {sourceFilterOptions.map((source) => (
                        <option key={source} value={source}>
                          {formatLeadSourceLabel(source)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="crm-field crm-field-grow">
                    Lead type
                    <select
                      value={dashboardLeadTypeFilter}
                      onChange={(event) => setDashboardLeadTypeFilter(event.target.value as LeadTypeFilter)}
                    >
                      <option value={ALL_LEAD_TYPE_FILTER}>All types</option>
                      <option value="website_lead">Website Lead</option>
                      <option value="valuation_request">Valuation Request</option>
                    </select>
                  </label>
                </div>

                <div className="crm-draft-bar">
                  <div className="crm-quick-summary">
                    <strong>{pendingLeadIds.length}</strong>
                    <span>Unsaved lead {pendingLeadIds.length === 1 ? 'change' : 'changes'}</span>
                  </div>
                  <div className="crm-quick-actions-buttons">
                    <button type="button" disabled={pendingLeadIds.length === 0 || isMutating} onClick={saveAllLeadDrafts}>
                      Save All
                    </button>
                    <button
                      type="button"
                      className="crm-secondary-button"
                      disabled={pendingLeadIds.length === 0 || isMutating}
                      onClick={clearAllLeadDrafts}
                    >
                      Discard Drafts
                    </button>
                  </div>
                </div>

                {dashboardFilteredLeads.length === 0 ? (
                  <EmptyState
                    title="No leads match the current filters"
                    detail="Clear or broaden filters to bring leads back into the queue."
                  />
                ) : (
                  <div className="crm-lead-list">
                    {dashboardFilteredLeads.map((lead) => {
                      const draft = getLeadDraft(lead);
                      const leadHasUnsavedChanges = hasUnsavedLeadChange(lead);
                      const isSavingLead = Boolean(savingLeadIds[lead.id]);
                      const behavior = leadBehaviorByLeadId.get(lead.id);

                      return (
                        <article key={lead.id} className="crm-lead-card">
                          <div className="crm-lead-head">
                            <div>
                              <button type="button" className="crm-lead-title-button" onClick={() => openLeadProfile(lead.id)}>
                                {draft.listingAddress || 'No address provided'}
                              </button>
                              <p className="crm-lead-meta">
                                {formatDateTime(lead.createdAt)} • {formatLeadTypeLabel(lead.leadType)}
                              </p>
                            </div>
                            <div className="crm-chip-row">
                              <span className="crm-chip">{formatLeadSourceLabel(lead.source)}</span>
                              <span className={`crm-status-badge crm-status-${draft.status}`}>{formatLeadStatusLabel(draft.status)}</span>
                              {behavior && (behavior.favoritedCount > 0 || behavior.viewedCount > 0) ? (
                                <span className="crm-chip crm-chip-intent">Intent signal</span>
                              ) : null}
                              {leadHasUnsavedChanges ? <span className="crm-chip crm-chip-warning">Unsaved</span> : null}
                            </div>
                          </div>

                          <div className="crm-lead-details">
                            <p>
                              <span>Contact</span>
                              <strong>
                                {lead.contactId ? (
                                  <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(lead.id)}>
                                    {getLeadContactLabel(lead, contactById)}
                                  </button>
                                ) : (
                                  getLeadContactLabel(lead, contactById)
                                )}
                              </strong>
                            </p>
                            <p>
                              <span>Property</span>
                              <strong>{draft.propertyType || 'Unspecified'}</strong>
                            </p>
                            <p>
                              <span>Beds / Baths</span>
                              <strong>
                                {draft.beds || '-'} / {draft.baths || '-'}
                              </strong>
                            </p>
                            <p>
                              <span>Sqft</span>
                              <strong>{draft.sqft || '-'}</strong>
                            </p>
                          </div>

                          <div className="crm-lead-edit-row">
                            <label className="crm-field">
                              Status
                              <select
                                disabled={isSavingLead}
                                value={draft.status}
                                onChange={(event) => {
                                  const value = event.target.value as CrmLeadStatus;
                                  setLeadDraftField(lead.id, 'status', value);
                                }}
                              >
                                {LEAD_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {formatLeadStatusLabel(status)}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="crm-field crm-field-grow">
                              Next Action
                              <input
                                value={draft.timeframe}
                                onChange={(event) => setLeadDraftField(lead.id, 'timeframe', event.target.value)}
                                placeholder="Schedule follow-up next Tuesday"
                              />
                            </label>
                          </div>

                          <div className="crm-lead-edit-row">
                            <label className="crm-field crm-field-grow">
                              Notes
                              <textarea
                                value={draft.notes}
                                onChange={(event) => setLeadDraftField(lead.id, 'notes', event.target.value)}
                                placeholder="Capture call outcomes, objections, and next actions..."
                              />
                            </label>
                          </div>

                          <div className="crm-actions-row">
                            <span className="crm-muted">Updated {formatDateTime(lead.updatedAt)}</span>
                            <button
                              type="button"
                              disabled={isSavingLead}
                              onClick={() => {
                                void updateLead(lead.id);
                              }}
                            >
                              {isSavingLead ? 'Saving...' : 'Save Lead'}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </article>

              <aside className="crm-side-column">
                <section className="crm-panel" ref={contactPanelRef}>
                  <div className="crm-panel-head">
                    <h3>New Contact</h3>
                    <span className="crm-muted">Add a person manually to your CRM.</span>
                  </div>
                  <form className="crm-form" onSubmit={createContact}>
                    <label className="crm-field">
                      Full Name
                      <input value={newContactName} onChange={(event) => setNewContactName(event.target.value)} placeholder="Jane Doe" />
                    </label>
                    <label className="crm-field">
                      Email
                      <input
                        type="email"
                        value={newContactEmail}
                        onChange={(event) => setNewContactEmail(event.target.value)}
                        placeholder="jane@example.com"
                      />
                    </label>
                    <label className="crm-field">
                      Phone
                      <input
                        value={newContactPhone}
                        onChange={(event) => setNewContactPhone(event.target.value)}
                        placeholder="(203) 555-0101"
                      />
                    </label>
                    <button type="submit" disabled={isMutating}>
                      Add Contact
                    </button>
                  </form>
                </section>

                <section className="crm-panel" ref={activityPanelRef}>
                  <div className="crm-panel-head">
                    <h3>Log Activity</h3>
                    <span className="crm-muted">Document outreach and deal progress.</span>
                  </div>

                  <div className="crm-inline-controls">
                    <span className="crm-muted">Sort linked options:</span>
                    <button
                      type="button"
                      className={`crm-sort-toggle ${activitySortMode === 'recent' ? 'is-active' : ''}`}
                      onClick={() => setActivitySortMode('recent')}
                    >
                      Most recent
                    </button>
                    <button
                      type="button"
                      className={`crm-sort-toggle ${activitySortMode === 'alpha' ? 'is-active' : ''}`}
                      onClick={() => setActivitySortMode('alpha')}
                    >
                      Alphabetical
                    </button>
                  </div>

                  <form className="crm-form" onSubmit={createActivity}>
                    <label className="crm-field">
                      Summary
                      <input
                        value={newActivitySummary}
                        onChange={(event) => setNewActivitySummary(event.target.value)}
                        placeholder="Called seller and reviewed valuation strategy"
                        required
                      />
                    </label>
                    <label className="crm-field">
                      Contact
                      <select
                        value={newActivityContactId}
                        onChange={(event) => {
                          const nextContactId = event.target.value;
                          setNewActivityContactId(nextContactId);

                          if (!nextContactId) {
                            return;
                          }

                          const linkedLead = (leadsByContactId.get(nextContactId) ?? [])[0];
                          if (linkedLead) {
                            setNewActivityLeadId(linkedLead.id);
                          }
                        }}
                      >
                        <option value="">None</option>
                        {sortedActivityContacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.fullName || contact.email || contact.id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="crm-field">
                      Lead
                      <select
                        value={newActivityLeadId}
                        onChange={(event) => {
                          const nextLeadId = event.target.value;
                          setNewActivityLeadId(nextLeadId);

                          if (!nextLeadId) {
                            return;
                          }

                          const linkedLead = leadById.get(nextLeadId);
                          if (linkedLead?.contactId) {
                            setNewActivityContactId(linkedLead.contactId);
                          }
                        }}
                      >
                        <option value="">None</option>
                        {activityLeadOptions.map((lead) => (
                          <option key={lead.id} value={lead.id}>
                            {lead.listingAddress || lead.id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" disabled={isMutating}>
                      Log Note
                    </button>
                  </form>
                </section>

                <section className="crm-panel">
                  <div className="crm-panel-head">
                    <h3>Contacts</h3>
                    <span className="crm-muted">Directory snapshot for active records.</span>
                  </div>
                  {contacts.length === 0 ? (
                    <EmptyState title="No contacts yet" detail="Create your first contact to start linking notes and lead records." />
                  ) : (
                    <ul className="crm-list">
                      {contacts.slice(0, 8).map((contact) => {
                        const linkedLead = leadByContactId.get(contact.id);
                        return (
                          <li key={contact.id} className="crm-list-item">
                            <strong>
                              {linkedLead ? (
                                <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(linkedLead.id)}>
                                  {contact.fullName || 'Unnamed contact'}
                                </button>
                              ) : (
                                contact.fullName || 'Unnamed contact'
                              )}
                            </strong>
                            <span className="crm-muted">{contact.email || contact.phone || 'No channel captured'}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </aside>
            </section>
          </section>
        ) : null}

        {activeView === 'leads' ? (
          <section className="crm-panel crm-leads-table-panel">
            <div className="crm-panel-head">
              <div>
                <h3>Lead Tracker</h3>
                <span className="crm-muted">Track, sort, and manage all your leads in one place.</span>
              </div>
              <button
                type="button"
                className="crm-primary-button"
                onClick={() => setShowNewLeadForm((prev) => !prev)}
              >
                {showNewLeadForm ? '✕ Cancel' : '＋ New Lead'}
              </button>
            </div>

            {showNewLeadForm && (
              <div className="crm-new-lead-form">
                <div className="crm-new-lead-fields">
                  <label className="crm-field">
                    Listing Address *
                    <input
                      type="text"
                      value={newLeadAddress}
                      placeholder="123 Main St, Fairfield, CT"
                      onChange={(event) => setNewLeadAddress(event.target.value)}
                    />
                  </label>
                  <label className="crm-field">
                    Lead Type
                    <select value={newLeadType} onChange={(event) => setNewLeadType(event.target.value as 'buyer' | 'seller')}>
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                    </select>
                  </label>
                  <label className="crm-field">
                    Source
                    <select value={newLeadSource} onChange={(event) => setNewLeadSource(event.target.value)}>
                      <option value="crm_manual">Manual Entry</option>
                      <option value="website">Website</option>
                      <option value="referral">Referral</option>
                      <option value="social">Social Media</option>
                      <option value="cold_call">Cold Call</option>
                      <option value="open_house">Open House</option>
                    </select>
                  </label>
                  <label className="crm-field">
                    Property Type
                    <select value={newLeadPropertyType} onChange={(event) => setNewLeadPropertyType(event.target.value)}>
                      <option value="">Not specified</option>
                      <option value="single-family">Single Family</option>
                      <option value="condo">Condo</option>
                      <option value="multi-family">Multi-Family</option>
                    </select>
                  </label>
                  <label className="crm-field">
                    Timeframe
                    <input
                      type="text"
                      value={newLeadTimeframe}
                      placeholder="e.g. 3-6 months"
                      onChange={(event) => setNewLeadTimeframe(event.target.value)}
                    />
                  </label>
                  <label className="crm-field crm-field-wide">
                    Notes
                    <textarea
                      value={newLeadNotes}
                      placeholder="Initial notes about this lead..."
                      rows={2}
                      onChange={(event) => setNewLeadNotes(event.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="crm-primary-button"
                  disabled={!newLeadAddress.trim() || activeMutations > 0}
                  onClick={() => { void createLead(); }}
                >
                  {activeMutations > 0 ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            )}

            <div className="crm-inline-controls crm-table-presets">
              <button
                type="button"
                className={`crm-sort-toggle ${tableStatusPreset === 'all' ? 'is-active' : ''}`}
                onClick={() => setTableStatusPreset('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`crm-sort-toggle ${tableStatusPreset === 'new' ? 'is-active' : ''}`}
                onClick={() => setTableStatusPreset('new')}
              >
                New
              </button>
              <button
                type="button"
                className={`crm-sort-toggle ${tableStatusPreset === 'follow_up' ? 'is-active' : ''}`}
                onClick={() => setTableStatusPreset('follow_up')}
              >
                Follow-up
              </button>
              <button
                type="button"
                className={`crm-sort-toggle ${tableStatusPreset === 'open_pipeline' ? 'is-active' : ''}`}
                onClick={() => setTableStatusPreset('open_pipeline')}
              >
                Open Pipeline
              </button>
              <button
                type="button"
                className={`crm-sort-toggle ${tableStatusPreset === 'closed' ? 'is-active' : ''}`}
                onClick={() => setTableStatusPreset('closed')}
              >
                Closed
              </button>
            </div>

            {leadsTableRows.length === 0 ? (
              <EmptyState title="No leads in this table view" detail="Try switching presets or adjusting active filters." />
            ) : (
              <div className="crm-table-wrap">
                <table className="crm-leads-table">
                  <thead>
                    <tr>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('name')}>
                          Name
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('leadType')}>
                          Lead Type
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('status')}>
                          Status
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('score')}>
                          Score
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('priceRange')}>
                          Price Range
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('location')}>
                          Location
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('lastContact')}>
                          Last Contact
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('desired')}>
                          Beds / Baths / Size Desired
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('source')}>
                          Source
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('updatedAt')}>
                          Updated At
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsTableRows.map((row) => (
                      <tr key={row.lead.id}>
                        <td>
                          <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(row.lead.id)}>
                            {row.contactLabel}
                          </button>
                          <span className="crm-muted crm-table-sub">{row.intentLabel}</span>
                        </td>
                        <td>{formatLeadTypeLabel(row.lead.leadType)}</td>
                        <td>
                          <span className={`crm-status-badge crm-status-${row.draft.status}`}>
                            {formatLeadStatusLabel(row.draft.status)}
                          </span>
                        </td>
                        <td>
                          <span className={`crm-score-badge crm-score-${row.score.label.toLowerCase()}`}>
                            {row.score.score} {row.score.label}
                          </span>
                        </td>
                        <td>{row.priceRange}</td>
                        <td>
                          <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(row.lead.id)}>
                            {row.location}
                          </button>
                        </td>
                        <td>{row.lastContact ? formatDateTime(row.lastContact) : '-'}</td>
                        <td>{row.desired}</td>
                        <td>{formatLeadSourceLabel(row.lead.source)}</td>
                        <td>{formatDateTime(row.lead.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        {activeView === 'pipeline' ? (
          <section className="crm-pipeline-view">
            <div className="crm-panel crm-pipeline-filter-panel">
              <div className="crm-panel-head">
                <h3>Pipeline Filters</h3>
                <span className="crm-muted">Pipeline-local filters are independent from dashboard filters.</span>
              </div>
              <div className="crm-filter-grid">
                <label className="crm-field crm-field-grow">
                  Source
                  <select value={pipelineSourceFilter} onChange={(event) => setPipelineSourceFilter(event.target.value)}>
                    <option value={ALL_SOURCE_FILTER}>All sources</option>
                    {sourceFilterOptions.map((source) => (
                      <option key={source} value={source}>
                        {formatLeadSourceLabel(source)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="crm-field crm-field-grow">
                  Lead type
                  <select
                    value={pipelineLeadTypeFilter}
                    onChange={(event) => setPipelineLeadTypeFilter(event.target.value as LeadTypeFilter)}
                  >
                    <option value={ALL_LEAD_TYPE_FILTER}>All types</option>
                    <option value="website_lead">Website Lead</option>
                    <option value="valuation_request">Valuation Request</option>
                  </select>
                </label>
                <label className="crm-field crm-field-grow">
                  Status
                  <select value={pipelineStatusFilter} onChange={(event) => setPipelineStatusFilter(event.target.value as LeadStatusFilter)}>
                    <option value={ALL_STATUS_FILTER}>All statuses</option>
                    {LEAD_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {formatLeadStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="crm-inline-controls">
                <button type="button" className="crm-secondary-button" onClick={clearPipelineFilters}>
                  All status / clear filters
                </button>
                <div className="crm-lane-controls" aria-label="Pipeline lane navigation">
                  <button
                    type="button"
                    className="crm-secondary-button"
                    onClick={() => pipelineBoardRef.current?.scrollBy({ left: -360, behavior: 'smooth' })}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="crm-secondary-button"
                    onClick={() => pipelineBoardRef.current?.scrollBy({ left: 360, behavior: 'smooth' })}
                  >
                    →
                  </button>
                </div>
              </div>
              {pipelineFilterNotice ? (
                <p className="crm-banner-warning">
                  {pipelineFilterNotice}
                  {hasPipelineFiltersActive ? ' Clear filters to view moved lead.' : ''}
                </p>
              ) : null}
            </div>

            <div className="crm-pipeline-board" aria-label="Pipeline board by status" ref={pipelineBoardRef}>
              {LEAD_STATUSES.map((status) => (
                <section key={status} className="crm-pipeline-column">
                  <header className="crm-pipeline-column-head">
                    <h4>
                      <StatusIcon status={status} size={14} /> {formatLeadStatusLabel(status)}
                    </h4>
                    <span className={`crm-status-badge crm-status-${status}`}>{groupedPipelineLeads[status].length}</span>
                  </header>

                  <div className="crm-pipeline-column-list">
                    {groupedPipelineLeads[status].length === 0 ? (
                      <EmptyState
                        title={`No leads in ${formatLeadStatusLabel(status)}`}
                        detail="Move a lead into this stage or clear filters to view hidden cards."
                      />
                    ) : (
                      groupedPipelineLeads[status].map((lead) => {
                        const draft = getLeadDraft(lead);
                        const leadHasUnsavedChanges = hasUnsavedLeadChange(lead);
                        const isSavingLead = Boolean(savingLeadIds[lead.id]);

                        return (
                          <article key={lead.id} className="crm-pipeline-card">
                            <div className="crm-pipeline-card-top">
                              <strong>
                                <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(lead.id)}>
                                  {getLeadContactLabel(lead, contactById)}
                                </button>
                              </strong>
                              <span className="crm-muted">{formatTimeAgo(lead.updatedAt)}</span>
                            </div>
                            <p className="crm-pipeline-address">
                              <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(lead.id)}>
                                {draft.listingAddress || 'No address provided'}
                              </button>
                            </p>
                            <div className="crm-chip-row">
                              <span className="crm-chip">{formatLeadTypeLabel(lead.leadType)}</span>
                              <span className="crm-chip">{formatLeadSourceLabel(lead.source)}</span>
                              {leadHasUnsavedChanges ? <span className="crm-chip crm-chip-warning">Unsaved</span> : null}
                            </div>
                            <label className="crm-field">
                              Status
                              <select
                                disabled={isSavingLead}
                                value={draft.status}
                                onChange={(event) => {
                                  const value = event.target.value as CrmLeadStatus;
                                  setLeadDraftField(lead.id, 'status', value);
                                  const notice = getPipelineMoveNotice(
                                    getLeadContactLabel(lead, contactById),
                                    value,
                                    pipelineStatusFilter
                                  );
                                  if (notice) {
                                    setPipelineFilterNotice(notice);
                                  }
                                }}
                              >
                                {LEAD_STATUSES.map((stage) => (
                                  <option key={stage} value={stage}>
                                    {formatLeadStatusLabel(stage)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="crm-field">
                              Notes
                              <textarea
                                value={draft.notes}
                                onChange={(event) => setLeadDraftField(lead.id, 'notes', event.target.value)}
                                placeholder="Update lead notes..."
                              />
                            </label>
                            <button
                              type="button"
                              className="crm-pipeline-save-button"
                              disabled={isSavingLead}
                              onClick={() => {
                                void updateLead(lead.id);
                              }}
                            >
                              {isSavingLead ? 'Saving...' : 'Save'}
                            </button>
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>
              ))}
            </div>
          </section>
        ) : null}

        {activeView === 'profile' ? (
          <section className="crm-panel">
            <div className="crm-panel-head">
              <h3>My Profile</h3>
              <span className="crm-muted">Manage your agent profile and see your performance at a glance.</span>
            </div>
            <div className="crm-profile-layout">
              <aside className="crm-profile-card">
                <div className="crm-profile-headshot-wrap">
                  {agentProfile.headshotUrl ? (
                    <Image
                      loader={passthroughImageLoader}
                      src={agentProfile.headshotUrl}
                      alt={agentProfile.fullName || 'Agent headshot'}
                      width={120}
                      height={120}
                      unoptimized
                      style={{ borderRadius: '50%', objectFit: 'cover', width: 120, height: 120 }}
                    />
                  ) : (
                    <span className="crm-profile-initials">{agentProfile.fullName ? getBrandInitials(agentProfile.fullName) : brandInitials}</span>
                  )}
                </div>
                <h4>{agentProfile.fullName || 'Your Name'}</h4>
                <p className="crm-muted">{agentProfile.brokerage || 'Your Brokerage'}</p>
                {agentProfile.licenseNumber && <p className="crm-muted" style={{ fontSize: '0.75rem' }}>License #{agentProfile.licenseNumber}</p>}
                <div className="crm-profile-stats">
                  <div className="crm-profile-stat">
                    <strong>{leads.length}</strong>
                    <span>Total Leads</span>
                  </div>
                  <div className="crm-profile-stat">
                    <strong>{leads.length > 0 ? `${Math.round((leads.filter((l) => l.status === 'won').length / leads.length) * 100)}%` : '0%'}</strong>
                    <span>Win Rate</span>
                  </div>
                  <div className="crm-profile-stat">
                    <strong>{leads.filter((l) => l.status === 'new' || l.status === 'qualified' || l.status === 'nurturing').length}</strong>
                    <span>Active</span>
                  </div>
                </div>
              </aside>
              <div className="crm-profile-form">
                <article>
                  <h4>Agent Information</h4>
                  <label className="crm-field">
                    Full Name
                    <input
                      type="text"
                      value={agentProfile.fullName}
                      placeholder="Jane Doe"
                      onChange={(event) => setAgentProfile((prev) => ({ ...prev, fullName: event.target.value }))}
                    />
                  </label>
                  <label className="crm-field">
                    Email
                    <input
                      type="email"
                      value={agentProfile.email}
                      placeholder="jane@example.com"
                      onChange={(event) => setAgentProfile((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </label>
                  <label className="crm-field">
                    Phone
                    <input
                      type="tel"
                      value={agentProfile.phone}
                      placeholder="(203) 555-0100"
                      onChange={(event) => setAgentProfile((prev) => ({ ...prev, phone: event.target.value }))}
                    />
                  </label>
                  <label className="crm-field">
                    Brokerage
                    <input
                      type="text"
                      value={agentProfile.brokerage}
                      placeholder="Luxury Properties Group"
                      onChange={(event) => setAgentProfile((prev) => ({ ...prev, brokerage: event.target.value }))}
                    />
                  </label>
                  <label className="crm-field">
                    License Number
                    <input
                      type="text"
                      value={agentProfile.licenseNumber}
                      placeholder="RES.0123456"
                      onChange={(event) => setAgentProfile((prev) => ({ ...prev, licenseNumber: event.target.value }))}
                    />
                  </label>
                </article>
                <article>
                  <h4>Headshot & Bio</h4>
                  <label className="crm-field">
                    Headshot URL
                    <input
                      type="url"
                      value={agentProfile.headshotUrl}
                      placeholder="https://example.com/headshot.jpg"
                      onChange={(event) => setAgentProfile((prev) => ({ ...prev, headshotUrl: event.target.value }))}
                    />
                  </label>
                  <label className="crm-field">
                    Bio
                    <textarea
                      value={agentProfile.bio}
                      placeholder="A brief description of your experience and specialties..."
                      rows={4}
                      onChange={(event) => setAgentProfile((prev) => ({ ...prev, bio: event.target.value }))}
                    />
                  </label>
                </article>
              </div>
            </div>
          </section>
        ) : null}

        {activeView === 'settings' ? (
          <section className="crm-panel">
            <div className="crm-panel-head">
              <h3>Settings</h3>
              <span className="crm-muted">Tenant-scoped brand, look-and-feel, and workspace preferences.</span>
            </div>
            <div className="crm-settings-grid">
              <article>
                <h4>Brand Identity</h4>
                <label className="crm-field">
                  Workspace Brand Name
                  <input
                    value={brandPreferences.brandName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setBrandPreferences((prev) => ({ ...prev, brandName: value }));
                    }}
                    placeholder="Caiola Realty"
                  />
                </label>
                <label className="crm-field">
                  Custom Logo URL
                  <input
                    value={brandPreferences.customLogoUrl}
                    onChange={(event) => {
                      const value = event.target.value;
                      setBrandPreferences((prev) => ({ ...prev, customLogoUrl: value, useWebsiteFavicon: false }));
                    }}
                    placeholder="https://.../logo.svg"
                  />
                </label>
                <div className="crm-inline-controls">
                  <button
                    type="button"
                    className={`crm-sort-toggle ${brandPreferences.useWebsiteFavicon ? 'is-active' : ''}`}
                    onClick={() =>
                      setBrandPreferences((prev) => ({
                        ...prev,
                        useWebsiteFavicon: true,
                      }))
                    }
                  >
                    Use Website Logo
                  </button>
                  <button
                    type="button"
                    className={`crm-sort-toggle ${!brandPreferences.useWebsiteFavicon ? 'is-active' : ''}`}
                    onClick={() =>
                      setBrandPreferences((prev) => ({
                        ...prev,
                        useWebsiteFavicon: false,
                      }))
                    }
                  >
                    Use Custom URL
                  </button>
                </div>
                <p className="crm-muted">
                  Website logo source: <code>{websiteFaviconUrl}</code>
                </p>
              </article>
              <article>
                <h4>Theme Controls</h4>
                <label className="crm-field">
                  Accent Color
                  <input
                    type="color"
                    value={normalizeHexColor(brandPreferences.accentColor, '#1c1917')}
                    onChange={(event) =>
                      setBrandPreferences((prev) => ({
                        ...prev,
                        accentColor: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="crm-field">
                  Surface Tint
                  <input
                    type="color"
                    value={normalizeHexColor(brandPreferences.surfaceTint, '#d6cec4')}
                    onChange={(event) =>
                      setBrandPreferences((prev) => ({
                        ...prev,
                        surfaceTint: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="crm-checkbox-row">
                  <input
                    type="checkbox"
                    checked={brandPreferences.showTexture}
                    onChange={(event) =>
                      setBrandPreferences((prev) => ({
                        ...prev,
                        showTexture: event.target.checked,
                      }))
                    }
                  />
                  <span>Enable decorative background texture</span>
                </label>
                <button type="button" className="crm-secondary-button" onClick={resetBrandPreferences}>
                  Reset Branding Defaults
                </button>
              </article>
              <article>
                <h4>Brand Preview</h4>
                <div className="crm-brand-preview">
                  <span className="crm-brand-mark" aria-hidden="true">
                    {showBrandLogo ? (
                      <Image
                        loader={passthroughImageLoader}
                        src={resolvedLogoUrl}
                        alt=""
                        width={44}
                        height={44}
                        unoptimized
                        onError={() => setLogoLoadErrored(true)}
                      />
                    ) : (
                      <span>{brandInitials}</span>
                    )}
                  </span>
                  <div>
                    <strong>{brandPreferences.brandName}</strong>
                    <p className="crm-muted">Tenant: {tenantContext.tenantSlug}</p>
                    <p className="crm-muted">Domain: {tenantContext.tenantDomain}</p>
                  </div>
                </div>
                <p className="crm-muted">
                  Your logo and colors appear in navigation, header, footer, and key workflow surfaces for stronger brand recognition.
                </p>
              </article>
            </div>
          </section>
        ) : null}

        <footer className="crm-footer">
          <span className="crm-footer-brand">
            <span className="crm-brand-mark crm-brand-mark-micro" aria-hidden="true">
              {showBrandLogo ? (
                <Image
                  loader={passthroughImageLoader}
                  src={resolvedLogoUrl}
                  alt=""
                  width={24}
                  height={24}
                  unoptimized
                  onError={() => setLogoLoadErrored(true)}
                />
              ) : (
                <span>{brandInitials}</span>
              )}
            </span>
            <span>{brandPreferences.brandName}</span>
          </span>
          <div className="crm-footer-links">
            <button type="button" className="crm-footer-link" onClick={() => handleNav('settings')}>
              Settings
            </button>
            <button type="button" className="crm-footer-link" onClick={() => openLeadsTable('all')}>
              Lead Tracker
            </button>
            <button type="button" className="crm-footer-link" onClick={openPipeline}>
              Pipeline
            </button>
          </div>
        </footer>
      </div>

      {activeLeadProfile ? (
        <div
          className="crm-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeLeadProfile();
            }
          }}
        >
          <section className="crm-modal" role="dialog" aria-modal="true" aria-labelledby="crm-lead-profile-title">
            <header className="crm-modal-header">
              <div>
                <p className="crm-kicker">Lead Profile</p>
                <h3 id="crm-lead-profile-title">{getLeadDraft(activeLeadProfile).listingAddress || 'Lead Details'}</h3>
                <p className="crm-muted">
                  Created {formatDateTime(activeLeadProfile.createdAt)} • Updated {formatDateTime(activeLeadProfile.updatedAt)}
                </p>
              </div>
              <button type="button" className="crm-modal-close" onClick={closeLeadProfile} aria-label="Close lead profile">
                ✕
              </button>
            </header>

            <div className="crm-modal-grid">
              <section className="crm-modal-section">
                <h4>Lead + Contact Details</h4>
                <div className="crm-chip-row">
                  <span className="crm-chip">{formatLeadTypeLabel(activeLeadProfile.leadType)}</span>
                  <span className="crm-chip">{formatLeadSourceLabel(activeLeadProfile.source)}</span>
                  <span className={`crm-status-badge crm-status-${getLeadDraft(activeLeadProfile).status}`}>
                    {formatLeadStatusLabel(getLeadDraft(activeLeadProfile).status)}
                  </span>
                  {hasUnsavedLeadChange(activeLeadProfile) ? <span className="crm-chip crm-chip-warning">Unsaved lead changes</span> : null}
                  {activeContact && hasUnsavedContactChange(activeContact) ? (
                    <span className="crm-chip crm-chip-warning">Unsaved contact changes</span>
                  ) : null}
                </div>

                <div className="crm-modal-definition-grid">
                  <p>
                    <span>Last Contact</span>
                    <strong>{activeLeadLastContact ? formatDateTime(activeLeadLastContact) : 'No contact logged'}</strong>
                  </p>
                  <p>
                    <span>Next Action</span>
                    <strong>{getLeadDraft(activeLeadProfile).timeframe || 'Not set'}</strong>
                  </p>
                  <p>
                    <span>Price Range</span>
                    <strong>
                      {formatPriceRange(
                        leadBehaviorByLeadId.get(activeLeadProfile.id)?.minPrice ?? null,
                        leadBehaviorByLeadId.get(activeLeadProfile.id)?.maxPrice ?? null
                      )}
                    </strong>
                  </p>
                </div>

                <div className="crm-modal-edit-grid">
                  <label className="crm-field crm-field-grow">
                    Contact Name
                    <input
                      value={activeContactDraft?.fullName ?? ''}
                      onChange={(event) => {
                        if (!activeContact) {
                          return;
                        }
                        const value = event.target.value;
                        setDraftContactById((prev) => ({
                          ...prev,
                          [activeContact.id]: {
                            ...(prev[activeContact.id] ?? {
                              fullName: activeContact.fullName ?? '',
                              email: activeContact.email ?? '',
                              phone: activeContact.phone ?? '',
                            }),
                            fullName: value,
                          },
                        }));
                      }}
                      disabled={!activeContact}
                      placeholder="No linked contact"
                    />
                  </label>
                  <label className="crm-field crm-field-grow">
                    Contact Email
                    <input
                      value={activeContactDraft?.email ?? ''}
                      onChange={(event) => {
                        if (!activeContact) {
                          return;
                        }
                        const value = event.target.value;
                        setDraftContactById((prev) => ({
                          ...prev,
                          [activeContact.id]: {
                            ...(prev[activeContact.id] ?? {
                              fullName: activeContact.fullName ?? '',
                              email: activeContact.email ?? '',
                              phone: activeContact.phone ?? '',
                            }),
                            email: value,
                          },
                        }));
                      }}
                      disabled={!activeContact}
                    />
                  </label>
                </div>

                <div className="crm-modal-edit-grid">
                  <label className="crm-field crm-field-grow">
                    Contact Phone
                    <input
                      value={activeContactDraft?.phone ?? ''}
                      onChange={(event) => {
                        if (!activeContact) {
                          return;
                        }
                        const value = event.target.value;
                        setDraftContactById((prev) => ({
                          ...prev,
                          [activeContact.id]: {
                            ...(prev[activeContact.id] ?? {
                              fullName: activeContact.fullName ?? '',
                              email: activeContact.email ?? '',
                              phone: activeContact.phone ?? '',
                            }),
                            phone: value,
                          },
                        }));
                      }}
                      disabled={!activeContact}
                    />
                  </label>
                  <label className="crm-field crm-field-grow">
                    Address
                    <input
                      value={getLeadDraft(activeLeadProfile).listingAddress}
                      onChange={(event) => setLeadDraftField(activeLeadProfile.id, 'listingAddress', event.target.value)}
                    />
                  </label>
                </div>

                <div className="crm-modal-edit-grid">
                  <label className="crm-field">
                    Status
                    <select
                      value={getLeadDraft(activeLeadProfile).status}
                      onChange={(event) => {
                        const value = event.target.value as CrmLeadStatus;
                        setLeadDraftField(activeLeadProfile.id, 'status', value);
                      }}
                    >
                      {LEAD_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {formatLeadStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="crm-field crm-field-grow">
                    Property Type
                    <input
                      value={getLeadDraft(activeLeadProfile).propertyType}
                      onChange={(event) => setLeadDraftField(activeLeadProfile.id, 'propertyType', event.target.value)}
                    />
                  </label>
                </div>

                <div className="crm-modal-edit-grid crm-modal-edit-grid-three">
                  <label className="crm-field">
                    Beds desired
                    <input
                      value={getLeadDraft(activeLeadProfile).beds}
                      onChange={(event) => setLeadDraftField(activeLeadProfile.id, 'beds', event.target.value)}
                    />
                  </label>
                  <label className="crm-field">
                    Baths desired
                    <input
                      value={getLeadDraft(activeLeadProfile).baths}
                      onChange={(event) => setLeadDraftField(activeLeadProfile.id, 'baths', event.target.value)}
                    />
                  </label>
                  <label className="crm-field">
                    Size desired (sqft)
                    <input
                      value={getLeadDraft(activeLeadProfile).sqft}
                      onChange={(event) => setLeadDraftField(activeLeadProfile.id, 'sqft', event.target.value)}
                    />
                  </label>
                </div>

                <div className="crm-modal-edit-grid">
                  <label className="crm-field crm-field-grow">
                    Next Action
                    <input
                      value={getLeadDraft(activeLeadProfile).timeframe}
                      onChange={(event) => setLeadDraftField(activeLeadProfile.id, 'timeframe', event.target.value)}
                      placeholder="Schedule next call"
                    />
                  </label>
                </div>

                <label className="crm-field crm-field-grow">
                  Notes
                  <textarea
                    value={getLeadDraft(activeLeadProfile).notes}
                    onChange={(event) => setLeadDraftField(activeLeadProfile.id, 'notes', event.target.value)}
                    placeholder="Capture call outcomes, objections, and next actions..."
                  />
                </label>

                <div className="crm-actions-row">
                  <button
                    type="button"
                    disabled={Boolean(savingLeadIds[activeLeadProfile.id])}
                    onClick={() => {
                      void updateLead(activeLeadProfile.id);
                    }}
                  >
                    {savingLeadIds[activeLeadProfile.id] ? 'Saving...' : 'Save Lead'}
                  </button>
                  <button
                    type="button"
                    className="crm-secondary-button"
                    disabled={!activeContact || Boolean(savingContactIds[activeContact.id])}
                    onClick={() => {
                      if (!activeContact) {
                        return;
                      }
                      void updateContact(activeContact.id);
                    }}
                  >
                    {activeContact && savingContactIds[activeContact.id] ? 'Saving...' : 'Save Contact'}
                  </button>
                  <button
                    type="button"
                    className="crm-secondary-button"
                    onClick={() => {
                      clearLeadDraft(activeLeadProfile.id);
                      if (activeContact) {
                        setDraftContactById((prev) => {
                          const next = { ...prev };
                          delete next[activeContact.id];
                          return next;
                        });
                      }
                    }}
                  >
                    Discard Draft
                  </button>
                </div>
              </section>

              <section className="crm-modal-section">
                <h4>Website Behavior Intelligence</h4>
                <div className="crm-behavior-grid">
                  <article
                    className={`crm-behavior-card crm-behavior-card-clickable ${expandedBehaviorCard === 'searches' ? 'is-expanded' : ''}`}
                    onClick={() => setExpandedBehaviorCard(expandedBehaviorCard === 'searches' ? null : 'searches')}
                    role="button"
                    tabIndex={0}
                  >
                    <p>Searches</p>
                    <strong>{activeLeadSearchSignals.length}</strong>
                    <span>{activeLeadSearchSignals[0] ? formatTimeAgo(activeLeadSearchSignals[0].occurredAt) : 'No recent searches'}</span>
                  </article>
                  <article
                    className={`crm-behavior-card crm-behavior-card-clickable ${expandedBehaviorCard === 'views' ? 'is-expanded' : ''}`}
                    onClick={() => setExpandedBehaviorCard(expandedBehaviorCard === 'views' ? null : 'views')}
                    role="button"
                    tabIndex={0}
                  >
                    <p>Listing Views</p>
                    <strong>{activeLeadListingSignals.filter((signal) => signal.action === 'viewed').length}</strong>
                    <span>Viewed listings</span>
                  </article>
                  <article
                    className={`crm-behavior-card crm-behavior-card-clickable ${expandedBehaviorCard === 'favorites' ? 'is-expanded' : ''}`}
                    onClick={() => setExpandedBehaviorCard(expandedBehaviorCard === 'favorites' ? null : 'favorites')}
                    role="button"
                    tabIndex={0}
                  >
                    <p>Favorites</p>
                    <strong>{activeLeadListingSignals.filter((signal) => signal.action === 'favorited').length}</strong>
                    <span>Saved listings</span>
                  </article>
                  <article
                    className={`crm-behavior-card crm-behavior-card-clickable ${expandedBehaviorCard === 'unfavorites' ? 'is-expanded' : ''}`}
                    onClick={() => setExpandedBehaviorCard(expandedBehaviorCard === 'unfavorites' ? null : 'unfavorites')}
                    role="button"
                    tabIndex={0}
                  >
                    <p>Unfavorites</p>
                    <strong>{activeLeadListingSignals.filter((signal) => signal.action === 'unfavorited').length}</strong>
                    <span>Removed listings</span>
                  </article>
                </div>

                {/* Expanded detail panel */}
                {expandedBehaviorCard === 'searches' && activeLeadSearchSignals.length > 0 ? (
                  <div className="crm-behavior-expanded">
                    <p className="crm-kicker">Search Activity</p>
                    <ul className="crm-behavior-detail-list">
                      {activeLeadSearchSignals.map((signal) => (
                        <li key={signal.id}>
                          <strong>{signal.query || 'General search'}</strong>
                          <span>{signal.filterSummary || 'No filters'} • {signal.resultCount ?? 0} results</span>
                          <span className="crm-muted">{formatDateTime(signal.occurredAt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {expandedBehaviorCard === 'views' ? (
                  <div className="crm-behavior-expanded">
                    <p className="crm-kicker">Viewed Listings</p>
                    <ul className="crm-behavior-detail-list">
                      {activeLeadListingSignals
                        .filter((s) => s.action === 'viewed')
                        .map((signal) => (
                          <li key={signal.id}>
                            <strong>{signal.address || 'Unknown address'}</strong>
                            <span>
                              {signal.price ? `$${signal.price.toLocaleString()}` : 'No price'}
                              {signal.beds ? ` • ${signal.beds} bed` : ''}
                              {signal.baths ? ` / ${signal.baths} bath` : ''}
                              {signal.sqft ? ` • ${signal.sqft.toLocaleString()} sqft` : ''}
                            </span>
                            <span className="crm-muted">{formatDateTime(signal.occurredAt)}</span>
                          </li>
                        ))}
                      {activeLeadListingSignals.filter((s) => s.action === 'viewed').length === 0 ? (
                        <li><span className="crm-muted">No viewed listings</span></li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                {expandedBehaviorCard === 'favorites' ? (
                  <div className="crm-behavior-expanded">
                    <p className="crm-kicker">Favorited Listings</p>
                    <ul className="crm-behavior-detail-list">
                      {activeLeadListingSignals
                        .filter((s) => s.action === 'favorited')
                        .map((signal) => (
                          <li key={signal.id}>
                            <strong>{signal.address || 'Unknown address'}</strong>
                            <span>
                              {signal.price ? `$${signal.price.toLocaleString()}` : 'No price'}
                              {signal.beds ? ` • ${signal.beds} bed` : ''}
                              {signal.baths ? ` / ${signal.baths} bath` : ''}
                            </span>
                            <span className="crm-muted">{formatDateTime(signal.occurredAt)}</span>
                          </li>
                        ))}
                      {activeLeadListingSignals.filter((s) => s.action === 'favorited').length === 0 ? (
                        <li><span className="crm-muted">No favorited listings</span></li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                {expandedBehaviorCard === 'unfavorites' ? (
                  <div className="crm-behavior-expanded">
                    <p className="crm-kicker">Removed Favorites</p>
                    <ul className="crm-behavior-detail-list">
                      {activeLeadListingSignals
                        .filter((s) => s.action === 'unfavorited')
                        .map((signal) => (
                          <li key={signal.id}>
                            <strong>{signal.address || 'Unknown address'}</strong>
                            <span className="crm-muted">{formatDateTime(signal.occurredAt)}</span>
                          </li>
                        ))}
                      {activeLeadListingSignals.filter((s) => s.action === 'unfavorited').length === 0 ? (
                        <li><span className="crm-muted">No removed favorites</span></li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                <div className="crm-lead-insights">
                  <LeadEngagementGauge score={leadScore.score} label={leadScore.label} />
                  <div className="crm-lead-insights-charts">
                    <LeadActivityChart activities={activeLeadProfileActivities} />
                    <PriceInterestBar signals={activeLeadListingSignals} />
                  </div>
                </div>

                <ul className="crm-modal-signal-list">
                  {activeLeadSearchSignals.slice(0, 4).map((signal) => (
                    <li key={signal.id}>
                      <strong>Search</strong>
                      <span>
                        {signal.query || 'No query text'} • {signal.filterSummary || 'No filter summary'} • {signal.resultCount ?? 0} results •{' '}
                        {formatDateTime(signal.occurredAt)}
                      </span>
                    </li>
                  ))}
                  {activeLeadListingSignals.slice(0, 6).map((signal) => (
                    <li key={signal.id}>
                      <strong>{signal.action.slice(0, 1).toUpperCase() + signal.action.slice(1)}</strong>
                      <span>
                        {signal.address || 'Listing interaction'} • {signal.price ? formatPriceRange(signal.price, signal.price) : 'No price'} •{' '}
                        {formatDateTime(signal.occurredAt)}
                      </span>
                    </li>
                  ))}
                  {activeLeadSearchSignals.length === 0 && activeLeadListingSignals.length === 0 ? (
                    <li>
                      <strong>No behavior intelligence yet</strong>
                      <span>This lead has no tracked website behavior events.</span>
                    </li>
                  ) : null}
                </ul>
              </section>
            </div>

            <section className="crm-modal-section">
              <h4>Notes + Activity Timeline</h4>
              {activeLeadProfileActivities.length === 0 ? (
                <EmptyState
                  title="No lead activity yet"
                  detail="When outreach or website actions are logged, this timeline becomes the source of truth."
                />
              ) : (
                <ul className="crm-modal-timeline">
                  {activeLeadProfileActivities.slice(0, 14).map((activity) => (
                    <li key={activity.id}>
                      <div>
                        <strong>{formatActivityTypeLabel(activity.activityType)}</strong>
                        <p>{activity.summary}</p>
                      </div>
                      <span className="crm-muted">{formatDateTime(activity.occurredAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </section>
        </div>
      ) : null}

      <div className="crm-toast-stack" aria-live="polite" aria-label="CRM notifications">
        {toasts.map((toast) => (
          <div key={toast.id} className={`crm-toast crm-toast-${toast.kind}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
