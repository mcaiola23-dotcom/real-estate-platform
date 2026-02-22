'use client';

import { memo } from 'react';

interface MobileActionBarProps {
  onSearchClick: () => void;
  onNewLeadClick: () => void;
  onLogActivityClick: () => void;
  onNotificationsClick: () => void;
  notificationCount: number;
}

export const MobileActionBar = memo(function MobileActionBar({
  onSearchClick,
  onNewLeadClick,
  onLogActivityClick,
  onNotificationsClick,
  notificationCount,
}: MobileActionBarProps) {
  return (
    <nav className="crm-mobile-action-bar" aria-label="Quick actions">
      <button type="button" className="crm-mobile-action" onClick={onSearchClick}>
        <span className="crm-mobile-action__icon" aria-hidden="true">🔍</span>
        <span className="crm-mobile-action__label">Search</span>
      </button>
      <button type="button" className="crm-mobile-action" onClick={onNewLeadClick}>
        <span className="crm-mobile-action__icon crm-mobile-action__icon--primary" aria-hidden="true">＋</span>
        <span className="crm-mobile-action__label">New Lead</span>
      </button>
      <button type="button" className="crm-mobile-action" onClick={onLogActivityClick}>
        <span className="crm-mobile-action__icon" aria-hidden="true">✎</span>
        <span className="crm-mobile-action__label">Log</span>
      </button>
      <button type="button" className="crm-mobile-action" onClick={onNotificationsClick}>
        <span className="crm-mobile-action__icon" aria-hidden="true">🔔</span>
        {notificationCount > 0 && (
          <span className="crm-mobile-action__badge">{notificationCount > 9 ? '9+' : notificationCount}</span>
        )}
        <span className="crm-mobile-action__label">Alerts</span>
      </button>
    </nav>
  );
});
