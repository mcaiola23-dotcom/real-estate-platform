import { create } from 'zustand';
import type { CrmActivity, CrmContact, CrmLead, CrmLeadStatus, CrmLeadIngestionSummary } from '@real-estate/types/crm';
import type {
  AgentProfile,
  BrandPreferences,
  ContactDraft,
  LeadDraft,
  LeadSourceFilter,
  LeadStatusFilter,
  LeadTypeFilter,
  WorkspaceToast,
} from '../crm-types';
import { ALL_SOURCE_FILTER, ALL_STATUS_FILTER, ALL_LEAD_TYPE_FILTER } from '../crm-types';
import type { LeadsTableSort, TableStatusPreset, WorkspaceNav, WorkspaceView } from '../workspace-interactions';
import { resolveViewFromNav } from '../workspace-interactions';
import { buildLeadDraft } from '../crm-formatters';
import { createDefaultBrandPreferences } from '../crm-brand-theme';

// ---------------------------------------------------------------------------
// UI Slice
// ---------------------------------------------------------------------------

interface UiSlice {
  activeNav: WorkspaceNav;
  activeView: WorkspaceView;
  activeLeadProfileId: string | null;

  searchQuery: string;
  searchSuggestionsOpen: boolean;

  cmdPaletteOpen: boolean;
  notificationsOpen: boolean;
  avatarMenuOpen: boolean;
  logoLoadErrored: boolean;
  showNewLeadForm: boolean;
  showCsvImport: boolean;
  showQuickAddLead: boolean;

  toasts: WorkspaceToast[];

  loading: boolean;
  error: string | null;
  activeMutations: number;

  greetingLabel: string;

  setActiveNav: (nav: WorkspaceNav) => void;
  handleNav: (nav: WorkspaceNav) => void;
  setActiveLeadProfileId: (id: string | null) => void;
  openLeadProfile: (id: string) => void;
  closeLeadProfile: () => void;

  setSearchQuery: (q: string) => void;
  setSearchSuggestionsOpen: (open: boolean) => void;

  setCmdPaletteOpen: (open: boolean) => void;
  toggleCmdPalette: () => void;
  setNotificationsOpen: (open: boolean) => void;
  setAvatarMenuOpen: (open: boolean) => void;
  setLogoLoadErrored: (errored: boolean) => void;
  setShowNewLeadForm: (show: boolean) => void;
  toggleShowNewLeadForm: () => void;
  setShowCsvImport: (show: boolean) => void;
  setShowQuickAddLead: (show: boolean) => void;

  pushToast: (kind: WorkspaceToast['kind'], message: string) => void;
  removeToast: (id: number) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  beginMutation: () => void;
  endMutation: () => void;

  setGreetingLabel: (label: string) => void;
}

// ---------------------------------------------------------------------------
// Data Slice
// ---------------------------------------------------------------------------

interface DataSlice {
  summary: CrmLeadIngestionSummary;
  leads: CrmLead[];
  contacts: CrmContact[];
  activities: CrmActivity[];

  setSummary: (summary: CrmLeadIngestionSummary) => void;
  updateSummary: (partial: Partial<CrmLeadIngestionSummary>) => void;
  setLeads: (leads: CrmLead[]) => void;
  updateLead: (leadId: string, updater: (lead: CrmLead) => CrmLead) => void;
  addLead: (lead: CrmLead) => void;
  removeLead: (leadId: string) => void;
  replaceLeadById: (leadId: string, lead: CrmLead) => void;
  setContacts: (contacts: CrmContact[]) => void;
  updateContact: (contactId: string, updater: (contact: CrmContact) => CrmContact) => void;
  addContact: (contact: CrmContact) => void;
  removeContact: (contactId: string) => void;
  replaceContactById: (contactId: string, contact: CrmContact) => void;
  setActivities: (activities: CrmActivity[]) => void;
  addActivity: (activity: CrmActivity) => void;
  removeActivity: (activityId: string) => void;
  replaceActivityById: (activityId: string, activity: CrmActivity) => void;
}

// ---------------------------------------------------------------------------
// Draft Slice
// ---------------------------------------------------------------------------

interface DraftSlice {
  draftByLeadId: Record<string, LeadDraft>;
  savingLeadIds: Record<string, true>;
  draftContactById: Record<string, ContactDraft>;
  savingContactIds: Record<string, true>;

  setLeadDraft: (leadId: string, draft: LeadDraft) => void;
  setLeadDraftField: (leadId: string, field: keyof LeadDraft, value: string | CrmLeadStatus, lead: CrmLead) => void;
  clearLeadDraft: (leadId: string) => void;
  clearAllLeadDrafts: () => void;
  setSavingLeadId: (leadId: string, saving: boolean) => void;

  setContactDraft: (contactId: string, draft: ContactDraft) => void;
  setContactDraftField: (contactId: string, field: keyof ContactDraft, value: string) => void;
  clearContactDraft: (contactId: string) => void;
  setSavingContactId: (contactId: string, saving: boolean) => void;
}

// ---------------------------------------------------------------------------
// Filter Slice
// ---------------------------------------------------------------------------

interface FilterSlice {
  dashboardStatusFilter: LeadStatusFilter;
  dashboardSourceFilter: LeadSourceFilter;
  dashboardLeadTypeFilter: LeadTypeFilter;

  pipelineStatusFilter: LeadStatusFilter;
  pipelineSourceFilter: LeadSourceFilter;
  pipelineLeadTypeFilter: LeadTypeFilter;

  tableStatusPreset: TableStatusPreset;
  tableSort: LeadsTableSort;

  activitySortMode: 'recent' | 'alpha';

  setDashboardStatusFilter: (filter: LeadStatusFilter) => void;
  setDashboardSourceFilter: (filter: LeadSourceFilter) => void;
  setDashboardLeadTypeFilter: (filter: LeadTypeFilter) => void;

  setPipelineStatusFilter: (filter: LeadStatusFilter) => void;
  setPipelineSourceFilter: (filter: LeadSourceFilter) => void;
  setPipelineLeadTypeFilter: (filter: LeadTypeFilter) => void;

  setTableStatusPreset: (preset: TableStatusPreset) => void;
  setTableSort: (sort: LeadsTableSort) => void;
  setActivitySortMode: (mode: 'recent' | 'alpha') => void;
}

// ---------------------------------------------------------------------------
// Form Slice (new lead / new contact / new activity form fields)
// ---------------------------------------------------------------------------

interface FormSlice {
  newLeadAddress: string;
  newLeadSource: string;
  newLeadType: 'buyer' | 'seller';
  newLeadNotes: string;
  newLeadTimeframe: string;
  newLeadPropertyType: string;

  newContactName: string;
  newContactEmail: string;
  newContactPhone: string;

  newActivitySummary: string;
  newActivityLeadId: string;
  newActivityContactId: string;

  setNewLeadField: (field: keyof Pick<FormSlice, 'newLeadAddress' | 'newLeadSource' | 'newLeadType' | 'newLeadNotes' | 'newLeadTimeframe' | 'newLeadPropertyType'>, value: string) => void;
  resetNewLeadForm: () => void;

  setNewContactField: (field: keyof Pick<FormSlice, 'newContactName' | 'newContactEmail' | 'newContactPhone'>, value: string) => void;
  resetNewContactForm: () => void;

  setNewActivityField: (field: keyof Pick<FormSlice, 'newActivitySummary' | 'newActivityLeadId' | 'newActivityContactId'>, value: string) => void;
  resetNewActivityForm: () => void;
}

// ---------------------------------------------------------------------------
// Settings Slice
// ---------------------------------------------------------------------------

interface SettingsSlice {
  brandPreferences: BrandPreferences;
  agentProfile: AgentProfile;
  winLossPrompt: { leadId: string; outcome: 'won' | 'lost' } | null;
  density: 'compact' | 'default' | 'comfortable';

  setBrandPreferences: (prefs: BrandPreferences) => void;
  updateBrandPreferences: (partial: Partial<BrandPreferences>) => void;
  resetBrandPreferences: (tenantSlug: string) => void;
  setAgentProfile: (profile: AgentProfile) => void;
  updateAgentProfile: (partial: Partial<AgentProfile>) => void;
  setWinLossPrompt: (prompt: { leadId: string; outcome: 'won' | 'lost' } | null) => void;
  setDensity: (density: 'compact' | 'default' | 'comfortable') => void;
}

// ---------------------------------------------------------------------------
// Combined Store
// ---------------------------------------------------------------------------

export type CrmStore = UiSlice & DataSlice & DraftSlice & FilterSlice & FormSlice & SettingsSlice;

export const useCrmStore = create<CrmStore>((set, get) => ({
  // --- UI State ---
  activeNav: 'dashboard',
  activeView: 'dashboard',
  activeLeadProfileId: null,

  searchQuery: '',
  searchSuggestionsOpen: false,

  cmdPaletteOpen: false,
  notificationsOpen: false,
  avatarMenuOpen: false,
  logoLoadErrored: false,
  showNewLeadForm: false,
  showCsvImport: false,
  showQuickAddLead: false,

  toasts: [],

  loading: true,
  error: null,
  activeMutations: 0,

  greetingLabel: 'Welcome',

  setActiveNav: (nav) => set({ activeNav: nav }),
  handleNav: (nav) => {
    const nextView = resolveViewFromNav(nav);
    set({ activeNav: nav, activeView: nextView });
  },
  setActiveLeadProfileId: (id) => set({ activeLeadProfileId: id }),
  openLeadProfile: (id) => set({ activeLeadProfileId: id, searchSuggestionsOpen: false }),
  closeLeadProfile: () => set({ activeLeadProfileId: null }),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchSuggestionsOpen: (open) => set({ searchSuggestionsOpen: open }),

  setCmdPaletteOpen: (open) => set({ cmdPaletteOpen: open }),
  toggleCmdPalette: () => set((s) => ({ cmdPaletteOpen: !s.cmdPaletteOpen })),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  setAvatarMenuOpen: (open) => set({ avatarMenuOpen: open }),
  setLogoLoadErrored: (errored) => set({ logoLoadErrored: errored }),
  setShowNewLeadForm: (show) => set({ showNewLeadForm: show }),
  toggleShowNewLeadForm: () => set((s) => ({ showNewLeadForm: !s.showNewLeadForm })),
  setShowCsvImport: (show) => set({ showCsvImport: show }),
  setShowQuickAddLead: (show) => set({ showQuickAddLead: show }),

  pushToast: (kind, message) => {
    const toastId = Date.now() + Math.floor(Math.random() * 1000);
    set((s) => ({ toasts: [...s.toasts, { id: toastId, kind, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== toastId) }));
    }, 3200);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  beginMutation: () => set((s) => ({ activeMutations: s.activeMutations + 1 })),
  endMutation: () => set((s) => ({ activeMutations: Math.max(0, s.activeMutations - 1) })),

  setGreetingLabel: (label) => set({ greetingLabel: label }),

  // --- Data State ---
  summary: { tenantId: '', leadCount: 0, contactCount: 0, activityCount: 0 },
  leads: [],
  contacts: [],
  activities: [],

  setSummary: (summary) => set({ summary }),
  updateSummary: (partial) => set((s) => ({ summary: { ...s.summary, ...partial } })),
  setLeads: (leads) => set({ leads }),
  updateLead: (leadId, updater) => set((s) => ({
    leads: s.leads.map((l) => (l.id === leadId ? updater(l) : l)),
  })),
  addLead: (lead) => set((s) => ({ leads: [lead, ...s.leads] })),
  removeLead: (leadId) => set((s) => ({ leads: s.leads.filter((l) => l.id !== leadId) })),
  replaceLeadById: (leadId, lead) => set((s) => ({
    leads: s.leads.map((l) => (l.id === leadId ? lead : l)),
  })),
  setContacts: (contacts) => set({ contacts }),
  updateContact: (contactId, updater) => set((s) => ({
    contacts: s.contacts.map((c) => (c.id === contactId ? updater(c) : c)),
  })),
  addContact: (contact) => set((s) => ({ contacts: [contact, ...s.contacts] })),
  removeContact: (contactId) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== contactId) })),
  replaceContactById: (contactId, contact) => set((s) => ({
    contacts: s.contacts.map((c) => (c.id === contactId ? contact : c)),
  })),
  setActivities: (activities) => set({ activities }),
  addActivity: (activity) => set((s) => ({ activities: [activity, ...s.activities] })),
  removeActivity: (activityId) => set((s) => ({ activities: s.activities.filter((a) => a.id !== activityId) })),
  replaceActivityById: (activityId, activity) => set((s) => ({
    activities: s.activities.map((a) => (a.id === activityId ? activity : a)),
  })),

  // --- Draft State ---
  draftByLeadId: {},
  savingLeadIds: {},
  draftContactById: {},
  savingContactIds: {},

  setLeadDraft: (leadId, draft) => set((s) => ({
    draftByLeadId: { ...s.draftByLeadId, [leadId]: draft },
  })),
  setLeadDraftField: (leadId, field, value, lead) => set((s) => {
    const current = s.draftByLeadId[leadId] ?? buildLeadDraft(lead);
    return {
      draftByLeadId: {
        ...s.draftByLeadId,
        [leadId]: { ...current, [field]: value },
      },
    };
  }),
  clearLeadDraft: (leadId) => set((s) => {
    if (!(leadId in s.draftByLeadId)) return s;
    const next = { ...s.draftByLeadId };
    delete next[leadId];
    return { draftByLeadId: next };
  }),
  clearAllLeadDrafts: () => set({ draftByLeadId: {} }),
  setSavingLeadId: (leadId, saving) => set((s) => {
    if (saving) {
      return { savingLeadIds: { ...s.savingLeadIds, [leadId]: true } };
    }
    const next = { ...s.savingLeadIds };
    delete next[leadId];
    return { savingLeadIds: next };
  }),

  setContactDraft: (contactId, draft) => set((s) => ({
    draftContactById: { ...s.draftContactById, [contactId]: draft },
  })),
  setContactDraftField: (contactId, field, value) => set((s) => {
    const current = s.draftContactById[contactId] ?? { fullName: '', email: '', phone: '' };
    return {
      draftContactById: {
        ...s.draftContactById,
        [contactId]: { ...current, [field]: value },
      },
    };
  }),
  clearContactDraft: (contactId) => set((s) => {
    if (!(contactId in s.draftContactById)) return s;
    const next = { ...s.draftContactById };
    delete next[contactId];
    return { draftContactById: next };
  }),
  setSavingContactId: (contactId, saving) => set((s) => {
    if (saving) {
      return { savingContactIds: { ...s.savingContactIds, [contactId]: true } };
    }
    const next = { ...s.savingContactIds };
    delete next[contactId];
    return { savingContactIds: next };
  }),

  // --- Filter State ---
  dashboardStatusFilter: ALL_STATUS_FILTER,
  dashboardSourceFilter: ALL_SOURCE_FILTER,
  dashboardLeadTypeFilter: ALL_LEAD_TYPE_FILTER,

  pipelineStatusFilter: ALL_STATUS_FILTER,
  pipelineSourceFilter: ALL_SOURCE_FILTER,
  pipelineLeadTypeFilter: ALL_LEAD_TYPE_FILTER,

  tableStatusPreset: 'all',
  tableSort: { column: 'updatedAt', direction: 'desc' },

  activitySortMode: 'recent',

  setDashboardStatusFilter: (filter) => set({ dashboardStatusFilter: filter }),
  setDashboardSourceFilter: (filter) => set({ dashboardSourceFilter: filter }),
  setDashboardLeadTypeFilter: (filter) => set({ dashboardLeadTypeFilter: filter }),

  setPipelineStatusFilter: (filter) => set({ pipelineStatusFilter: filter }),
  setPipelineSourceFilter: (filter) => set({ pipelineSourceFilter: filter }),
  setPipelineLeadTypeFilter: (filter) => set({ pipelineLeadTypeFilter: filter }),

  setTableStatusPreset: (preset) => set({ tableStatusPreset: preset }),
  setTableSort: (sort) => set({ tableSort: sort }),
  setActivitySortMode: (mode) => set({ activitySortMode: mode }),

  // --- Form State ---
  newLeadAddress: '',
  newLeadSource: 'crm_manual',
  newLeadType: 'buyer',
  newLeadNotes: '',
  newLeadTimeframe: '',
  newLeadPropertyType: '',

  newContactName: '',
  newContactEmail: '',
  newContactPhone: '',

  newActivitySummary: '',
  newActivityLeadId: '',
  newActivityContactId: '',

  setNewLeadField: (field, value) => set({ [field]: value }),
  resetNewLeadForm: () => set({
    newLeadAddress: '',
    newLeadSource: 'crm_manual',
    newLeadType: 'buyer',
    newLeadNotes: '',
    newLeadTimeframe: '',
    newLeadPropertyType: '',
    showNewLeadForm: false,
  }),

  setNewContactField: (field, value) => set({ [field]: value }),
  resetNewContactForm: () => set({
    newContactName: '',
    newContactEmail: '',
    newContactPhone: '',
  }),

  setNewActivityField: (field, value) => set({ [field]: value }),
  resetNewActivityForm: () => set({
    newActivitySummary: '',
    newActivityLeadId: '',
    newActivityContactId: '',
  }),

  // --- Settings State ---
  brandPreferences: createDefaultBrandPreferences(''),
  agentProfile: {
    fullName: '',
    email: '',
    phone: '',
    brokerage: '',
    licenseNumber: '',
    headshotUrl: '',
    bio: '',
  },
  winLossPrompt: null,
  density: 'default',

  setBrandPreferences: (prefs) => set({ brandPreferences: prefs }),
  updateBrandPreferences: (partial) => set((s) => ({
    brandPreferences: { ...s.brandPreferences, ...partial },
  })),
  resetBrandPreferences: (tenantSlug) => set({ brandPreferences: createDefaultBrandPreferences(tenantSlug) }),
  setAgentProfile: (profile) => set({ agentProfile: profile }),
  updateAgentProfile: (partial) => set((s) => ({
    agentProfile: { ...s.agentProfile, ...partial },
  })),
  setWinLossPrompt: (prompt) => set({ winLossPrompt: prompt }),
  setDensity: (density) => set({ density }),
}));
