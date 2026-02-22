'use client';

import { memo, useState } from 'react';

const WON_REASONS = [
  'Found property',
  'Competitive offer',
  'Great agent service',
  'Market timing',
  'Referral strength',
] as const;

const LOST_REASONS = [
  'Went with another agent',
  'Changed mind',
  'Financing fell through',
  'Couldn\'t find property',
  'Priced out',
  'Timing not right',
  'Relocated',
] as const;

interface WinLossModalProps {
  leadName: string;
  outcome: 'won' | 'lost';
  onSubmit: (data: { closeReason: string; closeNotes: string }) => void;
  onSkip: () => void;
}

export const WinLossModal = memo(function WinLossModal({
  leadName,
  outcome,
  onSubmit,
  onSkip,
}: WinLossModalProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const reasons = outcome === 'won' ? WON_REASONS : LOST_REASONS;
  const title = outcome === 'won' ? 'Congratulations!' : 'Lead Closed';
  const subtitle = outcome === 'won'
    ? `${leadName} has been marked as Won. What drove this success?`
    : `${leadName} has been marked as Lost. What happened?`;
  const accentClass = outcome === 'won' ? 'crm-winloss--won' : 'crm-winloss--lost';

  return (
    <div
      className="crm-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onSkip(); }}
    >
      <div className={`crm-winloss-modal ${accentClass}`} role="dialog" aria-modal="true">
        <div className="crm-winloss-header">
          <span className="crm-winloss-icon">{outcome === 'won' ? '🏆' : '📋'}</span>
          <h3>{title}</h3>
          <p className="crm-muted">{subtitle}</p>
        </div>

        <div className="crm-winloss-body">
          <label className="crm-winloss-label">
            {outcome === 'won' ? 'What drove this win?' : 'Primary reason'}
          </label>
          <div className="crm-winloss-reasons">
            {reasons.map((r) => (
              <button
                key={r}
                type="button"
                className={`crm-winloss-reason ${reason === r ? 'crm-winloss-reason--selected' : ''}`}
                onClick={() => setReason(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <label className="crm-winloss-label" style={{ marginTop: '1rem' }}>
            Additional notes <span className="crm-muted">(optional)</span>
          </label>
          <textarea
            className="crm-winloss-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={outcome === 'won' ? 'Any details about the deal...' : 'What could have been done differently?'}
            rows={3}
          />
        </div>

        <div className="crm-winloss-footer">
          <button type="button" className="crm-btn crm-btn-ghost" onClick={onSkip}>
            Skip
          </button>
          <button
            type="button"
            className="crm-btn crm-btn-primary"
            onClick={() => onSubmit({ closeReason: reason, closeNotes: notes })}
            disabled={!reason}
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
});
