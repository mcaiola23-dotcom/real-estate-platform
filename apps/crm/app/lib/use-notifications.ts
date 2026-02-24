import { useCallback, useMemo, useState } from 'react';
import type { CrmActivity, CrmContact, CrmLead } from '@real-estate/types/crm';

export interface CrmNotification {
  id: string;
  category: 'overdue' | 'activity' | 'milestone';
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

    // Overdue follow-ups
    for (const lead of leads) {
      if (!lead.nextActionAt || lead.status === 'won' || lead.status === 'lost') continue;
      const due = new Date(lead.nextActionAt);
      if (due.getTime() < now.getTime()) {
        items.push({
          id: `overdue-${lead.id}`,
          category: 'overdue',
          title: `Overdue: ${getLeadName(lead, contactById)}`,
          detail: lead.nextActionNote || 'Follow-up overdue',
          timestamp: lead.nextActionAt,
          leadId: lead.id,
        });
      }
    }

    // Recent activity (last 24h)
    const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
    for (const activity of activities.slice(0, 20)) {
      if (new Date(activity.occurredAt).getTime() < oneDayAgo) continue;
      items.push({
        id: `activity-${activity.id}`,
        category: 'activity',
        title: activity.summary,
        detail: activity.activityType,
        timestamp: activity.occurredAt,
        leadId: activity.leadId || undefined,
      });
    }

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
    return items;
  }, [leads, activities, contactById]);

  const notifications = useMemo(() => {
    return allNotifications.filter((n) => !dismissedIds.has(n.id));
  }, [allNotifications, dismissedIds]);

  const unreadCount = notifications.length;

  return { notifications, unreadCount, dismissNotification, clearAllNotifications };
}
