'use client';

import DOMPurify from 'dompurify';
import { useEffect, useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function extractName(from: string) {
  const match = from.match(/^(.+?)\s*<.*>$/);
  return match?.[1]?.replace(/"/g, '') ?? from.split('@')[0] ?? from;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 15;

export function GmailThreads({ email, onReply, onClose }: GmailThreadsProps) {
  // Thread list state
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  // Thread detail state
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set());

  // Inline reply state
  const [replyBody, setReplyBody] = useState('');
  const [replySending, setReplySending] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  // Fetch thread list
  const fetchThreads = useCallback(async (pageNum: number, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const limit = PAGE_SIZE;
      const offset = (pageNum - 1) * PAGE_SIZE;
      const res = await fetch(
        `/api/integrations/google/gmail/threads?email=${encodeURIComponent(email)}&limit=${limit}&offset=${offset}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const fetched: ThreadSummary[] = data.threads ?? [];

      if (append) {
        setThreads((prev) => [...prev, ...fetched]);
      } else {
        setThreads(fetched);
      }
      setHasMore(fetched.length >= PAGE_SIZE);
    } catch {
      setError('Failed to load email threads.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [email]);

  useEffect(() => {
    void fetchThreads(1);
  }, [fetchThreads]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    void fetchThreads(nextPage, true);
  }, [page, fetchThreads]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    void fetchThreads(1);
  }, [fetchThreads]);

  // Open thread detail
  const openThread = useCallback(async (threadId: string) => {
    setSelectedThread(threadId);
    setLoadingThread(true);
    setThreadError(null);
    setMessages([]);
    setReplyBody('');
    setCollapsedMessages(new Set());

    try {
      const res = await fetch(`/api/integrations/google/gmail/threads/${threadId}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to load thread');
      const data = await res.json();
      if (data.ok) {
        const msgs: ThreadMessage[] = data.messages ?? [];
        setMessages(msgs);
        // Auto-collapse all except the last 2 messages
        if (msgs.length > 2) {
          const toCollapse = new Set(msgs.slice(0, -2).map((m) => m.id));
          setCollapsedMessages(toCollapse);
        }
      } else {
        setThreadError('Failed to load thread messages.');
      }
    } catch {
      setThreadError('Failed to load thread messages.');
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const toggleCollapse = useCallback((msgId: string) => {
    setCollapsedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  }, []);

  // Inline reply
  const handleInlineReply = useCallback(async () => {
    if (!replyBody.trim() || !selectedThread) return;
    setReplySending(true);
    try {
      // Trigger the parent's reply handler which opens the Gmail composer
      const thread = threads.find((t) => t.id === selectedThread);
      onReply(selectedThread, thread?.subject ?? '');
    } finally {
      setReplySending(false);
    }
  }, [replyBody, selectedThread, threads, onReply]);

  // ── Thread Detail View ──
  if (selectedThread) {
    const thread = threads.find((t) => t.id === selectedThread);
    return (
      <div className="crm-gmail-threads crm-gmail-threads--detail">
        <div className="crm-gmail-threads-header">
          <button
            type="button"
            className="crm-secondary-button crm-gmail-back-btn"
            onClick={() => { setSelectedThread(null); setMessages([]); }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <strong className="crm-gmail-thread-subject">{thread?.subject ?? 'Thread'}</strong>
          <span className="crm-gmail-thread-count">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
          <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close threads">✕</button>
        </div>

        {loadingThread ? (
          <div className="crm-gmail-thread-loading">
            <span className="crm-spinner" />
            <span>Loading messages...</span>
          </div>
        ) : threadError ? (
          <div className="crm-gmail-thread-error">
            <p className="crm-integration-error">{threadError}</p>
            <button
              type="button"
              className="crm-secondary-button"
              onClick={() => void openThread(selectedThread)}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="crm-gmail-messages">
            {messages.map((msg) => {
              const isCollapsed = collapsedMessages.has(msg.id);
              return (
                <div key={msg.id} className={`crm-gmail-message ${isCollapsed ? 'crm-gmail-message--collapsed' : ''}`}>
                  <button
                    type="button"
                    className="crm-gmail-message-header"
                    onClick={() => toggleCollapse(msg.id)}
                  >
                    <div className="crm-gmail-message-header-left">
                      <strong>{extractName(msg.from)}</strong>
                      {isCollapsed && (
                        <span className="crm-gmail-message-preview">
                          {msg.isHtml
                            ? msg.body.replace(/<[^>]*>/g, '').slice(0, 80)
                            : msg.body.slice(0, 80)}
                          ...
                        </span>
                      )}
                    </div>
                    <span className="crm-muted">{formatDate(msg.date)}</span>
                    <svg
                      width="12" height="12" viewBox="0 0 16 16" fill="none"
                      className={`crm-gmail-collapse-icon ${isCollapsed ? '' : 'crm-gmail-collapse-icon--expanded'}`}
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {!isCollapsed && (
                    <div className="crm-gmail-message-body-wrap">
                      <div className="crm-gmail-message-to">
                        <span className="crm-muted">To: {msg.to}</span>
                      </div>
                      <div
                        className="crm-gmail-message-body"
                        dangerouslySetInnerHTML={msg.isHtml ? { __html: DOMPurify.sanitize(msg.body) } : undefined}
                      >
                        {msg.isHtml ? undefined : msg.body}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Inline reply form */}
        {!loadingThread && !threadError && messages.length > 0 && (
          <div className="crm-gmail-inline-reply">
            <textarea
              ref={replyRef}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a reply..."
              rows={3}
              className="crm-gmail-reply-textarea"
            />
            <div className="crm-gmail-reply-actions">
              <button
                type="button"
                className="crm-primary-button"
                disabled={replySending || !replyBody.trim()}
                onClick={() => void handleInlineReply()}
              >
                {replySending ? 'Opening...' : 'Reply'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Thread List View ──
  return (
    <div className="crm-gmail-threads">
      <div className="crm-gmail-threads-header">
        <strong>Email History with {email}</strong>
        <div className="crm-gmail-threads-header-actions">
          <button
            type="button"
            className="crm-btn-icon"
            onClick={handleRefresh}
            title="Refresh threads"
            disabled={loading}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 8a6 6 0 0110.89-3.477M14 8a6 6 0 01-10.89 3.477" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M14 2v4h-4M2 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close threads">✕</button>
        </div>
      </div>

      {loading ? (
        <div className="crm-gmail-thread-loading">
          <span className="crm-spinner" />
          <span>Loading email threads...</span>
        </div>
      ) : error ? (
        <div className="crm-gmail-thread-error">
          <p className="crm-integration-error">{error}</p>
          <button type="button" className="crm-secondary-button" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      ) : threads.length === 0 ? (
        <p className="crm-muted">No email history found with {email}.</p>
      ) : (
        <>
          <div className="crm-gmail-thread-list">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`crm-gmail-thread-item ${thread.isUnread ? 'crm-gmail-thread-unread' : ''}`}
                onClick={() => void openThread(thread.id)}
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

          {hasMore && (
            <button
              type="button"
              className="crm-secondary-button crm-gmail-load-more"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
