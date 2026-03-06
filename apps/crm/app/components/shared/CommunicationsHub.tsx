'use client';

import { useState, useCallback, useMemo, type ReactNode } from 'react';
import type { CrmActivity, CrmContact, CrmLead } from '@real-estate/types/crm';
import { formatTimeAgo } from '../../lib/crm-formatters';
import { ContactHistoryLog } from '../leads/ContactHistoryLog';
import { TemplateLibrary } from './TemplateLibrary';
import { AiDraftComposer } from './AiDraftComposer';
import { GmailThreads } from './GmailThreads';
import { ConversationInsights } from '../leads/ConversationInsights';
import { useCommunicationModals } from '../../lib/communication-modal-context';
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
  twilioConnected: boolean | null;
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
  sms_sent: 'text',
  sms_received: 'text',
  call_logged: 'phone',
  call_initiated: 'phone',
};

const CONTACT_ACTIVITY_TYPES = new Set([
  'call_logged', 'call_initiated',
  'text_logged', 'sms_sent', 'sms_received',
  'email_logged', 'email_sent',
]);

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
  if (type === 'call_logged' || type === 'call_initiated') return PhoneIcon;
  if (type === 'text_logged' || type === 'sms_sent' || type === 'sms_received') return MessageIcon;
  return EnvelopeIcon;
}

function getChannelLabel(type: string) {
  if (type === 'call_logged') return 'Call';
  if (type === 'call_initiated') return 'Call (Twilio)';
  if (type === 'text_logged') return 'Text';
  if (type === 'sms_sent') return 'SMS sent';
  if (type === 'sms_received') return 'SMS received';
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
  twilioConnected,
  mergeContext,
  onLogContact,
  onApplyInsights,
}: CommunicationsHubProps) {
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [activeComposer, setActiveComposer] = useState<ActiveComposer>('none');
  const [draftForEmail, setDraftForEmail] = useState<{ subject: string; body: string } | null>(null);
  const [callInProgress, setCallInProgress] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const { openEmailComposer, openSmsConversation } = useCommunicationModals();

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
      openEmailComposer({
        to: activeContact.email,
        leadId: lead.id,
        contactName: activeContact.fullName ?? undefined,
        propertyAddress: lead.listingAddress ?? undefined,
        initialSubject: data.subject || '',
        initialBody: data.body,
      });
      setActiveComposer('none');
    } else if (data.channel === 'sms' && activeContact?.phone && twilioConnected) {
      openSmsConversation({
        to: activeContact.phone,
        leadId: lead.id,
        contactId: activeContact.id,
        contactName: activeContact.fullName ?? undefined,
        initialBody: data.body,
      });
      setActiveComposer('none');
    } else {
      void navigator.clipboard.writeText(data.body);
      setActiveComposer('none');
    }
  }, [activeContact?.email, activeContact?.phone, activeContact?.fullName, activeContact?.id, twilioConnected, lead.id, lead.listingAddress, openEmailComposer, openSmsConversation]);

  const handleAiSend = useCallback((data: { channel: string; subject: string; body: string }) => {
    if (data.channel === 'email' && activeContact?.email) {
      // Open email popup with AI-drafted content
      openEmailComposer({
        to: activeContact.email,
        leadId: lead.id,
        contactName: activeContact.fullName ?? undefined,
        propertyAddress: lead.listingAddress ?? undefined,
        initialSubject: data.subject,
        initialBody: data.body,
      });
      setActiveComposer('none');
      void onLogContact('email_sent', 'AI-drafted email composed');
    } else if (data.channel === 'sms' && activeContact?.phone && twilioConnected) {
      // Open SMS popup with AI-drafted content
      openSmsConversation({
        to: activeContact.phone,
        leadId: lead.id,
        contactId: activeContact.id,
        contactName: activeContact.fullName ?? undefined,
        initialBody: data.body,
      });
      setActiveComposer('none');
    } else {
      void onLogContact('text_logged', 'AI-drafted message copied');
      setActiveComposer('none');
    }
  }, [activeContact?.email, activeContact?.phone, activeContact?.fullName, activeContact?.id, twilioConnected, onLogContact, lead.id, lead.listingAddress, openEmailComposer, openSmsConversation]);

  const handleClickToCall = useCallback(async () => {
    if (!activeContact?.phone) return;
    setCallInProgress(true);
    try {
      const res = await fetch('/api/integrations/twilio/voice/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: activeContact.phone,
          leadId: lead.id,
          contactId: activeContact.id,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error('[Click-to-Call] Error:', data.error);
      }
    } catch (err) {
      console.error('[Click-to-Call] Network error:', err);
    } finally {
      setCallInProgress(false);
    }
  }, [activeContact?.phone, activeContact?.id, lead.id]);

  const handleReply = useCallback((threadId: string, subject: string) => {
    if (!activeContact?.email) return;
    openEmailComposer({
      to: activeContact.email,
      leadId: lead.id,
      contactName: activeContact.fullName ?? undefined,
      propertyAddress: lead.listingAddress ?? undefined,
      replyToMessageId: threadId,
      initialSubject: subject,
    });
  }, [activeContact, lead.id, lead.listingAddress, openEmailComposer]);

  // Open email in popup via modal context
  const handleOpenEmail = useCallback(() => {
    if (!activeContact?.email) return;
    openEmailComposer({
      to: activeContact.email,
      leadId: lead.id,
      contactName: activeContact.fullName ?? undefined,
      propertyAddress: lead.listingAddress ?? undefined,
      initialSubject: draftForEmail?.subject,
      initialBody: draftForEmail?.body,
    });
    setDraftForEmail(null);
  }, [activeContact, lead.id, lead.listingAddress, draftForEmail, openEmailComposer]);

  // Open SMS in popup via modal context
  const handleOpenSms = useCallback(() => {
    if (!activeContact?.phone) return;
    openSmsConversation({
      to: activeContact.phone,
      leadId: lead.id,
      contactId: activeContact.id,
      contactName: activeContact.fullName ?? undefined,
    });
  }, [activeContact, lead.id, openSmsConversation]);

  return (
    <div className="crm-comm-hub">
      {/* ── Channel Filter Tabs with inline status dots ── */}
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
        <div className="crm-comm-hub__status-dots">
          <span className={`crm-comm-hub__status-dot ${googleConnected ? 'crm-comm-hub__status-dot--ok' : googleConnected === false ? 'crm-comm-hub__status-dot--off' : ''}`}>
            <svg viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="crm-comm-hub__status-tooltip">
              {googleConnected ? 'Gmail connected' : googleConnected === false ? 'Gmail not connected' : 'Checking Gmail...'}
            </span>
          </span>
          <span className={`crm-comm-hub__status-dot ${twilioConnected ? 'crm-comm-hub__status-dot--ok' : twilioConnected === false ? 'crm-comm-hub__status-dot--off' : ''}`}>
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M6 3H4.5A1.5 1.5 0 003 4.5v1A8.5 8.5 0 0010.5 14h1a1.5 1.5 0 001.5-1.5V11l-2.5-1.5L9 11a5 5 0 01-4-4l1.5-1.5L5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="crm-comm-hub__status-tooltip">
              {twilioConnected ? 'Twilio connected' : twilioConnected === false ? 'Twilio not configured' : 'Checking Twilio...'}
            </span>
          </span>
        </div>
      </div>

      {/* ── Unified Timeline ── */}
      <div className="crm-comm-hub__timeline">
        {contactActivities.length > 0 ? (
          <ul className="crm-comm-hub__timeline-list">
            {contactActivities.map((a) => {
              const isExpanded = expandedEntryId === a.id;
              return (
                <li key={a.id} className={`crm-comm-hub__timeline-entry ${isExpanded ? 'crm-comm-hub__timeline-entry--expanded' : ''}`}>
                  <span className="crm-comm-hub__timeline-icon">{getTimelineIcon(a.activityType)}</span>
                  <div className="crm-comm-hub__timeline-content">
                    <button
                      type="button"
                      className="crm-comm-hub__timeline-header crm-comm-hub__timeline-header--clickable"
                      onClick={() => setExpandedEntryId(isExpanded ? null : a.id)}
                    >
                      <span className="crm-comm-hub__timeline-channel">{getChannelLabel(a.activityType)}</span>
                      <span className="crm-comm-hub__timeline-time">{formatTimeAgo(a.occurredAt)}</span>
                      <svg
                        width="10" height="10" viewBox="0 0 16 16" fill="none"
                        className={`crm-comm-hub__timeline-chevron ${isExpanded ? 'crm-comm-hub__timeline-chevron--open' : ''}`}
                      >
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <p className="crm-comm-hub__timeline-summary">{a.summary}</p>
                    {isExpanded && (
                      <div className="crm-comm-hub__timeline-detail">
                        <ConversationInsights
                          text={a.summary}
                          leadId={lead.id}
                          tenantId={lead.tenantId}
                          onApplyInsights={onApplyInsights}
                        />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="crm-muted crm-comm-hub__empty">
            {channelFilter === 'all'
              ? 'No communication history yet. Use the actions below to get started.'
              : `No ${channelFilter} communications yet.`}
          </p>
        )}
      </div>

      {/* ── Sticky Compose Bar (centered) ── */}
      <div className="crm-comm-hub__compose-bar">
        {/* Reach Out group */}
        <div className="crm-comm-hub__compose-group">
          {activeContact?.email && (
            <button
              type="button"
              className="crm-comm-hub__compose-btn"
              onClick={handleOpenEmail}
              title="Compose email"
            >
              {EnvelopeIcon}
              <span>Email</span>
            </button>
          )}
          {activeContact?.phone && twilioConnected && (
            <button
              type="button"
              className="crm-comm-hub__compose-btn"
              onClick={handleOpenSms}
              title="Send SMS"
            >
              {MessageIcon}
              <span>SMS</span>
            </button>
          )}
          {activeContact?.phone && twilioConnected && (
            <button
              type="button"
              className={`crm-comm-hub__compose-btn ${callInProgress ? 'is-active' : ''}`}
              onClick={() => void handleClickToCall()}
              disabled={callInProgress}
              title="Click to call"
            >
              {PhoneIcon}
              <span>{callInProgress ? 'Calling...' : 'Call'}</span>
            </button>
          )}
        </div>

        <span className="crm-comm-hub__compose-divider" />

        {/* Assist group */}
        <div className="crm-comm-hub__compose-group">
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
        </div>

        <span className="crm-comm-hub__compose-divider" />

        {/* History group */}
        <div className="crm-comm-hub__compose-group">
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
        </div>
      </div>

      {/* ── Active Composer Panel (inline panels only — SMS/Email use popups) ── */}
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
