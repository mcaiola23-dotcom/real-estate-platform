import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  detail: string;
  /** Optional SVG or emoji icon replacing the default ◌ glyph */
  icon?: ReactNode;
  /** Label for the optional CTA button */
  actionLabel?: string;
  /** Callback fired when the CTA button is clicked */
  onAction?: () => void;
}

export function EmptyState({ title, detail, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="crm-empty-state">
      <span className="crm-empty-state-icon" aria-hidden="true">{icon ?? '◌'}</span>
      <strong>{title}</strong>
      <p>{detail}</p>
      {actionLabel && onAction && (
        <button type="button" className="crm-empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
