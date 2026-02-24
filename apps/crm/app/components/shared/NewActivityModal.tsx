'use client';

import { useState, type FormEvent } from 'react';
import type { CrmContact, CrmLead } from '@real-estate/types/crm';

const ACTIVITY_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Call' },
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'showing', label: 'Showing' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow-up' },
] as const;

interface NewActivityModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { activityType: string; summary: string; leadId?: string; contactId?: string }) => void;
  isMutating: boolean;
  leads: CrmLead[];
  contacts: CrmContact[];
  contactById: Map<string, CrmContact>;
}

export function NewActivityModal({
  open,
  onClose,
  onSubmit,
  isMutating,
  leads,
  contacts,
  contactById,
}: NewActivityModalProps) {
  const [activityType, setActivityType] = useState('note');
  const [summary, setSummary] = useState('');
  const [leadId, setLeadId] = useState('');
  const [contactId, setContactId] = useState('');

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    onSubmit({
      activityType,
      summary: summary.trim(),
      leadId: leadId || undefined,
      contactId: contactId || undefined,
    });
    setSummary('');
    setActivityType('note');
    setLeadId('');
    setContactId('');
  }

  return (
    <>
      <div className="crm-slide-over-overlay" onClick={onClose} />
      <aside className="crm-slide-over" aria-label="New Activity">
        <div className="crm-slide-over__header">
          <h3>Log Activity</h3>
          <button type="button" className="crm-icon-button" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="crm-slide-over__body" onSubmit={handleSubmit}>
          <div className="crm-new-activity-types">
            {ACTIVITY_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`crm-sort-toggle ${activityType === t.value ? 'is-active' : ''}`}
                onClick={() => setActivityType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="crm-field">
            Summary *
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe the activity..."
              rows={3}
              autoFocus
            />
          </label>
          <label className="crm-field">
            Linked Lead
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">None</option>
              {leads.map((lead) => {
                const contact = lead.contactId ? contactById.get(lead.contactId) : undefined;
                const label = contact?.fullName || lead.listingAddress || lead.id.slice(0, 8);
                return <option key={lead.id} value={lead.id}>{label}</option>;
              })}
            </select>
          </label>
          <label className="crm-field">
            Linked Contact
            <select value={contactId} onChange={(e) => setContactId(e.target.value)}>
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName || c.email || c.phone || c.id.slice(0, 8)}</option>
              ))}
            </select>
          </label>
          <div className="crm-slide-over__footer">
            <button type="button" className="crm-secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="crm-primary-button" disabled={!summary.trim() || isMutating}>
              {isMutating ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
