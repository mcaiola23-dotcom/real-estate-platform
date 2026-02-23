'use client';

import DOMPurify from 'dompurify';
import { useEffect, useState, useCallback } from 'react';

interface ThreadSummary {
  id: string;
  subject: string;
  snippet: string;
  lastMessageDate: string;
  messageCount: number;
  isUnread: boolean;
}

interface ThreadMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  isHtml: boolean;
}

interface GmailThreadsProps {
  email: string;
  onReply: (threadId: string, subject: string) => void;
  onClose: () => void;
}

export function GmailThreads({ email, onReply, onClose }: GmailThreadsProps) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/integrations/google/gmail/threads?email=${encodeURIComponent(email)}&limit=15`, {
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to fetch'))))
      .then((data) => {
        if (!cancelled) {
          setThreads(data.threads ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load email threads.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [email]);

  const openThread = useCallback(async (threadId: string) => {
    setSelectedThread(threadId);
    setLoadingThread(true);
    setMessages([]);

    try {
      const res = await fetch(`/api/integrations/google/gmail/threads/${threadId}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages ?? []);
      }
    } catch {
      // Thread load failure — show empty
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const extractName = (from: string) => {
    const match = from.match(/^(.+?)\s*<.*>$/);
    return match?.[1]?.replace(/"/g, '') ?? from.split('@')[0] ?? from;
  };

  if (loading) {
    return (
      <div className="crm-gmail-threads">
        <div className="crm-gmail-threads-header">
          <strong>Email History</strong>
          <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close threads">✕</button>
        </div>
        <p className="crm-muted">Loading email threads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crm-gmail-threads">
        <div className="crm-gmail-threads-header">
          <strong>Email History</strong>
          <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close threads">✕</button>
        </div>
        <p className="crm-integration-error">{error}</p>
      </div>
    );
  }

  // Thread detail view
  if (selectedThread) {
    const thread = threads.find((t) => t.id === selectedThread);
    return (
      <div className="crm-gmail-threads">
        <div className="crm-gmail-threads-header">
          <button
            type="button"
            className="crm-secondary-button"
            onClick={() => { setSelectedThread(null); setMessages([]); }}
          >
            ← Back
          </button>
          <strong className="crm-gmail-thread-subject">{thread?.subject ?? 'Thread'}</strong>
          <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close threads">✕</button>
        </div>

        {loadingThread ? (
          <p className="crm-muted">Loading messages...</p>
        ) : (
          <div className="crm-gmail-messages">
            {messages.map((msg) => (
              <div key={msg.id} className="crm-gmail-message">
                <div className="crm-gmail-message-header">
                  <strong>{extractName(msg.from)}</strong>
                  <span className="crm-muted">{formatDate(msg.date)}</span>
                </div>
                <div
                  className="crm-gmail-message-body"
                  dangerouslySetInnerHTML={msg.isHtml ? { __html: DOMPurify.sanitize(msg.body) } : undefined}
                >
                  {msg.isHtml ? undefined : msg.body}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="crm-secondary-button"
          onClick={() => onReply(selectedThread, thread?.subject ?? '')}
        >
          Reply
        </button>
      </div>
    );
  }

  // Thread list view
  return (
    <div className="crm-gmail-threads">
      <div className="crm-gmail-threads-header">
        <strong>Email History with {email}</strong>
        <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close threads">✕</button>
      </div>

      {threads.length === 0 ? (
        <p className="crm-muted">No email history found with {email}.</p>
      ) : (
        <div className="crm-gmail-thread-list">
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className={`crm-gmail-thread-item ${thread.isUnread ? 'crm-gmail-thread-unread' : ''}`}
              onClick={() => openThread(thread.id)}
            >
              <div className="crm-gmail-thread-item-top">
                <span className="crm-gmail-thread-subject-line">{thread.subject}</span>
                <span className="crm-gmail-thread-date">{formatDate(thread.lastMessageDate)}</span>
              </div>
              <p className="crm-gmail-thread-snippet">{thread.snippet}</p>
              <span className="crm-muted">{thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
