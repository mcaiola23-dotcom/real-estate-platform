'use client';

import { forwardRef } from 'react';
import type { CrmContact, CrmLead, CrmLeadStatus } from '@real-estate/types/crm';

import { formatLeadSourceLabel, formatLeadStatusLabel, formatLeadTypeLabel } from '../../lib/crm-display';
import { formatTimeAgo, getLeadContactLabel, formatDateTime } from '../../lib/crm-formatters';
import { computeLeadAging, estimateDealValue, formatDealValue, formatCommission } from '../../lib/crm-aging';
import { getPipelineMoveNotice } from '../../lib/workspace-interactions';
import { LEAD_STATUSES, type LeadDraft, type LeadStatusFilter } from '../../lib/crm-types';

function getDaysInStage(lead: CrmLead): number {
  const now = Date.now();
  const updatedAt = new Date(lead.updatedAt).getTime();
  return Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'crm-score-high';
  if (score >= 40) return 'crm-score-medium';
  return 'crm-score-low';
}

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
  /** Lead score (0-100) */
  score?: number;
  /** Last contact date ISO string */
  lastContactAt?: string | null;
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
      score,
      lastContactAt,
      ...attrs
    },
    ref
  ) {
    const aging = computeLeadAging(lead.updatedAt);
    const dealVal = estimateDealValue(lead.priceMin, lead.priceMax);
    const contactLabel = getLeadContactLabel(lead, contactById);
    const hasMatchCriteria = Boolean(lead.propertyType || lead.beds || lead.baths || lead.priceMin || lead.priceMax);
    const linkedContact = lead.contactId ? contactById.get(lead.contactId) : null;
    const daysInStage = getDaysInStage(lead);

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

        <div className="crm-pipeline-card-info-strip">
          {score !== undefined && (
            <span className={`crm-pipeline-score-badge ${getScoreColor(score)}`} title={`Lead score: ${score}`}>
              {score}
            </span>
          )}
          <span className="crm-pipeline-days-in-stage" title={`Days in current stage: ${daysInStage}`}>
            {daysInStage}d
          </span>
          {lastContactAt && (
            <span className="crm-pipeline-last-contact" title={`Last contact: ${formatDateTime(lastContactAt)}`}>
              ✉ {formatTimeAgo(lastContactAt)}
            </span>
          )}
          {lead.nextActionNote && (
            <span className="crm-pipeline-next-action" title={lead.nextActionNote}>
              → {lead.nextActionNote.length > 25 ? lead.nextActionNote.slice(0, 22) + '...' : lead.nextActionNote}
            </span>
          )}
        </div>

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
