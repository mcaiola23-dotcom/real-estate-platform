'use client';

import { useCallback, useEffect, useRef } from 'react';

interface SlideOverModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Generic right-side slide-over panel with overlay, animated entrance, and focus trap.
 */
export function SlideOverModal({ open, onClose, title, subtitle, children }: SlideOverModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    // Focus the panel on open
    requestAnimationFrame(() => panelRef.current?.focus());
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <>
      <div className="crm-slide-over-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="crm-slide-over"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="crm-slide-over__header">
          <div>
            <h3 className="crm-slide-over__title">{title}</h3>
            {subtitle && <p className="crm-slide-over__subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="crm-slide-over__close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="crm-slide-over__body">
          {children}
        </div>
      </div>
    </>
  );
}
