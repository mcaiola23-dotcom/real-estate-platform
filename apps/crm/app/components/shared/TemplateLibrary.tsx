'use client';

import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import type { AiTonePreset } from '@real-estate/ai/types';
import {
  BUILT_IN_TEMPLATES,
  resolveMergeFields,
  mergeTemplates,
  AVAILABLE_MERGE_FIELDS,
  type MessageTemplate,
  type TemplateCategory,
  type TemplateChannel,
  type MergeFieldContext,
} from '../../lib/crm-templates';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateLibraryProps {
  mergeContext: MergeFieldContext;
  tenantId: string;
  leadId: string;
  onUseTemplate: (data: { subject: string | null; body: string; channel: TemplateChannel }) => void;
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  outreach: 'Outreach',
  follow_up: 'Follow-Up',
  listing: 'Listings',
  transaction: 'Transactions',
  general: 'General',
};

const TONE_OPTIONS: { value: AiTonePreset; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
];

const CATEGORY_OPTIONS: TemplateCategory[] = ['outreach', 'follow_up', 'listing', 'transaction', 'general'];
const CHANNEL_OPTIONS: TemplateChannel[] = ['email', 'sms'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TemplateLibrary = memo(function TemplateLibrary({
  mergeContext,
  tenantId,
  leadId,
  onUseTemplate,
  onClose,
}: TemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedChannel, setSelectedChannel] = useState<TemplateChannel | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [previewBody, setPreviewBody] = useState('');
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const [aiTone, setAiTone] = useState<AiTonePreset>('professional');
  const [improvingWithAi, setImprovingWithAi] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Custom template CRUD state
  const [customTemplates, setCustomTemplates] = useState<Array<{
    id: string;
    name: string;
    category: string;
    channel: string;
    subject: string | null;
    body: string;
    description: string;
    isFavorite: boolean;
  }>>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    category: 'general' as TemplateCategory,
    channel: 'email' as TemplateChannel,
    subject: '',
    body: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch custom templates
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/templates`, {
      headers: { 'x-tenant-id': tenantId },
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.templates) {
          setCustomTemplates(data.templates);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tenantId]);

  // Merge built-in + custom
  const allTemplates = useMemo(() => mergeTemplates(customTemplates), [customTemplates]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (selectedChannel !== 'all' && t.channel !== selectedChannel) return false;
      return true;
    });
  }, [allTemplates, selectedCategory, selectedChannel]);

  const categories = useMemo(() => {
    const cats = new Set(allTemplates.map((t) => t.category));
    return ['all', ...cats] as Array<TemplateCategory | 'all'>;
  }, [allTemplates]);

  const handleSelectTemplate = useCallback((template: MessageTemplate) => {
    setSelectedTemplate(template);
    setPreviewBody(resolveMergeFields(template.body, mergeContext));
    setPreviewSubject(template.subject ? resolveMergeFields(template.subject, mergeContext) : null);
    setIsEditing(false);
    setShowCreateForm(false);
  }, [mergeContext]);

  const handleImproveWithAi = useCallback(async () => {
    if (!selectedTemplate) return;
    setImprovingWithAi(true);

    try {
      const response = await fetch('/api/ai/draft-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          leadId,
          context: previewBody,
          tone: aiTone,
          messageType: selectedTemplate.channel,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        draft?: { subject: string | null; body: string };
      };

      if (data.ok && data.draft) {
        setPreviewBody(data.draft.body);
        if (data.draft.subject) {
          setPreviewSubject(data.draft.subject);
        }
      }
    } catch {
      // Graceful — keep current preview
    } finally {
      setImprovingWithAi(false);
    }
  }, [selectedTemplate, previewBody, aiTone, tenantId, leadId]);

  const handleUse = useCallback(() => {
    if (!selectedTemplate) return;

    // Track use count for custom templates
    if (!selectedTemplate.isBuiltIn) {
      fetch(`/api/templates/${selectedTemplate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ action: 'use' }),
      }).catch(() => {});
    }

    onUseTemplate({
      subject: previewSubject,
      body: previewBody,
      channel: selectedTemplate.channel,
    });
  }, [selectedTemplate, previewSubject, previewBody, onUseTemplate, tenantId]);

  const handleCreateTemplate = useCallback(async () => {
    if (!createForm.name.trim() || !createForm.body.trim()) return;
    setSaving(true);

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({
          name: createForm.name.trim(),
          category: createForm.category,
          channel: createForm.channel,
          subject: createForm.channel === 'email' ? createForm.subject.trim() || null : null,
          body: createForm.body.trim(),
          description: createForm.description.trim(),
        }),
      });

      const data = await res.json();
      if (data.ok && data.template) {
        setCustomTemplates((prev) => [data.template, ...prev]);
        setCreateForm({ name: '', category: 'general', channel: 'email', subject: '', body: '', description: '' });
        setShowCreateForm(false);
      }
    } catch {
      // Keep form open on error
    } finally {
      setSaving(false);
    }
  }, [createForm, tenantId]);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    setDeleting(templateId);
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': tenantId },
      });
      const data = await res.json();
      if (data.ok) {
        setCustomTemplates((prev) => prev.filter((t) => t.id !== templateId));
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
        }
      }
    } catch {
      // Silent failure
    } finally {
      setDeleting(null);
    }
  }, [tenantId, selectedTemplate?.id]);

  const handleToggleFavorite = useCallback(async (templateId: string, currentFavorite: boolean) => {
    // Optimistic update
    setCustomTemplates((prev) =>
      prev.map((t) => t.id === templateId ? { ...t, isFavorite: !currentFavorite } : t)
    );

    try {
      await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ isFavorite: !currentFavorite }),
      });
    } catch {
      // Revert on failure
      setCustomTemplates((prev) =>
        prev.map((t) => t.id === templateId ? { ...t, isFavorite: currentFavorite } : t)
      );
    }
  }, [tenantId]);

  const insertMergeField = useCallback((field: string) => {
    setPreviewBody((prev) => prev + field);
    setIsEditing(true);
  }, []);

  return (
    <div className="crm-template-lib">
      <div className="crm-template-lib__header">
        <h3 className="crm-template-lib__title">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          </svg>
          Message Templates
        </h3>
        <div className="crm-template-lib__header-actions">
          <button
            type="button"
            className="crm-template-lib__create-btn"
            onClick={() => { setShowCreateForm(!showCreateForm); setSelectedTemplate(null); }}
          >
            + New
          </button>
          {onClose && (
            <button type="button" className="crm-template-lib__close" onClick={onClose} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" /></svg>
            </button>
          )}
        </div>
      </div>

      <div className="crm-template-lib__content">
        {/* Sidebar / filters */}
        <div className="crm-template-lib__sidebar">
          <div className="crm-template-lib__filter-group">
            <label className="crm-template-lib__filter-label">Category</label>
            <div className="crm-template-lib__filter-btns">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`crm-template-lib__filter-btn ${selectedCategory === cat ? 'crm-template-lib__filter-btn--active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="crm-template-lib__filter-group">
            <label className="crm-template-lib__filter-label">Channel</label>
            <div className="crm-template-lib__filter-btns">
              <button
                type="button"
                className={`crm-template-lib__filter-btn ${selectedChannel === 'all' ? 'crm-template-lib__filter-btn--active' : ''}`}
                onClick={() => setSelectedChannel('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`crm-template-lib__filter-btn ${selectedChannel === 'email' ? 'crm-template-lib__filter-btn--active' : ''}`}
                onClick={() => setSelectedChannel('email')}
              >
                Email
              </button>
              <button
                type="button"
                className={`crm-template-lib__filter-btn ${selectedChannel === 'sms' ? 'crm-template-lib__filter-btn--active' : ''}`}
                onClick={() => setSelectedChannel('sms')}
              >
                SMS
              </button>
            </div>
          </div>

          {/* Template list */}
          <div className="crm-template-lib__list">
            {filteredTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`crm-template-lib__item ${selectedTemplate?.id === t.id ? 'crm-template-lib__item--active' : ''}`}
                onClick={() => handleSelectTemplate(t)}
              >
                <span className="crm-template-lib__item-name">
                  {!t.isBuiltIn && t.isFavorite && <span className="crm-template-lib__fav-star">★</span>}
                  {t.name}
                </span>
                <span className="crm-template-lib__item-meta">
                  <span className={`crm-template-lib__item-channel crm-template-lib__item-channel--${t.channel}`}>
                    {t.channel}
                  </span>
                  {!t.isBuiltIn && (
                    <span className="crm-template-lib__item-custom">custom</span>
                  )}
                </span>
              </button>
            ))}
            {filteredTemplates.length === 0 && (
              <div className="crm-template-lib__empty">No templates match filters</div>
            )}
          </div>
        </div>

        {/* Preview pane */}
        <div className="crm-template-lib__preview">
          {/* ── Create Form ── */}
          {showCreateForm && (
            <div className="crm-template-lib__create-form">
              <h4 className="crm-template-lib__preview-name">Create Custom Template</h4>

              <label className="crm-template-lib__form-field">
                <span>Name</span>
                <input
                  type="text"
                  className="crm-template-lib__preview-input"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Template name..."
                />
              </label>

              <div className="crm-template-lib__form-row">
                <label className="crm-template-lib__form-field">
                  <span>Category</span>
                  <select
                    className="crm-template-lib__select"
                    value={createForm.category}
                    onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value as TemplateCategory }))}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </label>
                <label className="crm-template-lib__form-field">
                  <span>Channel</span>
                  <select
                    className="crm-template-lib__select"
                    value={createForm.channel}
                    onChange={(e) => setCreateForm((f) => ({ ...f, channel: e.target.value as TemplateChannel }))}
                  >
                    {CHANNEL_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
                    ))}
                  </select>
                </label>
              </div>

              {createForm.channel === 'email' && (
                <label className="crm-template-lib__form-field">
                  <span>Subject</span>
                  <input
                    type="text"
                    className="crm-template-lib__preview-input"
                    value={createForm.subject}
                    onChange={(e) => setCreateForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Email subject..."
                  />
                </label>
              )}

              <label className="crm-template-lib__form-field">
                <span>Body</span>
                <textarea
                  className="crm-template-lib__preview-textarea"
                  value={createForm.body}
                  onChange={(e) => setCreateForm((f) => ({ ...f, body: e.target.value }))}
                  rows={6}
                  placeholder="Type your message template... Use merge fields like {{lead.name}}"
                />
              </label>

              {/* Merge field picker for create form */}
              <div className="crm-template-lib__merge-picker">
                <span className="crm-template-lib__merge-label">Insert:</span>
                {AVAILABLE_MERGE_FIELDS.map((mf) => (
                  <button
                    key={mf.field}
                    type="button"
                    className="crm-template-lib__merge-btn"
                    onClick={() => setCreateForm((f) => ({ ...f, body: f.body + mf.field }))}
                  >
                    {mf.label}
                  </button>
                ))}
              </div>

              <label className="crm-template-lib__form-field">
                <span>Description (optional)</span>
                <input
                  type="text"
                  className="crm-template-lib__preview-input"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description..."
                />
              </label>

              <div className="crm-template-lib__form-actions">
                <button
                  type="button"
                  className="crm-template-lib__use-btn"
                  onClick={() => void handleCreateTemplate()}
                  disabled={saving || !createForm.name.trim() || !createForm.body.trim()}
                >
                  {saving ? 'Saving...' : 'Create Template'}
                </button>
                <button
                  type="button"
                  className="crm-template-lib__cancel-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Template Preview ── */}
          {!showCreateForm && selectedTemplate ? (
            <>
              <div className="crm-template-lib__preview-header">
                <div>
                  <h4 className="crm-template-lib__preview-name">{selectedTemplate.name}</h4>
                  <p className="crm-template-lib__preview-desc">{selectedTemplate.description}</p>
                </div>
                <div className="crm-template-lib__preview-actions">
                  {!selectedTemplate.isBuiltIn && (
                    <>
                      <button
                        type="button"
                        className="crm-template-lib__fav-btn"
                        onClick={() => handleToggleFavorite(selectedTemplate.id, selectedTemplate.isFavorite)}
                        title={selectedTemplate.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {selectedTemplate.isFavorite ? '★' : '☆'}
                      </button>
                      <button
                        type="button"
                        className="crm-template-lib__delete-btn"
                        onClick={() => void handleDeleteTemplate(selectedTemplate.id)}
                        disabled={deleting === selectedTemplate.id}
                        title="Delete template"
                      >
                        {deleting === selectedTemplate.id ? '...' : '✕'}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="crm-template-lib__edit-btn"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Preview' : 'Edit'}
                  </button>
                </div>
              </div>

              {previewSubject !== null && (
                <div className="crm-template-lib__preview-subject">
                  <label className="crm-template-lib__preview-label">Subject</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="crm-template-lib__preview-input"
                      value={previewSubject}
                      onChange={(e) => setPreviewSubject(e.target.value)}
                    />
                  ) : (
                    <p className="crm-template-lib__preview-value">{previewSubject}</p>
                  )}
                </div>
              )}

              <div className="crm-template-lib__preview-body">
                <label className="crm-template-lib__preview-label">Body</label>
                {isEditing ? (
                  <textarea
                    className="crm-template-lib__preview-textarea"
                    value={previewBody}
                    onChange={(e) => setPreviewBody(e.target.value)}
                    rows={10}
                  />
                ) : (
                  <div className="crm-template-lib__preview-text">{previewBody}</div>
                )}
              </div>

              {/* Merge field picker (edit mode) */}
              {isEditing && (
                <div className="crm-template-lib__merge-picker">
                  <span className="crm-template-lib__merge-label">Insert:</span>
                  {AVAILABLE_MERGE_FIELDS.map((mf) => (
                    <button
                      key={mf.field}
                      type="button"
                      className="crm-template-lib__merge-btn"
                      onClick={() => insertMergeField(mf.field)}
                    >
                      {mf.label}
                    </button>
                  ))}
                </div>
              )}

              {/* AI tone adjustment */}
              <div className="crm-template-lib__ai-section">
                <div className="crm-template-lib__ai-row">
                  <div className="crm-template-lib__ai-tone">
                    <label className="crm-template-lib__ai-tone-label">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" opacity="0.7" />
                      </svg>
                      Tone
                    </label>
                    <div className="crm-template-lib__ai-tone-btns">
                      {TONE_OPTIONS.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          className={`crm-template-lib__ai-tone-btn ${aiTone === t.value ? 'crm-template-lib__ai-tone-btn--active' : ''}`}
                          onClick={() => setAiTone(t.value)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="crm-template-lib__ai-btn"
                    onClick={handleImproveWithAi}
                    disabled={improvingWithAi}
                  >
                    {improvingWithAi ? (
                      <><span className="crm-ai-dots"><span /><span /><span /></span> Improving...</>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" />
                        </svg>
                        Improve with AI
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Use button */}
              <div className="crm-template-lib__footer">
                <button
                  type="button"
                  className="crm-template-lib__use-btn"
                  onClick={handleUse}
                >
                  Use Template
                </button>
              </div>
            </>
          ) : !showCreateForm && (
            <div className="crm-template-lib__no-selection">
              <svg width="32" height="32" viewBox="0 0 16 16" fill="none" opacity="0.3">
                <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <p>Select a template to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
