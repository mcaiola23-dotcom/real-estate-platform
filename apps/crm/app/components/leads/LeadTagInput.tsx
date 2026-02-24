'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const PRESET_SUGGESTIONS = [
  'VIP', 'Hot Lead', 'Investor', 'First-time Buyer', 'Relocating', 'Cash Buyer',
  'Pre-approved', 'Downsizing', 'Luxury', 'Referral',
];

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

interface LeadTagInputProps {
  leadId: string;
  tenantId: string;
  initialTags: string[];
  onTagsChange: (tags: string[]) => void;
  /** When true, tags are saved via the parent's draft/save flow instead of direct PATCH. */
  draftMode?: boolean;
}

export function LeadTagInput({ leadId, tenantId, initialTags, onTagsChange, draftMode }: LeadTagInputProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [allTenantTags, setAllTenantTags] = useState<string[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [saving, setSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch tenant tags on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchTags() {
      try {
        const res = await fetch('/api/leads/tags');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data.tags)) {
            setAllTenantTags(data.tags);
          }
        }
      } catch { /* silent */ }
    }
    fetchTags();
    return () => { cancelled = true; };
  }, [tenantId]);

  // Sync if initialTags change externally
  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const persistTags = useCallback(async (nextTags: string[]) => {
    if (draftMode) {
      // In draft mode, tags are saved with the parent's unified Save flow
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: nextTags }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lead?.tags) {
          setTags(data.lead.tags);
          onTagsChange(data.lead.tags);
        }
      }
    } catch { /* silent */ }
    setSaving(false);
  }, [leadId, onTagsChange, draftMode]);

  const addTag = useCallback((raw: string) => {
    const normalized = raw.trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
    if (!normalized || tags.includes(normalized) || tags.length >= MAX_TAGS) return;
    const nextTags = [...tags, normalized];
    setTags(nextTags);
    onTagsChange(nextTags);
    setInputValue('');
    setHighlightIndex(-1);
    persistTags(nextTags);
  }, [tags, onTagsChange, persistTags]);

  const removeTag = useCallback((tag: string) => {
    const nextTags = tags.filter((t) => t !== tag);
    setTags(nextTags);
    onTagsChange(nextTags);
    persistTags(nextTags);
  }, [tags, onTagsChange, persistTags]);

  // Build suggestion list
  const query = inputValue.trim().toLowerCase();
  const suggestions: string[] = [];

  if (query.length > 0) {
    // Filter from tenant tags + presets that match query and aren't already applied
    const combined = new Set([...allTenantTags, ...PRESET_SUGGESTIONS.map((s) => s.toLowerCase())]);
    for (const t of combined) {
      if (t.includes(query) && !tags.includes(t)) {
        suggestions.push(t);
      }
    }
    // If the exact query isn't in suggestions and isn't already a tag, offer to create it
    if (!suggestions.includes(query) && !tags.includes(query)) {
      suggestions.push(query);
    }
  } else if (isFocused) {
    // Show preset suggestions when focused with empty input
    for (const preset of PRESET_SUGGESTIONS) {
      const lower = preset.toLowerCase();
      if (!tags.includes(lower)) {
        suggestions.push(lower);
      }
    }
  }

  const showDropdown = isFocused && suggestions.length > 0 && tags.length < MAX_TAGS;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        addTag(suggestions[highlightIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [inputValue, isFocused]);

  // Scroll highlighted suggestion into view
  useEffect(() => {
    if (highlightIndex >= 0 && dropdownRef.current) {
      const item = dropdownRef.current.children[highlightIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  return (
    <div className="crm-tag-root" ref={containerRef}>
      <div
        className={`crm-tag-field ${isFocused ? 'is-focused' : ''} ${saving ? 'is-saving' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span key={tag} className="crm-tag-chip">
            <span className="crm-tag-chip-label">{tag}</span>
            <button
              type="button"
              className="crm-tag-chip-remove"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              aria-label={`Remove tag ${tag}`}
            >
              &times;
            </button>
          </span>
        ))}

        {tags.length < MAX_TAGS && (
          <input
            ref={inputRef}
            type="text"
            className="crm-tag-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.slice(0, MAX_TAG_LENGTH))}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? 'Add tags\u2026' : ''}
            aria-label="Add tag"
            autoComplete="off"
            spellCheck={false}
          />
        )}

        {saving && <span className="crm-tag-saving" aria-live="polite" />}
      </div>

      {showDropdown && (
        <div className="crm-tag-dropdown" ref={dropdownRef} role="listbox">
          {query.length === 0 && (
            <div className="crm-tag-dropdown-header">Suggestions</div>
          )}
          {suggestions.map((s, i) => {
            const isNew = query.length > 0 && s === query && !allTenantTags.includes(s);
            return (
              <button
                key={s}
                type="button"
                role="option"
                aria-selected={i === highlightIndex}
                className={`crm-tag-dropdown-item ${i === highlightIndex ? 'is-highlighted' : ''}`}
                onPointerDown={(e) => { e.preventDefault(); addTag(s); }}
              >
                {isNew ? (
                  <>
                    <span className="crm-tag-dropdown-new">Create</span>
                    {s}
                  </>
                ) : (
                  s
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
