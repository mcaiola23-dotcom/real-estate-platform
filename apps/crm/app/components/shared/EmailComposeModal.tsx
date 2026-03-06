'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GmailComposer } from './GmailComposer';
import { TemplateLibrary } from './TemplateLibrary';
import { AiDraftComposer } from './AiDraftComposer';
import type { MergeFieldContext } from '../../lib/crm-templates';
import { useCommunicationModals } from '../../lib/communication-modal-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailComposeModalProps {
  to: string;
  leadId: string;
  tenantId: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  propertyAddress?: string | null;
  replyToMessageId?: string;
  initialSubject?: string;
  initialBody?: string;
  mergeContext: MergeFieldContext;
  onClose: () => void;
  onSent?: () => void;
}

type ToolPanel = 'none' | 'templates' | 'ai';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmailComposeModal({
  to,
  leadId,
  tenantId,
  contactName,
  contactEmail,
  contactPhone,
  propertyAddress,
  replyToMessageId,
  initialSubject,
  initialBody,
  mergeContext,
  onClose,
  onSent,
}: EmailComposeModalProps) {
  const { googleConnected } = useCommunicationModals();
  const [toolPanel, setToolPanel] = useState<ToolPanel>('none');
  const [subject, setSubject] = useState(initialSubject ?? '');
  const [body, setBody] = useState(initialBody ?? '');
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  const handleTemplateUse = useCallback((data: { subject: string | null; body: string; channel: string }) => {
    if (data.subject) setSubject(data.subject);
    setBody(data.body);
    setToolPanel('none');
  }, []);

  const handleAiDraft = useCallback((data: { channel: string; subject: string; body: string }) => {
    setSubject(data.subject);
    setBody(data.body);
    setToolPanel('none');
  }, []);

  const handleSent = useCallback(() => {
    onSent?.();
    onClose();
  }, [onSent, onClose]);

  return (
    <div className="crm-comm-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="crm-email-compose-modal" role="dialog" aria-label="Compose Email">
        {/* Header */}
        <div className="crm-email-compose-modal__header">
          <h3>
            {replyToMessageId ? 'Reply' : 'New Email'}
            {contactName ? ` to ${contactName}` : ''}
          </h3>
          <div className="crm-email-compose-modal__header-actions">
            <button
              type="button"
              className={`crm-comm-hub__compose-btn ${toolPanel === 'templates' ? 'is-active' : ''}`}
              onClick={() => setToolPanel(toolPanel === 'templates' ? 'none' : 'templates')}
              title="Use template"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
              </svg>
              <span>Template</span>
            </button>
            <button
              type="button"
              className={`crm-comm-hub__compose-btn ${toolPanel === 'ai' ? 'is-active' : ''}`}
              onClick={() => setToolPanel(toolPanel === 'ai' ? 'none' : 'ai')}
              title="AI Draft"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" opacity="0.7" />
              </svg>
              <span>AI Draft</span>
            </button>
            <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="crm-email-compose-modal__body">
          {/* Tool panel (slides in from right) */}
          {toolPanel === 'templates' && (
            <div className="crm-email-compose-modal__tool-panel">
              <TemplateLibrary
                mergeContext={mergeContext}
                tenantId={tenantId}
                leadId={leadId}
                onUseTemplate={handleTemplateUse}
                onClose={() => setToolPanel('none')}
              />
            </div>
          )}

          {toolPanel === 'ai' && (
            <div className="crm-email-compose-modal__tool-panel">
              <AiDraftComposer
                leadId={leadId}
                tenantId={tenantId}
                contactName={contactName ?? null}
                contactEmail={contactEmail ?? to}
                contactPhone={contactPhone ?? null}
                propertyAddress={propertyAddress ?? null}
                onClose={() => setToolPanel('none')}
                onSend={handleAiDraft}
              />
            </div>
          )}

          {/* Main compose area */}
          <div className="crm-email-compose-modal__composer">
            {replyToMessageId && (
              <div className="crm-email-compose-modal__reply-context">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3L1 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1 8h10c2.2 0 4 1.8 4 4v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Replying to thread</span>
              </div>
            )}
            <GmailComposer
              to={to}
              leadId={leadId}
              contactName={contactName}
              propertyAddress={propertyAddress}
              googleConnected={googleConnected ?? false}
              replyToMessageId={replyToMessageId}
              initialSubject={subject || initialSubject}
              initialBody={body || initialBody}
              onClose={onClose}
              onSent={handleSent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
