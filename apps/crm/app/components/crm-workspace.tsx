'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { CrmActivity, CrmContact, CrmLead, CrmLeadStatus } from '@real-estate/types/crm';
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
import dynamic from 'next/dynamic';
import { KpiSparkline } from './shared/KpiSparkline';
import { EmptyState } from './shared/EmptyState';
import { SevenDayPulse } from './dashboard/SevenDayPulse';
import { MyDayPanel } from './dashboard/MyDayPanel';
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
import { MobileActionBar } from './shared/MobileActionBar';
import { computeLeadEscalationLevel } from '@real-estate/ai/crm/escalation-engine';
import { useOfflineQueue } from '../lib/use-offline-queue';
import { exportLeadsCsv, exportActivitiesCsv } from '../lib/crm-export';

const ProfileView = dynamic(() => import('./views/ProfileView').then(m => ({ default: m.ProfileView })), { ssr: false });
const SettingsView = dynamic(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })), { ssr: false });
const LeadProfileModal = dynamic(() => import('./views/LeadProfileModal').then(m => ({ default: m.LeadProfileModal })), { ssr: false });
const PropertiesView = dynamic(() => import('./properties/PropertiesView').then(m => ({ default: m.PropertiesView })), { ssr: false });
const TransactionsView = dynamic(() => import('./transactions/TransactionsView').then(m => ({ default: m.TransactionsView })), { ssr: false });

export function CrmWorkspace({
  tenantContext,
  hasClerkKey,
  devAuthBypassEnabled,
  initialSummary,
}: CrmWorkspaceProps) {
  const { theme, toggleTheme } = useCrmTheme(tenantContext.tenantId);
  const [summary, setSummary] = useState(initialSummary);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMutations, setActiveMutations] = useState(0);

  const [draftByLeadId, setDraftByLeadId] = useState<Record<string, LeadDraft>>({});
  const [savingLeadIds, setSavingLeadIds] = useState<Record<string, true>>({});
  const [draftContactById, setDraftContactById] = useState<Record<string, ContactDraft>>({});
  const [savingContactIds, setSavingContactIds] = useState<Record<string, true>>({});

  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const [newActivitySummary, setNewActivitySummary] = useState('');
  const [newActivityLeadId, setNewActivityLeadId] = useState('');
  const [newActivityContactId, setNewActivityContactId] = useState('');
  const [activitySortMode, setActivitySortMode] = useState<'recent' | 'alpha'>('recent');

  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [newLeadAddress, setNewLeadAddress] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('crm_manual');
  const [newLeadType, setNewLeadType] = useState<'buyer' | 'seller'>('buyer');
  const [newLeadNotes, setNewLeadNotes] = useState('');
  const [newLeadTimeframe, setNewLeadTimeframe] = useState('');
  const [newLeadPropertyType, setNewLeadPropertyType] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false);

  const [dashboardStatusFilter, setDashboardStatusFilter] = useState<LeadStatusFilter>(ALL_STATUS_FILTER);
  const [dashboardSourceFilter, setDashboardSourceFilter] = useState<LeadSourceFilter>(ALL_SOURCE_FILTER);
  const [dashboardLeadTypeFilter, setDashboardLeadTypeFilter] = useState<LeadTypeFilter>(ALL_LEAD_TYPE_FILTER);

  const [pipelineStatusFilter, setPipelineStatusFilter] = useState<LeadStatusFilter>(ALL_STATUS_FILTER);
  const [pipelineSourceFilter, setPipelineSourceFilter] = useState<LeadSourceFilter>(ALL_SOURCE_FILTER);
  const [pipelineLeadTypeFilter, setPipelineLeadTypeFilter] = useState<LeadTypeFilter>(ALL_LEAD_TYPE_FILTER);

  const [tableStatusPreset, setTableStatusPreset] = useState<TableStatusPreset>('all');
  const [tableSort, setTableSort] = useState<LeadsTableSort>({ column: 'updatedAt', direction: 'desc' });

  const [toasts, setToasts] = useState<WorkspaceToast[]>([]);
  const [activeNav, setActiveNav] = useState<WorkspaceNav>('dashboard');
  const [activeView, setActiveView] = useState<WorkspaceView>('dashboard');
  const [activeLeadProfileId, setActiveLeadProfileId] = useState<string | null>(null);

  const [winLossPrompt, setWinLossPrompt] = useState<{ leadId: string; outcome: 'won' | 'lost' } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [logoLoadErrored, setLogoLoadErrored] = useState(false);
  const [brandPreferences, setBrandPreferences] = useState<BrandPreferences>(() =>
    createDefaultBrandPreferences(tenantContext.tenantSlug)
  );
  const [agentProfile, setAgentProfile] = useState<AgentProfile>({
    fullName: '',
    email: '',
    phone: '',
    brokerage: '',
    licenseNumber: '',
    headshotUrl: '',
    bio: '',
  });

  const contactPanelRef = useRef<HTMLElement | null>(null);
  const activityPanelRef = useRef<HTMLElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);

  const brandStorageKey = useMemo(() => `crm.branding.${tenantContext.tenantId}`, [tenantContext.tenantId]);
  const profileStorageKey = useMemo(() => `crm.profile.${tenantContext.tenantId}`, [tenantContext.tenantId]);
  const websiteFaviconUrl = useMemo(() => `https://${tenantContext.tenantDomain}/favicon.ico`, [tenantContext.tenantDomain]);
  const [greetingLabel, setGreetingLabel] = useState('Welcome');
  useEffect(() => {
    setGreetingLabel(getTimeGreeting());
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(brandStorageKey);
      if (!raw) {
        setBrandPreferences(createDefaultBrandPreferences(tenantContext.tenantSlug));
        return;
      }
      const parsed = JSON.parse(raw) as Partial<BrandPreferences>;
      setBrandPreferences({
        ...createDefaultBrandPreferences(tenantContext.tenantSlug),
        ...parsed,
      });
    } catch {
      setBrandPreferences(createDefaultBrandPreferences(tenantContext.tenantSlug));
    }
  }, [brandStorageKey, tenantContext.tenantSlug]);

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
        setAgentProfile((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore parse errors.
    }
  }, [profileStorageKey]);

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

  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const { notifications, unreadCount } = useNotifications({ leads, activities, contactById });
  const { pinnedIds, togglePin, isPinned } = usePinnedLeads(tenantContext.tenantId);
  const { isOnline, pendingCount: offlinePendingCount, enqueue: enqueueOffline } = useOfflineQueue(tenantContext.tenantId);

  // Cmd+K / Ctrl+K keyboard shortcut for command palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pushToast = useCallback((kind: WorkspaceToast['kind'], message: string) => {
    const toastId = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id: toastId, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 3200);
  }, []);

  const beginMutation = useCallback(() => {
    setActiveMutations((prev) => prev + 1);
  }, []);

  const endMutation = useCallback(() => {
    setActiveMutations((prev) => Math.max(0, prev - 1));
  }, []);

  const getLeadDraft = useCallback(
    (lead: CrmLead): LeadDraft => {
      return draftByLeadId[lead.id] ?? buildLeadDraft(lead);
    },
    [draftByLeadId]
  );

  const setLeadDraftField = useCallback(
    (leadId: string, field: keyof LeadDraft, value: string | CrmLeadStatus) => {
      const lead = leadById.get(leadId);
      if (!lead) {
        return;
      }
      setDraftByLeadId((prev) => {
        const current = prev[leadId] ?? buildLeadDraft(lead);
        return {
          ...prev,
          [leadId]: {
            ...current,
            [field]: value,
          },
        };
      });
    },
    [leadById]
  );

  const hasUnsavedLeadChange = useCallback(
    (lead: CrmLead) => {
      const draft = getLeadDraft(lead);
      return (
        draft.status !== lead.status ||
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
        parseNullableNumber(draft.priceMax) !== lead.priceMax
      );
    },
    [getLeadDraft]
  );

  const clearLeadDraft = useCallback((leadId: string) => {
    setDraftByLeadId((prev) => {
      if (!(leadId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[leadId];
      return next;
    });
  }, []);

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

  const leadsByContactId = useMemo(() => {
    const map = new Map<string, CrmLead[]>();
    for (const lead of leads) {
      if (!lead.contactId) {
        continue;
      }
      const entries = map.get(lead.contactId) ?? [];
      entries.push(lead);
      map.set(lead.contactId, entries);
    }

    for (const [contactId, contactLeads] of map.entries()) {
      const sorted = [...contactLeads].sort((a, b) => {
        if (activitySortMode === 'alpha') {
          return (a.listingAddress || '').localeCompare(b.listingAddress || '');
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      map.set(contactId, sorted);
    }

    return map;
  }, [activitySortMode, leads]);

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
    const map = new Map<string, string>();

    for (const activity of activities) {
      if (!activity.leadId) {
        continue;
      }

      if (activity.activityType !== 'note' && activity.activityType !== 'lead_status_changed') {
        continue;
      }

      const existing = map.get(activity.leadId);
      if (!existing || new Date(activity.occurredAt).getTime() > new Date(existing).getTime()) {
        map.set(activity.leadId, activity.occurredAt);
      }
    }

    return map;
  }, [activities]);

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

  const sortedActivityLeads = useMemo(() => {
    const working = [...leads];
    working.sort((left, right) => {
      if (activitySortMode === 'alpha') {
        return (left.listingAddress || '').localeCompare(right.listingAddress || '');
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
    return working;
  }, [activitySortMode, leads]);

  const sortedActivityContacts = useMemo(() => {
    const working = [...contacts];
    working.sort((left, right) => {
      if (activitySortMode === 'alpha') {
        return (left.fullName || left.email || '').localeCompare(right.fullName || right.email || '');
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
    return working;
  }, [activitySortMode, contacts]);

  const activityLeadOptions = useMemo(() => {
    if (!newActivityContactId) {
      return sortedActivityLeads;
    }

    return leadsByContactId.get(newActivityContactId) ?? [];
  }, [leadsByContactId, newActivityContactId, sortedActivityLeads]);

  const loadWorkspace = useCallback(async () => {
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
      setSummary((prev) => ({
        ...prev,
        leadCount: leadsJson.leads.length,
        contactCount: contactsJson.contacts.length,
        activityCount: activitiesJson.activities.length,
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown CRM load error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const openLeadProfile = useCallback(
    (leadId: string) => {
      setActiveLeadProfileId(leadId);
      setSearchSuggestionsOpen(false);

      void (async () => {
        try {
          const response = await fetch(`/api/leads/${leadId}`, { cache: 'no-store' });
          if (!response.ok) {
            return;
          }
          const json = (await response.json()) as { lead?: CrmLead };
          if (json.lead) {
            setLeads((prev) => prev.map((entry) => (entry.id === leadId ? json.lead! : entry)));
          }
        } catch {
          // Keep modal open with current local data.
        }
      })();
    },
    []
  );

  const closeLeadProfile = useCallback(() => {
    if (!activeLeadProfile) {
      setActiveLeadProfileId(null);
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

    setActiveLeadProfileId(null);
  }, [activeContact, activeLeadProfile, hasUnsavedContactChange, hasUnsavedLeadChange]);

  useEffect(() => {
    if (!activeLeadProfileId) {
      return;
    }
    if (!leadById.has(activeLeadProfileId)) {
      setActiveLeadProfileId(null);
    }
  }, [activeLeadProfileId, leadById]);

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
      assignedTo?: string | null;
      referredBy?: string | null;
    } = {};

    if (draft.status !== lead.status) {
      payload.status = draft.status;
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

    if (Object.keys(payload).length === 0) {
      pushToast('success', 'No unsaved lead changes.');
      return;
    }

    beginMutation();
    setSavingLeadIds((prev) => ({ ...prev, [leadId]: true }));
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
      nextActionAt: payload.nextActionAt === undefined ? lead.nextActionAt : payload.nextActionAt,
      nextActionNote: payload.nextActionNote === undefined ? lead.nextActionNote : payload.nextActionNote,
      priceMin: payload.priceMin === undefined ? lead.priceMin : payload.priceMin,
      priceMax: payload.priceMax === undefined ? lead.priceMax : payload.priceMax,
    };

    setLeads((prev) => prev.map((entry) => (entry.id === leadId ? optimisticLead : entry)));

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
        setLeads((prev) => prev.map((entry) => (entry.id === leadId ? json.lead! : entry)));
      }

      clearLeadDraft(leadId);
      pushToast('success', `Saved ${lead.listingAddress || 'lead'} updates.`);

      // Trigger Win/Loss survey when status changes to won or lost (and no reason recorded yet)
      if (payload.status && (payload.status === 'won' || payload.status === 'lost') && !lead.closeReason) {
        setWinLossPrompt({ leadId, outcome: payload.status });
      }
    } catch (mutationError) {
      setLeads((prev) => prev.map((entry) => (entry.id === leadId ? lead : entry)));
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown lead update error.';
      setError(message);
      pushToast('error', message);
    } finally {
      setSavingLeadIds((prev) => {
        const next = { ...prev };
        delete next[leadId];
        return next;
      });
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
    setSavingContactIds((prev) => ({ ...prev, [contactId]: true }));
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

    setContacts((prev) => prev.map((entry) => (entry.id === contactId ? optimisticContact : entry)));

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
        setContacts((prev) => prev.map((entry) => (entry.id === contactId ? json.contact! : entry)));
      }

      setDraftContactById((prev) => {
        const next = { ...prev };
        delete next[contactId];
        return next;
      });

      pushToast('success', 'Contact updated.');
    } catch (mutationError) {
      setContacts((prev) => prev.map((entry) => (entry.id === contactId ? contact : entry)));
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown contact update error.';
      setError(message);
      pushToast('error', message);
    } finally {
      setSavingContactIds((prev) => {
        const next = { ...prev };
        delete next[contactId];
        return next;
      });
      endMutation();
    }
  }

  async function saveAllLeadDrafts() {
    if (pendingLeadIds.length === 0) {
      return;
    }

    await Promise.all(pendingLeadIds.map(async (leadId) => updateLead(leadId)));
  }

  function clearAllLeadDrafts() {
    setDraftByLeadId({});
  }

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

    setContacts((prev) => [optimisticContact, ...prev]);
    setSummary((prev) => ({ ...prev, contactCount: prev.contactCount + 1 }));

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

      setNewContactName('');
      setNewContactEmail('');
      setNewContactPhone('');

      if (json.contact) {
        setContacts((prev) => prev.map((contact) => (contact.id === optimisticId ? json.contact! : contact)));
      } else {
        setContacts((prev) => prev.filter((contact) => contact.id !== optimisticId));
        setSummary((prev) => ({ ...prev, contactCount: Math.max(0, prev.contactCount - 1) }));
      }

      pushToast('success', 'Contact added.');
    } catch (mutationError) {
      setContacts((prev) => prev.filter((contact) => contact.id !== optimisticId));
      setSummary((prev) => ({ ...prev, contactCount: Math.max(0, prev.contactCount - 1) }));
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
      activityType: 'note',
      occurredAt: nowIso,
      summary: newActivitySummary.trim(),
      metadataJson: null,
      createdAt: nowIso,
    };

    setActivities((prev) => [optimisticActivity, ...prev]);
    setSummary((prev) => ({ ...prev, activityCount: prev.activityCount + 1 }));

    beginMutation();

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: 'note',
          summary: newActivitySummary,
          leadId: newActivityLeadId || undefined,
          contactId: newActivityContactId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Activity create failed.');
      }

      const json = (await response.json()) as { activity?: CrmActivity };

      setNewActivitySummary('');
      setNewActivityLeadId('');
      setNewActivityContactId('');

      if (json.activity) {
        setActivities((prev) => prev.map((activity) => (activity.id === optimisticId ? json.activity! : activity)));
      } else {
        setActivities((prev) => prev.filter((activity) => activity.id !== optimisticId));
        setSummary((prev) => ({ ...prev, activityCount: Math.max(0, prev.activityCount - 1) }));
      }

      pushToast('success', 'Activity logged.');
    } catch (mutationError) {
      setActivities((prev) => prev.filter((activity) => activity.id !== optimisticId));
      setSummary((prev) => ({ ...prev, activityCount: Math.max(0, prev.activityCount - 1) }));
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

    setActivities((prev) => [optimisticActivity, ...prev]);
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
        setActivities((prev) => prev.map((a) => (a.id === optimisticId ? json.activity! : a)));
      }

      // Also update lastContactAt on the lead
      await fetch(`/api/leads/${activeLeadProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastContactAt: nowIso }),
      });

      setLeads((prev) =>
        prev.map((l) => (l.id === activeLeadProfile.id ? { ...l, lastContactAt: nowIso } : l))
      );

      pushToast('success', 'Contact logged.');
    } catch (err) {
      setActivities((prev) => prev.filter((a) => a.id !== optimisticId));
      pushToast('error', err instanceof Error ? err.message : 'Failed to log contact.');
    } finally {
      endMutation();
    }
  }

  const openDashboard = useCallback(() => {
    setActiveNav('dashboard');
    setActiveView('dashboard');
  }, []);

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
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setLeads((prev) => [optimisticLead, ...prev]);
    setSummary((prev) => ({ ...prev, leadCount: prev.leadCount + 1 }));
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

      setNewLeadAddress('');
      setNewLeadSource('crm_manual');
      setNewLeadType('buyer');
      setNewLeadNotes('');
      setNewLeadTimeframe('');
      setNewLeadPropertyType('');
      setShowNewLeadForm(false);

      if (json.lead) {
        setLeads((prev) => prev.map((lead) => (lead.id === optimisticId ? json.lead! : lead)));
      } else {
        setLeads((prev) => prev.filter((lead) => lead.id !== optimisticId));
        setSummary((prev) => ({ ...prev, leadCount: Math.max(0, prev.leadCount - 1) }));
      }

      pushToast('success', 'Lead created successfully.');
    } catch (mutationError) {
      setLeads((prev) => prev.filter((lead) => lead.id !== optimisticId));
      setSummary((prev) => ({ ...prev, leadCount: Math.max(0, prev.leadCount - 1) }));
      const message = mutationError instanceof Error ? mutationError.message : 'Unknown lead create error.';
      setError(message);
      pushToast('error', message);
    } finally {
      endMutation();
    }
  }

  const openPipeline = useCallback(() => {
    setActiveNav('pipeline');
    setActiveView('pipeline');
  }, []);

  const openLeadsTable = useCallback((preset: TableStatusPreset) => {
    setActiveNav('leads');
    setActiveView('leads');
    setTableStatusPreset(preset);
  }, []);

  const openProfile = useCallback(() => {
    setActiveNav('profile');
    setActiveView('profile');
  }, []);

  const handleNav = useCallback(
    (nav: WorkspaceNav) => {
      setActiveNav(nav);
      const nextView = resolveViewFromNav(nav);
      setActiveView(nextView);

      if (nextView !== 'dashboard') {
        return;
      }

      if (nav === 'contacts') {
        requestAnimationFrame(() => contactPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }

      if (nav === 'activity') {
        requestAnimationFrame(() => activityPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
    },
    []
  );

  const resetBrandPreferences = useCallback(() => {
    setBrandPreferences(createDefaultBrandPreferences(tenantContext.tenantSlug));
  }, [tenantContext.tenantSlug]);

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
      setLeads((prev) =>
        prev.map((entry) =>
          entry.id === leadId ? { ...entry, listingAddress: addr } : entry
        )
      );
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
          setLeads((prev) => prev.map((entry) => (entry.id === leadId ? json.lead : entry)));
        }
        pushToast('success', `Assigned ${listing.address.street} to ${getLeadContactLabel(lead, contactById) || 'lead'}.`);
      } catch {
        // Rollback
        setLeads((prev) =>
          prev.map((entry) =>
            entry.id === leadId ? { ...entry, listingAddress: lead.listingAddress } : entry
          )
        );
        pushToast('error', 'Failed to assign property to lead.');
      } finally {
        endMutation();
      }
    },
    [leads, contactById, beginMutation, endMutation, pushToast]
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

  const navItems: Array<{ id: WorkspaceNav; label: string; icon: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
    { id: 'pipeline', label: 'Pipeline', icon: '▦' },
    { id: 'leads', label: 'Lead Tracker', icon: '☰' },
    { id: 'properties', label: 'Properties', icon: '⊞' },
    { id: 'transactions', label: 'Transactions', icon: '⇄' },
    { id: 'contacts', label: 'Contacts', icon: '◉' },
    { id: 'activity', label: 'Activity', icon: '↻' },
    { id: 'profile', label: 'Profile', icon: '◯' },
    { id: 'analytics', label: 'Analytics', icon: '◫' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ];

  function toggleTableSort(column: LeadsTableSortColumn) {
    setTableSort((prev) => toggleTableSortState(prev, column));
  }

  return (
    <div className={`crm-shell-app ${brandPreferences.showTexture ? 'crm-shell-texture' : ''}`} style={brandThemeVars}>
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
          <span className="crm-tenant-domain">{tenantContext.tenantDomain}</span>
        </div>

        <nav className="crm-side-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`crm-side-nav-item ${activeNav === item.id ? 'is-active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              <span className="crm-side-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="crm-theme-toggle"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <span className="crm-theme-toggle__icon" aria-hidden="true">
            {theme === 'light' ? '☽' : '☀'}
          </span>
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

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

        <div className="crm-side-context">
          <span className="crm-chip">{tenantContext.tenantSlug}</span>
          <span className="crm-chip">{tenantContext.source}</span>
        </div>
      </aside>

      <div className="crm-main-shell">
        <header className="crm-shell-header">
          <div className="crm-shell-title">
            <span className="crm-brand-mark crm-brand-mark-small" aria-hidden="true">
              {showBrandLogo ? (
                <Image
                  loader={passthroughImageLoader}
                  src={resolvedLogoUrl}
                  alt=""
                  width={36}
                  height={36}
                  unoptimized
                  onError={() => setLogoLoadErrored(true)}
                />
              ) : (
                <span>{brandInitials}</span>
              )}
            </span>
            <div>
              <p className="crm-kicker">{greetingLabel}</p>
              <strong>{brandPreferences.brandName}</strong>
              <span className="crm-shell-subtitle">{toTitleCase(tenantContext.tenantSlug)} Workspace</span>
            </div>
          </div>
          <div className="crm-shell-links">
            <button type="button" className="crm-shell-link" onClick={openDashboard}>
              Dashboard
            </button>
            <button type="button" className="crm-shell-link" onClick={openPipeline}>
              Pipeline
            </button>
            <button type="button" className="crm-shell-link" onClick={() => openLeadsTable('all')}>
              Lead Tracker
            </button>
          </div>
        </header>

        <header className="crm-header">
          <div>
            <p className="crm-kicker">Workspace</p>
            <h2>
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
                        : activeView === 'settings'
                          ? 'Settings'
                          : activeView === 'profile'
                            ? 'My Profile'
                          : 'Dashboard'}
            </h2>
          </div>
          <div className="crm-header-tools">
            {!isOnline && (
              <span className="crm-offline-badge" title={offlinePendingCount > 0 ? `${offlinePendingCount} items queued` : 'You are offline'}>
                ⚡ Offline{offlinePendingCount > 0 ? ` (${offlinePendingCount})` : ''}
              </span>
            )}
            <div className="crm-search-wrap" ref={searchPanelRef}>
              <label className="crm-search">
                <span className="crm-search-icon" aria-hidden="true">
                  ⌕
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
                onClick={() => setNotificationsOpen((prev) => !prev)}
              >
                🔔
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
                onClick={() => setAvatarMenuOpen((prev) => !prev)}
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
                  brandInitials
                )}
              </button>
              {avatarMenuOpen ? (
                <div className="crm-popover crm-avatar-menu">
                  <button
                    type="button"
                    className="crm-popover-action"
                    onClick={() => {
                      openProfile();
                      setAvatarMenuOpen(false);
                    }}
                  >
                    Profile
                  </button>
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

        <nav className="crm-breadcrumb" aria-label="Breadcrumb">
          <button type="button" className="crm-breadcrumb-item" onClick={() => { closeLeadProfile(); handleNav('dashboard'); }}>Dashboard</button>
          {activeView !== 'dashboard' ? (
            <>
              <span className="crm-breadcrumb-sep">/</span>
              {activeLeadProfile ? (
                <button type="button" className="crm-breadcrumb-item" onClick={closeLeadProfile}>{
                  activeView === 'pipeline' ? 'Pipeline' :
                  activeView === 'leads' ? 'Leads' :
                  activeView === 'properties' ? 'Properties' :
                  activeView === 'transactions' ? 'Transactions' :
                  activeView === 'analytics' ? 'Analytics' :
                  activeView === 'settings' ? 'Settings' :
                  activeView === 'profile' ? 'Profile' : ''
                }</button>
              ) : (
                <span className="crm-breadcrumb-item crm-breadcrumb-item--current">{
                  activeView === 'pipeline' ? 'Pipeline' :
                  activeView === 'leads' ? 'Leads' :
                  activeView === 'properties' ? 'Properties' :
                  activeView === 'transactions' ? 'Transactions' :
                  activeView === 'analytics' ? 'Analytics' :
                  activeView === 'settings' ? 'Settings' :
                  activeView === 'profile' ? 'Profile' : ''
                }</span>
              )}
            </>
          ) : null}
          {activeLeadProfile ? (
            <>
              <span className="crm-breadcrumb-sep">/</span>
              <span className="crm-breadcrumb-item crm-breadcrumb-item--current">
                {getLeadContactLabel(activeLeadProfile, contactById)}
              </span>
            </>
          ) : null}
        </nav>

        {!hasClerkKey && !devAuthBypassEnabled ? (
          <p className="crm-banner-warning">Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to enable sign-in UI in this environment.</p>
        ) : null}

        {error ? <p className="crm-error">{error}</p> : null}

        {loading ? <p className="crm-muted">Loading CRM data...</p> : null}

        {activeView === 'dashboard' ? (
          <section className="crm-dashboard-view">
            <MyDayPanel
              greeting={greetingLabel}
              agentName={agentProfile.fullName}
              leads={leads}
              activities={activities}
              contactById={contactById}
              onOpenLead={openLeadProfile}
            />

            {escalatedLeads.length > 0 && (
              <EscalationAlertBanner
                escalatedLeads={escalatedLeads}
                onViewLead={openLeadProfile}
              />
            )}

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

            {urgentFollowUps.length > 0 && (
              <section className="crm-panel crm-urgent-followups">
                <div className="crm-panel-head">
                  <h3>Urgent Follow-Ups</h3>
                  <span className="crm-muted">{urgentFollowUps.length} overdue or due today</span>
                </div>
                <ul className="crm-timeline">
                  {urgentFollowUps.slice(0, 5).map((lead) => {
                    const contact = lead.contactId ? contactById.get(lead.contactId) : undefined;
                    return (
                      <li key={lead.id} className="crm-timeline-item">
                        <span className="crm-timeline-dot crm-status-nurturing" />
                        <div>
                          <strong>
                            <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(lead.id)}>
                              {contact?.fullName || lead.listingAddress || 'Lead'}
                            </button>
                          </strong>
                          <p>
                            {lead.nextActionNote || 'Follow-up needed'}
                            {lead.nextActionAt ? ` — due ${formatDateTime(lead.nextActionAt)}` : ''}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className="crm-status-strip" aria-label="Lead status breakdown">
              {LEAD_STATUSES.map((status) => (
                <button
                  key={status}
                  className={`crm-status-pill crm-status-${status} ${dashboardStatusFilter === status ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => setDashboardStatusFilter(dashboardStatusFilter === status ? ALL_STATUS_FILTER : status)}
                >
                  <span>
                    {getStatusGlyph(status)} {formatLeadStatusLabel(status)}
                  </span>
                  <strong>{leadCountsByStatus[status]}</strong>
                </button>
              ))}
            </section>

            <section className="crm-momentum-strip" aria-label="7 day activity pulse">
              <p className="crm-kicker">7-day Pulse</p>
              <SevenDayPulse days={heartbeatDays} />
              <span className="crm-muted">
                Activity across the last week: {heartbeatDays.reduce((sum, d) => sum + d.total, 0)} total events.
              </span>
            </section>

            <div className="crm-dashboard-widgets">
              <ConversionFunnel leads={leads} />
              <RevenuePipeline leads={leads} />
            </div>

            <MarketDigest />

            <section className="crm-overview-grid">
              <article className="crm-panel">
                <div className="crm-panel-head">
                  <h3>Recent Activity</h3>
                  <span className="crm-muted">Latest tenant-scoped updates</span>
                </div>
                {activities.length === 0 ? (
                  <EmptyState title="No activity yet" detail="Once calls, notes, and website events arrive, this feed will populate here." />
                ) : (
                  <ul className="crm-timeline">
                    {activities.slice(0, 8).map((activity) => {
                      const linkedLead = activity.leadId ? leadById.get(activity.leadId) : null;
                      return (
                        <li key={activity.id} className="crm-timeline-item">
                          <span className={`crm-timeline-dot crm-status-${linkedLead ? getLeadDraft(linkedLead).status : 'new'}`} />
                          <div>
                            <strong>{activity.summary}</strong>
                            <p>
                              {linkedLead ? (
                                <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(linkedLead.id)}>
                                  {linkedLead.listingAddress || 'View lead profile'}
                                </button>
                              ) : (
                                'General CRM activity'
                              )}{' '}
                              • {formatActivityTypeLabel(activity.activityType)} • {formatTimeAgo(activity.occurredAt)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>

              <article className="crm-panel">
                <div className="crm-panel-head">
                  <h3>Pipeline Snapshot</h3>
                  <span className="crm-muted">Current stage distribution</span>
                </div>

                <div className="crm-pipeline-bar" role="img" aria-label="Pipeline status distribution">
                  {LEAD_STATUSES.map((status) => {
                    const total = summary.leadCount || 1;
                    const segmentWidth = Math.max(leadCountsByStatus[status] / total, 0.08);

                    return (
                      <span
                        key={status}
                        className={`crm-pipeline-segment crm-status-${status}`}
                        style={{ flexGrow: segmentWidth }}
                        title={`${formatLeadStatusLabel(status)}: ${leadCountsByStatus[status]}`}
                      />
                    );
                  })}
                </div>

                <ul className="crm-legend">
                  {LEAD_STATUSES.map((status) => (
                    <li key={status}>
                      <span className={`crm-legend-swatch crm-status-${status}`} />
                      <span>
                        {getStatusGlyph(status)} {formatLeadStatusLabel(status)}
                      </span>
                      <strong>{leadCountsByStatus[status]}</strong>
                    </li>
                  ))}
                </ul>

                <div className="crm-quick-actions">
                  <button type="button" onClick={() => activityPanelRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                    Log Note
                  </button>
                  <button
                    type="button"
                    className="crm-secondary-button"
                    onClick={() => contactPanelRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Add Contact
                  </button>
                  <button type="button" className="crm-secondary-button" onClick={openPipeline}>
                    View Pipeline
                  </button>
                </div>

                <div className="crm-intent-banner">
                  <strong>{unlinkedBehaviorCount}</strong>
                  <span>Behavior events currently without linked lead/contact records.</span>
                </div>
              </article>
            </section>

            <section className="crm-work-grid">
              <article className="crm-panel crm-lead-panel">
                <div className="crm-panel-head">
                  <h3>Lead Queue</h3>
                  <span className="crm-muted">Prioritize and update your pipeline in one place.</span>
                </div>

                <div className="crm-filter-grid">
                  <label className="crm-field crm-field-grow">
                    Source
                    <select value={dashboardSourceFilter} onChange={(event) => setDashboardSourceFilter(event.target.value)}>
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
                      value={dashboardLeadTypeFilter}
                      onChange={(event) => setDashboardLeadTypeFilter(event.target.value as LeadTypeFilter)}
                    >
                      <option value={ALL_LEAD_TYPE_FILTER}>All types</option>
                      <option value="website_lead">Website Lead</option>
                      <option value="valuation_request">Valuation Request</option>
                    </select>
                  </label>
                </div>

                <div className="crm-draft-bar">
                  <div className="crm-quick-summary">
                    <strong>{pendingLeadIds.length}</strong>
                    <span>Unsaved lead {pendingLeadIds.length === 1 ? 'change' : 'changes'}</span>
                  </div>
                  <div className="crm-quick-actions-buttons">
                    <button type="button" disabled={pendingLeadIds.length === 0 || isMutating} onClick={saveAllLeadDrafts}>
                      Save All
                    </button>
                    <button
                      type="button"
                      className="crm-secondary-button"
                      disabled={pendingLeadIds.length === 0 || isMutating}
                      onClick={clearAllLeadDrafts}
                    >
                      Discard Drafts
                    </button>
                  </div>
                </div>

                {dashboardFilteredLeads.length === 0 ? (
                  <EmptyState
                    title="No leads match the current filters"
                    detail="Clear or broaden filters to bring leads back into the queue."
                  />
                ) : (
                  <div className="crm-lead-list">
                    {dashboardFilteredLeads.map((lead) => {
                      const draft = getLeadDraft(lead);
                      const leadHasUnsavedChanges = hasUnsavedLeadChange(lead);
                      const isSavingLead = Boolean(savingLeadIds[lead.id]);
                      const behavior = leadBehaviorByLeadId.get(lead.id);

                      return (
                        <article key={lead.id} className="crm-lead-card">
                          <div className="crm-lead-head">
                            <div>
                              <button type="button" className="crm-lead-title-button" onClick={() => openLeadProfile(lead.id)}>
                                {draft.listingAddress || 'No address provided'}
                              </button>
                              <p className="crm-lead-meta">
                                {formatDateTime(lead.createdAt)} • {formatLeadTypeLabel(lead.leadType)}
                              </p>
                            </div>
                            <div className="crm-chip-row">
                              <span className="crm-chip">{formatLeadSourceLabel(lead.source)}</span>
                              <span className={`crm-status-badge crm-status-${draft.status}`}>{formatLeadStatusLabel(draft.status)}</span>
                              {behavior && (behavior.favoritedCount > 0 || behavior.viewedCount > 0) ? (
                                <span className="crm-chip crm-chip-intent">Intent signal</span>
                              ) : null}
                              {leadHasUnsavedChanges ? <span className="crm-chip crm-chip-warning">Unsaved</span> : null}
                            </div>
                          </div>

                          <div className="crm-lead-details">
                            <p>
                              <span>Contact</span>
                              <strong>
                                {lead.contactId ? (
                                  <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(lead.id)}>
                                    {getLeadContactLabel(lead, contactById)}
                                  </button>
                                ) : (
                                  getLeadContactLabel(lead, contactById)
                                )}
                              </strong>
                            </p>
                            <p>
                              <span>Property</span>
                              <strong>{draft.propertyType || 'Unspecified'}</strong>
                            </p>
                            <p>
                              <span>Beds / Baths</span>
                              <strong>
                                {draft.beds || '-'} / {draft.baths || '-'}
                              </strong>
                            </p>
                            <p>
                              <span>Sqft</span>
                              <strong>{draft.sqft || '-'}</strong>
                            </p>
                          </div>

                          <div className="crm-lead-edit-row">
                            <label className="crm-field">
                              Status
                              <select
                                disabled={isSavingLead}
                                value={draft.status}
                                onChange={(event) => {
                                  const value = event.target.value as CrmLeadStatus;
                                  setLeadDraftField(lead.id, 'status', value);
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
                              Next Action
                              <input
                                value={draft.timeframe}
                                onChange={(event) => setLeadDraftField(lead.id, 'timeframe', event.target.value)}
                                placeholder="Schedule follow-up next Tuesday"
                              />
                            </label>
                          </div>

                          <div className="crm-lead-edit-row">
                            <label className="crm-field crm-field-grow">
                              Notes
                              <textarea
                                value={draft.notes}
                                onChange={(event) => setLeadDraftField(lead.id, 'notes', event.target.value)}
                                placeholder="Capture call outcomes, objections, and next actions..."
                              />
                            </label>
                          </div>

                          <div className="crm-actions-row">
                            <span className="crm-muted">Updated {formatDateTime(lead.updatedAt)}</span>
                            <button
                              type="button"
                              disabled={isSavingLead}
                              onClick={() => {
                                void updateLead(lead.id);
                              }}
                            >
                              {isSavingLead ? 'Saving...' : 'Save Lead'}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </article>

              <aside className="crm-side-column">
                <section className="crm-panel" ref={contactPanelRef}>
                  <div className="crm-panel-head">
                    <h3>New Contact</h3>
                    <span className="crm-muted">Add a person manually to your CRM.</span>
                  </div>
                  <form className="crm-form" onSubmit={createContact}>
                    <label className="crm-field">
                      Full Name
                      <input value={newContactName} onChange={(event) => setNewContactName(event.target.value)} placeholder="Jane Doe" />
                    </label>
                    <label className="crm-field">
                      Email
                      <input
                        type="email"
                        value={newContactEmail}
                        onChange={(event) => setNewContactEmail(event.target.value)}
                        placeholder="jane@example.com"
                      />
                    </label>
                    <label className="crm-field">
                      Phone
                      <input
                        value={newContactPhone}
                        onChange={(event) => setNewContactPhone(event.target.value)}
                        placeholder="(203) 555-0101"
                      />
                    </label>
                    <button type="submit" disabled={isMutating}>
                      Add Contact
                    </button>
                  </form>
                </section>

                <section className="crm-panel" ref={activityPanelRef}>
                  <div className="crm-panel-head">
                    <h3>Log Activity</h3>
                    <span className="crm-muted">Document outreach and deal progress.</span>
                  </div>

                  <div className="crm-inline-controls">
                    <span className="crm-muted">Sort linked options:</span>
                    <button
                      type="button"
                      className={`crm-sort-toggle ${activitySortMode === 'recent' ? 'is-active' : ''}`}
                      onClick={() => setActivitySortMode('recent')}
                    >
                      Most recent
                    </button>
                    <button
                      type="button"
                      className={`crm-sort-toggle ${activitySortMode === 'alpha' ? 'is-active' : ''}`}
                      onClick={() => setActivitySortMode('alpha')}
                    >
                      Alphabetical
                    </button>
                  </div>

                  <form className="crm-form" onSubmit={createActivity}>
                    <label className="crm-field">
                      Summary
                      <input
                        value={newActivitySummary}
                        onChange={(event) => setNewActivitySummary(event.target.value)}
                        placeholder="Called seller and reviewed valuation strategy"
                        required
                      />
                    </label>
                    <label className="crm-field">
                      Contact
                      <select
                        value={newActivityContactId}
                        onChange={(event) => {
                          const nextContactId = event.target.value;
                          setNewActivityContactId(nextContactId);

                          if (!nextContactId) {
                            return;
                          }

                          const linkedLead = (leadsByContactId.get(nextContactId) ?? [])[0];
                          if (linkedLead) {
                            setNewActivityLeadId(linkedLead.id);
                          }
                        }}
                      >
                        <option value="">None</option>
                        {sortedActivityContacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.fullName || contact.email || contact.id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="crm-field">
                      Lead
                      <select
                        value={newActivityLeadId}
                        onChange={(event) => {
                          const nextLeadId = event.target.value;
                          setNewActivityLeadId(nextLeadId);

                          if (!nextLeadId) {
                            return;
                          }

                          const linkedLead = leadById.get(nextLeadId);
                          if (linkedLead?.contactId) {
                            setNewActivityContactId(linkedLead.contactId);
                          }
                        }}
                      >
                        <option value="">None</option>
                        {activityLeadOptions.map((lead) => (
                          <option key={lead.id} value={lead.id}>
                            {lead.listingAddress || lead.id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" disabled={isMutating}>
                      Log Note
                    </button>
                  </form>
                </section>

                <section className="crm-panel">
                  <div className="crm-panel-head">
                    <h3>Contacts</h3>
                    <span className="crm-muted">Directory snapshot for active records.</span>
                  </div>
                  {contacts.length === 0 ? (
                    <EmptyState title="No contacts yet" detail="Create your first contact to start linking notes and lead records." />
                  ) : (
                    <ul className="crm-list">
                      {contacts.slice(0, 8).map((contact) => {
                        const linkedLead = leadByContactId.get(contact.id);
                        return (
                          <li key={contact.id} className="crm-list-item">
                            <strong>
                              {linkedLead ? (
                                <button type="button" className="crm-inline-link" onClick={() => openLeadProfile(linkedLead.id)}>
                                  {contact.fullName || 'Unnamed contact'}
                                </button>
                              ) : (
                                contact.fullName || 'Unnamed contact'
                              )}
                            </strong>
                            <span className="crm-muted">{contact.email || contact.phone || 'No channel captured'}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </aside>
            </section>
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
                  onClick={() => setShowNewLeadForm((prev) => !prev)}
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
                      onChange={(event) => setNewLeadAddress(event.target.value)}
                    />
                  </label>
                  <label className="crm-field">
                    Lead Type
                    <select value={newLeadType} onChange={(event) => setNewLeadType(event.target.value as 'buyer' | 'seller')}>
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                    </select>
                  </label>
                  <label className="crm-field">
                    Source
                    <select value={newLeadSource} onChange={(event) => setNewLeadSource(event.target.value)}>
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
                    <select value={newLeadPropertyType} onChange={(event) => setNewLeadPropertyType(event.target.value)}>
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
                      onChange={(event) => setNewLeadTimeframe(event.target.value)}
                    />
                  </label>
                  <label className="crm-field crm-field-wide">
                    Notes
                    <textarea
                      value={newLeadNotes}
                      placeholder="Initial notes about this lead..."
                      rows={2}
                      onChange={(event) => setNewLeadNotes(event.target.value)}
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
            onDraftChange={setLeadDraftField}
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

        {activeView === 'profile' ? (
          <ProfileView
            agentProfile={agentProfile}
            setAgentProfile={setAgentProfile}
            leads={leads}
            brandInitials={brandInitials}
          />
        ) : null}

        {activeView === 'settings' ? (
          <SettingsView
            brandPreferences={brandPreferences}
            setBrandPreferences={setBrandPreferences}
            resetBrandPreferences={resetBrandPreferences}
            websiteFaviconUrl={websiteFaviconUrl}
            showBrandLogo={showBrandLogo}
            resolvedLogoUrl={resolvedLogoUrl}
            brandInitials={brandInitials}
            setLogoLoadErrored={setLogoLoadErrored}
            tenantContext={tenantContext}
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
          onSetLeadDraftField={setLeadDraftField}
          onSetContactDraft={setDraftContactById}
          onUpdateLead={updateLead}
          onUpdateContact={updateContact}
          onClearLeadDraft={clearLeadDraft}
          onLogContact={logContactActivity}
          onViewLead={openLeadProfile}
          onSaveReminder={(leadId, data) => {
            setLeadDraftField(leadId, 'nextActionAt', data.nextActionAt);
            setLeadDraftField(leadId, 'nextActionNote', data.nextActionNote);
            setLeadDraftField(leadId, 'nextActionChannel', data.nextActionChannel);
            void updateLead(leadId);
          }}
          onSnoozeReminder={(leadId, durationMs) => {
            const snoozedUntil = new Date(Date.now() + durationMs).toISOString();
            setLeadDraftField(leadId, 'reminderSnoozedUntil', snoozedUntil);
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
            void loadWorkspace();
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
          setActiveNav(nav);
          setActiveView(resolveViewFromNav(nav));
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
        onLogActivityClick={() => handleNav('activity')}
        onNotificationsClick={() => setNotificationsOpen(true)}
        notificationCount={unreadCount}
      />

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
