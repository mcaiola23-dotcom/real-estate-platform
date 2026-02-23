'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface NotificationPrefs {
  enabled: boolean;
  newLead: boolean;
  overdueFollowUp: boolean;
  leadStatusChange: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  newLead: true,
  overdueFollowUp: true,
  leadStatusChange: true,
};

export function usePushNotifications(tenantId: string) {
  const storageKey = `crm.notif-prefs.${tenantId}`;
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const lastNotifiedRef = useRef<Map<string, number>>(new Map());

  // Load prefs from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      }
    } catch {
      // ignore
    }
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, [storageKey]);

  // Save prefs to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs, storageKey]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setPermissionState(permission);
    if (permission === 'granted') {
      setPrefs((prev) => ({ ...prev, enabled: true }));
    }
  }, []);

  const updatePrefs = useCallback((updates: Partial<NotificationPrefs>) => {
    setPrefs((prev) => ({ ...prev, ...updates }));
  }, []);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions & { dedupeKey?: string }) => {
      if (!prefs.enabled || permissionState !== 'granted') return;
      if (!('Notification' in window)) return;

      // Deduplication: don't send the same notification within 5 minutes
      if (options?.dedupeKey) {
        const last = lastNotifiedRef.current.get(options.dedupeKey);
        if (last && Date.now() - last < 5 * 60 * 1000) return;
        lastNotifiedRef.current.set(options.dedupeKey, Date.now());
      }

      try {
        new Notification(title, {
          icon: '/favicon.ico',
          ...options,
        });
      } catch {
        // Notification API may fail silently
      }
    },
    [prefs.enabled, permissionState]
  );

  const notifyNewLead = useCallback(
    (leadLabel: string) => {
      if (!prefs.newLead) return;
      sendNotification('New Lead', {
        body: `${leadLabel} — respond quickly!`,
        tag: 'new-lead',
        dedupeKey: `new-lead-${leadLabel}`,
      });
    },
    [prefs.newLead, sendNotification]
  );

  const notifyOverdueFollowUp = useCallback(
    (leadLabel: string) => {
      if (!prefs.overdueFollowUp) return;
      sendNotification('Overdue Follow-Up', {
        body: `${leadLabel} needs your attention`,
        tag: 'overdue-followup',
        dedupeKey: `overdue-${leadLabel}`,
      });
    },
    [prefs.overdueFollowUp, sendNotification]
  );

  const notifyStatusChange = useCallback(
    (leadLabel: string, newStatus: string) => {
      if (!prefs.leadStatusChange) return;
      sendNotification('Lead Status Changed', {
        body: `${leadLabel} moved to ${newStatus}`,
        tag: 'status-change',
        dedupeKey: `status-${leadLabel}-${newStatus}`,
      });
    },
    [prefs.leadStatusChange, sendNotification]
  );

  return {
    prefs,
    permissionState,
    requestPermission,
    updatePrefs,
    notifyNewLead,
    notifyOverdueFollowUp,
    notifyStatusChange,
  };
}
