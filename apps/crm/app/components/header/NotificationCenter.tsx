'use client';

import type { CrmNotification } from '../../lib/use-notifications';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  notifications: CrmNotification[];
  onOpenLead: (leadId: string) => void;
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const CATEGORY_CONFIG = {
  overdue: { label: 'Overdue', color: '#ef4444', icon: '!' },
  activity: { label: 'Activity', color: 'var(--crm-accent)', icon: '↻' },
  milestone: { label: 'Milestone', color: '#2d6a4f', icon: '★' },
} as const;

export function NotificationCenter({ open, onClose, notifications, onOpenLead }: NotificationCenterProps) {
  if (!open) return null;

  const grouped = {
    overdue: notifications.filter((n) => n.category === 'overdue'),
    activity: notifications.filter((n) => n.category === 'activity'),
    milestone: notifications.filter((n) => n.category === 'milestone'),
  };

  return (
    <>
      <div className="crm-notif-overlay" onClick={onClose} />
      <aside className="crm-notif-panel" aria-label="Notifications">
        <div className="crm-notif-panel__header">
          <h3 className="crm-notif-panel__title">Notifications</h3>
          <button className="crm-notif-panel__close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="crm-notif-panel__body">
          {notifications.length === 0 ? (
            <div className="crm-notif-panel__empty">No notifications</div>
          ) : (
            (['overdue', 'activity', 'milestone'] as const).map((cat) => {
              const items = grouped[cat];
              if (items.length === 0) return null;
              const config = CATEGORY_CONFIG[cat];
              return (
                <div key={cat} className="crm-notif-panel__section">
                  <div className="crm-notif-panel__section-header">
                    <span className="crm-notif-panel__section-dot" style={{ background: config.color }} />
                    <span className="crm-notif-panel__section-label">{config.label}</span>
                    <span className="crm-notif-panel__section-count">{items.length}</span>
                  </div>
                  {items.slice(0, 10).map((notif) => (
                    <button
                      key={notif.id}
                      className="crm-notif-panel__item"
                      type="button"
                      onClick={() => {
                        if (notif.leadId) onOpenLead(notif.leadId);
                        onClose();
                      }}
                    >
                      <span className="crm-notif-panel__item-icon" style={{ color: config.color }}>
                        {config.icon}
                      </span>
                      <div className="crm-notif-panel__item-content">
                        <span className="crm-notif-panel__item-title">{notif.title}</span>
                        <span className="crm-notif-panel__item-time">{formatRelativeTime(notif.timestamp)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
