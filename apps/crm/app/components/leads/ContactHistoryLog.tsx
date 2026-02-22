'use client';

import { useState } from 'react';
import type { CrmActivity } from '@real-estate/types/crm';
import { formatTimeAgo } from '../../lib/crm-formatters';
import { ConversationInsights } from './ConversationInsights';

const CONTACT_TYPES = [
  { value: 'call_logged', label: 'Call', glyph: '📞' },
  { value: 'text_logged', label: 'Text', glyph: '💬' },
  { value: 'email_logged', label: 'Email', glyph: '✉️' },
] as const;

const CONTACT_ACTIVITY_TYPES = new Set(['call_logged', 'text_logged', 'email_logged']);

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

  const getGlyph = (type: string) => {
    const ct = CONTACT_TYPES.find((t) => t.value === type);
    return ct?.glyph ?? '📌';
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
              {ct.glyph} {ct.label}
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
              <span className="crm-contact-history-glyph">{getGlyph(a.activityType)}</span>
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
