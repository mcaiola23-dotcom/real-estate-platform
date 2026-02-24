'use client';

import { useState, type ReactNode } from 'react';
import type { CrmActivity } from '@real-estate/types/crm';
import { formatTimeAgo } from '../../lib/crm-formatters';
import { ConversationInsights } from './ConversationInsights';

/* SVG icons replacing emoji glyphs */
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

const CONTACT_TYPES: Array<{ value: string; label: string; icon: ReactNode }> = [
  { value: 'call_logged', label: 'Call', icon: PhoneIcon },
  { value: 'text_logged', label: 'Text', icon: MessageIcon },
  { value: 'email_logged', label: 'Email', icon: EnvelopeIcon },
  { value: 'email_sent', label: 'Email Sent', icon: EnvelopeIcon },
];

const CONTACT_ACTIVITY_TYPES = new Set(['call_logged', 'text_logged', 'email_logged', 'email_sent']);

interface ExtractedInsight {
  category: string;
  value: string;
  confidence: number;
}

interface ContactHistoryLogProps {
  leadId: string;
  tenantId: string;
  contactId: string | null;
  activities: CrmActivity[];
  onLogContact: (activityType: string, summary: string) => Promise<void>;
  onApplyInsights?: (insights: ExtractedInsight[]) => void;
}

function getIcon(type: string): ReactNode {
  const ct = CONTACT_TYPES.find((t) => t.value === type);
  return ct?.icon ?? PhoneIcon;
}

export function ContactHistoryLog({ leadId, tenantId, contactId, activities, onLogContact, onApplyInsights }: ContactHistoryLogProps) {
  const [selectedType, setSelectedType] = useState('call_logged');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastLoggedNotes, setLastLoggedNotes] = useState('');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const contactActivities = activities.filter((a) =>
    CONTACT_ACTIVITY_TYPES.has(a.activityType) && (a.leadId === leadId || a.contactId === contactId)
  );

  const handleSubmit = async () => {
    const summary = notes.trim();
    if (!summary) return;
    setSaving(true);
    try {
      await onLogContact(selectedType, summary);
      setLastLoggedNotes(summary);
      setNotes('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="crm-modal-section crm-contact-history">
      <h4>Contact History</h4>

      {/* Log new contact */}
      <div className="crm-contact-log-form">
        <div className="crm-contact-type-selector">
          {CONTACT_TYPES.map((ct) => (
            <button
              key={ct.value}
              type="button"
              className={`crm-sort-toggle ${selectedType === ct.value ? 'is-active' : ''}`}
              onClick={() => setSelectedType(ct.value)}
            >
              <span className="crm-contact-history-glyph">{ct.icon}</span> {ct.label}
            </button>
          ))}
        </div>
        <textarea
          className="crm-contact-log-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes from this contact..."
          rows={2}
        />
        <div className="crm-contact-log-actions">
          <button
            type="button"
            className="crm-primary-button"
            disabled={saving || !notes.trim()}
            onClick={handleSubmit}
          >
            {saving ? 'Saving...' : 'Log Contact'}
          </button>
        </div>

      </div>

      {/* Post-log insight extraction */}
      {lastLoggedNotes && (
        <ConversationInsights
          text={lastLoggedNotes}
          leadId={leadId}
          tenantId={tenantId}
          onApplyInsights={(insights) => {
            onApplyInsights?.(insights);
            setLastLoggedNotes('');
          }}
        />
      )}

      {/* Timeline with per-entry extraction */}
      {contactActivities.length > 0 ? (
        <ul className="crm-modal-timeline">
          {contactActivities.map((a) => (
            <li key={a.id}>
              <span className="crm-contact-history-glyph">{getIcon(a.activityType)}</span>
              <div className="crm-contact-history-entry">
                <div className="crm-contact-history-entry__top">
                  <strong>{a.summary}</strong>
                  <button
                    type="button"
                    className="crm-btn-icon crm-insights-toggle"
                    title="Extract insights from this entry"
                    onClick={() => setExpandedInsight(expandedInsight === a.id ? null : a.id)}
                  >
                    <span className="crm-ai-glyph">◆</span>
                  </button>
                </div>
                <p>{formatTimeAgo(a.occurredAt)}</p>
                {expandedInsight === a.id && (
                  <ConversationInsights
                    text={a.summary}
                    leadId={leadId}
                    tenantId={tenantId}
                    onApplyInsights={onApplyInsights}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="crm-muted">No contact history yet. Log your first call, text, or email above.</p>
      )}
    </div>
  );
}
