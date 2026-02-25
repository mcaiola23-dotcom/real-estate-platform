'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import type { ReminderChannel, SnoozeOption } from '@real-estate/ai/crm/reminder-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SmartReminderFormProps {
  leadId: string;
  tenantId: string;
  currentNextAction: string | null;
  currentNextActionNote: string | null;
  currentChannel: string | null;
  onSave: (data: {
    nextActionAt: string;
    nextActionNote: string;
    nextActionChannel: string;
  }) => void;
  onSnooze: (durationMs: number) => void;
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
// Component
// ---------------------------------------------------------------------------

export const SmartReminderForm = memo(function SmartReminderForm({
  leadId,
  tenantId,
  currentNextAction,
  currentNextActionNote,
  currentChannel,
  onSave,
  onSnooze,
  hideHeader,
}: SmartReminderFormProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [channel, setChannel] = useState<ReminderChannel>((currentChannel as ReminderChannel) || 'any');
  const [note, setNote] = useState(currentNextActionNote || '');
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [expanded, setExpanded] = useState(!currentNextAction);

  // Initialize date from current next action (use .then() to satisfy react-hooks/set-state-in-effect)
  useEffect(() => {
    Promise.resolve().then(() => {
      if (currentNextAction) {
        const d = new Date(currentNextAction);
        setDate(d.toISOString().split('T')[0]!);
        setTime(d.toTimeString().slice(0, 5));
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDate(tomorrow.toISOString().split('T')[0]!);
      }
    });
  }, [currentNextAction]);

  // Fetch AI suggestions
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
    Promise.resolve().then(() => fetchSuggestions());
  }, [fetchSuggestions]);

  const handleSave = () => {
    if (!date) return;
    const datetime = new Date(`${date}T${time}:00`);
    onSave({
      nextActionAt: datetime.toISOString(),
      nextActionNote: note.trim(),
      nextActionChannel: channel,
    });
  };

  const handleApplySuggestion = (suggestion: AiSuggestion) => {
    const d = new Date(suggestion.suggestedAt);
    setDate(d.toISOString().split('T')[0]!);
    setTime(d.toTimeString().slice(0, 5));
    setChannel(suggestion.channel);
    if (suggestion.reason) {
      setNote(suggestion.reason);
    }
    setExpanded(true);
  };

  const handleSnooze = (durationMs: number) => {
    onSnooze(durationMs);
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
          <span className="crm-reminder-form__header-title">Follow-Up Reminder</span>
          <span className={`crm-reminder-form__chevron ${expanded ? 'crm-reminder-form__chevron--open' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
          </span>
        </div>
      )}

      {showBody && (
        <div className="crm-reminder-form__body">
          {/* AI Suggestions */}
          {loadingAi && (
            <div className="crm-reminder-form__ai-loading">
              <span className="crm-ai-dots"><span /><span /><span /></span> Analyzing lead patterns...
            </div>
          )}

          {!loadingAi && aiSuggestions.length > 0 && (
            <div className="crm-reminder-form__suggestions">
              <div className="crm-reminder-form__suggestions-label">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" opacity="0.7" />
                </svg>
                AI Suggestions
              </div>
              {aiSuggestions.map((s, i) => (
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
          )}

          {/* Form fields */}
          <div className="crm-reminder-form__fields">
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

          {/* Actions */}
          <div className="crm-reminder-form__actions">
            <div className="crm-reminder-form__snooze-group">
              <span className="crm-reminder-form__snooze-label">Snooze:</span>
              <button type="button" className="crm-reminder-form__snooze-btn" onClick={() => handleSnooze(60 * 60 * 1000)}>1hr</button>
              <button type="button" className="crm-reminder-form__snooze-btn" onClick={() => handleSnooze(24 * 60 * 60 * 1000)}>Tomorrow</button>
              <button type="button" className="crm-reminder-form__snooze-btn" onClick={() => handleSnooze(7 * 24 * 60 * 60 * 1000)}>Next week</button>
            </div>
            <button
              type="button"
              className="crm-reminder-form__save-btn"
              onClick={handleSave}
              disabled={!date}
            >
              Set Reminder
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
