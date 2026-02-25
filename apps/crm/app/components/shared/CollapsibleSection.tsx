'use client';

import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  headerExtra?: ReactNode;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  badge,
  headerExtra,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`crm-collapsible-section ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="crm-collapsible-section__header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="crm-collapsible-section__title-group">
          {icon && <span className="crm-collapsible-section__icon">{icon}</span>}
          <span className="crm-collapsible-section__title">{title}</span>
          {badge != null && <span className="crm-collapsible-section__badge">{badge}</span>}
          {headerExtra && <span className="crm-collapsible-section__header-extra" onClick={(e) => e.stopPropagation()}>{headerExtra}</span>}
        </span>
        <span className={`crm-collapsible-section__chevron ${open ? 'crm-collapsible-section__chevron--open' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="crm-collapsible-section__body">
          {children}
        </div>
      )}
    </div>
  );
}
