'use client';

import { useState } from 'react';
import type { CrmActivity } from '@real-estate/types/crm';
import { formatTimeAgo } from '../../lib/crm-formatters';

const CONTACT_TYPES = [
  { value: 'call_logged', label: 'Call', glyph: '📞' },
  { value: 'text_logged', label: 'Text', glyph: '💬' },
  { value: 'email_logged', label: 'Email', glyph: '✉️' },
] as const;

const CONTACT_ACTIVITY_TYPES = new Set(['call_logged', 'text_logged', 'email_logged']);

interface ContactHistoryLogProps {
  leadId: string;
  contactId: string | null;
  activities: CrmActivity[];
  onLogContact: (activityType: string, summary: string) => Promise<void>;
}

export function ContactHistoryLog({ leadId, contactId, activities, onLogContact }: ContactHistoryLogProps) {
  const [selectedType, setSelectedType] = useState('call_logged');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const contactActivities = activities.filter((a) =>
    CONTACT_ACTIVITY_TYPES.has(a.activityType) && (a.leadId === leadId || a.contactId === contactId)
  );

  const handleSubmit = async () => {
    const summary = notes.trim();
    if (!summary) return;
    setSaving(true);
    try {
      await onLogContact(selectedType, summary);
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
        <button
          type="button"
          className="crm-primary-button"
          disabled={saving || !notes.trim()}
          onClick={handleSubmit}
        >
          {saving ? 'Saving...' : 'Log Contact'}
        </button>
      </div>

      {/* Timeline */}
      {contactActivities.length > 0 ? (
        <ul className="crm-modal-timeline">
          {contactActivities.map((a) => (
            <li key={a.id}>
              <span className="crm-contact-history-glyph">{getGlyph(a.activityType)}</span>
              <div>
                <strong>{a.summary}</strong>
                <p>{formatTimeAgo(a.occurredAt)}</p>
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
