'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReminderAlert as ReminderAlertType } from '../../lib/use-reminder-alerts';

interface ReminderAlertProps {
  alerts: ReminderAlertType[];
  onDismiss: (alertId: string) => void;
  onSnooze: (alertId: string, leadId: string) => void;
  onMarkComplete: (alertId: string, leadId: string) => void;
  onDismissAll: () => void;
  onOpenLead: (leadId: string) => void;
}

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 15_000;

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function channelLabel(channel: string | null): string | null {
  if (!channel) return null;
  const labels: Record<string, string> = {
    call: 'Call',
    email: 'Email',
    text: 'Text',
    sms: 'SMS',
    meeting: 'Meeting',
    showing: 'Showing',
    other: 'Other',
  };
  return labels[channel.toLowerCase()] || channel;
}

function AlertCard({
  alert,
  onDismiss,
  onSnooze,
  onMarkComplete,
  onOpenLead,
}: {
  alert: ReminderAlertType;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, leadId: string) => void;
  onMarkComplete: (id: string, leadId: string) => void;
  onOpenLead: (leadId: string) => void;
}) {
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    timerRef.current = setTimeout(() => onDismiss(alert.id), AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [paused, alert.id, onDismiss]);

  const channel = channelLabel(alert.channel);

  return (
    <div
      className="crm-reminder-alert-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="alert"
    >
      <div className="crm-reminder-alert-header">
        <div className="crm-reminder-alert-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <span className="crm-reminder-alert-time">{formatRelativeTime(alert.dueAt)}</span>
        <button
          type="button"
          className="crm-reminder-alert-dismiss"
          onClick={() => onDismiss(alert.id)}
          aria-label="Dismiss reminder"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="crm-reminder-alert-name">{alert.leadName}</div>
      {alert.note && <div className="crm-reminder-alert-note">{alert.note}</div>}
      {channel && <span className="crm-reminder-alert-channel">{channel}</span>}
      <div className="crm-reminder-alert-actions">
        <button
          type="button"
          className="crm-reminder-alert-btn crm-reminder-alert-btn--primary"
          onClick={() => {
            onOpenLead(alert.leadId);
            onDismiss(alert.id);
          }}
        >
          Open Lead
        </button>
        <button
          type="button"
          className="crm-reminder-alert-btn crm-reminder-alert-btn--success"
          onClick={() => onMarkComplete(alert.id, alert.leadId)}
        >
          Done
        </button>
        <button
          type="button"
          className="crm-reminder-alert-btn crm-reminder-alert-btn--ghost"
          onClick={() => onSnooze(alert.id, alert.leadId)}
        >
          Snooze 1hr
        </button>
      </div>
    </div>
  );
}

export function ReminderAlertStack({
  alerts,
  onDismiss,
  onSnooze,
  onMarkComplete,
  onDismissAll,
  onOpenLead,
}: ReminderAlertProps) {
  if (alerts.length === 0) return null;

  const visible = alerts.slice(0, MAX_VISIBLE);
  const overflow = alerts.length - MAX_VISIBLE;

  return (
    <div className="crm-reminder-alert-stack" aria-label="Reminder alerts">
      {visible.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onDismiss={onDismiss}
          onSnooze={onSnooze}
          onMarkComplete={onMarkComplete}
          onOpenLead={onOpenLead}
        />
      ))}
      {overflow > 0 && (
        <div className="crm-reminder-alert-overflow">
          +{overflow} more reminder{overflow > 1 ? 's' : ''}
          <button
            type="button"
            className="crm-reminder-alert-btn crm-reminder-alert-btn--ghost"
            onClick={onDismissAll}
          >
            Dismiss all
          </button>
        </div>
      )}
    </div>
  );
}
