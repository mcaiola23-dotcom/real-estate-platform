'use client';

import { memo, useState } from 'react';
import type { NextActionSuggestion } from '@real-estate/ai/types';

interface AiActionCardProps {
  suggestion: NextActionSuggestion;
  onTakeAction?: (patternId: string) => void;
  onDismiss?: (patternId: string) => void;
  compact?: boolean;
}

const URGENCY_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const AiActionCard = memo(function AiActionCard({
  suggestion,
  onTakeAction,
  onDismiss,
  compact = false,
}: AiActionCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const { patternId, action, reason, urgency, aiEnhancedReason, provenance } = suggestion;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.(patternId);
  };

  return (
    <div className={`crm-ai-action ${compact ? 'crm-ai-action--compact' : ''} crm-ai-action--${urgency}`}>
      <div className="crm-ai-action__border" />

      <div className="crm-ai-action__content">
        <div className="crm-ai-action__header">
          <span className="crm-ai-action__icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" opacity="0.9" />
              <path d="M12.5 0l.75 2.25L15.5 3l-2.25.75L12.5 6l-.75-2.25L9.5 3l2.25-.75L12.5 0z" fill="currentColor" opacity="0.5" />
            </svg>
          </span>
          <span className="crm-ai-action__action">{action}</span>
          <span className={`crm-ai-action__urgency crm-ai-action__urgency--${urgency}`}>
            {URGENCY_LABELS[urgency] ?? urgency}
          </span>
        </div>

        <p className="crm-ai-action__reason">{reason}</p>

        {aiEnhancedReason && (
          <p className="crm-ai-action__enhanced">
            <span className="crm-ai-action__enhanced-label">AI</span>
            {aiEnhancedReason}
          </p>
        )}

        <div className="crm-ai-action__footer">
          <div className="crm-ai-action__provenance">
            <span className="crm-ai-action__provenance-tag">
              {provenance.source === 'ai' ? 'AI-enhanced' : provenance.source === 'rule_engine' ? 'Rule-based' : 'Fallback'}
            </span>
            {provenance.latencyMs > 0 && (
              <span className="crm-ai-action__provenance-latency">{provenance.latencyMs}ms</span>
            )}
          </div>

          <div className="crm-ai-action__actions">
            <button
              type="button"
              className="crm-ai-action__btn crm-ai-action__btn--dismiss"
              onClick={handleDismiss}
            >
              Dismiss
            </button>
            {onTakeAction && (
              <button
                type="button"
                className="crm-ai-action__btn crm-ai-action__btn--action"
                onClick={() => onTakeAction(patternId)}
              >
                Take Action
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
