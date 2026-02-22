'use client';

import { useDroppable } from '@dnd-kit/core';
import type { CrmContact, CrmLead, CrmLeadStatus } from '@real-estate/types/crm';

import { formatLeadStatusLabel } from '../../lib/crm-display';
import { estimateDealValue, formatDealValue } from '../../lib/crm-aging';
import type { LeadDraft, LeadStatusFilter } from '../../lib/crm-types';
import { StatusIcon } from '../shared/StatusIcon';
import { EmptyState } from '../shared/EmptyState';
import { DraggablePipelineCard } from './DraggablePipelineCard';

export interface PipelineColumnProps {
  status: CrmLeadStatus;
  leads: CrmLead[];
  contactById: Map<string, CrmContact>;
  getLeadDraft: (lead: CrmLead) => LeadDraft;
  hasUnsavedLeadChange: (lead: CrmLead) => boolean;
  savingLeadIds: Record<string, true>;
  isPinned: (id: string) => boolean;
  pipelineStatusFilter: LeadStatusFilter;
  onOpenProfile: (leadId: string) => void;
  onTogglePin: (leadId: string) => void;
  onDraftChange: (leadId: string, field: keyof LeadDraft, value: string | CrmLeadStatus) => void;
  onSave: (leadId: string) => void;
  onFilterNotice: (notice: string | null) => void;
}

export function PipelineColumn({
  status,
  leads,
  contactById,
  getLeadDraft,
  hasUnsavedLeadChange,
  savingLeadIds,
  isPinned,
  pipelineStatusFilter,
  onOpenProfile,
  onTogglePin,
  onDraftChange,
  onSave,
  onFilterNotice,
}: PipelineColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  const laneTotal = leads.reduce((sum, l) => sum + estimateDealValue(l.priceMin, l.priceMax), 0);

  return (
    <section
      ref={setNodeRef}
      className={`crm-pipeline-column${isOver ? ' crm-pipeline-column--dragover' : ''}`}
    >
      <header className="crm-pipeline-column-head">
        <h4>
          <StatusIcon status={status} size={14} /> {formatLeadStatusLabel(status)}
        </h4>
        <div className="crm-pipeline-column-meta">
          <span className={`crm-status-badge crm-status-${status}`}>{leads.length}</span>
          {laneTotal > 0 && (
            <span className="crm-pipeline-lane-total">{formatDealValue(laneTotal)}</span>
          )}
        </div>
      </header>

      <div className="crm-pipeline-column-list">
        {leads.length === 0 ? (
          <EmptyState
            title={`No leads in ${formatLeadStatusLabel(status)}`}
            detail="Move a lead into this stage or clear filters to view hidden cards."
          />
        ) : (
          leads.map((lead) => (
            <DraggablePipelineCard
              key={lead.id}
              lead={lead}
              draft={getLeadDraft(lead)}
              hasUnsavedChanges={hasUnsavedLeadChange(lead)}
              isSaving={Boolean(savingLeadIds[lead.id])}
              isPinned={isPinned(lead.id)}
              contactById={contactById}
              pipelineStatusFilter={pipelineStatusFilter}
              onOpenProfile={onOpenProfile}
              onTogglePin={onTogglePin}
              onDraftChange={onDraftChange}
              onSave={onSave}
              onFilterNotice={onFilterNotice}
            />
          ))
        )}
      </div>
    </section>
  );
}
