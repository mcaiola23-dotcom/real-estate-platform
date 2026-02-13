'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { CrmActivity, CrmContact, CrmLead, CrmLeadIngestionSummary, CrmLeadStatus } from '@real-estate/types/crm';
import type { TenantContext } from '@real-estate/types/tenant';

interface CrmWorkspaceProps {
  tenantContext: TenantContext;
  hasClerkKey: boolean;
  initialSummary: CrmLeadIngestionSummary;
}

const LEAD_STATUSES: CrmLeadStatus[] = ['new', 'qualified', 'nurturing', 'won', 'lost'];

export function CrmWorkspace({ tenantContext, hasClerkKey, initialSummary }: CrmWorkspaceProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [draftNotesByLead, setDraftNotesByLead] = useState<Record<string, string>>({});
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newActivitySummary, setNewActivitySummary] = useState('');
  const [newActivityLeadId, setNewActivityLeadId] = useState('');
  const [newActivityContactId, setNewActivityContactId] = useState('');

  const leadById = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);
  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [leadsRes, contactsRes, activitiesRes] = await Promise.all([
        fetch('/api/leads?limit=100', { cache: 'no-store' }),
        fetch('/api/contacts?limit=100', { cache: 'no-store' }),
        fetch('/api/activities?limit=100', { cache: 'no-store' }),
      ]);

      if (!leadsRes.ok || !contactsRes.ok || !activitiesRes.ok) {
        throw new Error('Failed to load CRM workspace data.');
      }

      const leadsJson = (await leadsRes.json()) as { leads: CrmLead[] };
      const contactsJson = (await contactsRes.json()) as { contacts: CrmContact[] };
      const activitiesJson = (await activitiesRes.json()) as { activities: CrmActivity[] };

      setLeads(leadsJson.leads);
      setContacts(contactsJson.contacts);
      setActivities(activitiesJson.activities);
      setSummary((prev) => ({
        ...prev,
        leadCount: leadsJson.leads.length,
        contactCount: contactsJson.contacts.length,
        activityCount: activitiesJson.activities.length,
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown CRM load error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  async function updateLeadStatus(leadId: string, status: CrmLeadStatus) {
    setIsMutating(true);
    setError(null);

    const notes = draftNotesByLead[leadId];

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: notes ?? undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Lead update failed.');
      }

      setDraftNotesByLead((prev) => {
        const next = { ...prev };
        delete next[leadId];
        return next;
      });

      await loadWorkspace();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unknown lead update error.');
    } finally {
      setIsMutating(false);
    }
  }

  async function createContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsMutating(true);
    setError(null);

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newContactName,
          email: newContactEmail,
          phone: newContactPhone,
        }),
      });

      if (!response.ok) {
        throw new Error('Contact create failed.');
      }

      setNewContactName('');
      setNewContactEmail('');
      setNewContactPhone('');
      await loadWorkspace();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unknown contact create error.');
    } finally {
      setIsMutating(false);
    }
  }

  async function createActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsMutating(true);
    setError(null);

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: 'note',
          summary: newActivitySummary,
          leadId: newActivityLeadId || undefined,
          contactId: newActivityContactId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Activity create failed.');
      }

      setNewActivitySummary('');
      setNewActivityLeadId('');
      setNewActivityContactId('');
      await loadWorkspace();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unknown activity create error.');
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div className="crm-shell">
      <h1>CRM Workspace</h1>
      <p className="crm-muted">Tenant-scoped CRM entry point with Clerk middleware protection.</p>

      <p>
        Tenant: <span className="crm-chip">{tenantContext.tenantId}</span>{' '}
        <span className="crm-chip">{tenantContext.tenantSlug}</span>{' '}
        <span className="crm-chip">{tenantContext.tenantDomain}</span>{' '}
        <span className="crm-chip">{tenantContext.source}</span>
      </p>

      {hasClerkKey ? (
        <p className="crm-accent">Auth integration active via Clerk middleware and session API.</p>
      ) : (
        <p className="crm-muted">
          Clerk publishable key is not set. Configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to enable sign-in UI.
        </p>
      )}

      <div className="crm-stats">
        <div className="crm-stat-card">
          <span className="crm-muted">Contacts</span>
          <strong>{summary.contactCount}</strong>
        </div>
        <div className="crm-stat-card">
          <span className="crm-muted">Leads</span>
          <strong>{summary.leadCount}</strong>
        </div>
        <div className="crm-stat-card">
          <span className="crm-muted">Activities</span>
          <strong>{summary.activityCount}</strong>
        </div>
      </div>

      {error ? <p className="crm-error">{error}</p> : null}
      {loading ? <p className="crm-muted">Loading CRM data...</p> : null}

      <section className="crm-section">
        <h2>Leads</h2>
        {leads.length === 0 ? (
          <p className="crm-muted">No tenant-scoped leads yet.</p>
        ) : (
          <div className="crm-grid-list">
            {leads.map((lead) => (
              <article key={lead.id} className="crm-card">
                <p>
                  <span className="crm-chip">{lead.leadType}</span> <span className="crm-chip">{lead.source}</span>
                </p>
                <p>
                  <strong>{lead.listingAddress || 'No address provided'}</strong>
                </p>
                <p className="crm-muted">
                  Contact:{' '}
                  {lead.contactId ? contactById.get(lead.contactId)?.fullName || contactById.get(lead.contactId)?.email : 'None'}
                </p>
                <label className="crm-field">
                  Status
                  <select
                    disabled={isMutating}
                    value={lead.status}
                    onChange={(event) => {
                      void updateLeadStatus(lead.id, event.target.value as CrmLeadStatus);
                    }}
                  >
                    {LEAD_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="crm-field">
                  Notes
                  <textarea
                    value={draftNotesByLead[lead.id] ?? lead.notes ?? ''}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDraftNotesByLead((prev) => ({ ...prev, [lead.id]: value }));
                    }}
                  />
                </label>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => {
                    void updateLeadStatus(lead.id, lead.status);
                  }}
                >
                  Save Lead
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="crm-section">
        <h2>Contacts</h2>
        <form className="crm-form" onSubmit={createContact}>
          <label className="crm-field">
            Full Name
            <input value={newContactName} onChange={(event) => setNewContactName(event.target.value)} />
          </label>
          <label className="crm-field">
            Email
            <input value={newContactEmail} onChange={(event) => setNewContactEmail(event.target.value)} />
          </label>
          <label className="crm-field">
            Phone
            <input value={newContactPhone} onChange={(event) => setNewContactPhone(event.target.value)} />
          </label>
          <button type="submit" disabled={isMutating}>
            Add Contact
          </button>
        </form>
        {contacts.length === 0 ? (
          <p className="crm-muted">No contacts yet.</p>
        ) : (
          <ul className="crm-list">
            {contacts.map((contact) => (
              <li key={contact.id} className="crm-list-item">
                <strong>{contact.fullName || 'Unnamed contact'}</strong>
                <span className="crm-muted">{contact.email || contact.phone || 'No channel captured'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="crm-section">
        <h2>Activity Timeline</h2>
        <form className="crm-form" onSubmit={createActivity}>
          <label className="crm-field">
            Summary
            <input
              value={newActivitySummary}
              onChange={(event) => setNewActivitySummary(event.target.value)}
              placeholder="Logged a call with seller..."
              required
            />
          </label>
          <label className="crm-field">
            Lead
            <select value={newActivityLeadId} onChange={(event) => setNewActivityLeadId(event.target.value)}>
              <option value="">None</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.listingAddress || lead.id}
                </option>
              ))}
            </select>
          </label>
          <label className="crm-field">
            Contact
            <select value={newActivityContactId} onChange={(event) => setNewActivityContactId(event.target.value)}>
              <option value="">None</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.fullName || contact.email || contact.id}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={isMutating}>
            Log Note
          </button>
        </form>
        {activities.length === 0 ? (
          <p className="crm-muted">No activity yet.</p>
        ) : (
          <ul className="crm-list">
            {activities.map((activity) => {
              const linkedLead = activity.leadId ? leadById.get(activity.leadId) : null;
              const linkedContact = activity.contactId ? contactById.get(activity.contactId) : null;
              return (
                <li key={activity.id} className="crm-list-item">
                  <span className="crm-chip">{activity.activityType}</span>
                  <strong>{activity.summary}</strong>
                  <span className="crm-muted">
                    {new Date(activity.occurredAt).toLocaleString()} {linkedLead ? `| ${linkedLead.listingAddress || linkedLead.id}` : ''}{' '}
                    {linkedContact ? `| ${linkedContact.fullName || linkedContact.email || linkedContact.id}` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
