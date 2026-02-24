'use client';

import { useEffect, useState } from 'react';
import type { CrmContact, CrmLead } from '@real-estate/types/crm';
import { formatLeadStatusLabel } from '../../lib/crm-display';

interface DuplicateMatch {
  lead: CrmLead;
  contact: CrmContact | null;
  matchReasons: string[];
}

interface DuplicateWarningProps {
  leadId: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  onViewLead?: (leadId: string) => void;
  dismissedIds?: Set<string>;
  onDismiss?: (leadId: string) => void;
}

export function DuplicateWarning({ leadId, email, phone, address, onViewLead, dismissedIds, onDismiss }: DuplicateWarningProps) {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasInput = Boolean(email || phone || address);

  useEffect(() => {
    if (!hasInput) return;

    let cancelled = false;
    async function check() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (email) params.set('email', email);
        if (phone) params.set('phone', phone);
        if (address) params.set('address', address);
        params.set('excludeLeadId', leadId);

        const res = await fetch(`/api/leads/duplicates?${params.toString()}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setDuplicates(data.duplicates ?? []);
        }
      } catch (err) { console.warn('[DuplicateWarning]', err); }
      if (!cancelled) setLoading(false);
    }
    check();
    return () => { cancelled = true; };
  }, [leadId, email, phone, address, hasInput]);

  if (dismissed || dismissedIds?.has(leadId) || loading || duplicates.length === 0) return null;

  return (
    <div className="crm-dup-warning" role="alert">
      <div className="crm-dup-warning-header">
        <span className="crm-dup-warning-icon" aria-hidden="true">⚠</span>
        <span className="crm-dup-warning-title">
          Potential duplicate{duplicates.length > 1 ? 's' : ''} detected
        </span>
        <button
          type="button"
          className="crm-dup-warning-dismiss"
          onClick={() => { setDismissed(true); onDismiss?.(leadId); }}
          aria-label="Dismiss duplicate warning"
        >
          ✕
        </button>
      </div>
      <div className="crm-dup-warning-list">
        {duplicates.map((dup) => (
          <div key={dup.lead.id} className="crm-dup-warning-item">
            <div className="crm-dup-warning-info">
              <span className="crm-dup-warning-name">
                {dup.contact?.fullName || dup.lead.listingAddress || 'Unknown'}
              </span>
              <span className={`crm-dup-warning-status crm-status-${dup.lead.status}`}>
                {formatLeadStatusLabel(dup.lead.status)}
              </span>
              <span className="crm-dup-warning-reasons">
                {dup.matchReasons.join(' · ')}
              </span>
            </div>
            {onViewLead && (
              <button
                type="button"
                className="crm-dup-warning-view"
                onClick={() => onViewLead(dup.lead.id)}
              >
                View
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
