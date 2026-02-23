'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { CrmActivity, CrmContact, CrmLead, CrmLeadStatus } from '@real-estate/types/crm';
import type { Listing } from '@real-estate/types/listings';
import type {
  ContactDraft,
  LeadDraft,
  LeadListingSignal,
  LeadSearchSignal,
} from '../../lib/crm-types';
import { LEAD_STATUSES } from '../../lib/crm-types';
import { formatDateTime } from '../../lib/crm-formatters';
import {
  formatLeadSourceLabel,
  formatLeadStatusLabel,
  formatLeadTypeLabel,
} from '../../lib/crm-display';
import { LeadEngagementGauge } from '../shared/LeadEngagementGauge';
import { AiScoreExplanation } from '../shared/AiScoreExplanation';
import { LeadActivityChart } from '../shared/LeadActivityChart';
import { PriceInterestBar } from '../shared/PriceInterestBar';
import { ContactHistoryLog } from '../leads/ContactHistoryLog';
import { AiLeadSummary } from '../leads/AiLeadSummary';
import { AiNextActions } from '../leads/AiNextActions';
import { DuplicateWarning } from '../leads/DuplicateWarning';
import { LeadTagInput } from '../leads/LeadTagInput';
import { SourceAttributionChain } from '../leads/SourceAttributionChain';
import { UnifiedTimeline } from '../leads/UnifiedTimeline';
import { SmartReminderForm } from '../shared/SmartReminderForm';
import { AiPredictiveScore } from '../shared/AiPredictiveScore';
import { AiLeadRouting } from '../shared/AiLeadRouting';
import { TemplateLibrary } from '../shared/TemplateLibrary';
import { AiDraftComposer } from '../shared/AiDraftComposer';
import { GmailComposer } from '../shared/GmailComposer';
import { GmailThreads } from '../shared/GmailThreads';
import type { MergeFieldContext } from '../../lib/crm-templates';
import { downloadIcsFile } from '../../lib/crm-calendar';

interface LeadProfileModalProps {
  lead: CrmLead;
  leadDraft: LeadDraft;
  activeContact: CrmContact | null;
  activeContactDraft: ContactDraft | undefined;
  activeLeadLastContact: string | null;
  searchSignals: LeadSearchSignal[];
  listingSignals: LeadListingSignal[];
  activities: CrmActivity[];
  leadScore: { score: number; label: string };
  savingLead: boolean;
  savingContact: boolean;
  hasUnsavedLeadChange: boolean;
  hasUnsavedContactChange: boolean;
  onClose: () => void;
  onSetLeadDraftField: (leadId: string, field: keyof LeadDraft, value: string) => void;
  onSetContactDraft: Dispatch<SetStateAction<Record<string, ContactDraft>>>;
  onUpdateLead: (leadId: string) => Promise<void>;
  onUpdateContact: (contactId: string) => Promise<void>;
  onClearLeadDraft: (leadId: string) => void;
  onLogContact: (activityType: string, summary: string) => Promise<void>;
  onViewLead?: (leadId: string) => void;
  onSaveReminder?: (leadId: string, data: { nextActionAt: string; nextActionNote: string; nextActionChannel: string }) => void;
  onSnoozeReminder?: (leadId: string, durationMs: number) => void;
}

export function LeadProfileModal({
  lead,
  leadDraft,
  activeContact,
  activeContactDraft,
  activeLeadLastContact,
  searchSignals,
  listingSignals,
  activities,
  leadScore,
  savingLead,
  savingContact,
  hasUnsavedLeadChange,
  hasUnsavedContactChange,
  onClose,
  onSetLeadDraftField,
  onSetContactDraft,
  onUpdateLead,
  onUpdateContact,
  onClearLeadDraft,
  onLogContact,
  onViewLead,
  onSaveReminder,
  onSnoozeReminder,
}: LeadProfileModalProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAiComposer, setShowAiComposer] = useState(false);
  const [showGmailComposer, setShowGmailComposer] = useState(false);
  const [showGmailThreads, setShowGmailThreads] = useState(false);
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);

  // Check Google connection status
  useEffect(() => {
    let cancelled = false;
    fetch('/api/integrations/google/status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setGoogleConnected(data.connected ?? false);
      })
      .catch(() => {
        if (!cancelled) setGoogleConnected(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Suggested property matches — derive loading from data staleness to avoid synchronous setState in effect body
  interface MatchEntry { listing: Listing; score: number; matchReasons: string[] }
  const [matchData, setMatchData] = useState<{ leadId: string; data: MatchEntry[] } | null>(null);

  const hasPreferences = Boolean(lead.propertyType || lead.beds || lead.baths || lead.priceMin || lead.priceMax);
  const propertyMatches = hasPreferences && matchData?.leadId === lead.id ? matchData.data : [];
  const matchesLoading = hasPreferences && (!matchData || matchData.leadId !== lead.id);

  useEffect(() => {
    if (!hasPreferences) return;

    let cancelled = false;
    fetch(`/api/leads/${lead.id}/matches?limit=5`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { matches?: MatchEntry[] } | null) => {
        if (!cancelled) {
          setMatchData({ leadId: lead.id, data: json?.matches ?? [] });
        }
      })
      .catch(() => {
        if (!cancelled) setMatchData({ leadId: lead.id, data: [] });
      });

    return () => { cancelled = true; };
  }, [lead.id, lead.propertyType, lead.beds, lead.baths, lead.priceMin, lead.priceMax, hasPreferences]);

  return (
    <div
      className="crm-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="crm-modal" role="dialog" aria-modal="true" aria-labelledby="crm-lead-profile-title">
        <header className="crm-modal-header">
          <div>
            <p className="crm-kicker">Lead Profile</p>
            <h3 id="crm-lead-profile-title">{leadDraft.listingAddress || 'Lead Details'}</h3>
            <p className="crm-muted">
              Created {formatDateTime(lead.createdAt)} • Updated {formatDateTime(lead.updatedAt)}
            </p>
            {activeContact && (activeContact.phone || activeContact.email) ? (
              <div className="crm-quick-actions" style={{ marginTop: '0.5rem' }}>
                {activeContact.phone ? (
                  <a href={`tel:${activeContact.phone}`} className="crm-quick-action" title={`Call ${activeContact.phone}`} aria-label="Call lead">
                    📞
                  </a>
                ) : null}
                {activeContact.email ? (
                  <a
                    href={`mailto:${activeContact.email}?subject=${encodeURIComponent(`Re: ${leadDraft.listingAddress || 'Your inquiry'}`)}`}
                    className="crm-quick-action"
                    title={`Email ${activeContact.email}`}
                    aria-label="Email lead"
                  >
                    ✉️
                  </a>
                ) : null}
                {activeContact.phone ? (
                  <a href={`sms:${activeContact.phone}`} className="crm-quick-action" title={`Text ${activeContact.phone}`} aria-label="Text lead">
                    💬
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
          <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close lead profile">
            ✕
          </button>
        </header>

        <DuplicateWarning
          leadId={lead.id}
          email={activeContact?.email ?? null}
          phone={activeContact?.phone ?? null}
          address={lead.listingAddress}
          onViewLead={onViewLead ?? (() => {})}
        />

        <div className="crm-modal-grid">
          <section className="crm-modal-section">
            <h4>Lead + Contact Details</h4>
            <div className="crm-chip-row">
              <span className="crm-chip">{formatLeadTypeLabel(lead.leadType)}</span>
              <span className="crm-chip">{formatLeadSourceLabel(lead.source)}</span>
              <span className={`crm-status-badge crm-status-${leadDraft.status}`}>
                {formatLeadStatusLabel(leadDraft.status)}
              </span>
              {hasUnsavedLeadChange ? <span className="crm-chip crm-chip-warning">Unsaved lead changes</span> : null}
              {activeContact && hasUnsavedContactChange ? (
                <span className="crm-chip crm-chip-warning">Unsaved contact changes</span>
              ) : null}
            </div>

            <SourceAttributionChain source={lead.source} activities={activities} />

            <LeadTagInput
              leadId={lead.id}
              tenantId={lead.tenantId}
              initialTags={lead.tags}
              onTagsChange={() => { /* parent refresh handled by API persist */ }}
            />

            <div className="crm-modal-definition-grid">
              <p>
                <span>Last Contact</span>
                <strong>{activeLeadLastContact ? formatDateTime(activeLeadLastContact) : 'No contact logged'}</strong>
              </p>
            </div>

            <div className="crm-inline-edit-row">
              <div className="crm-inline-edit-field">
                <label>Next Action Date</label>
                <input
                  type="date"
                  value={leadDraft.nextActionAt ? leadDraft.nextActionAt.split('T')[0] : ''}
                  onChange={(e) => onSetLeadDraftField(lead.id, 'nextActionAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                />
              </div>
              <div className="crm-inline-edit-field">
                <label>Next Action Note</label>
                <input
                  type="text"
                  value={leadDraft.nextActionNote}
                  onChange={(e) => onSetLeadDraftField(lead.id, 'nextActionNote', e.target.value)}
                  placeholder="Follow up re: showing"
                />
              </div>
            </div>

            <div className="crm-inline-edit-row">
              <div className="crm-inline-edit-field">
                <label>Min Price ($)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={leadDraft.priceMin}
                  onChange={(e) => onSetLeadDraftField(lead.id, 'priceMin', e.target.value)}
                  placeholder="350000"
                />
              </div>
              <div className="crm-inline-edit-field">
                <label>Max Price ($)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={leadDraft.priceMax}
                  onChange={(e) => onSetLeadDraftField(lead.id, 'priceMax', e.target.value)}
                  placeholder="550000"
                />
              </div>
            </div>

            <div className="crm-modal-edit-grid">
              <label className="crm-field crm-field-grow">
                Contact Name
                <input
                  value={activeContactDraft?.fullName ?? ''}
                  onChange={(event) => {
                    if (!activeContact) return;
                    const value = event.target.value;
                    onSetContactDraft((prev) => ({
                      ...prev,
                      [activeContact.id]: {
                        ...(prev[activeContact.id] ?? {
                          fullName: activeContact.fullName ?? '',
                          email: activeContact.email ?? '',
                          phone: activeContact.phone ?? '',
                        }),
                        fullName: value,
                      },
                    }));
                  }}
                  disabled={!activeContact}
                  placeholder="No linked contact"
                />
              </label>
              <label className="crm-field crm-field-grow">
                Contact Email
                <input
                  value={activeContactDraft?.email ?? ''}
                  onChange={(event) => {
                    if (!activeContact) return;
                    const value = event.target.value;
                    onSetContactDraft((prev) => ({
                      ...prev,
                      [activeContact.id]: {
                        ...(prev[activeContact.id] ?? {
                          fullName: activeContact.fullName ?? '',
                          email: activeContact.email ?? '',
                          phone: activeContact.phone ?? '',
                        }),
                        email: value,
                      },
                    }));
                  }}
                  disabled={!activeContact}
                />
              </label>
            </div>

            <div className="crm-modal-edit-grid">
              <label className="crm-field crm-field-grow">
                Contact Phone
                <input
                  value={activeContactDraft?.phone ?? ''}
                  onChange={(event) => {
                    if (!activeContact) return;
                    const value = event.target.value;
                    onSetContactDraft((prev) => ({
                      ...prev,
                      [activeContact.id]: {
                        ...(prev[activeContact.id] ?? {
                          fullName: activeContact.fullName ?? '',
                          email: activeContact.email ?? '',
                          phone: activeContact.phone ?? '',
                        }),
                        phone: value,
                      },
                    }));
                  }}
                  disabled={!activeContact}
                />
              </label>
              <label className="crm-field crm-field-grow">
                Address
                <input
                  value={leadDraft.listingAddress}
                  onChange={(event) => onSetLeadDraftField(lead.id, 'listingAddress', event.target.value)}
                />
              </label>
            </div>

            <div className="crm-modal-edit-grid">
              <label className="crm-field">
                Status
                <select
                  value={leadDraft.status}
                  onChange={(event) => {
                    const value = event.target.value as CrmLeadStatus;
                    onSetLeadDraftField(lead.id, 'status', value);
                  }}
                >
                  {LEAD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatLeadStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="crm-field crm-field-grow">
                Property Type
                <select
                  value={leadDraft.propertyType}
                  onChange={(event) => onSetLeadDraftField(lead.id, 'propertyType', event.target.value)}
                >
                  <option value="">Not specified</option>
                  <option value="single-family">Single Family</option>
                  <option value="condo">Condo / Townhome</option>
                  <option value="multi-family">Multifamily</option>
                  <option value="commercial">Commercial</option>
                  <option value="rental">Rental</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <div className="crm-modal-edit-grid crm-modal-edit-grid-three">
              <label className="crm-field">
                Beds desired
                <input
                  value={leadDraft.beds}
                  onChange={(event) => onSetLeadDraftField(lead.id, 'beds', event.target.value)}
                />
              </label>
              <label className="crm-field">
                Baths desired
                <input
                  value={leadDraft.baths}
                  onChange={(event) => onSetLeadDraftField(lead.id, 'baths', event.target.value)}
                />
              </label>
              <label className="crm-field">
                Size desired (sqft)
                <input
                  value={leadDraft.sqft}
                  onChange={(event) => onSetLeadDraftField(lead.id, 'sqft', event.target.value)}
                />
              </label>
            </div>

            <div className="crm-modal-edit-grid">
              <label className="crm-field crm-field-grow">
                Next Action
                <input
                  value={leadDraft.timeframe}
                  onChange={(event) => onSetLeadDraftField(lead.id, 'timeframe', event.target.value)}
                  placeholder="Schedule next call"
                />
              </label>
            </div>

            <label className="crm-field crm-field-grow">
              Notes
              <textarea
                value={leadDraft.notes}
                onChange={(event) => onSetLeadDraftField(lead.id, 'notes', event.target.value)}
                placeholder="Capture call outcomes, objections, and next actions..."
              />
            </label>

            <div className="crm-actions-row">
              <button
                type="button"
                disabled={savingLead}
                onClick={() => { void onUpdateLead(lead.id); }}
              >
                {savingLead ? 'Saving...' : 'Save Lead'}
              </button>
              <button
                type="button"
                className="crm-secondary-button"
                disabled={!activeContact || savingContact}
                onClick={() => {
                  if (!activeContact) return;
                  void onUpdateContact(activeContact.id);
                }}
              >
                {savingContact ? 'Saving...' : 'Save Contact'}
              </button>
              <button
                type="button"
                className="crm-secondary-button"
                onClick={() => {
                  onClearLeadDraft(lead.id);
                  if (activeContact) {
                    onSetContactDraft((prev) => {
                      const next = { ...prev };
                      delete next[activeContact.id];
                      return next;
                    });
                  }
                }}
              >
                Discard Draft
              </button>
            </div>
          </section>

          <section className="crm-modal-section">
            <h4>Lead Intelligence</h4>
            <div className="crm-lead-insights">
              <div className="crm-lead-insights__gauge-wrapper">
                <LeadEngagementGauge score={leadScore.score} label={leadScore.label} />
                <AiScoreExplanation
                  leadId={lead.id}
                  tenantId={lead.tenantId}
                />
                <AiPredictiveScore
                  leadId={lead.id}
                  tenantId={lead.tenantId}
                />
              </div>
              <div className="crm-lead-insights-charts">
                <LeadActivityChart activities={activities} />
                <PriceInterestBar signals={listingSignals} />
              </div>
            </div>
            <AiLeadSummary leadId={lead.id} tenantId={lead.tenantId} />
            <AiNextActions leadId={lead.id} tenantId={lead.tenantId} />
            <AiLeadRouting
              leadId={lead.id}
              tenantId={lead.tenantId}
              currentAssignee={lead.assignedTo}
            />
            <SmartReminderForm
              leadId={lead.id}
              tenantId={lead.tenantId}
              currentNextAction={lead.nextActionAt}
              currentNextActionNote={lead.nextActionNote}
              currentChannel={lead.nextActionChannel}
              onSave={(data) => onSaveReminder?.(lead.id, data)}
              onSnooze={(ms) => onSnoozeReminder?.(lead.id, ms)}
            />
            {lead.nextActionAt && (
              <div className="crm-calendar-add-row">
                {googleConnected ? (
                  <button
                    type="button"
                    className="crm-secondary-button"
                    disabled={addingToCalendar || calendarAdded}
                    onClick={async () => {
                      setAddingToCalendar(true);
                      try {
                        const res = await fetch('/api/integrations/google/calendar/sync', { method: 'POST' });
                        const data = await res.json();
                        if (data.ok) setCalendarAdded(true);
                      } catch { /* handled by sync result */ }
                      setAddingToCalendar(false);
                    }}
                  >
                    {calendarAdded ? '✓ Synced to Calendar' : addingToCalendar ? 'Adding...' : '📅 Add to Google Calendar'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="crm-secondary-button"
                    onClick={() => {
                      downloadIcsFile({
                        title: `Follow up: ${activeContact?.fullName ?? 'Lead'} — ${lead.nextActionNote || 'Follow up'}`,
                        startDate: new Date(lead.nextActionAt!),
                        description: lead.notes || undefined,
                      });
                    }}
                  >
                    📅 Download .ics
                  </button>
                )}
              </div>
            )}
            <div className="crm-template-toggle" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="crm-template-toggle__btn"
                onClick={() => { setShowTemplates(!showTemplates); setShowAiComposer(false); }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                </svg>
                {showTemplates ? 'Hide Templates' : 'Message Templates'}
              </button>
              <button
                type="button"
                className="crm-template-toggle__btn"
                onClick={() => { setShowAiComposer(!showAiComposer); setShowTemplates(false); setShowGmailComposer(false); }}
              >
                <span style={{ marginRight: '0.25rem' }}>◆</span>
                {showAiComposer ? 'Hide Composer' : 'Draft with AI'}
              </button>
              {activeContact?.email && (
                <button
                  type="button"
                  className="crm-template-toggle__btn"
                  onClick={() => { setShowGmailComposer(!showGmailComposer); setShowTemplates(false); setShowAiComposer(false); }}
                >
                  ✉️ {showGmailComposer ? 'Hide Email' : googleConnected ? 'Send via Gmail' : 'Email'}
                </button>
              )}
              {activeContact?.email && googleConnected && (
                <button
                  type="button"
                  className="crm-template-toggle__btn"
                  onClick={() => setShowGmailThreads(!showGmailThreads)}
                >
                  📧 {showGmailThreads ? 'Hide Threads' : 'Email History'}
                </button>
              )}
            </div>
            {showTemplates && (
              <TemplateLibrary
                mergeContext={{
                  leadName: activeContact?.fullName ?? null,
                  agentName: null,
                  propertyAddress: lead.listingAddress,
                  propertyType: lead.propertyType,
                  priceRange: lead.priceMin && lead.priceMax ? `$${lead.priceMin.toLocaleString()}-$${lead.priceMax.toLocaleString()}` : null,
                  timeframe: lead.timeframe,
                  agentPhone: null,
                  agentEmail: null,
                } satisfies MergeFieldContext}
                tenantId={lead.tenantId}
                leadId={lead.id}
                onUseTemplate={(data) => {
                  if (data.channel === 'email' && activeContact?.email) {
                    const subject = encodeURIComponent(data.subject || '');
                    const body = encodeURIComponent(data.body);
                    window.open(`mailto:${activeContact.email}?subject=${subject}&body=${body}`, '_blank');
                  } else {
                    void navigator.clipboard.writeText(data.body);
                  }
                  setShowTemplates(false);
                }}
                onClose={() => setShowTemplates(false)}
              />
            )}
            {showAiComposer && (
              <AiDraftComposer
                leadId={lead.id}
                tenantId={lead.tenantId}
                contactName={activeContact?.fullName ?? null}
                contactEmail={activeContact?.email ?? null}
                contactPhone={activeContact?.phone ?? null}
                propertyAddress={lead.listingAddress}
                onClose={() => setShowAiComposer(false)}
                onSend={() => setShowAiComposer(false)}
              />
            )}
            {showGmailComposer && activeContact?.email && (
              <GmailComposer
                to={activeContact.email}
                leadId={lead.id}
                contactName={activeContact.fullName ?? undefined}
                propertyAddress={lead.listingAddress ?? undefined}
                googleConnected={googleConnected ?? false}
                onClose={() => setShowGmailComposer(false)}
                onSent={() => {
                  setShowGmailComposer(false);
                  void onLogContact('email_sent', `Email sent to ${activeContact.email}`);
                }}
              />
            )}
            {showGmailThreads && activeContact?.email && googleConnected && (
              <GmailThreads
                email={activeContact.email}
                onReply={(threadId, subject) => {
                  setShowGmailComposer(true);
                  setShowGmailThreads(false);
                }}
                onClose={() => setShowGmailThreads(false)}
              />
            )}
          </section>
        </div>

        <ContactHistoryLog
          leadId={lead.id}
          tenantId={lead.tenantId}
          contactId={lead.contactId}
          activities={activities}
          onLogContact={onLogContact}
          onApplyInsights={(insights) => {
            const insightText = insights.map((i) => `[${i.category}] ${i.value}`).join('\n');
            const existing = leadDraft.notes?.trim() || '';
            const separator = existing ? '\n---\n' : '';
            onSetLeadDraftField(lead.id, 'notes', existing + separator + insightText);
            void onUpdateLead(lead.id);
          }}
        />

        {(propertyMatches.length > 0 || matchesLoading) ? (
          <section className="crm-modal-section crm-suggested-properties">
            <h4>
              Suggested Properties
              {propertyMatches.length > 0 && !matchesLoading ? (
                <span className="crm-match-badge">{propertyMatches.length} match{propertyMatches.length !== 1 ? 'es' : ''}</span>
              ) : null}
            </h4>
            {matchesLoading ? (
              <p className="crm-muted">Finding matching properties...</p>
            ) : (
              <div className="crm-suggested-properties-list">
                {propertyMatches.map((match) => (
                  <article key={match.listing.id} className="crm-suggested-property-card">
                    <div className="crm-suggested-property-header">
                      <strong>{match.listing.address.street}</strong>
                      <span className="crm-match-score">
                        {match.score >= 4 ? '★★★' : match.score >= 2 ? '★★' : '★'} {match.score}pt
                      </span>
                    </div>
                    <p className="crm-muted">
                      {match.listing.address.city}, {match.listing.address.state} {match.listing.address.zip}
                    </p>
                    <div className="crm-chip-row">
                      <span className="crm-chip">${match.listing.price.toLocaleString()}</span>
                      <span className="crm-chip">{match.listing.beds} bd / {match.listing.baths} ba</span>
                      <span className="crm-chip">{match.listing.sqft.toLocaleString()} sqft</span>
                      <span className={`crm-status-badge crm-status-${match.listing.status === 'active' ? 'new' : 'nurturing'}`}>
                        {match.listing.status}
                      </span>
                    </div>
                    <div className="crm-match-reasons">
                      {match.matchReasons.map((reason) => (
                        <span key={reason} className="crm-chip crm-chip-match">{reason}</span>
                      ))}
                    </div>
                    <div className="crm-suggested-property-actions">
                      <button
                        type="button"
                        className="crm-secondary-button"
                        onClick={() => {
                          onSetLeadDraftField(lead.id, 'listingAddress', match.listing.address.street);
                        }}
                      >
                        Assign to Lead
                      </button>
                      {activeContact?.email ? (
                        <a
                          className="crm-secondary-button"
                          href={`mailto:${activeContact.email}?subject=Property Match: ${match.listing.address.street}&body=Hi ${activeContact.fullName ?? ''},\n\nI found a property that matches your criteria:\n\n${match.listing.address.street}, ${match.listing.address.city}\n$${match.listing.price.toLocaleString()} • ${match.listing.beds} beds / ${match.listing.baths} baths • ${match.listing.sqft.toLocaleString()} sqft\n\nLet me know if you'd like to schedule a showing!`}
                        >
                          Send to Client
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <UnifiedTimeline
          activities={activities}
          searchSignals={searchSignals}
          listingSignals={listingSignals}
        />
      </section>
    </div>
  );
}
