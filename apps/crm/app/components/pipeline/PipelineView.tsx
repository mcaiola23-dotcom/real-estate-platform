'use client';

import { useCallback, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { CrmContact, CrmLead, CrmLeadStatus } from '@real-estate/types/crm';

import { formatLeadSourceLabel, formatLeadStatusLabel, formatLeadTypeLabel } from '../../lib/crm-display';
import { getPipelineMoveNotice } from '../../lib/workspace-interactions';
import {
  ALL_LEAD_TYPE_FILTER,
  ALL_SOURCE_FILTER,
  ALL_STATUS_FILTER,
  LEAD_STATUSES,
  type LeadDraft,
  type LeadSourceFilter,
  type LeadStatusFilter,
  type LeadTypeFilter,
} from '../../lib/crm-types';
import { PipelineColumn } from './PipelineColumn';
import { PipelineCard } from './PipelineCard';
import { EmptyState } from '../shared/EmptyState';

export interface PipelineViewProps {
  groupedLeads: Record<CrmLeadStatus, CrmLead[]>;
  contactById: Map<string, CrmContact>;
  getLeadDraft: (lead: CrmLead) => LeadDraft;
  hasUnsavedLeadChange: (lead: CrmLead) => boolean;
  savingLeadIds: Record<string, true>;
  isPinned: (id: string) => boolean;
  sourceFilterOptions: string[];
  pipelineStatusFilter: LeadStatusFilter;
  pipelineSourceFilter: LeadSourceFilter;
  pipelineLeadTypeFilter: LeadTypeFilter;
  onStatusFilterChange: (value: LeadStatusFilter) => void;
  onSourceFilterChange: (value: LeadSourceFilter) => void;
  onLeadTypeFilterChange: (value: LeadTypeFilter) => void;
  onOpenProfile: (leadId: string) => void;
  onTogglePin: (leadId: string) => void;
  onDraftChange: (leadId: string, field: keyof LeadDraft, value: string | CrmLeadStatus) => void;
  onSave: (leadId: string) => void;
  pushToast: (kind: 'success' | 'error', message: string) => void;
}

export function PipelineView({
  groupedLeads,
  contactById,
  getLeadDraft,
  hasUnsavedLeadChange,
  savingLeadIds,
  isPinned,
  sourceFilterOptions,
  pipelineStatusFilter,
  pipelineSourceFilter,
  pipelineLeadTypeFilter,
  onStatusFilterChange,
  onSourceFilterChange,
  onLeadTypeFilterChange,
  onOpenProfile,
  onTogglePin,
  onDraftChange,
  onSave,
  pushToast,
}: PipelineViewProps) {
  const pipelineBoardRef = useRef<HTMLDivElement | null>(null);
  const [pipelineFilterNotice, setPipelineFilterNotice] = useState<string | null>(null);
  const [activeDragLead, setActiveDragLead] = useState<CrmLead | null>(null);
  const [swimlaneMode, setSwimlaneMode] = useState<'status' | 'type'>('status');

  // Type-grouped leads for "By Type" swimlane
  const LEAD_TYPES = ['website_lead', 'valuation_request'] as const;
  const typeGroupedLeads = LEAD_TYPES.reduce(
    (acc, type) => {
      acc[type] = LEAD_STATUSES.flatMap((s) => groupedLeads[s]).filter((l) => l.leadType === type);
      return acc;
    },
    {} as Record<string, CrmLead[]>
  );

  const hasPipelineFiltersActive =
    pipelineStatusFilter !== ALL_STATUS_FILTER ||
    pipelineSourceFilter !== ALL_SOURCE_FILTER ||
    pipelineLeadTypeFilter !== ALL_LEAD_TYPE_FILTER;

  const clearPipelineFilters = useCallback(() => {
    onStatusFilterChange(ALL_STATUS_FILTER);
    onSourceFilterChange(ALL_SOURCE_FILTER);
    onLeadTypeFilterChange(ALL_LEAD_TYPE_FILTER);
    setPipelineFilterNotice(null);
  }, [onStatusFilterChange, onSourceFilterChange, onLeadTypeFilterChange]);

  // Look up a lead across all grouped lanes by id
  const findLeadById = useCallback(
    (leadId: string): CrmLead | undefined => {
      for (const status of LEAD_STATUSES) {
        const found = groupedLeads[status].find((l) => l.id === leadId);
        if (found) return found;
      }
      return undefined;
    },
    [groupedLeads]
  );

  // DnD sensors: pointer with 8px activation distance to avoid accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const lead = findLeadById(String(event.active.id));
      setActiveDragLead(lead ?? null);
    },
    [findLeadById]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragLead(null);

      const { active, over } = event;
      if (!over) return;

      const leadId = String(active.id);
      const newStatus = String(over.id) as CrmLeadStatus;

      // Validate the drop target is a valid status column
      if (!LEAD_STATUSES.includes(newStatus)) return;

      const lead = findLeadById(leadId);
      if (!lead) return;

      const draft = getLeadDraft(lead);
      if (draft.status === newStatus) return;

      // Optimistic update: change draft status
      onDraftChange(leadId, 'status', newStatus);

      // Show filter notice if applicable
      const contactLabel = lead.contactId ? 'Lead' : 'Lead';
      const notice = getPipelineMoveNotice(contactLabel, newStatus, pipelineStatusFilter);
      if (notice) {
        setPipelineFilterNotice(notice);
      }

      // Auto-save the status change
      onSave(leadId);

      pushToast('success', `Lead moved to ${formatLeadStatusLabel(newStatus)}`);
    },
    [findLeadById, getLeadDraft, onDraftChange, onSave, pipelineStatusFilter, pushToast]
  );

  return (
    <section className="crm-pipeline-view">
      <div className="crm-panel crm-pipeline-filter-panel">
        <div className="crm-panel-head">
          <h3>Pipeline Filters</h3>
          <span className="crm-muted">Pipeline-local filters are independent from dashboard filters.</span>
        </div>
        <div className="crm-filter-grid">
          <label className="crm-field crm-field-grow">
            Source
            <select value={pipelineSourceFilter} onChange={(event) => onSourceFilterChange(event.target.value)}>
              <option value={ALL_SOURCE_FILTER}>All sources</option>
              {sourceFilterOptions.map((source) => (
                <option key={source} value={source}>
                  {formatLeadSourceLabel(source)}
                </option>
              ))}
            </select>
          </label>
          <label className="crm-field crm-field-grow">
            Lead type
            <select
              value={pipelineLeadTypeFilter}
              onChange={(event) => onLeadTypeFilterChange(event.target.value as LeadTypeFilter)}
            >
              <option value={ALL_LEAD_TYPE_FILTER}>All types</option>
              <option value="website_lead">Website Lead</option>
              <option value="valuation_request">Valuation Request</option>
            </select>
          </label>
          <label className="crm-field crm-field-grow">
            Status
            <select
              value={pipelineStatusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value as LeadStatusFilter)}
            >
              <option value={ALL_STATUS_FILTER}>All statuses</option>
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLeadStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="crm-inline-controls">
          <div className="crm-swimlane-toggle" role="group" aria-label="Pipeline view mode">
            <button
              type="button"
              className={`crm-toggle-btn ${swimlaneMode === 'status' ? 'crm-toggle-btn--active' : ''}`}
              onClick={() => setSwimlaneMode('status')}
            >
              By Status
            </button>
            <button
              type="button"
              className={`crm-toggle-btn ${swimlaneMode === 'type' ? 'crm-toggle-btn--active' : ''}`}
              onClick={() => setSwimlaneMode('type')}
            >
              By Type
            </button>
          </div>
          <button type="button" className="crm-secondary-button" onClick={clearPipelineFilters}>
            Clear filters
          </button>
          <div className="crm-lane-controls" aria-label="Pipeline lane navigation">
            <button
              type="button"
              className="crm-secondary-button"
              onClick={() => pipelineBoardRef.current?.scrollBy({ left: -360, behavior: 'smooth' })}
            >
              ←
            </button>
            <button
              type="button"
              className="crm-secondary-button"
              onClick={() => pipelineBoardRef.current?.scrollBy({ left: 360, behavior: 'smooth' })}
            >
              →
            </button>
          </div>
        </div>
        {pipelineFilterNotice ? (
          <p className="crm-banner-warning">
            {pipelineFilterNotice}
            {hasPipelineFiltersActive ? ' Clear filters to view moved lead.' : ''}
          </p>
        ) : null}
      </div>

      {swimlaneMode === 'status' ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="crm-pipeline-board" aria-label="Pipeline board by status" ref={pipelineBoardRef}>
            {LEAD_STATUSES.map((status) => (
              <PipelineColumn
                key={status}
                status={status}
                leads={groupedLeads[status]}
                contactById={contactById}
                getLeadDraft={getLeadDraft}
                hasUnsavedLeadChange={hasUnsavedLeadChange}
                savingLeadIds={savingLeadIds}
                isPinned={isPinned}
                pipelineStatusFilter={pipelineStatusFilter}
                onOpenProfile={onOpenProfile}
                onTogglePin={onTogglePin}
                onDraftChange={onDraftChange}
                onSave={onSave}
                onFilterNotice={setPipelineFilterNotice}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeDragLead ? (
              <PipelineCard
                lead={activeDragLead}
                draft={getLeadDraft(activeDragLead)}
                hasUnsavedChanges={false}
                isSaving={false}
                isPinned={false}
                contactById={contactById}
                pipelineStatusFilter={pipelineStatusFilter}
                onOpenProfile={() => {}}
                onTogglePin={() => {}}
                onDraftChange={() => {}}
                onSave={() => {}}
                onFilterNotice={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="crm-pipeline-board crm-pipeline-board--by-type" aria-label="Pipeline board by type" ref={pipelineBoardRef}>
          {LEAD_TYPES.map((type) => {
            const typeLeads = typeGroupedLeads[type];
            return (
              <section key={type} className="crm-pipeline-column">
                <header className="crm-pipeline-column-head">
                  <h4>{formatLeadTypeLabel(type)}</h4>
                  <div className="crm-pipeline-column-meta">
                    <span className="crm-status-badge crm-status-new">{typeLeads.length}</span>
                  </div>
                </header>
                <div className="crm-pipeline-column-list">
                  {typeLeads.length === 0 ? (
                    <EmptyState
                      title={`No ${formatLeadTypeLabel(type).toLowerCase()} leads`}
                      detail="Leads of this type will appear here when they enter the pipeline."
                    />
                  ) : (
                    typeLeads.map((lead) => {
                      const draft = getLeadDraft(lead);
                      return (
                        <article key={lead.id} className="crm-pipeline-card crm-pipeline-card--compact">
                          <div className="crm-pipeline-card-top">
                            <strong>
                              <button type="button" className="crm-inline-link" onClick={() => onOpenProfile(lead.id)}>
                                {lead.contactId ? 'Lead' : 'No contact'}
                              </button>
                            </strong>
                            <span className={`crm-status-dot crm-status-dot--${draft.status}`} title={formatLeadStatusLabel(draft.status)} />
                          </div>
                          <p className="crm-pipeline-address">
                            <button type="button" className="crm-inline-link" onClick={() => onOpenProfile(lead.id)}>
                              {draft.listingAddress || 'No address'}
                            </button>
                          </p>
                          <div className="crm-chip-row">
                            <span className={`crm-status-badge crm-status-${draft.status}`}>
                              {formatLeadStatusLabel(draft.status)}
                            </span>
                            <span className="crm-chip">{formatLeadSourceLabel(lead.source)}</span>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
