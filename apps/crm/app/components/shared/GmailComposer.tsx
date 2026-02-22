'use client';

import { useState, useCallback } from 'react';

interface GmailComposerProps {
  to: string;
  leadId: string;
  contactName?: string;
  propertyAddress?: string | null;
  googleConnected: boolean;
  replyToMessageId?: string;
  initialSubject?: string;
  onClose: () => void;
  onSent: () => void;
}

export function GmailComposer({
  to,
  leadId,
  contactName,
  propertyAddress,
  googleConnected,
  replyToMessageId,
  initialSubject,
  onClose,
  onSent,
}: GmailComposerProps) {
  const [subject, setSubject] = useState(
    initialSubject ?? (propertyAddress ? `Re: ${propertyAddress}` : '')
  );
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = useCallback(async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required.');
      return;
    }

    if (!googleConnected) {
      // Fall back to mailto
      const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailto, '_blank');
      onSent();
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/integrations/google/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          body,
          leadId,
          replyToMessageId,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSent(true);
        setTimeout(() => onSent(), 1500);
      } else {
        setError(data.error ?? 'Failed to send email.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  }, [to, subject, body, leadId, googleConnected, replyToMessageId, onSent]);

  if (sent) {
    return (
      <div className="crm-gmail-composer crm-gmail-sent">
        <p>✓ Email sent to {to}</p>
      </div>
    );
  }

  return (
    <div className="crm-gmail-composer">
      <div className="crm-gmail-composer-header">
        <strong>{googleConnected ? 'Send via Gmail' : 'Compose Email'}</strong>
        <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close composer">
          ✕
        </button>
      </div>

      <label className="crm-field">
        To
        <input value={to} readOnly className="crm-gmail-to" />
      </label>

      <label className="crm-field">
        Subject
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject..."
        />
      </label>

      <label className="crm-field">
        Message
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={contactName ? `Hi ${contactName},\n\n` : 'Type your message...'}
          rows={6}
        />
      </label>

      {error && <p className="crm-integration-error">{error}</p>}

      <div className="crm-gmail-composer-actions">
        <button
          type="button"
          className="crm-primary-button"
          onClick={handleSend}
          disabled={sending || !subject.trim() || !body.trim()}
        >
          {sending ? 'Sending...' : googleConnected ? 'Send via Gmail' : 'Open in Email Client'}
        </button>
        <button type="button" className="crm-secondary-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
