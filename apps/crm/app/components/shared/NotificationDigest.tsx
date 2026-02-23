'use client';

import { useCallback, useEffect, useState } from 'react';

interface DigestItem {
  type: 'overdue' | 'new_lead' | 'hot_lead' | 'milestone';
  label: string;
  detail: string;
  leadId?: string;
  priority: number;
}

interface NotificationDigestProps {
  onOpenLead?: (leadId: string) => void;
}

export function NotificationDigest({ onOpenLead }: NotificationDigestProps) {
  const [items, setItems] = useState<DigestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/ai/daily-digest');
        const data = await res.json();
        if (!cancelled && data.ok) {
          setItems(data.items || []);
        }
      } catch {
        // Digest fetch failed
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'overdue': return '⚠';
      case 'new_lead': return '★';
      case 'hot_lead': return '🔥';
      case 'milestone': return '✓';
      default: return '•';
    }
  };

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <div className="crm-digest">
      <button
        type="button"
        className="crm-digest-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <h4>Morning Digest</h4>
        <span className="crm-digest-count">{items.length} items</span>
        <span className="crm-digest-toggle">{collapsed ? '▸' : '▾'}</span>
      </button>

      {!collapsed && (
        <div className="crm-digest-list">
          {items
            .sort((a, b) => b.priority - a.priority)
            .map((item, i) => (
              <div key={i} className={`crm-digest-item crm-digest-item--${item.type}`}>
                <span className="crm-digest-icon">{getTypeIcon(item.type)}</span>
                <div className="crm-digest-content">
                  <span className="crm-digest-label">{item.label}</span>
                  <span className="crm-muted">{item.detail}</span>
                </div>
                {item.leadId && onOpenLead && (
                  <button
                    type="button"
                    className="crm-inline-link"
                    onClick={() => onOpenLead(item.leadId!)}
                  >
                    View
                  </button>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
