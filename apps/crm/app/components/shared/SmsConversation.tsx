'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SmsMessage {
  sid: string;
  to: string;
  from: string;
  body: string;
  status: string;
  direction: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply';
  dateCreated: string;
  dateSent: string | null;
}

interface SmsConversationProps {
  to: string;
  leadId: string;
  contactId?: string | null;
  contactName?: string | null;
  initialBody?: string;
  onClose: () => void;
  onSent?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'delivered': return 'Delivered';
    case 'sent': return 'Sent';
    case 'queued': return 'Sending...';
    case 'failed': return 'Failed';
    case 'undelivered': return 'Undelivered';
    case 'received': return 'Received';
    default: return status;
  }
}

function isOutbound(direction: string) {
  return direction.startsWith('outbound');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SmsConversation({
  to,
  leadId,
  contactId,
  contactName,
  initialBody,
  onClose,
  onSent,
}: SmsConversationProps) {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState(initialBody ?? '');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const charCount = body.length;
  const segments = Math.ceil(charCount / 160) || 1;

  // Fetch message history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/integrations/twilio/sms/history?phoneNumber=${encodeURIComponent(to)}&limit=50`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (data.ok) {
        // Sort chronologically (oldest first)
        const sorted = (data.messages as SmsMessage[]).sort(
          (a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
        );
        setMessages(sorted);
        setError(null);
      } else {
        setError(data.error ?? 'Failed to load messages.');
      }
    } catch {
      setError('Network error loading SMS history.');
    } finally {
      setLoading(false);
    }
  }, [to]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  // Poll for new messages every 30s
  useEffect(() => {
    const interval = setInterval(() => void fetchHistory(), 30_000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Send message
  const handleSend = useCallback(async () => {
    if (!body.trim()) return;
    setSending(true);
    setSendError(null);

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
        setBody('');
        onSent?.();
        // Refresh history to show the sent message
        setTimeout(() => void fetchHistory(), 1000);
      } else {
        setSendError(data.error ?? 'Failed to send SMS.');
      }
    } catch {
      setSendError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  }, [to, body, leadId, contactId, onSent, fetchHistory]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }, [handleSend]);

  return (
    <div className="crm-sms-phone-frame">
      {/* Phone chrome header */}
      <div className="crm-sms-phone-header">
        <button type="button" className="crm-sms-phone-back" onClick={onClose} aria-label="Close conversation">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="crm-sms-phone-contact">
          <div className="crm-sms-phone-avatar">
            {(contactName ?? to).charAt(0).toUpperCase()}
          </div>
          <div className="crm-sms-phone-contact-info">
            <span className="crm-sms-phone-contact-name">{contactName ?? to}</span>
            <span className="crm-sms-phone-contact-number">{to}</span>
          </div>
        </div>
        <div className="crm-sms-phone-status-icons">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M1 12h2v2H1zM5 9h2v5H5zM9 6h2v8H9zM13 3h2v11h-2z" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* Chat area */}
      <div className="crm-sms-chat-area" ref={chatAreaRef}>
        {loading ? (
          <div className="crm-sms-loading">
            <span className="crm-spinner" />
            <span>Loading conversation...</span>
          </div>
        ) : error ? (
          <div className="crm-sms-error">
            <p>{error}</p>
            <button type="button" className="crm-secondary-button" onClick={() => { setLoading(true); void fetchHistory(); }}>
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="crm-sms-empty">
            <p>No messages yet. Start a conversation below.</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const outbound = isOutbound(msg.direction);
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showTimestamp = !prevMsg ||
                (new Date(msg.dateCreated).getTime() - new Date(prevMsg.dateCreated).getTime() > 600_000);

              return (
                <div key={msg.sid}>
                  {showTimestamp && (
                    <div className="crm-sms-timestamp-divider">
                      {formatTime(msg.dateCreated)}
                    </div>
                  )}
                  <div className={`crm-sms-bubble ${outbound ? 'crm-sms-bubble--sent' : 'crm-sms-bubble--received'}`}>
                    <p>{msg.body}</p>
                    <span className="crm-sms-bubble-meta">
                      {!showTimestamp && formatTime(msg.dateCreated)}
                      {outbound && msg.status && (
                        <span className={`crm-sms-status crm-sms-status--${msg.status}`}>
                          {getStatusLabel(msg.status)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Compose bar */}
      <div className="crm-sms-compose-bar">
        {sendError && (
          <div className="crm-sms-send-error">{sendError}</div>
        )}
        <div className="crm-sms-compose-input-row">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={contactName ? `Message ${contactName}...` : 'Type a message...'}
            rows={1}
            maxLength={1600}
            className="crm-sms-compose-textarea"
          />
          <button
            type="button"
            className="crm-sms-send-btn"
            onClick={() => void handleSend()}
            disabled={sending || !body.trim()}
            aria-label="Send message"
          >
            {sending ? (
              <span className="crm-spinner crm-spinner--sm" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 6-12 6V9l8-1-8-1V2z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
        {body.length > 0 && (
          <div className="crm-sms-compose-meta">
            {charCount} char{charCount !== 1 ? 's' : ''} · {segments} segment{segments !== 1 ? 's' : ''}
            {charCount > 160 && <span className="crm-sms-multi-segment">Multi-segment</span>}
          </div>
        )}
      </div>
    </div>
  );
}
