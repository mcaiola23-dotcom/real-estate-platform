'use client';

import type { NotificationPrefs } from '../../lib/use-push-notifications';

interface NotificationPreferencesProps {
  prefs: NotificationPrefs;
  permissionState: NotificationPermission;
  onRequestPermission: () => void;
  onUpdatePrefs: (updates: Partial<NotificationPrefs>) => void;
}

export function NotificationPreferences({
  prefs,
  permissionState,
  onRequestPermission,
  onUpdatePrefs,
}: NotificationPreferencesProps) {
  return (
    <div className="crm-notification-prefs">
      <div className="crm-panel-head">
        <h4>Push Notifications</h4>
        <span className="crm-muted">Get browser alerts for important CRM events</span>
      </div>

      {permissionState === 'denied' ? (
        <p className="crm-banner-warning">
          Browser notifications are blocked. Enable them in your browser settings to receive alerts.
        </p>
      ) : permissionState === 'default' ? (
        <div className="crm-notification-prefs-enable">
          <p>Enable browser notifications to stay on top of new leads and follow-ups.</p>
          <button type="button" className="crm-primary-button" onClick={onRequestPermission}>
            Enable Notifications
          </button>
        </div>
      ) : null}

      <div className="crm-notification-prefs-toggles">
        <label className="crm-toggle-row">
          <input
            type="checkbox"
            checked={prefs.enabled}
            onChange={(e) => onUpdatePrefs({ enabled: e.target.checked })}
            disabled={permissionState !== 'granted'}
          />
          <span>Notifications enabled</span>
        </label>

        <label className="crm-toggle-row">
          <input
            type="checkbox"
            checked={prefs.newLead}
            onChange={(e) => onUpdatePrefs({ newLead: e.target.checked })}
            disabled={!prefs.enabled}
          />
          <span>New lead alerts (speed-to-lead)</span>
        </label>

        <label className="crm-toggle-row">
          <input
            type="checkbox"
            checked={prefs.overdueFollowUp}
            onChange={(e) => onUpdatePrefs({ overdueFollowUp: e.target.checked })}
            disabled={!prefs.enabled}
          />
          <span>Overdue follow-up reminders</span>
        </label>

        <label className="crm-toggle-row">
          <input
            type="checkbox"
            checked={prefs.leadStatusChange}
            onChange={(e) => onUpdatePrefs({ leadStatusChange: e.target.checked })}
            disabled={!prefs.enabled}
          />
          <span>Lead status change notifications</span>
        </label>
      </div>
    </div>
  );
}
