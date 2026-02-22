'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import type { AiTonePreset } from '@real-estate/ai/types';
import {
  BUILT_IN_TEMPLATES,
  resolveMergeFields,
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

  const filteredTemplates = useMemo(() => {
    return BUILT_IN_TEMPLATES.filter((t) => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (selectedChannel !== 'all' && t.channel !== selectedChannel) return false;
      return true;
    });
  }, [selectedCategory, selectedChannel]);

  const categories = useMemo(() => {
    const cats = new Set(BUILT_IN_TEMPLATES.map((t) => t.category));
    return ['all', ...cats] as Array<TemplateCategory | 'all'>;
  }, []);

  const handleSelectTemplate = useCallback((template: MessageTemplate) => {
    setSelectedTemplate(template);
    setPreviewBody(resolveMergeFields(template.body, mergeContext));
    setPreviewSubject(template.subject ? resolveMergeFields(template.subject, mergeContext) : null);
    setIsEditing(false);
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
    onUseTemplate({
      subject: previewSubject,
      body: previewBody,
      channel: selectedTemplate.channel,
    });
  }, [selectedTemplate, previewSubject, previewBody, onUseTemplate]);

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
        {onClose && (
          <button type="button" className="crm-template-lib__close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
        )}
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
                <span className="crm-template-lib__item-name">{t.name}</span>
                <span className="crm-template-lib__item-meta">
                  <span className={`crm-template-lib__item-channel crm-template-lib__item-channel--${t.channel}`}>
                    {t.channel}
                  </span>
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
          {selectedTemplate ? (
            <>
              <div className="crm-template-lib__preview-header">
                <div>
                  <h4 className="crm-template-lib__preview-name">{selectedTemplate.name}</h4>
                  <p className="crm-template-lib__preview-desc">{selectedTemplate.description}</p>
                </div>
                <button
                  type="button"
                  className="crm-template-lib__edit-btn"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Preview' : 'Edit'}
                </button>
              </div>

              {previewSubject && (
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
          ) : (
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
