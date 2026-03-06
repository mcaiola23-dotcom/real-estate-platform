'use client';

import { useCallback, type ReactNode } from 'react';
import { useCommunicationModals } from '../../lib/communication-modal-context';

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

const PhoneIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M6 3H4.5A1.5 1.5 0 003 4.5v1A8.5 8.5 0 0010.5 14h1a1.5 1.5 0 001.5-1.5V11l-2.5-1.5L9 11a5 5 0 01-4-4l1.5-1.5L5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EmailIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TextIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 3h11A1.5 1.5 0 0115 4.5v6a1.5 1.5 0 01-1.5 1.5H5L2 14.5V4.5A1.5 1.5 0 013.5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuickActionButtonsProps {
  phone?: string | null;
  email?: string | null;
  contactName?: string | null;
  leadId: string;
  contactId?: string | null;
  propertyAddress?: string | null;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickActionButtons({
  phone,
  email,
  contactName,
  leadId,
  contactId,
  propertyAddress,
  compact,
}: QuickActionButtonsProps) {
  const {
    googleConnected,
    twilioConnected,
    openEmailComposer,
    openSmsConversation,
    initiateCall,
  } = useCommunicationModals();

  const handlePhone = useCallback(() => {
    if (!phone) return;
    if (twilioConnected) {
      void initiateCall({ to: phone, leadId, contactId: contactId ?? undefined });
    } else {
      window.open(`tel:${phone}`, '_blank');
    }
  }, [phone, twilioConnected, initiateCall, leadId, contactId]);

  const handleEmail = useCallback(() => {
    if (!email) return;
    if (googleConnected) {
      openEmailComposer({
        to: email,
        contactName: contactName ?? undefined,
        leadId,
        propertyAddress: propertyAddress ?? undefined,
        initialSubject: propertyAddress ? `Re: ${propertyAddress}` : 'Following up on your inquiry',
      });
    } else {
      const subject = encodeURIComponent(propertyAddress ? `Re: ${propertyAddress}` : 'Your inquiry');
      window.open(`mailto:${email}?subject=${subject}`, '_blank');
    }
  }, [email, googleConnected, openEmailComposer, contactName, leadId, propertyAddress]);

  const handleSms = useCallback(() => {
    if (!phone) return;
    if (twilioConnected) {
      openSmsConversation({
        to: phone,
        contactName: contactName ?? undefined,
        leadId,
        contactId: contactId ?? undefined,
      });
    } else {
      window.open(`sms:${phone}`, '_blank');
    }
  }, [phone, twilioConnected, openSmsConversation, contactName, leadId, contactId]);

  if (!phone && !email) return null;

  const className = compact
    ? 'crm-quick-actions crm-quick-actions--compact'
    : 'crm-quick-actions';

  return (
    <div className={className}>
      {phone ? (
        <button type="button" className="crm-quick-action" title={`Call ${phone}`} aria-label="Call lead" onClick={handlePhone}>
          {PhoneIcon}
        </button>
      ) : null}
      {email ? (
        <button type="button" className="crm-quick-action" title={`Email ${email}`} aria-label="Email lead" onClick={handleEmail}>
          {EmailIcon}
        </button>
      ) : null}
      {phone ? (
        <button type="button" className="crm-quick-action" title={`Text ${phone}`} aria-label="Text lead" onClick={handleSms}>
          {TextIcon}
        </button>
      ) : null}
    </div>
  );
}
