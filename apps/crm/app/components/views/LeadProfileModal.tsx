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
}: LeadProfileModalProps) {
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
              </div>
              <div className="crm-lead-insights-charts">
                <LeadActivityChart activities={activities} />
                <PriceInterestBar signals={listingSignals} />
              </div>
            </div>
            <AiLeadSummary leadId={lead.id} tenantId={lead.tenantId} />
            <AiNextActions leadId={lead.id} tenantId={lead.tenantId} />
          </section>
        </div>

        <ContactHistoryLog
          leadId={lead.id}
          contactId={lead.contactId}
          activities={activities}
          onLogContact={onLogContact}
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
