'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { CrmActivity, CrmContact, CrmLead, CrmLeadStatus, CrmLeadType } from '@real-estate/types/crm';
import type { Listing } from '@real-estate/types/listings';
import type {
  ContactDraft,
  LeadDraft,
  LeadListingSignal,
  LeadSearchSignal,
} from '../../lib/crm-types';
import { LEAD_STATUSES } from '../../lib/crm-types';
import { formatDateTime, formatTimeAgo } from '../../lib/crm-formatters';
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
// DuplicateWarning removed — revisit when duplicate merge flow is built
// import { DuplicateWarning } from '../leads/DuplicateWarning';
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
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { CrmListingModal } from '../shared/CrmListingModal';
import type { MergeFieldContext } from '../../lib/crm-templates';
import { downloadIcsFile } from '../../lib/crm-calendar';
import type { CrmShowing } from '@real-estate/types/crm';
import { ShowingScheduler } from '../shared/ShowingScheduler';
// EscalationBanner removed — was too aggressive without actionable info
// import { EscalationBanner } from '../shared/EscalationBanner';
// import { computeLeadEscalationLevel } from '@real-estate/ai/crm/escalation-engine';

// ---------------------------------------------------------------------------
// Tab type + icons
// ---------------------------------------------------------------------------

type ModalTab = 'overview' | 'communication' | 'intelligence' | 'activity';

const TabOverviewIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const TabCommsIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 3h11A1.5 1.5 0 0115 4.5v6a1.5 1.5 0 01-1.5 1.5H5L2 14.5V4.5A1.5 1.5 0 013.5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TabIntelIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TabActivityIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2 8h3l1.5-4 3 8L11 8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// Quick action SVG icons (replacing emojis)
// ---------------------------------------------------------------------------

const QuickPhoneIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M6 3H4.5A1.5 1.5 0 003 4.5v1A8.5 8.5 0 0010.5 14h1a1.5 1.5 0 001.5-1.5V11l-2.5-1.5L9 11a5 5 0 01-4-4l1.5-1.5L5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const QuickEmailIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const QuickTextIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 3h11A1.5 1.5 0 0115 4.5v6a1.5 1.5 0 01-1.5 1.5H5L2 14.5V4.5A1.5 1.5 0 013.5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

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
  onSetLeadDraftField: (leadId: string, field: keyof LeadDraft, value: string | string[]) => void;
  onSetContactDraft: Dispatch<SetStateAction<Record<string, ContactDraft>>>;
  onUpdateLead: (leadId: string) => Promise<void>;
  onUpdateContact: (contactId: string) => Promise<void>;
  onClearLeadDraft: (leadId: string) => void;
  onLogContact: (activityType: string, summary: string) => Promise<void>;
  onViewLead?: (leadId: string) => void;
  onDeleteLead?: (leadId: string) => Promise<void>;
  dismissedDuplicateIds?: Set<string>;
  onDismissDuplicate?: (leadId: string) => void;
  onSaveReminder?: (leadId: string, data: { nextActionAt: string; nextActionNote: string; nextActionChannel: string }) => void;
  onSnoozeReminder?: (leadId: string, durationMs: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
  onDeleteLead,
  dismissedDuplicateIds,
  onDismissDuplicate,
  onSaveReminder,
  onSnoozeReminder,
}: LeadProfileModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAiComposer, setShowAiComposer] = useState(false);
  const [showGmailComposer, setShowGmailComposer] = useState(false);
  const [showGmailThreads, setShowGmailThreads] = useState(false);
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [showings, setShowings] = useState<CrmShowing[]>([]);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [generatingPortal, setGeneratingPortal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replyContext, setReplyContext] = useState<{ threadId: string; subject: string } | null>(null);

  // Escalation banner removed — revisit when actionable resolution flow is built

  // Color-coded last contact badge
  const lastContactColorClass = useMemo(() => {
    if (!activeLeadLastContact) return 'crm-last-contact-none';
    const days = (Date.now() - new Date(activeLeadLastContact).getTime()) / (1000 * 60 * 60 * 24);
    if (days < 7) return 'crm-last-contact-recent';
    if (days <= 28) return 'crm-last-contact-aging';
    return 'crm-last-contact-stale';
  }, [activeLeadLastContact]);

  const modalRef = useRef<HTMLElement>(null);

  // -- Focus trap --
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Auto-focus first interactive element
    requestAnimationFrame(() => {
      const firstFocusable = modal.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    });

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch showings for this lead
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/showings?leadId=${lead.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.showings) setShowings(data.showings);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [lead.id]);

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

  // Suggested property matches
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

  // Unified save
  const handleSaveAll = useCallback(async () => {
    if (hasUnsavedLeadChange) {
      await onUpdateLead(lead.id);
    }
    if (activeContact && hasUnsavedContactChange) {
      await onUpdateContact(activeContact.id);
    }
  }, [lead.id, activeContact, hasUnsavedLeadChange, hasUnsavedContactChange, onUpdateLead, onUpdateContact]);

  const handleDiscard = useCallback(() => {
    onClearLeadDraft(lead.id);
    if (activeContact) {
      onSetContactDraft((prev) => {
        const next = { ...prev };
        delete next[activeContact.id];
        return next;
      });
    }
  }, [lead.id, activeContact, onClearLeadDraft, onSetContactDraft]);

  const handleListingClick = useCallback((listingId: string) => {
    // Try to find listing in matches first
    const match = propertyMatches.find((m) => m.listing.id === listingId);
    if (match) {
      setSelectedListing(match.listing);
      return;
    }
    // Fetch from API
    fetch(`/api/listings/${listingId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.listing) setSelectedListing(data.listing);
      })
      .catch(() => {});
  }, [propertyMatches]);

  const hasUnsavedChanges = hasUnsavedLeadChange || hasUnsavedContactChange;

  return (
    <div
      className="crm-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="crm-modal" role="dialog" aria-modal="true" aria-labelledby="crm-lead-profile-title" ref={modalRef}>
        {/* ── Header ── */}
        <header className="crm-modal-header">
          <div>
            {activeContact?.fullName && leadDraft.listingAddress ? (
              <p className="crm-kicker">{leadDraft.listingAddress}</p>
            ) : (
              <p className="crm-kicker">Lead Profile</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 id="crm-lead-profile-title">{activeContact?.fullName || leadDraft.listingAddress || 'Lead Details'}</h3>
              {leadDraft.leadType && (
                <span className={`crm-lead-type-badge crm-lead-type-${leadDraft.leadType}`}>
                  {formatLeadTypeLabel(leadDraft.leadType as CrmLeadType)}
                </span>
              )}
            </div>
            <p className="crm-muted">
              Created {formatDateTime(lead.createdAt)} · Updated {formatDateTime(lead.updatedAt)}
            </p>
            <button
              type="button"
              className={`crm-last-contact-badge ${lastContactColorClass}`}
              onClick={() => setActiveTab('activity')}
              title="View activity timeline"
            >
              {activeLeadLastContact ? `Last contact ${formatTimeAgo(activeLeadLastContact)}` : 'No contact yet'}
            </button>
          </div>
          <div className="crm-modal-header-actions">
            {activeContact && (activeContact.phone || activeContact.email) ? (
              <div className="crm-quick-actions">
                {activeContact.phone ? (
                  <a href={`tel:${activeContact.phone}`} className="crm-quick-action" title={`Call ${activeContact.phone}`} aria-label="Call lead">
                    {QuickPhoneIcon}
                  </a>
                ) : null}
                {activeContact.email ? (
                  <a
                    href={`mailto:${activeContact.email}?subject=${encodeURIComponent(`Re: ${leadDraft.listingAddress || 'Your inquiry'}`)}`}
                    className="crm-quick-action"
                    title={`Email ${activeContact.email}`}
                    aria-label="Email lead"
                  >
                    {QuickEmailIcon}
                  </a>
                ) : null}
                {activeContact.phone ? (
                  <a href={`sms:${activeContact.phone}`} className="crm-quick-action" title={`Text ${activeContact.phone}`} aria-label="Text lead">
                    {QuickTextIcon}
                  </a>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              className="crm-btn-secondary"
              disabled={generatingPortal}
              onClick={async () => {
                setGeneratingPortal(true);
                try {
                  const res = await fetch('/api/portal/generate-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leadId: lead.id }),
                  });
                  const data = await res.json();
                  if (data.ok && data.portalUrl) {
                    const fullUrl = `${window.location.origin}${data.portalUrl}`;
                    setPortalLink(fullUrl);
                    void navigator.clipboard.writeText(fullUrl);
                  }
                } catch { /* portal generation failed */ } finally {
                  setGeneratingPortal(false);
                }
              }}
            >
              {portalLink ? 'Link Copied!' : generatingPortal ? 'Generating...' : 'Share Client Portal'}
            </button>
            <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close lead profile">
              ✕
            </button>
          </div>
        </header>

        {/* Escalation banner and duplicate warning removed — revisit when actionable resolution flows are built */}

        {/* ── Tab Bar ── */}
        <nav className="crm-modal-tabs" aria-label="Lead profile sections">
          <button
            type="button"
            className={`crm-modal-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {TabOverviewIcon} Overview
          </button>
          <button
            type="button"
            className={`crm-modal-tab ${activeTab === 'communication' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('communication')}
          >
            {TabCommsIcon} Communication
          </button>
          <button
            type="button"
            className={`crm-modal-tab ${activeTab === 'intelligence' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('intelligence')}
          >
            {TabIntelIcon} Intelligence
          </button>
          <button
            type="button"
            className={`crm-modal-tab ${activeTab === 'activity' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            {TabActivityIcon} Activity
          </button>
        </nav>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="crm-modal-tab-content">
            {/* Unsaved change indicators */}
            {hasUnsavedChanges && (
              <div className="crm-chip-row">
                {hasUnsavedLeadChange ? <span className="crm-chip crm-chip-warning">Unsaved lead changes</span> : null}
                {activeContact && hasUnsavedContactChange ? (
                  <span className="crm-chip crm-chip-warning">Unsaved contact changes</span>
                ) : null}
              </div>
            )}

            {/* Lead Profile section */}
            <CollapsibleSection
              title="Lead Profile"
              icon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
            >
              <div className="crm-chip-row">
                <span className="crm-chip">{formatLeadSourceLabel(lead.source)}</span>
                <span className={`crm-status-badge crm-status-${leadDraft.status}`}>
                  {formatLeadStatusLabel(leadDraft.status)}
                </span>
              </div>

              <SourceAttributionChain source={lead.source} activities={activities} />

              <LeadTagInput
                leadId={lead.id}
                tenantId={lead.tenantId}
                initialTags={leadDraft.tags}
                draftMode
                onTagsChange={(nextTags) => {
                  onSetLeadDraftField(lead.id, 'tags', nextTags);
                }}
              />

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
                <label className="crm-field">
                  Lead Type
                  <select
                    value={leadDraft.leadType}
                    onChange={(event) => {
                      onSetLeadDraftField(lead.id, 'leadType', event.target.value);
                    }}
                  >
                    {(['buyer', 'seller', 'investor', 'renter', 'other'] as const).map((type) => (
                      <option key={type} value={type}>
                        {formatLeadTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="crm-field crm-field-grow">
                  Address
                  <input
                    value={leadDraft.listingAddress}
                    onChange={(event) => onSetLeadDraftField(lead.id, 'listingAddress', event.target.value)}
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
            </CollapsibleSection>

            {/* Contact Information section */}
            <CollapsibleSection
              title="Contact Information"
              icon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M5 12c0-1.5 1.3-2.5 3-2.5s3 1 3 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              }
            >
              {activeContact ? (
                <>
                  <div className="crm-modal-edit-grid">
                    <label className="crm-field crm-field-grow">
                      Contact Name
                      <input
                        value={activeContactDraft?.fullName ?? ''}
                        onChange={(event) => {
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
                        placeholder="Full name"
                      />
                    </label>
                    <label className="crm-field crm-field-grow">
                      Email
                      <input
                        value={activeContactDraft?.email ?? ''}
                        onChange={(event) => {
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
                      />
                    </label>
                  </div>
                  <div className="crm-modal-edit-grid">
                    <label className="crm-field crm-field-grow">
                      Phone
                      <input
                        value={activeContactDraft?.phone ?? ''}
                        onChange={(event) => {
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
                      />
                    </label>
                  </div>
                </>
              ) : (
                <div className="crm-contact-link-cta">
                  <p>No linked contact. Create or link one to enable communication tools.</p>
                  <button type="button" className="crm-btn-secondary">Link Contact</button>
                </div>
              )}
            </CollapsibleSection>

            {/* Property Preferences section */}
            <CollapsibleSection
              title="Property Preferences"
              icon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 7l6-5 6 5v6.5a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            >
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

              <div className="crm-field">
                <span className="crm-field-label">Property Type</span>
                <div className="crm-multi-checkbox-group">
                  {[
                    { value: 'single-family', label: 'Single Family' },
                    { value: 'condo', label: 'Condo / Townhome' },
                    { value: 'multi-family', label: 'Multifamily' },
                    { value: 'commercial', label: 'Commercial' },
                    { value: 'rental', label: 'Rental' },
                    { value: 'other', label: 'Other' },
                  ].map((opt) => {
                    const selected = leadDraft.propertyType.split(',').map((s) => s.trim()).filter(Boolean);
                    const isChecked = selected.includes(opt.value);
                    return (
                      <label key={opt.value} className={`crm-multi-checkbox ${isChecked ? 'is-checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const next = isChecked
                              ? selected.filter((v) => v !== opt.value)
                              : [...selected, opt.value];
                            onSetLeadDraftField(lead.id, 'propertyType', next.sort().join(','));
                          }}
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
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

              <div className="crm-modal-edit-grid crm-modal-edit-grid-three">
                <label className="crm-field">
                  Acreage
                  <input
                    type="text"
                    inputMode="decimal"
                    value={leadDraft.acreage}
                    onChange={(e) => onSetLeadDraftField(lead.id, 'acreage', e.target.value)}
                    placeholder="e.g. 0.5"
                  />
                </label>
                <label className="crm-field">
                  Town
                  <input
                    value={leadDraft.town}
                    onChange={(e) => onSetLeadDraftField(lead.id, 'town', e.target.value)}
                    placeholder="e.g. Greenwich"
                  />
                </label>
                <label className="crm-field">
                  Neighborhood
                  <input
                    value={leadDraft.neighborhood}
                    onChange={(e) => onSetLeadDraftField(lead.id, 'neighborhood', e.target.value)}
                    placeholder="e.g. Back Country"
                  />
                </label>
              </div>

              <div className="crm-modal-edit-grid">
                <label className="crm-field crm-field-grow">
                  Timeframe
                  <input
                    value={leadDraft.timeframe}
                    onChange={(event) => onSetLeadDraftField(lead.id, 'timeframe', event.target.value)}
                    placeholder="e.g. Next 3 months"
                  />
                </label>
              </div>

              <label className="crm-field crm-field-grow">
                Preference Notes
                <textarea
                  value={leadDraft.preferenceNotes}
                  onChange={(e) => onSetLeadDraftField(lead.id, 'preferenceNotes', e.target.value)}
                  placeholder="Additional buyer/renter preferences, must-haves, deal-breakers..."
                  rows={2}
                />
              </label>
            </CollapsibleSection>

            {/* Follow-Up Reminder — the SINGLE next-action widget */}
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
                    className="crm-btn-secondary"
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
                    {calendarAdded ? '✓ Synced to Calendar' : addingToCalendar ? 'Adding...' : 'Add to Google Calendar'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="crm-btn-secondary"
                    onClick={() => {
                      downloadIcsFile({
                        title: `Follow up: ${activeContact?.fullName ?? 'Lead'} — ${lead.nextActionNote || 'Follow up'}`,
                        startDate: new Date(lead.nextActionAt!),
                        description: lead.notes || undefined,
                      });
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M2 6.5h12M5.5 3V1.5M10.5 3V1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Download .ics
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Communication Tab ── */}
        {activeTab === 'communication' && (
          <div className="crm-modal-tab-content">
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

            {/* Communication Tools */}
            <div className="crm-comm-tools-grid">
              <button
                type="button"
                className={`crm-comm-tool-card ${showTemplates ? 'is-active' : ''}`}
                onClick={() => { setShowTemplates(!showTemplates); setShowAiComposer(false); setShowGmailComposer(false); }}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                </svg>
                <span className="crm-comm-tool-card__title">Message Templates</span>
                <span className="crm-comm-tool-card__subtitle">Pre-built message library</span>
              </button>
              <button
                type="button"
                className={`crm-comm-tool-card ${showAiComposer ? 'is-active' : ''}`}
                onClick={() => { setShowAiComposer(!showAiComposer); setShowTemplates(false); setShowGmailComposer(false); }}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" opacity="0.7" />
                </svg>
                <span className="crm-comm-tool-card__title">Draft with AI</span>
                <span className="crm-comm-tool-card__subtitle">Generate personalized messages</span>
              </button>
              {activeContact?.email && (
                <button
                  type="button"
                  className={`crm-comm-tool-card ${showGmailComposer ? 'is-active' : ''}`}
                  onClick={() => { setShowGmailComposer(!showGmailComposer); setShowTemplates(false); setShowAiComposer(false); }}
                >
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="crm-comm-tool-card__title">Send Email</span>
                  <span className="crm-comm-tool-card__subtitle">{googleConnected ? 'via Gmail' : 'Compose email'}</span>
                </button>
              )}
            </div>
            {activeContact?.email && googleConnected && (
              <button
                type="button"
                className="crm-template-toggle__btn"
                onClick={() => setShowGmailThreads(!showGmailThreads)}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 9h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                </svg>
                {showGmailThreads ? 'Hide Threads' : 'Email History'}
              </button>
            )}
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
                onSend={(data) => {
                  if (data.channel === 'email') {
                    void onLogContact('email_sent', 'AI-drafted email sent');
                  } else {
                    void onLogContact('text_logged', 'AI-drafted message copied');
                  }
                  setShowAiComposer(false);
                }}
              />
            )}
            {showGmailComposer && activeContact?.email && (
              <GmailComposer
                to={activeContact.email}
                leadId={lead.id}
                contactName={activeContact.fullName ?? undefined}
                propertyAddress={lead.listingAddress ?? undefined}
                googleConnected={googleConnected ?? false}
                replyToMessageId={replyContext?.threadId}
                onClose={() => { setShowGmailComposer(false); setReplyContext(null); }}
                onSent={() => {
                  setShowGmailComposer(false);
                  setReplyContext(null);
                  void onLogContact('email_sent', `Email sent to ${activeContact.email}`);
                }}
              />
            )}
            {showGmailThreads && activeContact?.email && googleConnected && (
              <GmailThreads
                email={activeContact.email}
                onReply={(threadId, subject) => {
                  setReplyContext({ threadId, subject });
                  setShowGmailComposer(true);
                  setShowGmailThreads(false);
                }}
                onClose={() => setShowGmailThreads(false)}
              />
            )}
          </div>
        )}

        {/* ── Intelligence Tab ── */}
        {activeTab === 'intelligence' && (
          <div className="crm-modal-tab-content">
            {/* Lead Intelligence — consolidated score + activity */}
            <CollapsibleSection
              title="Lead Intelligence"
              icon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" opacity="0.7" />
                </svg>
              }
            >
              <LeadEngagementGauge score={leadScore.score} label={leadScore.label} />
              <AiScoreExplanation leadId={lead.id} tenantId={lead.tenantId} />
              {(searchSignals.length > 0 || listingSignals.length > 0) && (
                <div className="crm-intel-compact-row">
                  <LeadActivityChart activities={activities} />
                  <PriceInterestBar signals={listingSignals} />
                </div>
              )}
              <AiPredictiveScore leadId={lead.id} tenantId={lead.tenantId} />
            </CollapsibleSection>

            {/* Listing Activity */}
            {listingSignals.length > 0 && (
              <CollapsibleSection
                title="Listing Activity"
                badge={listingSignals.length}
                icon={
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M2 7l6-5 6 5v6.5a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              >
                <ul className="crm-modal-signal-list">
                  {listingSignals.map((signal) => (
                    <li
                      key={signal.id}
                      className={signal.listingId ? 'crm-listing-signal-clickable' : ''}
                      onClick={() => signal.listingId && handleListingClick(signal.listingId)}
                      role={signal.listingId ? 'button' : undefined}
                      tabIndex={signal.listingId ? 0 : undefined}
                      onKeyDown={(e) => signal.listingId && e.key === 'Enter' && handleListingClick(signal.listingId)}
                    >
                      <strong>{signal.address || 'Unknown property'}</strong>
                      <span>
                        {signal.action} · {signal.price ? `$${signal.price.toLocaleString()}` : ''} {signal.beds ? `${signal.beds}bd` : ''} {signal.baths ? `${signal.baths}ba` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            )}

            {/* AI Summary */}
            <CollapsibleSection
              title="AI Summary"
              icon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" opacity="0.7" />
                </svg>
              }
            >
              <AiLeadSummary leadId={lead.id} tenantId={lead.tenantId} />
            </CollapsibleSection>

            {/* Suggested Actions */}
            <CollapsibleSection
              title="Suggested Actions"
              icon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v4l3 2M8 14a6 6 0 100-12 6 6 0 000 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
            >
              <AiNextActions leadId={lead.id} tenantId={lead.tenantId} />
            </CollapsibleSection>

            {/* Suggested Properties */}
            {(propertyMatches.length > 0 || matchesLoading) && (
              <CollapsibleSection
                title="Suggested Properties"
                defaultOpen={false}
                badge={propertyMatches.length || undefined}
                icon={
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l2 4h4l-3.2 2.5L12 12 8 9.2 4 12l1.2-4.5L2 5h4l2-4z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                  </svg>
                }
              >
                {matchesLoading ? (
                  <p className="crm-muted">Finding matching properties...</p>
                ) : (
                  <div className="crm-suggested-properties-list">
                    {propertyMatches.map((match) => (
                      <article
                        key={match.listing.id}
                        className="crm-suggested-property-card crm-listing-signal-clickable"
                        onClick={() => setSelectedListing(match.listing)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedListing(match.listing)}
                      >
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
                        </div>
                        <div className="crm-match-reasons">
                          {match.matchReasons.map((reason) => (
                            <span key={reason} className="crm-chip crm-chip-match">{reason}</span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* Lead Routing */}
            <CollapsibleSection
              title="Lead Routing"
              icon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h4l2-3 2 6 2-3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            >
              <AiLeadRouting
                leadId={lead.id}
                tenantId={lead.tenantId}
                currentAssignee={lead.assignedTo}
              />
            </CollapsibleSection>
          </div>
        )}

        {/* ── Activity Tab ── */}
        {activeTab === 'activity' && (
          <div className="crm-modal-tab-content">
            <UnifiedTimeline
              activities={activities}
              searchSignals={searchSignals}
              listingSignals={listingSignals}
              onListingClick={handleListingClick}
            />

            <section className="crm-modal-section">
              <ShowingScheduler
                leadId={lead.id}
                contactId={lead.contactId}
                defaultAddress={lead.listingAddress || ''}
                existingShowings={showings}
                onShowingCreated={(showing) => {
                  setShowings((prev) => [showing, ...prev]);
                  void onLogContact('showing_scheduled', `Showing scheduled: ${showing.propertyAddress}`);
                }}
              />
            </section>
          </div>
        )}

        {/* ── Unified Footer ── */}
        <div className="crm-modal-footer">
          {onDeleteLead && !showDeleteConfirm && (
            <button
              type="button"
              className="crm-btn-destructive"
              onClick={() => setShowDeleteConfirm(true)}
              style={{ marginRight: 'auto' }}
            >
              Delete Lead
            </button>
          )}
          {showDeleteConfirm && (
            <div className="crm-delete-confirm" style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="crm-muted" style={{ fontSize: '0.78rem' }}>Are you sure? This cannot be undone.</span>
              <button type="button" className="crm-btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button
                type="button"
                className="crm-btn-destructive"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await onDeleteLead!(lead.id);
                    onClose();
                  } catch {
                    setDeleting(false);
                    setShowDeleteConfirm(false);
                  }
                }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
          <button
            type="button"
            className="crm-btn-ghost"
            onClick={handleDiscard}
            disabled={!hasUnsavedChanges}
          >
            Discard
          </button>
          <button
            type="button"
            className="crm-btn-primary"
            disabled={!hasUnsavedChanges || savingLead || savingContact}
            onClick={() => { void handleSaveAll(); }}
          >
            {savingLead || savingContact ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* CRM Listing Detail Modal */}
      {selectedListing && (
        <CrmListingModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          leadName={activeContact?.fullName ?? undefined}
          onScheduleShowing={(_listingId, address) => {
            setSelectedListing(null);
            setActiveTab('activity');
            // ShowingScheduler uses defaultAddress from lead — update the draft address for context
            if (address) onSetLeadDraftField(lead.id, 'listingAddress', address);
          }}
          onShareWithLead={() => {
            setSelectedListing(null);
            setActiveTab('communication');
            setShowTemplates(true);
          }}
        />
      )}
    </div>
  );
}
