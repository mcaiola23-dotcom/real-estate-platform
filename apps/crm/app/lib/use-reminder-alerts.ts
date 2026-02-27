'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CrmContact, CrmLead } from '@real-estate/types/crm';

export interface ReminderAlert {
  id: string;
  leadId: string;
  leadName: string;
  note: string | null;
  channel: string | null;
  dueAt: string;
  firedAt: number;
}

const STORAGE_KEY_PREFIX = 'crm.reminder-alerts-ack';
const CHECK_INTERVAL_MS = 15_000; // Check every 15 seconds for responsiveness
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

function getAcknowledged(tenantId: string): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}.${tenantId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setAcknowledged(tenantId: string, acked: Record<string, number>) {
  try {
    const now = Date.now();
    const pruned: Record<string, number> = {};
    for (const [k, v] of Object.entries(acked)) {
      if (now - v < DEDUP_WINDOW_MS) {
        pruned[k] = v;
      }
    }
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}.${tenantId}`, JSON.stringify(pruned));
  } catch {
    // ignore
  }
}

export function useReminderAlerts(
  leads: CrmLead[],
  tenantId: string,
  contactById: Map<string, CrmContact>,
  pushNotify?: (leadLabel: string) => void,
) {
  const [activeAlerts, setActiveAlerts] = useState<ReminderAlert[]>([]);
  const ackedRef = useRef<Record<string, number>>(getAcknowledged(tenantId));

  // Use refs so the interval callback always reads the latest values
  // without causing the interval to be torn down and recreated
  const leadsRef = useRef(leads);
  leadsRef.current = leads;
  const contactByIdRef = useRef(contactById);
  contactByIdRef.current = contactById;
  const pushNotifyRef = useRef(pushNotify);
  pushNotifyRef.current = pushNotify;
  const tenantIdRef = useRef(tenantId);
  tenantIdRef.current = tenantId;

  // Stable check function that reads from refs
  const checkReminders = useCallback(() => {
    const now = Date.now();
    const currentLeads = leadsRef.current;
    const newAlerts: ReminderAlert[] = [];

    for (const lead of currentLeads) {
      if (lead.status === 'won' || lead.status === 'lost') continue;
      if (!lead.nextActionAt) continue;

      const dueTime = new Date(lead.nextActionAt).getTime();
      if (dueTime > now) continue;

      // Respect snooze
      if (lead.reminderSnoozedUntil) {
        const snoozeUntil = new Date(lead.reminderSnoozedUntil).getTime();
        if (snoozeUntil > now) continue;
      }

      // Dedup: skip if acknowledged within window
      const ackTime = ackedRef.current[lead.id];
      if (ackTime && now - ackTime < DEDUP_WINDOW_MS) continue;

      // Resolve contact name, fall back to address
      let leadName = lead.listingAddress || lead.id.slice(0, 8);
      if (lead.contactId) {
        const contact = contactByIdRef.current.get(lead.contactId);
        if (contact?.fullName) leadName = contact.fullName;
      }

      newAlerts.push({
        id: `reminder-${lead.id}-${dueTime}`,
        leadId: lead.id,
        leadName,
        note: lead.nextActionNote,
        channel: lead.nextActionChannel,
        dueAt: lead.nextActionAt,
        firedAt: now,
      });

      // Fire push notification
      if (pushNotifyRef.current) {
        pushNotifyRef.current(leadName);
      }

      // Mark as acknowledged
      ackedRef.current[lead.id] = now;
    }

    if (newAlerts.length > 0) {
      setAcknowledged(tenantIdRef.current, ackedRef.current);
      setActiveAlerts((prev) => {
        const existingLeadIds = new Set(prev.map((a) => a.leadId));
        const merged = [...prev];
        for (const alert of newAlerts) {
          if (!existingLeadIds.has(alert.leadId)) {
            merged.push(alert);
          }
        }
        return merged;
      });
    }
  }, []); // No deps — reads from refs

  // Stable interval that never resets
  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkReminders]);

  const dismissAlert = useCallback((alertId: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const snoozeAlert = useCallback((alertId: string, leadId: string) => {
    ackedRef.current[leadId] = Date.now();
    setAcknowledged(tenantIdRef.current, ackedRef.current);
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const dismissAll = useCallback(() => {
    setActiveAlerts([]);
  }, []);

  return { activeAlerts, dismissAlert, snoozeAlert, dismissAll };
}
