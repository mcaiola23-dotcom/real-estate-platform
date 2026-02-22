'use client';

import { memo } from 'react';
import type { EscalationLevel } from '@real-estate/ai/crm/escalation-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EscalationBannerProps {
  leadId: string;
  leadName: string;
  level: EscalationLevel;
  daysOverdue: number;
  recommendation: string;
  onViewLead?: (leadId: string) => void;
  onDismiss?: (leadId: string) => void;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEVEL_CONFIG: Record<number, {
  className: string;
  label: string;
  icon: string;
}> = {
  0: { className: '', label: '', icon: '' },
  1: { className: 'crm-escalation--amber', label: 'Needs Attention', icon: '\u26A0' },
  2: { className: 'crm-escalation--red', label: 'Action Required', icon: '\u{1F534}' },
  3: { className: 'crm-escalation--red-banner', label: 'Urgent', icon: '\u{1F6A8}' },
  4: { className: 'crm-escalation--critical', label: 'Critical', icon: '\u{1F6A8}' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EscalationBanner = memo(function EscalationBanner({
  leadId,
  leadName,
  level,
  daysOverdue,
  recommendation,
  onViewLead,
  onDismiss,
  compact = false,
}: EscalationBannerProps) {
  if (level === 0) return null;

  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG[1]!;

  return (
    <div className={`crm-escalation ${config.className} ${compact ? 'crm-escalation--compact' : ''}`} role="alert">
      <div className="crm-escalation__indicator" />
      <div className="crm-escalation__content">
        <div className="crm-escalation__header">
          <span className="crm-escalation__icon" aria-hidden="true">{config.icon}</span>
          <span className="crm-escalation__label">{config.label}</span>
          {daysOverdue > 0 && (
            <span className="crm-escalation__days">
              {daysOverdue}d overdue
            </span>
          )}
        </div>
        <div className="crm-escalation__lead-name">{leadName}</div>
        {!compact && (
          <p className="crm-escalation__recommendation">{recommendation}</p>
        )}
      </div>
      <div className="crm-escalation__actions">
        {onViewLead && (
          <button
            type="button"
            className="crm-escalation__btn crm-escalation__btn--view"
            onClick={() => onViewLead(leadId)}
          >
            View
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            className="crm-escalation__btn crm-escalation__btn--dismiss"
            onClick={() => onDismiss(leadId)}
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
        )}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Dashboard-level alert banner for multiple escalated leads
// ---------------------------------------------------------------------------

interface EscalationAlertBannerProps {
  escalatedLeads: Array<{
    leadId: string;
    leadName: string;
    level: EscalationLevel;
    daysOverdue: number;
  }>;
  onViewLead?: (leadId: string) => void;
}

export const EscalationAlertBanner = memo(function EscalationAlertBanner({
  escalatedLeads,
  onViewLead,
}: EscalationAlertBannerProps) {
  const critical = escalatedLeads.filter((l) => l.level >= 3);
  const warning = escalatedLeads.filter((l) => l.level >= 1 && l.level < 3);

  if (escalatedLeads.length === 0) return null;

  return (
    <div className={`crm-escalation-alert ${critical.length > 0 ? 'crm-escalation-alert--critical' : 'crm-escalation-alert--warning'}`} role="alert">
      <div className="crm-escalation-alert__content">
        <span className="crm-escalation-alert__icon" aria-hidden="true">
          {critical.length > 0 ? '\u{1F6A8}' : '\u26A0'}
        </span>
        <span className="crm-escalation-alert__text">
          {critical.length > 0 && (
            <strong>{critical.length} critical</strong>
          )}
          {critical.length > 0 && warning.length > 0 && ' and '}
          {warning.length > 0 && (
            <span>{warning.length} lead{warning.length !== 1 ? 's' : ''} need{warning.length === 1 ? 's' : ''} attention</span>
          )}
          {critical.length > 0 && warning.length === 0 && (
            <span> lead{critical.length !== 1 ? 's' : ''} need{critical.length === 1 ? 's' : ''} immediate action</span>
          )}
        </span>
      </div>
      <div className="crm-escalation-alert__leads">
        {escalatedLeads.slice(0, 5).map((l) => (
          <button
            key={l.leadId}
            type="button"
            className={`crm-escalation-alert__lead crm-escalation-alert__lead--${l.level >= 3 ? 'critical' : 'warning'}`}
            onClick={() => onViewLead?.(l.leadId)}
          >
            {l.leadName} ({l.daysOverdue}d)
          </button>
        ))}
        {escalatedLeads.length > 5 && (
          <span className="crm-escalation-alert__more">+{escalatedLeads.length - 5} more</span>
        )}
      </div>
    </div>
  );
});
