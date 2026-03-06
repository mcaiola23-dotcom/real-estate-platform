'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailComposeParams {
  to: string;
  contactName?: string;
  leadId: string;
  propertyAddress?: string;
  replyToMessageId?: string;
  initialSubject?: string;
  initialBody?: string;
}

export interface SmsConversationParams {
  to: string;
  contactName?: string;
  leadId: string;
  contactId?: string;
  initialBody?: string;
}

export interface CallParams {
  to: string;
  leadId: string;
  contactId?: string;
}

interface CommunicationModalState {
  // Integration status (fetched once, shared everywhere)
  googleConnected: boolean | null;
  twilioConnected: boolean | null;

  // Modal state
  emailCompose: EmailComposeParams | null;
  smsConversation: SmsConversationParams | null;
  callInProgress: boolean;

  // Actions
  openEmailComposer: (params: EmailComposeParams) => void;
  closeEmailComposer: () => void;
  openSmsConversation: (params: SmsConversationParams) => void;
  closeSmsConversation: () => void;
  initiateCall: (params: CallParams) => Promise<void>;
  refetchIntegrationStatus: () => void;
}

const CommunicationModalContext = createContext<CommunicationModalState | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CommunicationModalProvider({ children }: { children: ReactNode }) {
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [twilioConnected, setTwilioConnected] = useState<boolean | null>(null);
  const [emailCompose, setEmailCompose] = useState<EmailComposeParams | null>(null);
  const [smsConversation, setSmsConversation] = useState<SmsConversationParams | null>(null);
  const [callInProgress, setCallInProgress] = useState(false);

  const fetchStatus = useCallback(() => {
    fetch('/api/integrations/google/status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setGoogleConnected(data.connected ?? false); })
      .catch(() => setGoogleConnected(false));

    fetch('/api/integrations/twilio/status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setTwilioConnected(data.connected ?? false); })
      .catch(() => setTwilioConnected(false));
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const openEmailComposer = useCallback((params: EmailComposeParams) => {
    setEmailCompose(params);
  }, []);

  const closeEmailComposer = useCallback(() => {
    setEmailCompose(null);
  }, []);

  const openSmsConversation = useCallback((params: SmsConversationParams) => {
    setSmsConversation(params);
  }, []);

  const closeSmsConversation = useCallback(() => {
    setSmsConversation(null);
  }, []);

  const initiateCall = useCallback(async (params: CallParams) => {
    if (callInProgress) return;
    setCallInProgress(true);
    try {
      const res = await fetch('/api/integrations/twilio/voice/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: params.to,
          leadId: params.leadId,
          contactId: params.contactId,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error('[Click-to-Call] Error:', data.error);
      }
    } catch (err) {
      console.error('[Click-to-Call] Network error:', err);
    } finally {
      setCallInProgress(false);
    }
  }, [callInProgress]);

  return (
    <CommunicationModalContext.Provider
      value={{
        googleConnected,
        twilioConnected,
        emailCompose,
        smsConversation,
        callInProgress,
        openEmailComposer,
        closeEmailComposer,
        openSmsConversation,
        closeSmsConversation,
        initiateCall,
        refetchIntegrationStatus: fetchStatus,
      }}
    >
      {children}
    </CommunicationModalContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCommunicationModals() {
  const ctx = useContext(CommunicationModalContext);
  if (!ctx) {
    throw new Error('useCommunicationModals must be used within CommunicationModalProvider');
  }
  return ctx;
}
