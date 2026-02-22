'use client';

import { forwardRef } from 'react';
import type { CrmContact, CrmLead, CrmLeadStatus } from '@real-estate/types/crm';

import { formatLeadSourceLabel, formatLeadStatusLabel, formatLeadTypeLabel } from '../../lib/crm-display';
import { formatTimeAgo, getLeadContactLabel } from '../../lib/crm-formatters';
import { computeLeadAging, estimateDealValue, formatDealValue, formatCommission } from '../../lib/crm-aging';
import { getPipelineMoveNotice } from '../../lib/workspace-interactions';
import { LEAD_STATUSES, type LeadDraft, type LeadStatusFilter } from '../../lib/crm-types';

export interface PipelineCardProps {
  lead: CrmLead;
  draft: LeadDraft;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isPinned: boolean;
  contactById: Map<string, CrmContact>;
  pipelineStatusFilter: LeadStatusFilter;
  onOpenProfile: (leadId: string) => void;
  onTogglePin: (leadId: string) => void;
  onDraftChange: (leadId: string, field: keyof LeadDraft, value: string | CrmLeadStatus) => void;
  onSave: (leadId: string) => void;
  onFilterNotice: (notice: string | null) => void;
  /** When true, renders as a drag overlay (no interactive controls). */
  isOverlay?: boolean;
}

export const PipelineCard = forwardRef<HTMLElement, PipelineCardProps & React.HTMLAttributes<HTMLElement>>(
  function PipelineCard(
    {
      lead,
      draft,
      hasUnsavedChanges,
      isSaving,
      isPinned: pinned,
      contactById,
      pipelineStatusFilter,
      onOpenProfile,
      onTogglePin,
      onDraftChange,
      onSave,
      onFilterNotice,
      isOverlay,
      ...attrs
    },
    ref
  ) {
    const aging = computeLeadAging(lead.updatedAt);
    const dealVal = estimateDealValue(lead.priceMin, lead.priceMax);
    const contactLabel = getLeadContactLabel(lead, contactById);
    const hasMatchCriteria = Boolean(lead.propertyType || lead.beds || lead.baths || lead.priceMin || lead.priceMax);
    const linkedContact = lead.contactId ? contactById.get(lead.contactId) : null;

    return (
      <article ref={ref} className={`crm-pipeline-card${isOverlay ? ' crm-pipeline-card--overlay' : ''}`} {...attrs}>
        <div className="crm-pipeline-card-top">
          <strong>
            {isOverlay ? (
              <span className="crm-inline-link">{contactLabel}</span>
            ) : (
              <button type="button" className="crm-inline-link" onClick={() => onOpenProfile(lead.id)}>
                {contactLabel}
              </button>
            )}
          </strong>
          <div className="crm-pipeline-card-actions">
            {!isOverlay && (
              <button
                type="button"
                className={`crm-pin-btn ${pinned ? 'crm-pin-btn--active' : ''}`}
                onClick={() => onTogglePin(lead.id)}
                title={pinned ? 'Unpin lead' : 'Pin lead'}
                aria-label={pinned ? 'Unpin lead' : 'Pin lead'}
              >
                {pinned ? '★' : '☆'}
              </button>
            )}
            <span className="crm-muted">{formatTimeAgo(lead.updatedAt)}</span>
          </div>
        </div>

        <p className="crm-pipeline-address">
          {isOverlay ? (
            <span className="crm-inline-link">{draft.listingAddress || 'No address provided'}</span>
          ) : (
            <button type="button" className="crm-inline-link" onClick={() => onOpenProfile(lead.id)}>
              {draft.listingAddress || 'No address provided'}
            </button>
          )}
        </p>

        {!isOverlay && linkedContact && (linkedContact.phone || linkedContact.email) ? (
          <div className="crm-quick-actions">
            {linkedContact.phone ? (
              <a href={`tel:${linkedContact.phone}`} className="crm-quick-action" title={`Call ${linkedContact.phone}`} aria-label="Call lead">
                📞
              </a>
            ) : null}
            {linkedContact.email ? (
              <a
                href={`mailto:${linkedContact.email}?subject=Following up on your inquiry`}
                className="crm-quick-action"
                title={`Email ${linkedContact.email}`}
                aria-label="Email lead"
              >
                ✉️
              </a>
            ) : null}
            {linkedContact.phone ? (
              <a href={`sms:${linkedContact.phone}`} className="crm-quick-action" title={`Text ${linkedContact.phone}`} aria-label="Text lead">
                💬
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="crm-chip-row">
          <span className="crm-chip">{formatLeadTypeLabel(lead.leadType)}</span>
          <span className="crm-chip">{formatLeadSourceLabel(lead.source)}</span>
          {hasUnsavedChanges ? <span className="crm-chip crm-chip-warning">Unsaved</span> : null}
          {hasMatchCriteria ? <span className="crm-chip crm-chip-match">Matches</span> : null}
          {aging.level !== 'fresh' ? (
            <span className={`crm-aging-badge crm-aging-badge--${aging.level}`}>{aging.label}</span>
          ) : null}
        </div>

        {dealVal > 0 ? (
          <div className="crm-pipeline-deal-value">
            <span className="crm-pipeline-deal-amount">{formatDealValue(dealVal)}</span>
            <span className="crm-pipeline-deal-commission">{formatCommission(dealVal)}</span>
          </div>
        ) : null}

        {!isOverlay && (
          <>
            <label className="crm-field">
              Status
              <select
                disabled={isSaving}
                value={draft.status}
                onChange={(event) => {
                  const value = event.target.value as CrmLeadStatus;
                  onDraftChange(lead.id, 'status', value);
                  const notice = getPipelineMoveNotice(contactLabel, value, pipelineStatusFilter);
                  if (notice) {
                    onFilterNotice(notice);
                  }
                }}
              >
                {LEAD_STATUSES.map((stage) => (
                  <option key={stage} value={stage}>
                    {formatLeadStatusLabel(stage)}
                  </option>
                ))}
              </select>
            </label>
            <label className="crm-field">
              Notes
              <textarea
                value={draft.notes}
                onChange={(event) => onDraftChange(lead.id, 'notes', event.target.value)}
                placeholder="Update lead notes..."
              />
            </label>
            <button
              type="button"
              className="crm-pipeline-save-button"
              disabled={isSaving}
              onClick={() => {
                void onSave(lead.id);
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
      </article>
    );
  }
);
