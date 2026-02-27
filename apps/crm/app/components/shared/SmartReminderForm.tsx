'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import type { ReminderChannel, SnoozeOption } from '@real-estate/ai/crm/reminder-engine';
import type { CrmReminder } from '@real-estate/types/crm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SmartReminderFormProps {
  leadId: string;
  tenantId: string;
  hideHeader?: boolean;
}

interface AiSuggestion {
  suggestedAt: string;
  channel: ReminderChannel;
  urgency: string;
  reason: string;
  aiEnhancedReason: string | null;
  snoozeOptions: SnoozeOption[];
}

// ---------------------------------------------------------------------------
// Channel config
// ---------------------------------------------------------------------------

const CHANNELS: { value: ReminderChannel; label: string; icon: string }[] = [
  { value: 'call', label: 'Call', icon: '\u260E' },
  { value: 'email', label: 'Email', icon: '\u2709' },
  { value: 'text', label: 'Text', icon: '\u{1F4AC}' },
  { value: 'any', label: 'Any', icon: '\u{1F504}' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatReminderDate(isoStr: string): string {
  const d = new Date(isoStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
}

function getReminderStatus(isoStr: string): 'overdue' | 'today' | 'upcoming' {
  const d = new Date(isoStr);
  const now = new Date();
  if (d.getTime() < now.getTime()) return 'overdue';
  if (d.toDateString() === now.toDateString()) return 'today';
  return 'upcoming';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SmartReminderForm = memo(function SmartReminderForm({
  leadId,
  tenantId,
  hideHeader,
}: SmartReminderFormProps) {
  // ── Reminder list state (self-contained) ──
  const [reminders, setReminders] = useState<CrmReminder[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Form state ──
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [channel, setChannel] = useState<ReminderChannel>('any');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── AI suggestion state ──
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // ── Collapsible header ──
  const [expanded, setExpanded] = useState(true);

  // ── Fetch reminders from API ──
  const fetchReminders = useCallback(() => {
    setLoading(true);
    fetch(`/api/leads/${leadId}/reminders?status=pending`, {
      headers: { 'x-tenant-id': tenantId },
    })
      .then((res) => res.json())
      .then((data: { ok: boolean; reminders?: CrmReminder[] }) => {
        if (data.ok && data.reminders) {
          setReminders(data.reminders);
        }
      })
      .catch(() => {
        // Graceful — keep existing state
      })
      .finally(() => setLoading(false));
  }, [leadId, tenantId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // ── Fetch AI suggestions ──
  const fetchSuggestions = useCallback(() => {
    setLoadingAi(true);
    fetch(`/api/ai/reminders/${leadId}`, {
      headers: { 'x-tenant-id': tenantId },
    })
      .then((res) => res.json())
      .then((data: { ok: boolean; reminders?: { suggestions: AiSuggestion[] } }) => {
        if (data.ok && data.reminders?.suggestions) {
          setAiSuggestions(data.reminders.suggestions);
        }
      })
      .catch(() => {
        // Graceful — no suggestions shown
      })
      .finally(() => setLoadingAi(false));
  }, [leadId, tenantId]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // ── Initialize form defaults ──
  useEffect(() => {
    if (!editingId) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]!);
      setTime('09:00');
      setChannel('any');
      setNote('');
    }
  }, [editingId]);

  // ── Form actions ──
  const resetForm = () => {
    setEditingId(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]!);
    setTime('09:00');
    setChannel('any');
    setNote('');
  };

  const handleSave = async () => {
    if (!date || saving) return;
    setSaving(true);
    const datetime = new Date(`${date}T${time}:00`);

    try {
      if (editingId) {
        // Update existing
        await fetch(`/api/reminders/${editingId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', 'x-tenant-id': tenantId },
          body: JSON.stringify({
            scheduledFor: datetime.toISOString(),
            note: note.trim() || null,
            channel: channel || null,
          }),
        });
      } else {
        // Create new
        await fetch(`/api/leads/${leadId}/reminders`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-tenant-id': tenantId },
          body: JSON.stringify({
            scheduledFor: datetime.toISOString(),
            note: note.trim() || null,
            channel: channel || null,
          }),
        });
      }
      resetForm();
      fetchReminders();
    } catch {
      // Error state could be added here
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reminderId: string) => {
    try {
      await fetch(`/api/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': tenantId },
      });
      if (editingId === reminderId) {
        resetForm();
      }
      fetchReminders();
    } catch {
      // Graceful
    }
  };

  const handleEdit = (reminder: CrmReminder) => {
    const d = new Date(reminder.scheduledFor);
    setDate(d.toISOString().split('T')[0]!);
    setTime(d.toTimeString().slice(0, 5));
    setChannel((reminder.channel as ReminderChannel) || 'any');
    setNote(reminder.note || '');
    setEditingId(reminder.id);
  };

  const handleApplySuggestion = (suggestion: AiSuggestion) => {
    const d = new Date(suggestion.suggestedAt);
    setDate(d.toISOString().split('T')[0]!);
    setTime(d.toTimeString().slice(0, 5));
    setChannel(suggestion.channel);
    if (suggestion.reason) {
      setNote(suggestion.reason);
    }
    setEditingId(null);
  };

  const showBody = hideHeader || expanded;

  return (
    <div className="crm-reminder-form">
      {!hideHeader && (
        <div className="crm-reminder-form__header" onClick={() => setExpanded(!expanded)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}>
          <span className="crm-reminder-form__header-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="crm-reminder-form__header-title">Follow-Up Reminders</span>
          {reminders.length > 0 && (
            <span className="crm-reminder-form__header-count">{reminders.length}</span>
          )}
          <span className={`crm-reminder-form__chevron ${expanded ? 'crm-reminder-form__chevron--open' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
          </span>
        </div>
      )}

      {showBody && (
        <div className="crm-reminder-form__body">
          {/* ── Reminder cards list ── */}
          {loading && reminders.length === 0 && (
            <div className="crm-reminder-form__ai-loading">
              <span className="crm-ai-dots"><span /><span /><span /></span> Loading reminders...
            </div>
          )}

          {reminders.length > 0 && (
            <div className="crm-reminder-form__cards">
              {reminders.map((r) => {
                const status = getReminderStatus(r.scheduledFor);
                const channelLabel = r.channel ? CHANNELS.find((c) => c.value === r.channel) : null;
                const isEditing = editingId === r.id;
                return (
                  <div
                    key={r.id}
                    className={`crm-reminder-form__card crm-reminder-form__card--${status}${isEditing ? ' crm-reminder-form__card--editing' : ''}`}
                  >
                    <div className="crm-reminder-form__card-top">
                      <span className={`crm-reminder-form__active-badge crm-reminder-form__active-badge--${status}`}>
                        {status === 'overdue' ? 'OVERDUE' : status === 'today' ? 'TODAY' : 'SCHEDULED'}
                      </span>
                      <span className="crm-reminder-form__card-date">
                        {formatReminderDate(r.scheduledFor)}
                      </span>
                      {channelLabel && (
                        <span className="crm-reminder-form__card-channel">
                          {channelLabel.icon} {channelLabel.label}
                        </span>
                      )}
                    </div>
                    {r.note && (
                      <div className="crm-reminder-form__card-note">{r.note}</div>
                    )}
                    <div className="crm-reminder-form__card-actions">
                      <button
                        type="button"
                        className="crm-reminder-form__card-action-btn"
                        onClick={() => handleEdit(r)}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        className="crm-reminder-form__card-action-btn crm-reminder-form__card-action-btn--delete"
                        onClick={() => handleDelete(r.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── AI Suggestions ── */}
          {loadingAi && (
            <div className="crm-reminder-form__ai-loading">
              <span className="crm-ai-dots"><span /><span /><span /></span> Analyzing lead patterns...
            </div>
          )}

          {(() => {
            const filtered = aiSuggestions.filter((s) => s.urgency !== 'overdue' && s.urgency !== 'today');
            if (loadingAi || filtered.length === 0) return null;
            return (
              <div className="crm-reminder-form__suggestions">
                <div className="crm-reminder-form__suggestions-label">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" opacity="0.7" />
                  </svg>
                  AI Suggestions
                </div>
                {filtered.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`crm-reminder-form__suggestion crm-reminder-form__suggestion--${s.urgency}`}
                    onClick={() => handleApplySuggestion(s)}
                  >
                    <span className="crm-reminder-form__suggestion-urgency">{s.urgency}</span>
                    <span className="crm-reminder-form__suggestion-reason">{s.reason}</span>
                    {s.aiEnhancedReason && (
                      <span className="crm-reminder-form__suggestion-ai">{s.aiEnhancedReason}</span>
                    )}
                    <span className="crm-reminder-form__suggestion-channel">{s.channel}</span>
                  </button>
                ))}
              </div>
            );
          })()}

          {/* ── Form fields ── */}
          <div className="crm-reminder-form__fields">
            {editingId && (
              <div className="crm-reminder-form__editing-label">
                Editing reminder — <button type="button" className="crm-reminder-form__cancel-edit" onClick={resetForm}>Cancel</button>
              </div>
            )}
            <div className="crm-reminder-form__row">
              <div className="crm-reminder-form__field">
                <label className="crm-reminder-form__label">Date</label>
                <input
                  type="date"
                  className="crm-reminder-form__input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="crm-reminder-form__field">
                <label className="crm-reminder-form__label">Time</label>
                <input
                  type="time"
                  className="crm-reminder-form__input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="crm-reminder-form__field">
              <label className="crm-reminder-form__label">Channel</label>
              <div className="crm-reminder-form__channels">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.value}
                    type="button"
                    className={`crm-reminder-form__channel-btn ${channel === ch.value ? 'crm-reminder-form__channel-btn--active' : ''}`}
                    onClick={() => setChannel(ch.value)}
                    title={ch.label}
                  >
                    <span aria-hidden="true">{ch.icon}</span> {ch.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="crm-reminder-form__field">
              <label className="crm-reminder-form__label">Note</label>
              <textarea
                className="crm-reminder-form__textarea"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What to discuss or follow up on..."
                rows={2}
              />
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="crm-reminder-form__actions">
            <div className="crm-reminder-form__action-btns">
              {editingId && (
                <button
                  type="button"
                  className="crm-reminder-form__clear-action-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="crm-reminder-form__save-btn"
                onClick={handleSave}
                disabled={!date || saving}
              >
                {saving ? 'Saving...' : editingId ? 'Update Reminder' : 'Set Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
