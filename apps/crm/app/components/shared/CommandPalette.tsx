'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CrmActivity, CrmLead, CrmContact } from '@real-estate/types/crm';
import type { WorkspaceNav } from '../../lib/workspace-interactions';
import { useCrmStore } from '../../lib/stores/use-crm-store';
import { formatActivityTypeLabel } from '../../lib/crm-display';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (nav: WorkspaceNav) => void;
  onOpenLead: (leadId: string) => void;
  leads: CrmLead[];
  contacts: CrmContact[];
}

type CommandSection = 'Navigation' | 'Actions' | 'Leads' | 'Contacts' | 'Activities' | 'Transactions' | 'Properties';

interface CommandItem {
  id: string;
  label: string;
  detail?: string;
  section: CommandSection;
  icon: string;
  action: () => void;
}

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onOpenLead,
  leads,
  contacts,
}: CommandPaletteProps) {
  if (!open) return null;
  return (
    <CommandPaletteInner
      onClose={onClose}
      onNavigate={onNavigate}
      onOpenLead={onOpenLead}
      leads={leads}
      contacts={contacts}
    />
  );
}

function CommandPaletteInner({
  onClose,
  onNavigate,
  onOpenLead,
  leads,
  contacts,
}: Omit<CommandPaletteProps, 'open'>) {
  const [query, setQueryRaw] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [nlResult, setNlResult] = useState<{ description: string; intent: Record<string, unknown> } | null>(null);
  const [nlLoading, setNlLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activities = useCrmStore((s) => s.activities);
  const setShowQuickAddLead = useCrmStore((s) => s.setShowQuickAddLead);

  // Auto-focus on mount
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const setQuery = useCallback((value: string) => {
    setQueryRaw(value);
    setSelectedIndex(0);
  }, []);

  const navItems: CommandItem[] = useMemo(() => [
    { id: 'nav-dashboard', label: 'Go to Dashboard', section: 'Navigation', icon: '⌂', action: () => { onNavigate('dashboard'); onClose(); } },
    { id: 'nav-pipeline', label: 'Go to Pipeline', section: 'Navigation', icon: '▦', action: () => { onNavigate('pipeline'); onClose(); } },
    { id: 'nav-leads', label: 'Go to Lead Tracker', section: 'Navigation', icon: '☰', action: () => { onNavigate('leads'); onClose(); } },
    { id: 'nav-properties', label: 'Go to Properties', section: 'Navigation', icon: '⊞', action: () => { onNavigate('properties'); onClose(); } },
    { id: 'nav-transactions', label: 'Go to Transactions', section: 'Navigation', icon: '⇄', action: () => { onNavigate('transactions'); onClose(); } },
    { id: 'nav-contacts', label: 'Go to Contacts', section: 'Navigation', icon: '◉', action: () => { onNavigate('contacts'); onClose(); } },
    { id: 'nav-activity', label: 'Go to Activity', section: 'Navigation', icon: '↻', action: () => { onNavigate('activity'); onClose(); } },
    { id: 'nav-analytics', label: 'Go to Analytics', section: 'Navigation', icon: '◫', action: () => { onNavigate('analytics'); onClose(); } },
    { id: 'nav-settings', label: 'Go to Settings', section: 'Navigation', icon: '⚙', action: () => { onNavigate('settings'); onClose(); } },
  ], [onNavigate, onClose]);

  const actionItems: CommandItem[] = useMemo(() => [
    {
      id: 'action-new-lead',
      label: 'New Lead',
      detail: 'Press N anywhere',
      section: 'Actions',
      icon: '＋',
      action: () => { setShowQuickAddLead(true); onClose(); },
    },
  ], [setShowQuickAddLead, onClose]);

  const leadItems: CommandItem[] = useMemo(() =>
    leads.slice(0, 20).map((lead) => {
      const contact = lead.contactId ? contacts.find(c => c.id === lead.contactId) : undefined;
      const label = contact?.fullName || lead.listingAddress || `Lead #${lead.id.slice(0, 8)}`;
      return {
        id: `lead-${lead.id}`,
        label,
        detail: lead.status,
        section: 'Leads' as const,
        icon: '●',
        action: () => { onOpenLead(lead.id); onClose(); },
      };
    }),
    [leads, contacts, onOpenLead, onClose]
  );

  const contactItems: CommandItem[] = useMemo(() =>
    contacts.slice(0, 15).map((contact) => ({
      id: `contact-${contact.id}`,
      label: contact.fullName || contact.email || contact.phone || 'Contact',
      detail: contact.email || contact.phone || undefined,
      section: 'Contacts' as const,
      icon: '◎',
      action: () => {
        // Find the first lead linked to this contact
        const linkedLead = leads.find(l => l.contactId === contact.id);
        if (linkedLead) {
          onOpenLead(linkedLead.id);
        }
        onClose();
      },
    })),
    [contacts, leads, onOpenLead, onClose]
  );

  const activityItems: CommandItem[] = useMemo(() =>
    activities.slice(0, 15).map((activity) => ({
      id: `activity-${activity.id}`,
      label: activity.summary || formatActivityTypeLabel(activity.activityType),
      detail: formatActivityTypeLabel(activity.activityType),
      section: 'Activities' as const,
      icon: '↻',
      action: () => {
        if (activity.leadId) {
          onOpenLead(activity.leadId);
        }
        onClose();
      },
    })),
    [activities, onOpenLead, onClose]
  );

  const allItems = useMemo(
    () => [...navItems, ...actionItems, ...leadItems, ...contactItems, ...activityItems],
    [navItems, actionItems, leadItems, contactItems, activityItems]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return [...navItems, ...actionItems];
    return allItems.filter((item) =>
      fuzzyMatch(item.label, query) || (item.detail && fuzzyMatch(item.detail, query))
    );
  }, [query, allItems, navItems, actionItems]);

  const handleNlQuery = useCallback(async (q: string) => {
    setNlLoading(true);
    setNlResult(null);
    try {
      const res = await fetch('/api/ai/natural-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data.ok && data.intent) {
        setNlResult({ description: data.intent.description, intent: data.intent });
        // Auto-navigate if the intent is navigation
        if (data.intent.action === 'navigate' && data.intent.view) {
          onNavigate(data.intent.view as WorkspaceNav);
          onClose();
        }
      }
    } catch {
      // NL query failed silently
    } finally {
      setNlLoading(false);
    }
  }, [onNavigate, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      } else if (query.trim().length > 3 && filtered.length === 0) {
        // No fuzzy matches — try NL query
        void handleNlQuery(query.trim());
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filtered, selectedIndex, onClose, query, handleNlQuery]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Group by section with counts
  const sections = new Map<string, CommandItem[]>();
  for (const item of filtered) {
    const existing = sections.get(item.section) || [];
    existing.push(item);
    sections.set(item.section, existing);
  }

  return (
    <div className="crm-cmdpal-backdrop" onClick={onClose}>
      <div className="crm-cmdpal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="crm-cmdpal__input-wrap">
          <svg className="crm-cmdpal__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            className="crm-cmdpal__input"
            type="text"
            placeholder="Type a command or search leads, contacts, activities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="crm-cmdpal__esc">ESC</kbd>
        </div>

        <div ref={listRef} className="crm-cmdpal__results">
          {nlLoading && (
            <div className="crm-cmdpal__nl-loading">AI interpreting...</div>
          )}
          {nlResult && !nlLoading && (
            <div className="crm-cmdpal__nl-result">
              <span className="crm-cmdpal__nl-icon">✦</span>
              <span>{nlResult.description}</span>
            </div>
          )}
          {filtered.length === 0 && !nlLoading && !nlResult ? (
            <div className="crm-cmdpal__empty">No results found — press Enter to ask AI</div>
          ) : filtered.length === 0 ? null : (
            Array.from(sections.entries()).map(([section, items]) => (
              <div key={section} className="crm-cmdpal__section">
                <div className="crm-cmdpal__section-label">
                  {section}
                  <span className="crm-cmdpal__section-count">{items.length}</span>
                </div>
                {items.map((item) => {
                  const globalIndex = filtered.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      className={`crm-cmdpal__item ${globalIndex === selectedIndex ? 'crm-cmdpal__item--selected' : ''}`}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      type="button"
                    >
                      <span className="crm-cmdpal__item-icon">{item.icon}</span>
                      <span className="crm-cmdpal__item-label">{item.label}</span>
                      {item.detail && <span className="crm-cmdpal__item-detail">{item.detail}</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
