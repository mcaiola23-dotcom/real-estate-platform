'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { CrmActivity, CrmContact, CrmLead, CrmLeadStatus, CrmLeadType } from '@real-estate/types/crm';
import Image from 'next/image';

import {
  formatActivityTypeLabel,
  formatLeadSourceLabel,
  formatLeadStatusLabel,
  formatLeadTypeLabel,
} from '../lib/crm-display';
import {
  doesStatusMatchPreset,
  resolveViewFromNav,
  toggleTableSortState,
  type LeadsTableSort,
  type LeadsTableSortColumn,
  type TableStatusPreset,
  type WorkspaceNav,
  type WorkspaceView,
} from '../lib/workspace-interactions';
import type {
  AgentProfile,
  BrandPreferences,
  CrmWorkspaceProps,
  ContactDraft,
  DailyBreakdown,
  LeadBehaviorStats,
  LeadDraft,
  LeadListingSignal,
  LeadSearchSignal,
  LeadSearchSuggestion,
  LeadSourceFilter,
  LeadStatusFilter,
  LeadTypeFilter,
  WorkspaceToast,
} from '../lib/crm-types';
import {
  ALL_LEAD_TYPE_FILTER,
  ALL_SOURCE_FILTER,
  ALL_STATUS_FILTER,
  LEAD_STATUSES,
} from '../lib/crm-types';
import {
  buildBrandThemeVars,
  createDefaultBrandPreferences,
  getBrandInitials,
  toTitleCase,
} from '../lib/crm-brand-theme';
import {
  buildLeadDraft,
  formatDateTime,
  formatPriceRange,
  formatTimeAgo,
  classifyLeadType,
  getLeadContactLabel,
  getStatusGlyph,
  getTimeGreeting,
  normalizeOptionalNotes,
  normalizeOptionalString,
  parseNullableNumber,
  passthroughImageLoader,
} from '../lib/crm-formatters';
import { calculateLeadScore } from '../lib/crm-scoring';
import {
  extractLeadListingSignal,
  extractLeadSearchSignal,
  matchesLeadFilters,
} from '../lib/crm-data-extraction';
import {
  LayoutDashboard,
  Kanban,
  ListFilter,
  Building2,
  ArrowLeftRight,
  Activity,
  BarChart3,
  Mail,
  Settings,
  Search,
  Bell,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { KpiSparkline } from './shared/KpiSparkline';
import { EmptyState } from './shared/EmptyState';
import { SevenDayPulse } from './dashboard/SevenDayPulse';
import { MyDayPanel } from './dashboard/MyDayPanel';
import { ActionCenter } from './dashboard/ActionCenter';
import { ConversionFunnel } from './dashboard/ConversionFunnel';
import { RevenuePipeline } from './dashboard/RevenuePipeline';
import { MarketDigest } from './dashboard/MarketDigest';
import { PipelineView } from './pipeline/PipelineView';
import { WinLossModal } from './pipeline/WinLossModal';
import { AnalyticsView } from './analytics/AnalyticsView';
import { CommandPalette } from './shared/CommandPalette';
import { NotificationCenter } from './header/NotificationCenter';
import { useCrmTheme } from '../lib/use-theme';
import { useNotifications } from '../lib/use-notifications';
import { usePinnedLeads } from '../lib/use-pinned-leads';
import { EscalationAlertBanner } from './shared/EscalationBanner';
import { CsvImportModal } from './shared/CsvImportModal';
import { NeedsAttention } from './dashboard/NeedsAttention';
import { NewLeadModal } from './shared/NewLeadModal';
import { NewActivityModal } from './shared/NewActivityModal';
import { MobileActionBar } from './shared/MobileActionBar';
import { computeLeadEscalationLevel } from '@real-estate/ai/crm/escalation-engine';
import { useOfflineQueue } from '../lib/use-offline-queue';
import { exportLeadsCsv, exportActivitiesCsv } from '../lib/crm-export';
import { useCrmStore } from '../lib/stores/use-crm-store';
import { useWorkspaceData, refreshLead } from '../lib/stores/use-query-hooks';
import { FloatingActivityLog } from './shared/FloatingActivityLog';
import { SpeedToLeadTimer } from './dashboard/SpeedToLeadTimer';
import { usePushNotifications } from '../lib/use-push-notifications';
const ActivityView = dynamic(() => import('./views/ActivityView').then(m => ({ default: m.ActivityView })), { ssr: false });
const SettingsView = dynamic(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })), { ssr: false });
const LeadProfileModal = dynamic(() => import('./views/LeadProfileModal').then(m => ({ default: m.LeadProfileModal })), { ssr: false });
const PropertiesView = dynamic(() => import('./properties/PropertiesView').then(m => ({ default: m.PropertiesView })), { ssr: false });
const TransactionsView = dynamic(() => import('./transactions/TransactionsView').then(m => ({ default: m.TransactionsView })), { ssr: false });
const CampaignsView = dynamic(() => import('./views/CampaignsView').then(m => ({ default: m.CampaignsView })), { ssr: false });

export function CrmWorkspace({
  tenantContext,
  hasClerkKey,
  devAuthBypassEnabled,
  initialSummary,
}: CrmWorkspaceProps) {
  const { theme, toggleTheme } = useCrmTheme(tenantContext.tenantId);

  // --- Zustand Store ---
  const store = useCrmStore();
  const {
    // UI
    activeNav, activeView, activeLeadProfileId,
    searchQuery, searchSuggestionsOpen,
    cmdPaletteOpen, notificationsOpen, avatarMenuOpen, logoLoadErrored,
    showNewLeadForm, showCsvImport, showQuickAddLead,
    toasts, loading, error, activeMutations, greetingLabel,
    // UI actions
    handleNav, openLeadProfile: storeOpenLeadProfile, closeLeadProfile: storeCloseLeadProfile,
    setSearchQuery, setSearchSuggestionsOpen,
    setCmdPaletteOpen, toggleCmdPalette,
    setNotificationsOpen, setAvatarMenuOpen, setLogoLoadErrored,
    setShowNewLeadForm, toggleShowNewLeadForm, setShowCsvImport, setShowQuickAddLead,
    setShowNewLeadModal, setShowNewActivityModal,
    pushToast, setLoading, setError, beginMutation, endMutation, setGreetingLabel,
    // Data
    summary, leads, contacts, activities,
    setSummary, updateSummary, setLeads, addLead, removeLead, replaceLeadById,
    setContacts, addContact, removeContact, replaceContactById,
    setActivities, addActivity, removeActivity, replaceActivityById,
    // Drafts
    draftByLeadId, savingLeadIds, draftContactById, savingContactIds,
    setLeadDraftField, clearLeadDraft, clearAllLeadDrafts,
    setSavingLeadId, setSavingContactId, clearContactDraft,
    // Filters
    dashboardStatusFilter, dashboardSourceFilter, dashboardLeadTypeFilter,
    pipelineStatusFilter, pipelineSourceFilter, pipelineLeadTypeFilter,
    tableStatusPreset, tableSort, activitySortMode,
    setDashboardStatusFilter, setDashboardSourceFilter, setDashboardLeadTypeFilter,
    setPipelineStatusFilter, setPipelineSourceFilter, setPipelineLeadTypeFilter,
    setTableStatusPreset, setTableSort, setActivitySortMode,
    // Forms
    newLeadAddress, newLeadSource, newLeadType, newLeadNotes, newLeadTimeframe, newLeadPropertyType,
    newContactName, newContactEmail, newContactPhone,
    newActivitySummary, newActivityLeadId, newActivityContactId, newActivityType,
    showNewLeadModal, showNewActivityModal,
    setNewLeadField, resetNewLeadForm, resetNewContactForm,
    setNewActivityField, resetNewActivityForm,
    // Settings
    brandPreferences, agentProfile, winLossPrompt, density,
    setBrandPreferences, setAgentProfile, setWinLossPrompt, setDensity,
    resetBrandPreferences: storeResetBrandPreferences,
  } = store;

  // Initialize summary from props
  useEffect(() => {
    setSummary(initialSummary);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load workspace data via hook
  useWorkspaceData();

  const [dismissedDuplicateLeadIds, setDismissedDuplicateLeadIds] = useState(() => new Set<string>());

  const contactPanelRef = useRef<HTMLElement | null>(null);
  const activityPanelRef = useRef<HTMLElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);

  const brandStorageKey = useMemo(() => `crm.branding.${tenantContext.tenantId}`, [tenantContext.tenantId]);
  const profileStorageKey = useMemo(() => `crm.profile.${tenantContext.tenantId}`, [tenantContext.tenantId]);
  const websiteFaviconUrl = useMemo(() => `https://${tenantContext.tenantDomain}/favicon.ico`, [tenantContext.tenantDomain]);
  useEffect(() => {
    setGreetingLabel(getTimeGreeting());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(brandStorageKey);
      if (!raw) {
        storeResetBrandPreferences(tenantContext.tenantSlug);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<BrandPreferences>;
      setBrandPreferences({
        ...createDefaultBrandPreferences(tenantContext.tenantSlug),
        ...parsed,
      });
    } catch {
      storeResetBrandPreferences(tenantContext.tenantSlug);
    }
  }, [brandStorageKey, tenantContext.tenantSlug, setBrandPreferences, storeResetBrandPreferences]);

  useEffect(() => {
    try {
      window.localStorage.setItem(brandStorageKey, JSON.stringify(brandPreferences));
    } catch {
      // Ignore storage errors for private/incognito browser modes.
    }
  }, [brandPreferences, brandStorageKey]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(profileStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AgentProfile>;
        setAgentProfile({ ...agentProfile, ...parsed });
      }
    } catch {
      // Ignore parse errors.
    }
  }, [profileStorageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      window.localStorage.setItem(profileStorageKey, JSON.stringify(agentProfile));
    } catch {
      // Ignore storage errors.
    }
  }, [agentProfile, profileStorageKey]);

  const resolvedLogoUrl = useMemo(() => {
    if (brandPreferences.useWebsiteFavicon) {
      return websiteFaviconUrl;
    }
    const custom = brandPreferences.customLogoUrl.trim();
    return custom.length > 0 ? custom : '';
  }, [brandPreferences.customLogoUrl, brandPreferences.useWebsiteFavicon, websiteFaviconUrl]);

  useEffect(() => {
    setLogoLoadErrored(false);
  }, [resolvedLogoUrl]);

  const brandThemeVars = useMemo(() => buildBrandThemeVars(brandPreferences), [brandPreferences]);
  const brandInitials = useMemo(() => getBrandInitials(brandPreferences.brandName), [brandPreferences.brandName]);
  const showBrandLogo = Boolean(resolvedLogoUrl) && !logoLoadErrored;

  const isMutating = activeMutations > 0;

  const leadById = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);
  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts]);

  const { notifications, unreadCount, dismissNotification, clearAllNotifications } = useNotifications({ leads, activities, contactById, tenantId: tenantContext.tenantId });
  const { pinnedIds, togglePin, isPinned } = usePinnedLeads(tenantContext.tenantId);
  const { isOnline, pendingCount: offlinePendingCount, enqueue: enqueueOffline } = useOfflineQueue(tenantContext.tenantId);
  const pushNotifications = usePushNotifications(tenantContext.tenantId);

  // Unclaimed leads for speed-to-lead (new leads without any contact/response)
  const unclaimedLeads = useMemo(() => {
    return leads.filter((l) =>
      l.status === 'new' && !l.lastContactAt
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [leads]);

  // Cmd+K / Ctrl+K keyboard shortcut for command palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCmdPalette();
      }
      // Sprint 1B: Press N to open quick-add lead (when not in text input)
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select' && !(e.target as HTMLElement)?.isContentEditable) {
          e.preventDefault();
          setShowQuickAddLead(true);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCmdPalette, setShowQuickAddLead]);

  const getLeadDraft = useCallback(
    (lead: CrmLead): LeadDraft => {
      return draftByLeadId[lead.id] ?? buildLeadDraft(lead);
    },
    [draftByLeadId]
  );

  const handleSetLeadDraftField = useCallback(
    (leadId: string, field: keyof LeadDraft, value: string | CrmLeadStatus | string[]) => {
      const lead = leadById.get(leadId);
      if (!lead) {
        return;
      }
      setLeadDraftField(leadId, field, value, lead);
    },
    [leadById, setLeadDraftField]
  );

  const hasUnsavedLeadChange = useCallback(
    (lead: CrmLead) => {
      const draft = getLeadDraft(lead);
      return (
        draft.status !== lead.status ||
        draft.leadType !== classifyLeadType(lead.leadType) ||
        normalizeOptionalNotes(draft.notes) !== normalizeOptionalNotes(lead.notes) ||
        normalizeOptionalString(draft.timeframe) !== normalizeOptionalString(lead.timeframe) ||
        normalizeOptionalString(draft.listingAddress) !== normalizeOptionalString(lead.listingAddress) ||
        normalizeOptionalString(draft.propertyType) !== normalizeOptionalString(lead.propertyType) ||
        parseNullableNumber(draft.beds) !== lead.beds ||
        parseNullableNumber(draft.baths) !== lead.baths ||
        parseNullableNumber(draft.sqft) !== lead.sqft ||
        normalizeOptionalString(draft.nextActionAt) !== normalizeOptionalString(lead.nextActionAt) ||
        normalizeOptionalString(draft.nextActionNote) !== normalizeOptionalString(lead.nextActionNote) ||
        normalizeOptionalString(draft.nextActionChannel) !== normalizeOptionalString(lead.nextActionChannel) ||
        normalizeOptionalString(draft.reminderSnoozedUntil) !== normalizeOptionalString(lead.reminderSnoozedUntil) ||
        parseNullableNumber(draft.priceMin) !== lead.priceMin ||
        parseNullableNumber(draft.priceMax) !== lead.priceMax ||
        normalizeOptionalString(draft.houseStyle) !== normalizeOptionalString(lead.houseStyle) ||
        draft.tags.length !== (lead.tags ?? []).length ||
        draft.tags.some((t, i) => t !== (lead.tags ?? [])[i])
      );
    },
    [getLeadDraft]
  );

  // clearLeadDraft now comes from Zustand store

  const sourceFilterOptions = useMemo(() => {
    return Array.from(new Set(leads.map((lead) => lead.source))).sort((left, right) => left.localeCompare(right));
  }, [leads]);

  const leadCountsByStatus = useMemo(() => {
    const counts: Record<CrmLeadStatus, number> = {
      new: 0,
      qualified: 0,
      nurturing: 0,
      won: 0,
      lost: 0,
    };

    for (const lead of leads) {
      counts[getLeadDraft(lead).status] += 1;
    }

    return counts;
  }, [getLeadDraft, leads]);

  const activePipelineCount = leadCountsByStatus.new + leadCountsByStatus.qualified + leadCountsByStatus.nurturing;
  const followUpCount = leadCountsByStatus.qualified + leadCountsByStatus.nurturing;
  const closedLeadTotal = leadCountsByStatus.won + leadCountsByStatus.lost;
  const winRate = closedLeadTotal > 0 ? Math.round((leadCountsByStatus.won / closedLeadTotal) * 100) : 0;

  const urgentFollowUps = useMemo(() => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return leads.filter((l) => {
      if (!l.nextActionAt) return false;
      if (l.status === 'won' || l.status === 'lost') return false;
      return new Date(l.nextActionAt).getTime() <= endOfToday.getTime();
    });
  }, [leads]);

  // Escalation computation for dashboard banner
  const escalatedLeads = useMemo(() => {
    return leads
      .filter((l) => l.status !== 'won' && l.status !== 'lost')
      .map((l) => {
        const esc = computeLeadEscalationLevel(l);
        const linkedContact = l.contactId ? contactById.get(l.contactId) : undefined;
        return {
          leadId: l.id,
          leadName: linkedContact?.fullName || l.listingAddress || l.id.slice(0, 8),
          level: esc.level,
          daysOverdue: esc.daysOverdue,
        };
      })
      .filter((e) => e.level >= 1)
      .sort((a, b) => b.level - a.level || b.daysOverdue - a.daysOverdue);
  }, [leads, contactById]);

  const activityVolumeLast7Days = useMemo(() => {
    const buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return { date, count: 0 };
    });

    for (const activity of activities) {
      const occurredAt = new Date(activity.occurredAt);
      const occurredDay = new Date(occurredAt);
      occurredDay.setHours(0, 0, 0, 0);
      const bucket = buckets.find((entry) => entry.date.getTime() === occurredDay.getTime());
      if (bucket) {
        bucket.count += 1;
      }
    }

    return buckets.map((entry) => entry.count);
  }, [activities]);

  const heartbeatDays: DailyBreakdown[] = useMemo(() => {
    const dayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      let total = 0;
      let newLeads = 0;
      let statusChanges = 0;
      let listingViews = 0;
      let searches = 0;
      let favorites = 0;
      let notes = 0;

      for (const activity of activities) {
        const ts = new Date(activity.occurredAt).getTime();
        if (ts < date.getTime() || ts >= nextDay.getTime()) continue;
        total += 1;
        if (activity.activityType === 'lead_created') newLeads += 1;
        else if (activity.activityType === 'lead_status_changed') statusChanges += 1;
        else if (activity.activityType === 'website_listing_viewed') listingViews += 1;
        else if (activity.activityType === 'website_search_performed') searches += 1;
        else if (activity.activityType === 'website_listing_favorited') favorites += 1;
        else if (activity.activityType === 'note') notes += 1;
      }

      return { date, label: dayFmt.format(date), total, newLeads, statusChanges, listingViews, searches, favorites, notes };
    });
  }, [activities]);

  const kpiSeries = useMemo(() => {
    const openPipelineBaseline = [leadCountsByStatus.new, leadCountsByStatus.qualified, leadCountsByStatus.nurturing];
    const closedBaseline = [leadCountsByStatus.won, leadCountsByStatus.lost, winRate];

    return {
      newLeads: [leadCountsByStatus.new, ...activityVolumeLast7Days.slice(-5)],
      followUp: [leadCountsByStatus.qualified, leadCountsByStatus.nurturing, ...activityVolumeLast7Days.slice(-4)],
      openPipeline: [...openPipelineBaseline, ...activityVolumeLast7Days.slice(-4)],
      closed: [...closedBaseline, ...activityVolumeLast7Days.slice(-4)],
    };
  }, [activityVolumeLast7Days, leadCountsByStatus, winRate]);

  const leadByContactId = useMemo(() => {
    const map = new Map<string, CrmLead>();
    const sorted = [...leads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    for (const lead of sorted) {
      if (!lead.contactId || map.has(lead.contactId)) {
        continue;
      }
      map.set(lead.contactId, lead);
    }
    return map;
  }, [leads]);


  const leadBehaviorByLeadId = useMemo(() => {
    const map = new Map<string, LeadBehaviorStats>();

    for (const activity of activities) {
      if (
        activity.activityType !== 'website_search_performed' &&
        activity.activityType !== 'website_listing_viewed' &&
        activity.activityType !== 'website_listing_favorited' &&
        activity.activityType !== 'website_listing_unfavorited'
      ) {
        continue;
      }

      if (!activity.leadId) {
        continue;
      }

      const current =
        map.get(activity.leadId) ??
        ({
          viewedCount: 0,
          favoritedCount: 0,
          unfavoritedCount: 0,
          lastBehaviorAt: null,
          minPrice: null,
          maxPrice: null,
        } satisfies LeadBehaviorStats);

      if (!current.lastBehaviorAt || new Date(activity.occurredAt).getTime() > new Date(current.lastBehaviorAt).getTime()) {
        current.lastBehaviorAt = activity.occurredAt;
      }

      const listingSignal = extractLeadListingSignal(activity);
      const listingPrice = listingSignal?.price ?? null;
      if (listingPrice !== null) {
        current.minPrice = current.minPrice === null ? listingPrice : Math.min(current.minPrice, listingPrice);
        current.maxPrice = current.maxPrice === null ? listingPrice : Math.max(current.maxPrice, listingPrice);
      }

      if (activity.activityType === 'website_listing_viewed') {
        current.viewedCount += 1;
      }
      if (activity.activityType === 'website_listing_favorited') {
        current.favoritedCount += 1;
      }
      if (activity.activityType === 'website_listing_unfavorited') {
        current.unfavoritedCount += 1;
      }

      map.set(activity.leadId, current);
    }

    return map;
  }, [activities]);

  const lastContactByLeadId = useMemo(() => {
    const LAST_CONTACT_ACTIVITY_TYPES = new Set([
      'call_logged',
      'text_logged',
      'email_logged',
      'email_sent',
      'showing_scheduled',
    ]);

    // Build reverse map: contactId → leadId[] so contact-linked activities update leads
    const leadIdsByContactId = new Map<string, string[]>();
    for (const lead of leads) {
      if (lead.contactId) {
        const existing = leadIdsByContactId.get(lead.contactId);
        if (existing) {
          existing.push(lead.id);
        } else {
          leadIdsByContactId.set(lead.contactId, [lead.id]);
        }
      }
    }

    const map = new Map<string, string>();

    const updateMap = (leadId: string, occurredAt: string) => {
      const existing = map.get(leadId);
      if (!existing || new Date(occurredAt).getTime() > new Date(existing).getTime()) {
        map.set(leadId, occurredAt);
      }
    };

    for (const activity of activities) {
      if (!LAST_CONTACT_ACTIVITY_TYPES.has(activity.activityType)) {
        continue;
      }

      if (activity.leadId) {
        updateMap(activity.leadId, activity.occurredAt);
      }

      // Also update leads linked via contactId
      if (activity.contactId) {
        const linkedLeadIds = leadIdsByContactId.get(activity.contactId);
        if (linkedLeadIds) {
          for (const linkedLeadId of linkedLeadIds) {
            updateMap(linkedLeadId, activity.occurredAt);
          }
        }
      }
    }

    return map;
  }, [activities, leads]);

  const unlinkedBehaviorCount = useMemo(() => {
    return activities.filter((activity) => {
      if (
        activity.activityType !== 'website_search_performed' &&
        activity.activityType !== 'website_listing_viewed' &&
        activity.activityType !== 'website_listing_favorited' &&
        activity.activityType !== 'website_listing_unfavorited'
      ) {
        return false;
      }
      return !activity.leadId && !activity.contactId;
    }).length;
  }, [activities]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const dashboardFilteredLeads = useMemo(() => {
    return leads.filter((lead) =>
      matchesLeadFilters(
        lead,
        normalizedSearch,
        dashboardStatusFilter,
        dashboardSourceFilter,
        dashboardLeadTypeFilter,
        contactById,
        getLeadDraft(lead)
      )
    );
  }, [
    contactById,
    dashboardLeadTypeFilter,
    dashboardSourceFilter,
    dashboardStatusFilter,
    getLeadDraft,
    leads,
    normalizedSearch,
  ]);

  const pipelineFilteredLeads = useMemo(() => {
    return leads.filter((lead) =>
      matchesLeadFilters(
        lead,
        normalizedSearch,
        pipelineStatusFilter,
        pipelineSourceFilter,
        pipelineLeadTypeFilter,
        contactById,
        getLeadDraft(lead)
      )
    );
  }, [
    contactById,
    getLeadDraft,
    leads,
    normalizedSearch,
    pipelineLeadTypeFilter,
    pipelineSourceFilter,
    pipelineStatusFilter,
  ]);

  const groupedPipelineLeads = useMemo(() => {
    const grouped: Record<CrmLeadStatus, CrmLead[]> = {
      new: [],
      qualified: [],
      nurturing: [],
      won: [],
      lost: [],
    };

    for (const lead of pipelineFilteredLeads) {
      grouped[getLeadDraft(lead).status].push(lead);
    }

    return grouped;
  }, [getLeadDraft, pipelineFilteredLeads]);

  const pendingLeadIds = useMemo(() => {
    return leads.filter((lead) => hasUnsavedLeadChange(lead)).map((lead) => lead.id);
  }, [hasUnsavedLeadChange, leads]);

  const searchSuggestions = useMemo(() => {
    if (!normalizedSearch) {
      return [] as LeadSearchSuggestion[];
    }

    const directLeadMatches: LeadSearchSuggestion[] = leads
      .filter((lead) => {
        const linkedContact = lead.contactId ? contactById.get(lead.contactId) : null;
        const leadSearchText = [
          lead.listingAddress,
          lead.listingId,
          lead.listingUrl,
          linkedContact?.fullName,
          linkedContact?.email,
          linkedContact?.phone,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return leadSearchText.includes(normalizedSearch);
      })
      .slice(0, 8)
      .map((lead) => {
        const behavior = leadBehaviorByLeadId.get(lead.id);
        const detail = getLeadContactLabel(lead, contactById);
        const meta = [formatLeadSourceLabel(lead.source), behavior?.favoritedCount ? `${behavior.favoritedCount} favorites` : null]
          .filter(Boolean)
          .join(' • ');

        return {
          id: `lead-${lead.id}`,
          leadId: lead.id,
          label: lead.listingAddress || 'Lead profile',
          detail,
          meta: meta || 'Lead record',
          status: getLeadDraft(lead).status,
        };
      });

    const matchedLeadIds = new Set(directLeadMatches.map((entry) => entry.leadId));

    const contactMatches: LeadSearchSuggestion[] = contacts
      .map((contact) => {
        const text = [contact.fullName, contact.email, contact.phone].filter(Boolean).join(' ').toLowerCase();
        if (!text.includes(normalizedSearch)) {
          return null;
        }

        const linkedLead = leadByContactId.get(contact.id);
        if (!linkedLead || matchedLeadIds.has(linkedLead.id)) {
          return null;
        }

        return {
          id: `contact-${contact.id}`,
          leadId: linkedLead.id,
          label: contact.fullName || contact.email || contact.phone || 'Contact',
          detail: linkedLead.listingAddress || 'Open linked lead profile',
          meta: formatLeadSourceLabel(linkedLead.source),
          status: getLeadDraft(linkedLead).status,
        } satisfies LeadSearchSuggestion;
      })
      .filter((entry): entry is LeadSearchSuggestion => Boolean(entry))
      .slice(0, 4);

    return [...directLeadMatches, ...contactMatches].slice(0, 8);
  }, [contactById, contacts, getLeadDraft, leadBehaviorByLeadId, leadByContactId, leads, normalizedSearch]);

  const activeLeadProfile = useMemo(() => {
    if (!activeLeadProfileId) {
      return null;
    }
    return leadById.get(activeLeadProfileId) ?? null;
  }, [activeLeadProfileId, leadById]);

  const activeLeadProfileActivities = useMemo(() => {
    if (!activeLeadProfile) {
      return [] as CrmActivity[];
    }

    const related = activities.filter((activity) => {
      if (activity.leadId === activeLeadProfile.id) {
        return true;
      }

      if (!activeLeadProfile.contactId) {
        return false;
      }

      return activity.contactId === activeLeadProfile.contactId;
    });

    return related.sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());
  }, [activeLeadProfile, activities]);

  const activeLeadSearchSignals = useMemo(() => {
    return activeLeadProfileActivities
      .map((activity) => extractLeadSearchSignal(activity))
      .filter((signal): signal is LeadSearchSignal => Boolean(signal));
  }, [activeLeadProfileActivities]);

  const activeLeadListingSignals = useMemo(() => {
    return activeLeadProfileActivities
      .map((activity) => extractLeadListingSignal(activity))
      .filter((signal): signal is LeadListingSignal => Boolean(signal));
  }, [activeLeadProfileActivities]);

  const leadScore = useMemo(() => {
    return calculateLeadScore(
      activeLeadProfileActivities,
      activeLeadSearchSignals,
      activeLeadListingSignals,
      activeLeadProfile,
    );
  }, [activeLeadProfileActivities, activeLeadSearchSignals, activeLeadListingSignals, activeLeadProfile]);

  const activeLeadLastContact = useMemo(() => {
    if (!activeLeadProfile) {
      return null;
    }
    return lastContactByLeadId.get(activeLeadProfile.id) ?? null;
  }, [activeLeadProfile, lastContactByLeadId]);

  const activeContact = useMemo(() => {
    if (!activeLeadProfile?.contactId) {
      return null;
    }
    return contactById.get(activeLeadProfile.contactId) ?? null;
  }, [activeLeadProfile, contactById]);

  const activeContactDraft = useMemo(() => {
    if (!activeContact) {
      return null;
    }
    return (
      draftContactById[activeContact.id] ?? {
        fullName: activeContact.fullName ?? '',
        email: activeContact.email ?? '',
        phone: activeContact.phone ?? '',
      }
    );
  }, [activeContact, draftContactById]);

  const hasUnsavedContactChange = useCallback(
    (contact: CrmContact) => {
      const draft = draftContactById[contact.id];
      if (!draft) {
        return false;
      }
      return (
        normalizeOptionalString(draft.fullName) !== normalizeOptionalString(contact.fullName) ||
        normalizeOptionalString(draft.email) !== normalizeOptionalString(contact.email) ||
        normalizeOptionalString(draft.phone) !== normalizeOptionalString(contact.phone)
      );
    },
    [draftContactById]
  );

  const leadsTableRows = useMemo(() => {
    let rows = leads.map((lead) => {
      const draft = getLeadDraft(lead);
      const behavior = leadBehaviorByLeadId.get(lead.id);
      const priceRange = formatPriceRange(behavior?.minPrice ?? null, behavior?.maxPrice ?? null);
      const lastContact = lastContactByLeadId.get(lead.id) ?? null;
      const contactLabel = getLeadContactLabel(lead, contactById);

      // Compute a per-lead score using activities for this lead
      const leadActivities = activities.filter((a) => a.leadId === lead.id || (lead.contactId && a.contactId === lead.contactId));
      const leadSearchSigs = leadActivities.map(extractLeadSearchSignal).filter((s): s is LeadSearchSignal => Boolean(s));
      const leadListingSigs = leadActivities.map(extractLeadListingSignal).filter((s): s is LeadListingSignal => Boolean(s));
      const score = calculateLeadScore(leadActivities, leadSearchSigs, leadListingSigs, lead);

      const linkedContact = lead.contactId ? contactById.get(lead.contactId) : undefined;

      return {
        lead,
        draft,
        contactLabel,
        priceRange,
        location: draft.listingAddress || '-',
        lastContact,
        desired: `${draft.beds || '-'} / ${draft.baths || '-'} / ${draft.sqft || '-'}`,
        score,
        phone: linkedContact?.phone ?? null,
        email: linkedContact?.email ?? null,
        intentLabel:
          behavior && (behavior.favoritedCount > 0 || behavior.viewedCount > 0)
            ? `${behavior.favoritedCount > 0 ? 'Favorited' : 'Viewed'} recently`
            : 'No recent intent',
      };
    });

    rows = rows.filter((row) => doesStatusMatchPreset(row.draft.status, tableStatusPreset));

    rows.sort((left, right) => {
      const directionFactor = tableSort.direction === 'asc' ? 1 : -1;
      let comparison = 0;

      if (tableSort.column === 'name') {
        comparison = left.contactLabel.localeCompare(right.contactLabel);
      } else if (tableSort.column === 'leadType') {
        comparison = left.lead.leadType.localeCompare(right.lead.leadType);
      } else if (tableSort.column === 'status') {
        comparison = left.draft.status.localeCompare(right.draft.status);
      } else if (tableSort.column === 'priceRange') {
        comparison = left.priceRange.localeCompare(right.priceRange);
      } else if (tableSort.column === 'location') {
        comparison = left.location.localeCompare(right.location);
      } else if (tableSort.column === 'lastContact') {
        const leftTime = left.lastContact ? new Date(left.lastContact).getTime() : 0;
        const rightTime = right.lastContact ? new Date(right.lastContact).getTime() : 0;
        comparison = leftTime - rightTime;
      } else if (tableSort.column === 'desired') {
        comparison = left.desired.localeCompare(right.desired);
      } else if (tableSort.column === 'source') {
        comparison = left.lead.source.localeCompare(right.lead.source);
      } else if (tableSort.column === 'updatedAt') {
        comparison = new Date(left.lead.updatedAt).getTime() - new Date(right.lead.updatedAt).getTime();
      } else if (tableSort.column === 'score') {
        comparison = left.score.score - right.score.score;
      } else if (tableSort.column === 'phone') {
        comparison = (left.phone ?? '').localeCompare(right.phone ?? '');
      } else if (tableSort.column === 'email') {
        comparison = (left.email ?? '').localeCompare(right.email ?? '');
      }

      return comparison * directionFactor;
    });

    return rows;
  }, [activities, contactById, getLeadDraft, lastContactByLeadId, leadBehaviorByLeadId, leads, tableSort, tableStatusPreset]);

  // Data loading is handled by useWorkspaceData() hook above.
  // reloadWorkspace re-fetches data for use after CSV import, etc.
  const reloadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, contactsRes, activitiesRes] = await Promise.all([
        fetch('/api/leads?limit=200', { cache: 'no-store' }),
        fetch('/api/contacts?limit=200', { cache: 'no-store' }),
        fetch('/api/activities?limit=200', { cache: 'no-store' }),
      ]);
      if (!leadsRes.ok || !contactsRes.ok || !activitiesRes.ok) {
        throw new Error('Failed to load CRM workspace data.');
      }
      const leadsJson = (await leadsRes.json()) as { leads: CrmLead[] };
      const contactsJson = (await contactsRes.json()) as { contacts: CrmContact[] };
      const activitiesJson = (await activitiesRes.json()) as { activities: CrmActivity[] };
      setLeads(leadsJson.leads);
      setContacts(contactsJson.contacts);
      setActivities(activitiesJson.activities);
      updateSummary({
        leadCount: leadsJson.leads.length,
        contactCount: contactsJson.contacts.length,
        activityCount: activitiesJson.activities.length,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown CRM load error.');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setLeads, setContacts, setActivities, updateSummary]);

  const openLeadProfile = useCallback(
    (leadId: string) => {
      storeOpenLeadProfile(leadId);
      void refreshLead(leadId);
    },
    [storeOpenLeadProfile]
  );

  const closeLeadProfile = useCallback(() => {
    if (!activeLeadProfile) {
      storeCloseLeadProfile();
      return;
    }

    const hasLeadUnsaved = hasUnsavedLeadChange(activeLeadProfile);
    const hasContactUnsaved = activeContact ? hasUnsavedContactChange(activeContact) : false;

    if (hasLeadUnsaved || hasContactUnsaved) {
      const discard = window.confirm('Discard unsaved lead/profile changes?');
      if (!discard) {
        return;
      }
    }

    storeCloseLeadProfile();
  }, [activeContact, activeLeadProfile, hasUnsavedContactChange, hasUnsavedLeadChange, storeCloseLeadProfile]);

  useEffect(() => {
    if (!activeLeadProfileId) {
      return;
    }
    if (!leadById.has(activeLeadProfileId)) {
      storeCloseLeadProfile();
    }
  }, [activeLeadProfileId, leadById, storeCloseLeadProfile]);

  useEffect(() => {
    if (!activeLeadProfileId) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeLeadProfile();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeLeadProfileId, closeLeadProfile]);

  useEffect(() => {
    function onWindowPointerDown(event: MouseEvent) {
      const target = event.target as Node | null;

      if (searchPanelRef.current && target && !searchPanelRef.current.contains(target)) {
        setSearchSuggestionsOpen(false);
      }

      if (avatarMenuRef.current && target && !avatarMenuRef.current.contains(target)) {
        setAvatarMenuOpen(false);
      }

      if (notificationPanelRef.current && target && !notificationPanelRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    }

    window.addEventListener('mousedown', onWindowPointerDown);
    return () => window.removeEventListener('mousedown', onWindowPointerDown);
  }, []);

  async function updateLead(leadId: string) {
    const lead = leadById.get(leadId);
    if (!lead) {
      return;
    }

    const draft = getLeadDraft(lead);

    const payload: {
      status?: CrmLeadStatus;
      leadType?: CrmLeadType;
      notes?: string | null;
      timeframe?: string | null;
      listingAddress?: string | null;
      propertyType?: string | null;
      beds?: number | null;
      baths?: number | null;
      sqft?: number | null;
      nextActionAt?: string | null;
      nextActionNote?: string | null;
      nextActionChannel?: string | null;
      reminderSnoozedUntil?: string | null;
      priceMin?: number | null;
      priceMax?: number | null;
      acreage?: number | null;
      town?: string | null;
      neighborhood?: string | null;
      houseStyle?: string | null;
      preferenceNotes?: string | null;
      assignedTo?: string | null;
      referredBy?: string | null;
      tags?: string[];
    } = {};

    if (draft.status !== lead.status) {
      payload.status = draft.status;
    }

    if (draft.leadType !== classifyLeadType(lead.leadType)) {
      payload.leadType = draft.leadType as CrmLeadType;
    }

    if (normalizeOptionalNotes(draft.notes) !== normalizeOptionalNotes(lead.notes)) {
      payload.notes = normalizeOptionalNotes(draft.notes);
    }

    if (normalizeOptionalString(draft.timeframe) !== normalizeOptionalString(lead.timeframe)) {
      payload.timeframe = normalizeOptionalString(draft.timeframe);
    }

    if (normalizeOptionalString(draft.listingAddress) !== normalizeOptionalString(lead.listingAddress)) {
      payload.listingAddress = normalizeOptionalString(draft.listingAddress);
    }

    if (normalizeOptionalString(draft.propertyType) !== normalizeOptionalString(lead.propertyType)) {
      payload.propertyType = normalizeOptionalString(draft.propertyType);
    }

    const beds = parseNullableNumber(draft.beds);
    if (beds === undefined) {
      pushToast('error', 'Beds must be a whole number.');
      return;
    }
    if (beds !== lead.beds) {
      payload.beds = beds;
    }

    const baths = parseNullableNumber(draft.baths);
    if (baths === undefined) {
      pushToast('error', 'Baths must be a whole number.');
      return;
    }
    if (baths !== lead.baths) {
      payload.baths = baths;
    }

    const sqft = parseNullableNumber(draft.sqft);
    if (sqft === undefined) {
      pushToast('error', 'Sqft must be a whole number.');
      return;
    }
    if (sqft !== lead.sqft) {
      payload.sqft = sqft;
    }

    if (normalizeOptionalString(draft.nextActionAt) !== normalizeOptionalString(lead.nextActionAt)) {
      payload.nextActionAt = normalizeOptionalString(draft.nextActionAt);
    }

    if (normalizeOptionalString(draft.nextActionNote) !== normalizeOptionalString(lead.nextActionNote)) {
      payload.nextActionNote = normalizeOptionalString(draft.nextActionNote);
    }

    if (normalizeOptionalString(draft.nextActionChannel) !== normalizeOptionalString(lead.nextActionChannel)) {
      payload.nextActionChannel = normalizeOptionalString(draft.nextActionChannel);
    }

    if (normalizeOptionalString(draft.reminderSnoozedUntil) !== normalizeOptionalString(lead.reminderSnoozedUntil)) {
      payload.reminderSnoozedUntil = normalizeOptionalString(draft.reminderSnoozedUntil);
    }

    const priceMin = parseNullableNumber(draft.priceMin);
    if (priceMin === undefined) {
      pushToast('error', 'Min price must be a number.');
      return;
    }
    if (priceMin !== lead.priceMin) {
      payload.priceMin = priceMin;
    }

    const priceMax = parseNullableNumber(draft.priceMax);
    if (priceMax === undefined) {
      pushToast('error', 'Max price must be a number.');
      return;
    }
    if (priceMax !== lead.priceMax) {
      payload.priceMax = priceMax;
    }

    if (normalizeOptionalString(draft.assignedTo) !== normalizeOptionalString(lead.assignedTo)) {
      payload.assignedTo = normalizeOptionalString(draft.assignedTo);
    }
    if (normalizeOptionalString(draft.referredBy) !== normalizeOptionalString(lead.referredBy)) {
      payload.referredBy = normalizeOptionalString(draft.referredBy);
    }

    const acreage = parseNullableNumber(draft.acreage);
    if (acreage === undefined) {
      pushToast('error', 'Acreage must be a number.');
      return;
    }
    if (acreage !== (lead.acreage ?? null)) {
      payload.acreage = acreage;
    }

    if (normalizeOptionalString(draft.town) !== normalizeOptionalString(lead.town)) {
      payload.town = normalizeOptionalString(draft.town);
    }
    if (normalizeOptionalString(draft.neighborhood) !== normalizeOptionalString(lead.neighborhood)) {
      payload.neighborhood = normalizeOptionalString(draft.neighborhood);
    }
    if (normalizeOptionalString(draft.houseStyle) !== normalizeOptionalString(lead.houseStyle)) {
      payload.houseStyle = normalizeOptionalString(draft.houseStyle);
    }
    if (normalizeOptionalString(draft.preferenceNotes) !== normalizeOptionalString(lead.preferenceNotes)) {
      payload.preferenceNotes = normalizeOptionalString(draft.preferenceNotes);
    }

    const leadTags = lead.tags ?? [];
    if (draft.tags.length !== leadTags.length || draft.tags.some((t, i) => t !== leadTags[i])) {
      payload.tags = draft.tags;
    }

    if (Object.keys(payload).length === 0) {
      pushToast('success', 'No unsaved lead changes.');
      return;
    }

    beginMutation();
    setSavingLeadId(leadId, true);
    setError(null);

    const optimisticLead: CrmLead = {
      ...lead,
      ...payload,
      updatedAt: new Date().toISOString(),
      notes: payload.notes === undefined ? lead.notes : payload.notes,
      timeframe: payload.timeframe === undefined ? lead.timeframe : payload.timeframe,
      listingAddress: payload.listingAddress === undefined ? lead.listingAddress : payload.listingAddress,
      propertyType: payload.propertyType === undefined ? lead.propertyType : payload.propertyType,
      beds: payload.beds === undefined ? lead.beds : payload.beds,
      baths: payload.baths === undefined ? lead.baths : payload.baths,
      sqft: payload.sqft === undefined ? lead.sqft : payload.sqft,
      status: payload.status === undefined ? lead.status : payload.status,
      leadType: payload.leadType === undefined ? lead.leadType : payload.leadType,
      nextActionAt: payload.nextActionAt === undefined ? lead.nextActionAt : payload.nextActionAt,
      nextActionNote: payload.nextActionNote === undefined ? lead.nextActionNote : payload.nextActionNote,
      priceMin: payload.priceMin === undefined ? lead.priceMin : payload.priceMin,
      priceMax: payload.priceMax === undefined ? lead.priceMax : payload.priceMax,
    };

    replaceLeadById(leadId, optimisticLead);

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Lead update failed.');
      }

      const json = (await response.json()) as { lead?: CrmLead };

      if (json.lead) {
        replaceLeadById(leadId, json.lead);
      }

      clearLeadDraft(leadId);
      pushToast('success', `Saved ${lead.listingAddress || 'lead'} updates.`);

      // Trigger Win/Loss survey when status changes to won or lost (and no reason recorded yet)
      if (payload.status && (payload.status === 'won' || payload.status === 'lost') && !lead.closeReason) {
        setWinLossPrompt({ leadId, outcome: payload.status });
      }
    } catch (mutationError) {
      replaceLeadById(leadId, lead);
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown lead update error.';
      setError(message);
      pushToast('error', message);
    } finally {
      setSavingLeadId(leadId, false);
      endMutation();
    }
  }

  async function updateContact(contactId: string) {
    const contact = contactById.get(contactId);
    const draft = draftContactById[contactId];
    if (!contact || !draft) {
      return;
    }

    const payload: { fullName?: string | null; email?: string | null; phone?: string | null } = {};

    if (normalizeOptionalString(draft.fullName) !== normalizeOptionalString(contact.fullName)) {
      payload.fullName = normalizeOptionalString(draft.fullName);
    }
    if (normalizeOptionalString(draft.email) !== normalizeOptionalString(contact.email)) {
      payload.email = normalizeOptionalString(draft.email);
    }
    if (normalizeOptionalString(draft.phone) !== normalizeOptionalString(contact.phone)) {
      payload.phone = normalizeOptionalString(draft.phone);
    }

    if (Object.keys(payload).length === 0) {
      pushToast('success', 'No unsaved contact changes.');
      return;
    }

    beginMutation();
    setSavingContactId(contactId, true);
    setError(null);

    const optimisticContact: CrmContact = {
      ...contact,
      fullName: payload.fullName === undefined ? contact.fullName : payload.fullName,
      email: payload.email === undefined ? contact.email : payload.email,
      phone: payload.phone === undefined ? contact.phone : payload.phone,
      updatedAt: new Date().toISOString(),
      emailNormalized:
        payload.email === undefined
          ? contact.emailNormalized
          : payload.email
            ? payload.email.trim().toLowerCase()
            : null,
      phoneNormalized:
        payload.phone === undefined ? contact.phoneNormalized : payload.phone ? payload.phone.replace(/\D/g, '') : null,
    };

    replaceContactById(contactId, optimisticContact);

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Contact update failed.');
      }

      const json = (await response.json()) as { contact?: CrmContact };
      if (json.contact) {
        replaceContactById(contactId, json.contact);
      }

      clearContactDraft(contactId);

      pushToast('success', 'Contact updated.');
    } catch (mutationError) {
      replaceContactById(contactId, contact);
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown contact update error.';
      setError(message);
      pushToast('error', message);
    } finally {
      setSavingContactId(contactId, false);
      endMutation();
    }
  }

  async function saveAllLeadDrafts() {
    if (pendingLeadIds.length === 0) {
      return;
    }

    await Promise.all(pendingLeadIds.map(async (leadId) => updateLead(leadId)));
  }

  // clearAllLeadDrafts is now from the store

  async function createContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const optimisticId = `optimistic-contact-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const optimisticContact: CrmContact = {
      id: optimisticId,
      tenantId: tenantContext.tenantId,
      fullName: newContactName.trim() || null,
      email: newContactEmail.trim() || null,
      emailNormalized: newContactEmail.trim().toLowerCase() || null,
      phone: newContactPhone.trim() || null,
      phoneNormalized: newContactPhone.replace(/\D/g, '') || null,
      source: 'crm_manual',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    addContact(optimisticContact);
    updateSummary({ contactCount: summary.contactCount + 1 });

    beginMutation();

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newContactName,
          email: newContactEmail,
          phone: newContactPhone,
        }),
      });

      if (!response.ok) {
        throw new Error('Contact create failed.');
      }

      const json = (await response.json()) as { contact?: CrmContact };

      resetNewContactForm();

      if (json.contact) {
        replaceContactById(optimisticId, json.contact);
      } else {
        removeContact(optimisticId);
        updateSummary({ contactCount: Math.max(0, summary.contactCount - 1) });
      }

      pushToast('success', 'Contact added.');
    } catch (mutationError) {
      removeContact(optimisticId);
      updateSummary({ contactCount: Math.max(0, summary.contactCount - 1) });
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown contact create error.';
      setError(message);
      pushToast('error', message);
    } finally {
      endMutation();
    }
  }

  async function createActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nowIso = new Date().toISOString();
    const optimisticId = `optimistic-activity-${Date.now()}`;

    const optimisticActivity: CrmActivity = {
      id: optimisticId,
      tenantId: tenantContext.tenantId,
      contactId: newActivityContactId || null,
      leadId: newActivityLeadId || null,
      activityType: newActivityType || 'note',
      occurredAt: nowIso,
      summary: newActivitySummary.trim(),
      metadataJson: null,
      createdAt: nowIso,
    };

    addActivity(optimisticActivity);
    updateSummary({ activityCount: summary.activityCount + 1 });

    beginMutation();

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: newActivityType || 'note',
          summary: newActivitySummary,
          leadId: newActivityLeadId || undefined,
          contactId: newActivityContactId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Activity create failed.');
      }

      const json = (await response.json()) as { activity?: CrmActivity };

      resetNewActivityForm();

      if (json.activity) {
        replaceActivityById(optimisticId, json.activity);
      } else {
        removeActivity(optimisticId);
        updateSummary({ activityCount: Math.max(0, summary.activityCount - 1) });
      }

      pushToast('success', 'Activity logged.');
    } catch (mutationError) {
      removeActivity(optimisticId);
      updateSummary({ activityCount: Math.max(0, summary.activityCount - 1) });
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown activity create error.';
      setError(message);
      pushToast('error', message);
    } finally {
      endMutation();
    }
  }

  async function logContactActivity(activityType: string, summary: string) {
    if (!activeLeadProfile) return;

    const nowIso = new Date().toISOString();
    const optimisticId = `optimistic-contact-${Date.now()}`;
    const optimisticActivity: CrmActivity = {
      id: optimisticId,
      tenantId: tenantContext.tenantId,
      contactId: activeLeadProfile.contactId,
      leadId: activeLeadProfile.id,
      activityType,
      occurredAt: nowIso,
      summary,
      metadataJson: null,
      createdAt: nowIso,
    };

    addActivity(optimisticActivity);
    beginMutation();

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType,
          summary,
          leadId: activeLeadProfile.id,
          contactId: activeLeadProfile.contactId || undefined,
        }),
      });

      if (!response.ok) throw new Error('Contact log failed.');

      const json = (await response.json()) as { activity?: CrmActivity };
      if (json.activity) {
        replaceActivityById(optimisticId, json.activity);
      }

      // Also update lastContactAt on the lead
      await fetch(`/api/leads/${activeLeadProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastContactAt: nowIso }),
      });

      replaceLeadById(activeLeadProfile.id, { ...activeLeadProfile, lastContactAt: nowIso });

      pushToast('success', 'Contact logged.');
    } catch (err) {
      removeActivity(optimisticId);
      pushToast('error', err instanceof Error ? err.message : 'Failed to log contact.');
    } finally {
      endMutation();
    }
  }

  async function handleDeleteLead(leadId: string) {
    beginMutation();
    try {
      const response = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Delete failed.');
      }
      removeLead(leadId);
      clearLeadDraft(leadId);
      storeCloseLeadProfile();
      updateSummary({ leadCount: Math.max(0, summary.leadCount - 1) });
      pushToast('success', 'Lead deleted.');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to delete lead.');
      throw err;
    } finally {
      endMutation();
    }
  }

  const openDashboard = useCallback(() => {
    handleNav('dashboard');
  }, [handleNav]);

  async function createLead() {
    if (!newLeadAddress.trim()) {
      pushToast('error', 'Listing address is required.');
      return;
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const optimisticLead: CrmLead = {
      id: optimisticId,
      tenantId: tenantContext.tenantId,
      contactId: null,
      status: 'new',
      leadType: (newLeadType || 'buyer') as CrmLead['leadType'],
      source: newLeadSource || 'crm_manual',
      timeframe: newLeadTimeframe.trim() || null,
      notes: newLeadNotes.trim() || null,
      listingId: null,
      listingUrl: null,
      listingAddress: newLeadAddress.trim(),
      propertyType: newLeadPropertyType || null,
      beds: null,
      baths: null,
      sqft: null,
      lastContactAt: null,
      nextActionAt: null,
      nextActionNote: null,
      nextActionChannel: null,
      reminderSnoozedUntil: null,
      priceMin: null,
      priceMax: null,
      tags: [],
      closeReason: null,
      closeNotes: null,
      closedAt: null,
      assignedTo: null,
      referredBy: null,
      acreage: null,
      town: null,
      neighborhood: null,
      houseStyle: null,
      preferenceNotes: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    addLead(optimisticLead);
    updateSummary({ leadCount: summary.leadCount + 1 });
    beginMutation();

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingAddress: newLeadAddress.trim(),
          source: newLeadSource || 'crm_manual',
          leadType: newLeadType || 'buyer',
          notes: newLeadNotes.trim() || null,
          timeframe: newLeadTimeframe.trim() || null,
          propertyType: newLeadPropertyType || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Lead create failed.');
      }

      const json = (await response.json()) as { lead?: CrmLead };

      resetNewLeadForm();

      if (json.lead) {
        replaceLeadById(optimisticId, json.lead);
      } else {
        removeLead(optimisticId);
        updateSummary({ leadCount: Math.max(0, summary.leadCount - 1) });
      }

      pushToast('success', 'Lead created successfully.');
    } catch (mutationError) {
      removeLead(optimisticId);
      updateSummary({ leadCount: Math.max(0, summary.leadCount - 1) });
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown lead create error.';
      setError(message);
      pushToast('error', message);
    } finally {
      endMutation();
    }
  }

  const openPipeline = useCallback(() => {
    handleNav('pipeline');
  }, [handleNav]);

  const openLeadsTable = useCallback((preset: TableStatusPreset) => {
    handleNav('leads');
    setTableStatusPreset(preset);
  }, [handleNav, setTableStatusPreset]);

  // Extended handleNav that also scrolls to sections
  const handleNavWithScroll = useCallback(
    (nav: WorkspaceNav) => {
      handleNav(nav);
    },
    [handleNav]
  );

  const resetBrandPreferences = useCallback(() => {
    storeResetBrandPreferences(tenantContext.tenantSlug);
  }, [tenantContext.tenantSlug, storeResetBrandPreferences]);

  // --- Properties ---
  const propertyLeadOptions = useMemo(() => {
    return leads
      .filter((l) => l.status !== 'won' && l.status !== 'lost')
      .map((l) => ({
        id: l.id,
        label: getLeadContactLabel(l, contactById),
      }));
  }, [leads, contactById]);
  const handleAssignPropertyToLead = useCallback(
    async (listing: import('@real-estate/types/listings').Listing, leadId: string) => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) return;
      const addr = `${listing.address.street}, ${listing.address.city}`;
      // Optimistic update
      replaceLeadById(leadId, { ...lead, listingAddress: addr });
      beginMutation();
      try {
        const res = await fetch(`/api/leads/${leadId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingAddress: addr }),
        });
        if (!res.ok) throw new Error('Failed to assign property');
        const json = await res.json();
        if (json.lead) {
          replaceLeadById(leadId, json.lead);
        }
        pushToast('success', `Assigned ${listing.address.street} to ${getLeadContactLabel(lead, contactById) || 'lead'}.`);
      } catch {
        // Rollback
        replaceLeadById(leadId, lead);
        pushToast('error', 'Failed to assign property to lead.');
      } finally {
        endMutation();
      }
    },
    [leads, contactById, beginMutation, endMutation, pushToast, replaceLeadById]
  );

  const handleSendPropertyToClient = useCallback(
    (listing: import('@real-estate/types/listings').Listing, leadId: string) => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) return;
      const contact = contacts.find((c) => c.id === lead.contactId);
      const email = contact?.email;
      if (!email) {
        pushToast('error', 'No email found for this lead\'s contact.');
        return;
      }
      const subject = encodeURIComponent(`Property: ${listing.address.street}, ${listing.address.city}`);
      const body = encodeURIComponent(
        `Hi ${contact.fullName || ''},\n\nI wanted to share this property with you:\n\n` +
        `${listing.address.street}\n${listing.address.city}, ${listing.address.state} ${listing.address.zip}\n` +
        `${listing.beds} beds • ${listing.baths} baths • ${listing.sqft.toLocaleString()} sqft\n` +
        `Listed at $${listing.price.toLocaleString()}\n\nLet me know if you'd like to schedule a showing!`
      );
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
      pushToast('success', `Email draft opened for ${contact.fullName || email}.`);
    },
    [leads, contacts, pushToast]
  );

  const navItems: Array<{ id: WorkspaceNav; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'pipeline', label: 'Pipeline', icon: <Kanban size={18} /> },
    { id: 'leads', label: 'Lead Tracker', icon: <ListFilter size={18} /> },
    { id: 'properties', label: 'Properties', icon: <Building2 size={18} /> },
    { id: 'transactions', label: 'Transactions', icon: <ArrowLeftRight size={18} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
    { id: 'campaigns', label: 'Campaigns', icon: <Mail size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  function toggleTableSort(column: LeadsTableSortColumn) {
    setTableSort(toggleTableSortState(tableSort, column));
  }

  return (
    <div className={`crm-shell-app ${brandPreferences.showTexture ? 'crm-shell-texture' : ''}`} style={brandThemeVars} data-density="default">
      <aside className="crm-sidebar" aria-label="CRM navigation">
        <div className="crm-sidebar-brand">
          <div className="crm-brand-lockup">
            <span className="crm-brand-mark" aria-hidden="true">
              {showBrandLogo ? (
                <Image
                  loader={passthroughImageLoader}
                  src={resolvedLogoUrl}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  onError={() => setLogoLoadErrored(true)}
                />
              ) : (
                <span>{brandInitials}</span>
              )}
            </span>
            <div>
              <p className="crm-kicker">{brandPreferences.brandName}</p>
              <h1>CRM</h1>
            </div>
          </div>
        </div>

        <nav className="crm-side-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`crm-side-nav-item ${activeNav === item.id ? 'is-active' : ''}`}
              onClick={() => handleNavWithScroll(item.id)}
            >
              <span className="crm-side-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {pinnedIds.length > 0 && (
          <div className="crm-pinned-leads">
            <p className="crm-pinned-leads__label">Pinned</p>
            <div className="crm-pinned-leads__list">
              {pinnedIds.map((id) => {
                const lead = leads.find((l) => l.id === id);
                if (!lead) return null;
                const contact = lead.contactId ? contactById.get(lead.contactId) : undefined;
                const label = contact?.fullName || lead.listingAddress || 'Lead';
                return (
                  <button
                    key={id}
                    type="button"
                    className="crm-pinned-leads__chip"
                    onClick={() => openLeadProfile(id)}
                    title={label}
                  >
                    {label.length > 14 ? label.slice(0, 12) + '...' : label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </aside>

      <div className="crm-main-shell">
        <header className="crm-header crm-header--unified">
          <div className="crm-header__left">
            <h2 className="crm-header__title">
              {activeView === 'pipeline'
                ? 'Deal Pipeline'
                : activeView === 'leads'
                  ? 'Lead Tracker'
                  : activeView === 'properties'
                    ? 'Properties'
                    : activeView === 'transactions'
                      ? 'Transactions'
                      : activeView === 'analytics'
                        ? 'Analytics'
                        : activeView === 'campaigns'
                          ? 'Campaigns'
                          : activeView === 'settings'
                            ? 'Settings'
                            : activeView === 'activity'
                              ? 'Activity'
                              : 'Dashboard'}
            </h2>
          </div>
          <div className="crm-header__right">
            <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => setShowNewLeadModal(true)}>
              + Lead
            </button>
            <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => setShowNewActivityModal(true)}>
              + Activity
            </button>
            {!isOnline && (
              <span className="crm-offline-badge" title={offlinePendingCount > 0 ? `${offlinePendingCount} items queued` : 'You are offline'}>
                Offline{offlinePendingCount > 0 ? ` (${offlinePendingCount})` : ''}
              </span>
            )}
            <div className="crm-search-wrap" ref={searchPanelRef}>
              <label className="crm-search">
                <span className="crm-search-icon" aria-hidden="true">
                  <Search size={16} />
                </span>
                <input
                  value={searchQuery}
                  onFocus={() => setSearchSuggestionsOpen(searchSuggestions.length > 0)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearchQuery(value);
                    setSearchSuggestionsOpen(value.trim().length > 0);
                  }}
                  placeholder="Search leads, contacts, addresses..."
                />
              </label>
              {searchSuggestionsOpen && searchSuggestions.length > 0 ? (
                <ul className="crm-search-suggestions" role="listbox" aria-label="Lead and contact suggestions">
                  {searchSuggestions.map((suggestion) => (
                    <li key={suggestion.id}>
                      <button
                        type="button"
                        className="crm-search-suggestion"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openLeadProfile(suggestion.leadId)}
                      >
                        <span>{suggestion.label}</span>
                        <span className="crm-muted">{suggestion.detail}</span>
                        <span className="crm-muted">{suggestion.meta}</span>
                        <span className={`crm-status-badge crm-status-${suggestion.status}`}>
                          {formatLeadStatusLabel(suggestion.status)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="crm-header-pop" ref={notificationPanelRef}>
              <button
                className="crm-icon-button crm-notif-trigger"
                type="button"
                aria-label="Notifications"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="crm-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
            </div>

            <div className="crm-header-pop" ref={avatarMenuRef}>
              <button
                type="button"
                className="crm-avatar crm-avatar-button"
                aria-label="User actions"
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              >
                {agentProfile.headshotUrl ? (
                  <Image
                    loader={passthroughImageLoader}
                    src={agentProfile.headshotUrl}
                    alt=""
                    width={36}
                    height={36}
                    unoptimized
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  agentProfile.fullName ? getBrandInitials(agentProfile.fullName) : brandInitials
                )}
              </button>
              {avatarMenuOpen ? (
                <div className="crm-popover crm-avatar-menu">
                  <button
                    type="button"
                    className="crm-popover-action"
                    onClick={() => {
                      handleNav('settings');
                      setAvatarMenuOpen(false);
                    }}
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    className="crm-popover-action"
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      window.location.href = '/sign-in';
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {!hasClerkKey && !devAuthBypassEnabled ? (
          <p className="crm-banner-warning">Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to enable sign-in UI in this environment.</p>
        ) : null}

        {error ? <p className="crm-error">{error}</p> : null}

        {loading ? <p className="crm-muted">Loading CRM data...</p> : null}

        {activeView === 'dashboard' ? (
          <section className="crm-dashboard-view">
            <section className="crm-kpi-grid" aria-label="Summary metrics">
              <button type="button" className="crm-kpi-card" onClick={() => openLeadsTable('new')}>
                <p>New Leads</p>
                <strong>{leadCountsByStatus.new}</strong>
                <KpiSparkline values={kpiSeries.newLeads} />
                <span>Open filtered table</span>
              </button>
              <button type="button" className="crm-kpi-card" onClick={() => openLeadsTable('follow_up')}>
                <p>Need Follow-up</p>
                <strong>{followUpCount}</strong>
                <KpiSparkline values={kpiSeries.followUp} />
                <span>Qualified + Nurturing</span>
              </button>
              <button type="button" className="crm-kpi-card" onClick={() => openLeadsTable('open_pipeline')}>
                <p>Open Pipeline</p>
                <strong>{activePipelineCount}</strong>
                <KpiSparkline values={kpiSeries.openPipeline} />
                <span>Active opportunities</span>
              </button>
              <button type="button" className="crm-kpi-card" onClick={() => openLeadsTable('closed')}>
                <p>Closed Win Rate</p>
                <strong>{winRate}%</strong>
                <KpiSparkline values={kpiSeries.closed} />
                <span>Won vs lost breakdown</span>
              </button>
            </section>

            <ActionCenter
              greeting={greetingLabel}
              agentName={agentProfile.fullName ? agentProfile.fullName.split(' ')[0] : 'there'}
              leads={leads}
              activities={activities}
              contactById={contactById}
              onOpenLead={openLeadProfile}
              newThisWeek={leadCountsByStatus.new}
              followUpsToday={urgentFollowUps.length}
              pipelineDeals={activePipelineCount}
              onClickNewThisWeek={() => openLeadsTable('new')}
              onClickFollowUps={() => openLeadsTable('follow_up')}
              onClickPipelineDeals={() => openLeadsTable('open_pipeline')}
            />

            <div className="crm-dashboard-funnel-row">
              <ConversionFunnel leads={leads} contactById={contactById} onClickStatus={(status) => openLeadsTable(status === 'won' || status === 'lost' ? 'all' : 'open_pipeline')} />
              <RevenuePipeline leads={leads} onClickTotal={() => openLeadsTable('open_pipeline')} />
            </div>

            <section className="crm-pulse-section" aria-label="7 day activity pulse">
              <p className="crm-kicker">7-day Pulse</p>
              <SevenDayPulse days={heartbeatDays} />
              <span className="crm-muted">
                {heartbeatDays.reduce((sum, d) => sum + d.total, 0)} events this week
              </span>
            </section>

            <MarketDigest />

            <NeedsAttention
              leads={leads}
              activities={activities}
              contactById={contactById}
              onOpenLead={openLeadProfile}
            />
          </section>
        ) : null}

        {activeView === 'leads' ? (
          <section className="crm-panel crm-leads-table-panel">
            <div className="crm-panel-head">
              <div>
                <h3>Lead Tracker</h3>
                <span className="crm-muted">Track, sort, and manage all your leads in one place.</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="crm-btn crm-btn-ghost"
                  onClick={() => exportLeadsCsv(leads, contactById)}
                >
                  ⬇ Export
                </button>
                <button
                  type="button"
                  className="crm-btn crm-btn-ghost"
                  onClick={() => setShowCsvImport(true)}
                >
                  📄 Import CSV
                </button>
                <button
                  type="button"
                  className="crm-primary-button"
                  onClick={() => toggleShowNewLeadForm()}
                >
                  {showNewLeadForm ? '✕ Cancel' : '＋ New Lead'}
                </button>
              </div>
            </div>

            {showNewLeadForm && (
              <div className="crm-new-lead-form">
                <div className="crm-new-lead-fields">
                  <label className="crm-field">
                    Listing Address *
                    <input
                      type="text"
                      value={newLeadAddress}
                      placeholder="123 Main St, Fairfield, CT"
                      onChange={(event) => setNewLeadField('newLeadAddress', event.target.value)}
                    />
                  </label>
                  <label className="crm-field">
                    Lead Type
                    <select value={newLeadType} onChange={(event) => setNewLeadField('newLeadType', event.target.value)}>
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                    </select>
                  </label>
                  <label className="crm-field">
                    Source
                    <select value={newLeadSource} onChange={(event) => setNewLeadField('newLeadSource', event.target.value)}>
                      <option value="crm_manual">Manual Entry</option>
                      <option value="website">Website</option>
                      <option value="referral">Referral</option>
                      <option value="social">Social Media</option>
                      <option value="cold_call">Cold Call</option>
                      <option value="open_house">Open House</option>
                    </select>
                  </label>
                  <label className="crm-field">
                    Property Type
                    <select value={newLeadPropertyType} onChange={(event) => setNewLeadField('newLeadPropertyType', event.target.value)}>
                      <option value="">Not specified</option>
                      <option value="single-family">Single Family</option>
                      <option value="condo">Condo</option>
                      <option value="multi-family">Multi-Family</option>
                    </select>
                  </label>
                  <label className="crm-field">
                    Timeframe
                    <input
                      type="text"
                      value={newLeadTimeframe}
                      placeholder="e.g. 3-6 months"
                      onChange={(event) => setNewLeadField('newLeadTimeframe', event.target.value)}
                    />
                  </label>
                  <label className="crm-field crm-field-wide">
                    Notes
                    <textarea
                      value={newLeadNotes}
                      placeholder="Initial notes about this lead..."
                      rows={2}
                      onChange={(event) => setNewLeadField('newLeadNotes', event.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="crm-primary-button"
                  disabled={!newLeadAddress.trim() || activeMutations > 0}
                  onClick={() => { void createLead(); }}
                >
                  {activeMutations > 0 ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            )}

            <div className="crm-inline-controls crm-table-presets">
              <button
                type="button"
                className={`crm-sort-toggle ${tableStatusPreset === 'all' ? 'is-active' : ''}`}
                onClick={() => setTableStatusPreset('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`crm-sort-toggle ${tableStatusPreset === 'new' ? 'is-active' : ''}`}
                onClick={() => setTableStatusPreset('new')}
              >
                New
              </button>
              <button
                type="button"
                className={`crm-sort-toggle ${tableStatusPreset === 'follow_up' ? 'is-active' : ''}`}
                onClick={() => setTableStatusPreset('follow_up')}
              >
                Follow-up
              </button>
              <button
                type="button"
                className={`crm-sort-toggle ${tableStatusPreset === 'open_pipeline' ? 'is-active' : ''}`}
                onClick={() => setTableStatusPreset('open_pipeline')}
              >
                Open Pipeline
              </button>
              <button
                type="button"
                className={`crm-sort-toggle ${tableStatusPreset === 'closed' ? 'is-active' : ''}`}
                onClick={() => setTableStatusPreset('closed')}
              >
                Closed
              </button>
            </div>

            {leadsTableRows.length === 0 ? (
              <EmptyState title="No leads in this table view" detail="Try switching presets or adjusting active filters." />
            ) : (
              <div className="crm-table-wrap">
                <table className="crm-leads-table">
                  <thead>
                    <tr>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('name')}>
                          Name
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('leadType')}>
                          Lead Type
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('status')}>
                          Status
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('score')}>
                          Score
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('priceRange')}>
                          Price Range
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('location')}>
                          Location
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('lastContact')}>
                          Last Contact
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('desired')}>
                          Beds / Baths / Size Desired
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('phone')}>
                          Phone
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('email')}>
                          Email
                        </button>
                      </th>
                      <th>Actions</th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('source')}>
                          Source
                        </button>
                      </th>
                      <th>
                        <button type="button" className="crm-table-head-btn" onClick={() => toggleTableSort('updatedAt')}>
                          Updated At
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsTableRows.map((row) => (
                      <tr key={row.lead.id}>
                        <td>
                          <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(row.lead.id)}>
                            {row.contactLabel}
                          </button>
                          <span className="crm-muted crm-table-sub">{row.intentLabel}</span>
                        </td>
                        <td>{formatLeadTypeLabel(row.lead.leadType)}</td>
                        <td>
                          <span className={`crm-status-badge crm-status-${row.draft.status}`}>
                            {formatLeadStatusLabel(row.draft.status)}
                          </span>
                        </td>
                        <td>
                          <span className={`crm-score-badge crm-score-${row.score.label.toLowerCase()}`}>
                            {row.score.score} {row.score.label}
                          </span>
                        </td>
                        <td>{row.priceRange}</td>
                        <td>
                          <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(row.lead.id)}>
                            {row.location}
                          </button>
                        </td>
                        <td>{row.lastContact ? formatDateTime(row.lastContact) : '-'}</td>
                        <td>{row.desired}</td>
                        <td>
                          {row.phone ? <a href={`tel:${row.phone}`} className="crm-inline-link">{row.phone}</a> : '-'}
                        </td>
                        <td>
                          {row.email ? <a href={`mailto:${row.email}`} className="crm-inline-link">{row.email}</a> : '-'}
                        </td>
                        <td>
                          {row.phone || row.email ? (
                            <div className="crm-quick-actions">
                              {row.phone ? (
                                <a href={`tel:${row.phone}`} className="crm-quick-action" title={`Call ${row.phone}`} aria-label="Call lead">📞</a>
                              ) : null}
                              {row.email ? (
                                <a href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: ${row.lead.listingAddress || 'Your inquiry'}`)}`} className="crm-quick-action" title={`Email ${row.email}`} aria-label="Email lead">✉️</a>
                              ) : null}
                              {row.phone ? (
                                <a href={`sms:${row.phone}`} className="crm-quick-action" title={`Text ${row.phone}`} aria-label="Text lead">💬</a>
                              ) : null}
                            </div>
                          ) : '-'}
                        </td>
                        <td>{formatLeadSourceLabel(row.lead.source)}</td>
                        <td>{formatDateTime(row.lead.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        {activeView === 'pipeline' ? (
          <PipelineView
            groupedLeads={groupedPipelineLeads}
            contactById={contactById}
            getLeadDraft={getLeadDraft}
            hasUnsavedLeadChange={hasUnsavedLeadChange}
            savingLeadIds={savingLeadIds}
            isPinned={isPinned}
            sourceFilterOptions={sourceFilterOptions}
            pipelineStatusFilter={pipelineStatusFilter}
            pipelineSourceFilter={pipelineSourceFilter}
            pipelineLeadTypeFilter={pipelineLeadTypeFilter}
            onStatusFilterChange={setPipelineStatusFilter}
            onSourceFilterChange={setPipelineSourceFilter}
            onLeadTypeFilterChange={setPipelineLeadTypeFilter}
            onOpenProfile={openLeadProfile}
            onTogglePin={togglePin}
            onDraftChange={handleSetLeadDraftField}
            onSave={(leadId) => { void updateLead(leadId); }}
            pushToast={pushToast}
          />
        ) : null}

        {activeView === 'properties' ? (
          <PropertiesView
            leadOptions={propertyLeadOptions}
            onAssignToLead={handleAssignPropertyToLead}
            onSendToClient={handleSendPropertyToClient}
            pushToast={pushToast}
          />
        ) : null}

        {activeView === 'transactions' ? (
          <TransactionsView
            pushToast={pushToast}
          />
        ) : null}

        {activeView === 'analytics' ? (
          <AnalyticsView
            leads={leads}
            activities={activities}
            contactById={contactById}
          />
        ) : null}

        {activeView === 'campaigns' ? <CampaignsView /> : null}

        {activeView === 'activity' ? (
          <ActivityView
            activities={activities}
            leads={leads}
            contacts={contacts}
            contactById={contactById}
            leadById={leadById}
            onOpenLead={openLeadProfile}
          />
        ) : null}

        {activeView === 'settings' ? (
          <SettingsView
            brandPreferences={brandPreferences}
            setBrandPreferences={(value) => {
              if (typeof value === 'function') {
                setBrandPreferences(value(brandPreferences));
              } else {
                setBrandPreferences(value);
              }
            }}
            resetBrandPreferences={resetBrandPreferences}
            websiteFaviconUrl={websiteFaviconUrl}
            showBrandLogo={showBrandLogo}
            resolvedLogoUrl={resolvedLogoUrl}
            brandInitials={brandInitials}
            setLogoLoadErrored={(value) => {
              if (typeof value === 'function') {
                setLogoLoadErrored(value(logoLoadErrored));
              } else {
                setLogoLoadErrored(value);
              }
            }}
            tenantContext={tenantContext}
            notificationPrefs={pushNotifications.prefs}
            notificationPermission={pushNotifications.permissionState}
            onRequestNotificationPermission={pushNotifications.requestPermission}
            onUpdateNotificationPrefs={pushNotifications.updatePrefs}
            agentProfile={agentProfile}
            setAgentProfile={(value) => {
              if (typeof value === 'function') {
                setAgentProfile(value(agentProfile));
              } else {
                setAgentProfile(value);
              }
            }}
            leads={leads}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        ) : null}

        <footer className="crm-footer">
          <span className="crm-footer-brand">
            <span className="crm-brand-mark crm-brand-mark-micro" aria-hidden="true">
              {showBrandLogo ? (
                <Image
                  loader={passthroughImageLoader}
                  src={resolvedLogoUrl}
                  alt=""
                  width={24}
                  height={24}
                  unoptimized
                  onError={() => setLogoLoadErrored(true)}
                />
              ) : (
                <span>{brandInitials}</span>
              )}
            </span>
            <span>{brandPreferences.brandName}</span>
          </span>
          <div className="crm-footer-links">
            <button type="button" className="crm-footer-link" onClick={() => handleNav('settings')}>
              Settings
            </button>
            <button type="button" className="crm-footer-link" onClick={() => openLeadsTable('all')}>
              Lead Tracker
            </button>
            <button type="button" className="crm-footer-link" onClick={openPipeline}>
              Pipeline
            </button>
          </div>
        </footer>
      </div>

      {activeLeadProfile ? (
        <LeadProfileModal
          lead={activeLeadProfile}
          leadDraft={getLeadDraft(activeLeadProfile)}
          activeContact={activeContact}
          activeContactDraft={activeContactDraft ?? undefined}
          activeLeadLastContact={activeLeadLastContact}
          searchSignals={activeLeadSearchSignals}
          listingSignals={activeLeadListingSignals}
          activities={activeLeadProfileActivities}
          leadScore={leadScore}
          savingLead={Boolean(savingLeadIds[activeLeadProfile.id])}
          savingContact={activeContact ? Boolean(savingContactIds[activeContact.id]) : false}
          hasUnsavedLeadChange={hasUnsavedLeadChange(activeLeadProfile)}
          hasUnsavedContactChange={activeContact ? hasUnsavedContactChange(activeContact) : false}
          onClose={closeLeadProfile}
          onSetLeadDraftField={handleSetLeadDraftField}
          onSetContactDraft={(updater) => {
            // Compatibility wrapper: LeadProfileModal passes React-style setState updaters
            if (typeof updater === 'function') {
              const next = updater(draftContactById);
              for (const [id, draft] of Object.entries(next)) {
                store.setContactDraft(id, draft);
              }
            }
          }}
          onUpdateLead={updateLead}
          onUpdateContact={updateContact}
          onClearLeadDraft={clearLeadDraft}
          onLogContact={logContactActivity}
          onViewLead={openLeadProfile}
          onDeleteLead={handleDeleteLead}
          dismissedDuplicateIds={dismissedDuplicateLeadIds}
          onDismissDuplicate={(id) => setDismissedDuplicateLeadIds((prev) => new Set(prev).add(id))}
          onSaveReminder={(leadId, data) => {
            handleSetLeadDraftField(leadId, 'nextActionAt', data.nextActionAt);
            handleSetLeadDraftField(leadId, 'nextActionNote', data.nextActionNote);
            handleSetLeadDraftField(leadId, 'nextActionChannel', data.nextActionChannel);
            void updateLead(leadId);
          }}
          onSnoozeReminder={(leadId, durationMs) => {
            const snoozedUntil = new Date(Date.now() + durationMs).toISOString();
            handleSetLeadDraftField(leadId, 'reminderSnoozedUntil', snoozedUntil);
            void updateLead(leadId);
          }}
        />
      ) : null}

      {showCsvImport ? (
        <CsvImportModal
          tenantId={tenantContext.tenantId}
          onClose={() => setShowCsvImport(false)}
          onImportComplete={(imported, errors) => {
            pushToast('success', `Imported ${imported} lead${imported !== 1 ? 's' : ''}${errors > 0 ? ` (${errors} error${errors !== 1 ? 's' : ''})` : ''}.`);
            void reloadWorkspace();
          }}
        />
      ) : null}

      {winLossPrompt ? (
        <WinLossModal
          leadName={(() => {
            const l = leadById.get(winLossPrompt.leadId);
            return l ? getLeadContactLabel(l, contactById) : 'Lead';
          })()}
          outcome={winLossPrompt.outcome}
          onSubmit={async (data) => {
            try {
              await fetch(`/api/leads/${winLossPrompt.leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  closeReason: data.closeReason || null,
                  closeNotes: data.closeNotes || null,
                  closedAt: new Date().toISOString(),
                }),
              });
              pushToast('success', 'Close reason saved.');
            } catch {
              pushToast('error', 'Failed to save close reason.');
            }
            setWinLossPrompt(null);
          }}
          onSkip={() => setWinLossPrompt(null)}
        />
      ) : null}

      <CommandPalette
        open={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onNavigate={(nav) => {
          handleNav(nav);
        }}
        onOpenLead={openLeadProfile}
        leads={leads}
        contacts={contacts}
      />

      <NotificationCenter
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onOpenLead={openLeadProfile}
        onDismiss={dismissNotification}
        onClearAll={clearAllNotifications}
      />

      <MobileActionBar
        onSearchClick={() => {
          const input = document.querySelector<HTMLInputElement>('.crm-search input');
          input?.focus();
        }}
        onNewLeadClick={() => {
          handleNav('leads');
          setShowNewLeadForm(true);
        }}
        onLogActivityClick={() => handleNavWithScroll('activity')}
        onNotificationsClick={() => setNotificationsOpen(true)}
        notificationCount={unreadCount}
      />

      <div className="crm-floating-btn-stack">
        <button type="button" className="crm-floating-btn" onClick={() => setShowNewLeadModal(true)} title="New Lead" aria-label="New Lead">
          + Lead
        </button>
        <button type="button" className="crm-floating-btn" onClick={() => setShowNewActivityModal(true)} title="New Activity" aria-label="New Activity">
          + Activity
        </button>
      </div>

      <FloatingActivityLog
        activities={activities}
        leadById={leadById}
        contactById={contactById}
        onOpenLead={openLeadProfile}
      />

      <NewLeadModal
        open={showNewLeadModal}
        onClose={() => setShowNewLeadModal(false)}
        isMutating={isMutating}
        onSubmit={async (data) => {
          setShowNewLeadModal(false);
          setNewLeadField('newLeadAddress', data.listingAddress);
          setNewLeadField('newLeadSource', data.source);
          setNewLeadField('newLeadType', data.leadType);
          setNewLeadField('newLeadNotes', data.notes);
          setNewLeadField('newLeadTimeframe', data.timeframe);
          setNewLeadField('newLeadPropertyType', data.propertyType);
          await createLead();
        }}
      />

      <NewActivityModal
        open={showNewActivityModal}
        onClose={() => setShowNewActivityModal(false)}
        isMutating={isMutating}
        leads={leads}
        contacts={contacts}
        contactById={contactById}
        onSubmit={async (data) => {
          setShowNewActivityModal(false);
          // Direct POST since this bypasses the form state
          const nowIso = new Date().toISOString();
          const optimisticId = `optimistic-activity-${Date.now()}`;
          const optimisticActivity: CrmActivity = {
            id: optimisticId,
            tenantId: tenantContext.tenantId,
            contactId: data.contactId || null,
            leadId: data.leadId || null,
            activityType: data.activityType,
            occurredAt: nowIso,
            summary: data.summary,
            metadataJson: null,
            createdAt: nowIso,
          };
          addActivity(optimisticActivity);
          updateSummary({ activityCount: summary.activityCount + 1 });
          beginMutation();
          try {
            const response = await fetch('/api/activities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Activity create failed.');
            const json = (await response.json()) as { activity?: CrmActivity };
            if (json.activity) replaceActivityById(optimisticId, json.activity);
            else { removeActivity(optimisticId); updateSummary({ activityCount: Math.max(0, summary.activityCount - 1) }); }
            pushToast('success', 'Activity logged.');
          } catch (err) {
            removeActivity(optimisticId);
            updateSummary({ activityCount: Math.max(0, summary.activityCount - 1) });
            pushToast('error', err instanceof Error ? err.message : 'Failed to log activity.');
          } finally {
            endMutation();
          }
        }}
      />


      {showQuickAddLead && (
        <div className="crm-quick-add-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowQuickAddLead(false); }}>
          <div className="crm-quick-add-modal">
            <div className="crm-quick-add-header">
              <h3>Quick Add Lead</h3>
              <button type="button" className="crm-icon-button" onClick={() => setShowQuickAddLead(false)} aria-label="Close">✕</button>
            </div>
            <div className="crm-quick-add-body">
              <label className="crm-field">
                Listing Address *
                <input
                  type="text"
                  value={newLeadAddress}
                  placeholder="123 Main St, Fairfield, CT"
                  onChange={(e) => setNewLeadField('newLeadAddress', e.target.value)}
                  autoFocus
                />
              </label>
              <div className="crm-quick-add-row">
                <label className="crm-field">
                  Type
                  <select value={newLeadType} onChange={(e) => setNewLeadField('newLeadType', e.target.value)}>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                  </select>
                </label>
                <label className="crm-field">
                  Source
                  <select value={newLeadSource} onChange={(e) => setNewLeadField('newLeadSource', e.target.value)}>
                    <option value="crm_manual">Manual Entry</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social">Social Media</option>
                    <option value="cold_call">Cold Call</option>
                    <option value="open_house">Open House</option>
                  </select>
                </label>
              </div>
              <label className="crm-field">
                Notes
                <textarea
                  value={newLeadNotes}
                  placeholder="Quick notes about this lead..."
                  rows={2}
                  onChange={(e) => setNewLeadField('newLeadNotes', e.target.value)}
                />
              </label>
            </div>
            <div className="crm-quick-add-footer">
              <button
                type="button"
                className="crm-secondary-button"
                onClick={() => setShowQuickAddLead(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="crm-primary-button"
                disabled={!newLeadAddress.trim() || isMutating}
                onClick={() => {
                  void createLead();
                  setShowQuickAddLead(false);
                }}
              >
                {isMutating ? 'Creating...' : 'Create Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="crm-toast-stack" aria-live="polite" aria-label="CRM notifications">
        {toasts.map((toast) => (
          <div key={toast.id} className={`crm-toast crm-toast-${toast.kind}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
