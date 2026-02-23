'use client';

import { useEffect } from 'react';
import type { CrmActivity, CrmContact, CrmLead } from '@real-estate/types/crm';
import { useCrmStore } from './use-crm-store';

/**
 * Fetches all CRM workspace data (leads, contacts, activities) and
 * hydrates the Zustand store. Uses stale-while-revalidate semantics:
 * data loads on mount and refreshes are triggered via `refetch`.
 *
 * This replaces the old `loadWorkspace()` callback in crm-workspace.tsx.
 */
export function useWorkspaceData() {
  const setLeads = useCrmStore((s) => s.setLeads);
  const setContacts = useCrmStore((s) => s.setContacts);
  const setActivities = useCrmStore((s) => s.setActivities);
  const updateSummary = useCrmStore((s) => s.updateSummary);
  const setLoading = useCrmStore((s) => s.setLoading);
  const setError = useCrmStore((s) => s.setError);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [leadsRes, contactsRes, activitiesRes] = await Promise.all([
          fetch('/api/leads?limit=200', { cache: 'no-store' }),
          fetch('/api/contacts?limit=200', { cache: 'no-store' }),
          fetch('/api/activities?limit=200', { cache: 'no-store' }),
        ]);

        if (!leadsRes.ok || !contactsRes.ok || !activitiesRes.ok) {
          throw new Error('Failed to load CRM workspace data.');
        }

        const leadsJson = (await leadsRes.json()) as { leads: CrmLead[] };
        const contactsJson = (await contactsRes.json()) as { contacts: CrmContact[] };
        const activitiesJson = (await activitiesRes.json()) as { activities: CrmActivity[] };

        if (cancelled) return;

        setLeads(leadsJson.leads);
        setContacts(contactsJson.contacts);
        setActivities(activitiesJson.activities);
        updateSummary({
          leadCount: leadsJson.leads.length,
          contactCount: contactsJson.contacts.length,
          activityCount: activitiesJson.activities.length,
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unknown CRM load error.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [setLeads, setContacts, setActivities, updateSummary, setLoading, setError]);
}

/**
 * Fetches a single lead by ID and updates it in the store.
 * Used when opening lead profile modals for fresh data.
 */
export async function refreshLead(leadId: string) {
  const { replaceLeadById } = useCrmStore.getState();

  try {
    const response = await fetch(`/api/leads/${leadId}`, { cache: 'no-store' });
    if (!response.ok) return;

    const json = (await response.json()) as { lead?: CrmLead };
    if (json.lead) {
      replaceLeadById(leadId, json.lead);
    }
  } catch {
    // Keep existing local data on failure.
  }
}
