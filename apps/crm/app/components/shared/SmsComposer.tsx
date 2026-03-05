'use client';

import { useState, useCallback } from 'react';

interface SmsComposerProps {
  to: string;
  leadId: string;
  contactId?: string | null;
  contactName?: string | null;
  initialBody?: string;
  onClose: () => void;
  onSent: () => void;
}

export function SmsComposer({
  to,
  leadId,
  contactId,
  contactName,
  initialBody,
  onClose,
  onSent,
}: SmsComposerProps) {
  const [body, setBody] = useState(initialBody ?? '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const charCount = body.length;
  const segments = Math.ceil(charCount / 160) || 1;

  const handleSend = useCallback(async () => {
    if (!body.trim()) {
      setError('Message body is required.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/integrations/twilio/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          body: body.trim(),
          leadId,
          contactId: contactId ?? undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSent(true);
        setTimeout(() => onSent(), 1500);
      } else {
        setError(data.error ?? 'Failed to send SMS.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  }, [to, body, leadId, contactId, onSent]);

  if (sent) {
    return (
      <div className="crm-sms-composer crm-sms-sent">
        <p>✓ SMS sent to {to}</p>
      </div>
    );
  }

  return (
    <div className="crm-sms-composer">
      <div className="crm-sms-composer__header">
        <strong>Send SMS</strong>
        <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close composer">
          ✕
        </button>
      </div>

      <label className="crm-field">
        To
        <input value={`${contactName ? contactName + ' — ' : ''}${to}`} readOnly className="crm-sms-to" />
      </label>

      <label className="crm-field">
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          Message
          <span className="crm-muted" style={{ fontWeight: 400, fontSize: '0.75rem' }}>
            {charCount} chars · {segments} segment{segments !== 1 ? 's' : ''}
            {charCount > 160 && (
              <span style={{ color: 'var(--crm-warning, #dc2626)', marginLeft: '0.3rem' }}>
                Multi-segment
              </span>
            )}
          </span>
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={contactName ? `Hi ${contactName}, ` : 'Type your message...'}
          rows={4}
          maxLength={1600}
        />
      </label>

      {error && <p className="crm-integration-error">{error}</p>}

      <div className="crm-sms-composer__actions">
        <button
          type="button"
          className="crm-primary-button"
          onClick={() => void handleSend()}
          disabled={sending || !body.trim()}
        >
          {sending ? 'Sending...' : 'Send SMS'}
        </button>
        <button type="button" className="crm-secondary-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
