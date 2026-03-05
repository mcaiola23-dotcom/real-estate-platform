'use client';

import { useState, useCallback, useMemo, type ReactNode } from 'react';
import type { CrmActivity, CrmContact, CrmLead } from '@real-estate/types/crm';
import { formatTimeAgo } from '../../lib/crm-formatters';
import { ContactHistoryLog } from '../leads/ContactHistoryLog';
import { TemplateLibrary } from './TemplateLibrary';
import { AiDraftComposer } from './AiDraftComposer';
import { GmailComposer } from './GmailComposer';
import { GmailThreads } from './GmailThreads';
import type { MergeFieldContext } from '../../lib/crm-templates';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChannelFilter = 'all' | 'email' | 'text' | 'phone';
type ActiveComposer = 'none' | 'email' | 'ai' | 'templates' | 'threads' | 'log';

interface ExtractedInsight {
  category: string;
  value: string;
  confidence: number;
}

interface CommunicationsHubProps {
  lead: CrmLead;
  activeContact: CrmContact | null;
  activities: CrmActivity[];
  googleConnected: boolean | null;
  mergeContext: MergeFieldContext;
  onLogContact: (activityType: string, summary: string) => Promise<void>;
  onApplyInsights: (insights: ExtractedInsight[]) => void;
}

// ---------------------------------------------------------------------------
// Channel filter config
// ---------------------------------------------------------------------------

const CHANNEL_FILTERS: { value: ChannelFilter; label: string; icon: ReactNode }[] = [
  {
    value: 'all',
    label: 'All',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    value: 'email',
    label: 'Email',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'text',
    label: 'Text',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 3h11A1.5 1.5 0 0115 4.5v6a1.5 1.5 0 01-1.5 1.5H5L2 14.5V4.5A1.5 1.5 0 013.5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'phone',
    label: 'Phone',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M6 3H4.5A1.5 1.5 0 003 4.5v1A8.5 8.5 0 0010.5 14h1a1.5 1.5 0 001.5-1.5V11l-2.5-1.5L9 11a5 5 0 01-4-4l1.5-1.5L5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const ACTIVITY_CHANNEL_MAP: Record<string, ChannelFilter> = {
  email_sent: 'email',
  email_logged: 'email',
  text_logged: 'text',
  call_logged: 'phone',
};

const CONTACT_ACTIVITY_TYPES = new Set(['call_logged', 'text_logged', 'email_logged', 'email_sent']);

// ---------------------------------------------------------------------------
// SVG icons for timeline entries
// ---------------------------------------------------------------------------

const PhoneIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M6 3H4.5A1.5 1.5 0 003 4.5v1A8.5 8.5 0 0010.5 14h1a1.5 1.5 0 001.5-1.5V11l-2.5-1.5L9 11a5 5 0 01-4-4l1.5-1.5L5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MessageIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 3h11A1.5 1.5 0 0115 4.5v6a1.5 1.5 0 01-1.5 1.5H5L2 14.5V4.5A1.5 1.5 0 013.5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EnvelopeIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function getTimelineIcon(type: string) {
  if (type === 'call_logged') return PhoneIcon;
  if (type === 'text_logged') return MessageIcon;
  return EnvelopeIcon;
}

function getChannelLabel(type: string) {
  if (type === 'call_logged') return 'Call';
  if (type === 'text_logged') return 'Text';
  if (type === 'email_sent') return 'Email sent';
  if (type === 'email_logged') return 'Email';
  return type;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunicationsHub({
  lead,
  activeContact,
  activities,
  googleConnected,
  mergeContext,
  onLogContact,
  onApplyInsights,
}: CommunicationsHubProps) {
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [activeComposer, setActiveComposer] = useState<ActiveComposer>('none');
  const [replyContext, setReplyContext] = useState<{ threadId: string; subject: string } | null>(null);
  const [draftForEmail, setDraftForEmail] = useState<{ subject: string; body: string } | null>(null);

  // Filter communication activities
  const contactActivities = useMemo(() => {
    const filtered = activities.filter((a) =>
      CONTACT_ACTIVITY_TYPES.has(a.activityType) &&
      (a.leadId === lead.id || a.contactId === activeContact?.id)
    );

    if (channelFilter === 'all') return filtered;
    return filtered.filter((a) => ACTIVITY_CHANNEL_MAP[a.activityType] === channelFilter);
  }, [activities, lead.id, activeContact?.id, channelFilter]);

  // Count activities per channel for filter badges
  const channelCounts = useMemo(() => {
    const allActivities = activities.filter((a) =>
      CONTACT_ACTIVITY_TYPES.has(a.activityType) &&
      (a.leadId === lead.id || a.contactId === activeContact?.id)
    );
    const counts: Record<ChannelFilter, number> = { all: allActivities.length, email: 0, text: 0, phone: 0 };
    for (const a of allActivities) {
      const ch = ACTIVITY_CHANNEL_MAP[a.activityType];
      if (ch) counts[ch]++;
    }
    return counts;
  }, [activities, lead.id, activeContact?.id]);

  const toggleComposer = useCallback((composer: ActiveComposer) => {
    setActiveComposer((prev) => prev === composer ? 'none' : composer);
  }, []);

  const handleTemplateUse = useCallback((data: { subject: string | null; body: string; channel: string }) => {
    if (data.channel === 'email' && activeContact?.email) {
      // Route through Gmail composer with pre-filled content
      setDraftForEmail({ subject: data.subject || '', body: data.body });
      setActiveComposer('email');
    } else {
      void navigator.clipboard.writeText(data.body);
      setActiveComposer('none');
    }
  }, [activeContact?.email]);

  const handleAiSend = useCallback((data: { channel: string; subject: string; body: string }) => {
    if (data.channel === 'email' && activeContact?.email) {
      // Route through Gmail composer
      setDraftForEmail({ subject: data.subject, body: data.body });
      setActiveComposer('email');
      void onLogContact('email_sent', 'AI-drafted email composed');
    } else {
      void onLogContact('text_logged', 'AI-drafted message copied');
      setActiveComposer('none');
    }
  }, [activeContact?.email, onLogContact]);

  const handleGmailSent = useCallback(() => {
    setActiveComposer('none');
    setReplyContext(null);
    setDraftForEmail(null);
    void onLogContact('email_sent', `Email sent to ${activeContact?.email ?? 'contact'}`);
  }, [onLogContact, activeContact?.email]);

  const handleReply = useCallback((threadId: string, subject: string) => {
    setReplyContext({ threadId, subject });
    setDraftForEmail(null);
    setActiveComposer('email');
  }, []);

  return (
    <div className="crm-comm-hub">
      {/* ── Integration Status Bar ── */}
      <div className="crm-comm-hub__status-bar">
        <div className="crm-comm-hub__status-item">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Gmail</span>
          {googleConnected ? (
            <span className="crm-comm-hub__status-badge crm-comm-hub__status-badge--connected">Connected</span>
          ) : googleConnected === false ? (
            <button
              type="button"
              className="crm-comm-hub__status-badge crm-comm-hub__status-badge--connect"
              onClick={async () => {
                try {
                  const res = await fetch('/api/integrations/google/connect');
                  const data = await res.json();
                  if (data.ok && data.authUrl) {
                    window.location.href = data.authUrl;
                  }
                } catch { /* silent */ }
              }}
            >
              Connect
            </button>
          ) : (
            <span className="crm-comm-hub__status-badge crm-comm-hub__status-badge--checking">...</span>
          )}
        </div>
        <div className="crm-comm-hub__status-item">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 3h11A1.5 1.5 0 0115 4.5v6a1.5 1.5 0 01-1.5 1.5H5L2 14.5V4.5A1.5 1.5 0 013.5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Twilio</span>
          <span className="crm-comm-hub__status-badge crm-comm-hub__status-badge--unavailable" title="Coming soon">—</span>
        </div>
      </div>

      {/* ── Channel Filter Tabs ── */}
      <div className="crm-comm-hub__filters">
        {CHANNEL_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`crm-comm-hub__filter-btn ${channelFilter === f.value ? 'is-active' : ''}`}
            onClick={() => setChannelFilter(f.value)}
          >
            {f.icon}
            <span>{f.label}</span>
            {channelCounts[f.value] > 0 && (
              <span className="crm-comm-hub__filter-count">{channelCounts[f.value]}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Unified Timeline ── */}
      <div className="crm-comm-hub__timeline">
        {contactActivities.length > 0 ? (
          <ul className="crm-comm-hub__timeline-list">
            {contactActivities.map((a) => (
              <li key={a.id} className="crm-comm-hub__timeline-entry">
                <span className="crm-comm-hub__timeline-icon">{getTimelineIcon(a.activityType)}</span>
                <div className="crm-comm-hub__timeline-content">
                  <div className="crm-comm-hub__timeline-header">
                    <span className="crm-comm-hub__timeline-channel">{getChannelLabel(a.activityType)}</span>
                    <span className="crm-comm-hub__timeline-time">{formatTimeAgo(a.occurredAt)}</span>
                  </div>
                  <p className="crm-comm-hub__timeline-summary">{a.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="crm-muted crm-comm-hub__empty">
            {channelFilter === 'all'
              ? 'No communication history yet. Use the compose bar below to get started.'
              : `No ${channelFilter} communications yet.`}
          </p>
        )}
      </div>

      {/* ── Compose Bar ── */}
      <div className="crm-comm-hub__compose-bar">
        <button
          type="button"
          className={`crm-comm-hub__compose-btn ${activeComposer === 'log' ? 'is-active' : ''}`}
          onClick={() => toggleComposer('log')}
          title="Log a contact"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Log</span>
        </button>
        {activeContact?.email && (
          <button
            type="button"
            className={`crm-comm-hub__compose-btn ${activeComposer === 'email' ? 'is-active' : ''}`}
            onClick={() => { setDraftForEmail(null); toggleComposer('email'); }}
            title="Compose email"
          >
            {EnvelopeIcon}
            <span>Email</span>
          </button>
        )}
        <button
          type="button"
          className={`crm-comm-hub__compose-btn ${activeComposer === 'ai' ? 'is-active' : ''}`}
          onClick={() => toggleComposer('ai')}
          title="Draft with AI"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" opacity="0.7" />
          </svg>
          <span>AI Draft</span>
        </button>
        <button
          type="button"
          className={`crm-comm-hub__compose-btn ${activeComposer === 'templates' ? 'is-active' : ''}`}
          onClick={() => toggleComposer('templates')}
          title="Message templates"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          </svg>
          <span>Templates</span>
        </button>
        {activeContact?.email && googleConnected && (
          <button
            type="button"
            className={`crm-comm-hub__compose-btn ${activeComposer === 'threads' ? 'is-active' : ''}`}
            onClick={() => toggleComposer('threads')}
            title="Email history"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 9h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            </svg>
            <span>Threads</span>
          </button>
        )}
      </div>

      {/* ── Active Composer Panel ── */}
      {activeComposer === 'log' && (
        <ContactHistoryLog
          leadId={lead.id}
          tenantId={lead.tenantId}
          contactId={lead.contactId}
          activities={activities}
          onLogContact={onLogContact}
          onApplyInsights={onApplyInsights}
        />
      )}

      {activeComposer === 'templates' && (
        <TemplateLibrary
          mergeContext={mergeContext}
          tenantId={lead.tenantId}
          leadId={lead.id}
          onUseTemplate={handleTemplateUse}
          onClose={() => setActiveComposer('none')}
        />
      )}

      {activeComposer === 'ai' && (
        <AiDraftComposer
          leadId={lead.id}
          tenantId={lead.tenantId}
          contactName={activeContact?.fullName ?? null}
          contactEmail={activeContact?.email ?? null}
          contactPhone={activeContact?.phone ?? null}
          propertyAddress={lead.listingAddress}
          onClose={() => setActiveComposer('none')}
          onSend={handleAiSend}
        />
      )}

      {activeComposer === 'email' && activeContact?.email && (
        <GmailComposer
          to={activeContact.email}
          leadId={lead.id}
          contactName={activeContact.fullName ?? undefined}
          propertyAddress={lead.listingAddress ?? undefined}
          googleConnected={googleConnected ?? false}
          replyToMessageId={replyContext?.threadId}
          initialSubject={draftForEmail?.subject ?? replyContext?.subject}
          initialBody={draftForEmail?.body}
          onClose={() => { setActiveComposer('none'); setReplyContext(null); setDraftForEmail(null); }}
          onSent={handleGmailSent}
        />
      )}

      {activeComposer === 'threads' && activeContact?.email && googleConnected && (
        <GmailThreads
          email={activeContact.email}
          onReply={handleReply}
          onClose={() => setActiveComposer('none')}
        />
      )}
    </div>
  );
}
