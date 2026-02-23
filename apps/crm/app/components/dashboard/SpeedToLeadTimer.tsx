'use client';

import { useEffect, useState } from 'react';
import type { CrmLead, CrmContact } from '@real-estate/types/crm';
import { getElapsedSinceCreation, getSpeedUrgency, formatElapsed } from '../../lib/speed-to-lead';

interface SpeedToLeadTimerProps {
  lead: CrmLead;
  contactById: Map<string, CrmContact>;
  onClaim: (leadId: string) => void;
}

export function SpeedToLeadTimer({ lead, contactById, onClaim }: SpeedToLeadTimerProps) {
  const [elapsed, setElapsed] = useState(() => getElapsedSinceCreation(lead));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsedSinceCreation(lead));
    }, 1000);
    return () => clearInterval(interval);
  }, [lead]);

  const urgency = getSpeedUrgency(elapsed);
  const contact = lead.contactId ? contactById.get(lead.contactId) : undefined;
  const label = contact?.fullName || lead.listingAddress || 'New Lead';

  return (
    <div className={`crm-speed-timer crm-speed-timer--${urgency}`}>
      <div className="crm-speed-timer-info">
        <strong>{label}</strong>
        <span className="crm-speed-timer-elapsed">{formatElapsed(elapsed)}</span>
      </div>
      <div className="crm-speed-timer-bar">
        <div
          className={`crm-speed-timer-fill crm-speed-timer-fill--${urgency}`}
          style={{ width: `${Math.min((elapsed / (15 * 60 * 1000)) * 100, 100)}%` }}
        />
      </div>
      <button type="button" className="crm-speed-timer-claim" onClick={() => onClaim(lead.id)}>
        Claim
      </button>
    </div>
  );
}
