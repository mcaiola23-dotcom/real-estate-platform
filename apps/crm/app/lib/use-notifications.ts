import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CrmActivity, CrmContact, CrmLead } from '@real-estate/types/crm';

export interface CrmNotification {
  id: string;
  category: 'overdue' | 'activity' | 'milestone' | 'reminder';
  title: string;
  detail: string;
  timestamp: string;
  leadId?: string;
}

interface UseNotificationsParams {
  leads: CrmLead[];
  activities: CrmActivity[];
  contactById: Map<string, CrmContact>;
  tenantId?: string;
}

function getLeadName(lead: CrmLead, contactById: Map<string, CrmContact>): string {
  if (lead.contactId) {
    const contact = contactById.get(lead.contactId);
    if (contact?.fullName) return contact.fullName;
  }
  return lead.listingAddress || 'Lead';
}

export function useNotifications({ leads, activities, contactById, tenantId }: UseNotificationsParams) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined' || !tenantId) return new Set();
    try {
      const raw = window.localStorage.getItem(`crm.dismissed-notifs.${tenantId}`);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  // 5-minute ticker so overdue/reminder notifications refresh periodically
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 300_000);
    return () => clearInterval(interval);
  }, []);

  const persistDismissed = useCallback((ids: Set<string>) => {
    if (!tenantId) return;
    try {
      window.localStorage.setItem(`crm.dismissed-notifs.${tenantId}`, JSON.stringify([...ids]));
    } catch { /* ignore */ }
  }, [tenantId]);

  const dismissNotification = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      persistDismissed(next);
      return next;
    });
  }, [persistDismissed]);

  const clearAllNotifications = useCallback(() => {
    setDismissedIds((prev) => {
      const next = new Set([...prev, ...allNotifications.map((n) => n.id)]);
      persistDismissed(next);
      return next;
    });
  }, [persistDismissed]); // eslint-disable-line react-hooks/exhaustive-deps

  const allNotifications = useMemo<CrmNotification[]>(() => {
    const items: CrmNotification[] = [];
    const now = new Date();
    const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
    // Only show overdue reminders from the last 48 hours — older ones belong
    // in the My Day panel, not as persistent alert-style notifications.
    const twoDaysAgo = now.getTime() - 48 * 60 * 60 * 1000;
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    for (const lead of leads) {
      if (lead.status === 'won' || lead.status === 'lost') continue;
      if (!lead.nextActionAt) continue;

      // Respect snooze
      if (lead.reminderSnoozedUntil) {
        const snoozeUntil = new Date(lead.reminderSnoozedUntil).getTime();
        if (snoozeUntil > now.getTime()) continue;
      }

      const due = new Date(lead.nextActionAt);
      const name = getLeadName(lead, contactById);

      if (due.getTime() < now.getTime() && due.getTime() >= twoDaysAgo) {
        // Overdue (within last 48h only)
        items.push({
          id: `overdue-${lead.id}`,
          category: 'overdue',
          title: `Overdue: ${name}`,
          detail: lead.nextActionNote || 'Follow-up overdue',
          timestamp: lead.nextActionAt,
          leadId: lead.id,
        });
      } else if (due.getTime() >= now.getTime() && due.getTime() <= endOfToday.getTime()) {
        // Due today (upcoming)
        items.push({
          id: `reminder-${lead.id}`,
          category: 'reminder',
          title: `Today: ${name}`,
          detail: lead.nextActionNote || 'Follow-up scheduled for today',
          timestamp: lead.nextActionAt,
          leadId: lead.id,
        });
      }
    }

    // Activity-type notifications removed — activities belong in the
    // timeline/feed, not as alert-style notifications that regenerate on
    // every render cycle and cause notification spam.

    // Milestone: leads that recently moved to 'won'
    for (const lead of leads) {
      if (lead.status !== 'won') continue;
      if (new Date(lead.updatedAt).getTime() < oneDayAgo) continue;
      items.push({
        id: `milestone-${lead.id}`,
        category: 'milestone',
        title: `Deal Won: ${getLeadName(lead, contactById)}`,
        detail: 'Lead status changed to Won',
        timestamp: lead.updatedAt,
        leadId: lead.id,
      });
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    // Cap at 10 to avoid notification overload
    return items.slice(0, 10);
  }, [leads, contactById, tick]); // tick forces periodic recalculation

  const notifications = useMemo(() => {
    return allNotifications.filter((n) => !dismissedIds.has(n.id));
  }, [allNotifications, dismissedIds]);

  const unreadCount = notifications.length;

  return { notifications, unreadCount, dismissNotification, clearAllNotifications };
}
