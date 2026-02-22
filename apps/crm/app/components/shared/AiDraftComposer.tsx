'use client';

import { memo, useState, useCallback } from 'react';

type DraftChannel = 'email' | 'sms';
type DraftTone = 'professional' | 'friendly' | 'casual';

interface AiDraftComposerProps {
  leadId: string;
  tenantId: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  propertyAddress: string | null;
  onClose: () => void;
  onSend?: (data: { channel: DraftChannel; subject: string; body: string }) => void;
}

const TONES: { value: DraftTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
];

const PROMPT_SUGGESTIONS = [
  'Initial outreach to new lead',
  'Follow up after showing',
  'Share new listings that match their criteria',
  'Check in after a period of inactivity',
  'Send market update for their area',
  'Congratulate on closing',
];

export const AiDraftComposer = memo(function AiDraftComposer({
  leadId,
  tenantId,
  contactName,
  contactEmail,
  contactPhone,
  propertyAddress,
  onClose,
  onSend,
}: AiDraftComposerProps) {
  const [channel, setChannel] = useState<DraftChannel>('email');
  const [tone, setTone] = useState<DraftTone>('professional');
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateDraft = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/ai/draft-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          leadId,
          context: prompt.trim(),
          tone,
          messageType: channel,
        }),
      });
      if (response.ok) {
        const json = (await response.json()) as {
          draft?: { subject: string | null; body: string };
        };
        if (json.draft) {
          setSubject(json.draft.subject || '');
          setBody(json.draft.body);
          setGenerated(true);
        }
      }
    } catch {
      // Keep existing content on failure
    } finally {
      setLoading(false);
    }
  }, [prompt, tone, channel, leadId, tenantId]);

  const handleSend = useCallback(() => {
    if (channel === 'email' && contactEmail) {
      const mailtoSubject = encodeURIComponent(subject);
      const mailtoBody = encodeURIComponent(body);
      window.open(`mailto:${contactEmail}?subject=${mailtoSubject}&body=${mailtoBody}`, '_blank');
    } else if (channel === 'sms' && contactPhone) {
      void navigator.clipboard.writeText(body);
    } else {
      void navigator.clipboard.writeText(body);
    }
    onSend?.({ channel, subject, body });
  }, [channel, contactEmail, contactPhone, subject, body, onSend]);

  const charCount = body.length;
  const smsSegments = channel === 'sms' ? Math.ceil(charCount / 160) || 1 : 0;

  return (
    <div className="crm-draft-composer">
      <div className="crm-draft-composer__header">
        <h4>
          <span className="crm-ai-glyph">◆</span> AI Message Composer
        </h4>
        <button type="button" className="crm-modal-close" onClick={onClose} aria-label="Close composer">
          ✕
        </button>
      </div>

      {!generated ? (
        <div className="crm-draft-composer__setup">
          <div className="crm-draft-composer__row">
            <label className="crm-draft-composer__label">Channel</label>
            <div className="crm-draft-composer__toggle-group">
              <button
                type="button"
                className={`crm-draft-composer__toggle ${channel === 'email' ? 'crm-draft-composer__toggle--active' : ''}`}
                onClick={() => setChannel('email')}
              >
                ✉️ Email
              </button>
              <button
                type="button"
                className={`crm-draft-composer__toggle ${channel === 'sms' ? 'crm-draft-composer__toggle--active' : ''}`}
                onClick={() => setChannel('sms')}
              >
                💬 SMS
              </button>
            </div>
          </div>

          <div className="crm-draft-composer__row">
            <label className="crm-draft-composer__label">Tone</label>
            <div className="crm-draft-composer__toggle-group">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`crm-draft-composer__toggle ${tone === t.value ? 'crm-draft-composer__toggle--active' : ''}`}
                  onClick={() => setTone(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="crm-draft-composer__row">
            <label className="crm-draft-composer__label">What would you like to say?</label>
            <textarea
              className="crm-draft-composer__prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to communicate..."
              rows={3}
            />
          </div>

          <div className="crm-draft-composer__suggestions">
            {PROMPT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="crm-draft-composer__suggestion"
                onClick={() => setPrompt(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="crm-draft-composer__context">
            {contactName && <span className="crm-chip">To: {contactName}</span>}
            {propertyAddress && <span className="crm-chip">{propertyAddress}</span>}
          </div>

          <button
            type="button"
            className="crm-btn crm-btn-primary crm-draft-composer__generate"
            onClick={() => void generateDraft()}
            disabled={!prompt.trim() || loading}
          >
            {loading ? 'Generating...' : '◆ Generate Draft'}
          </button>
        </div>
      ) : (
        <div className="crm-draft-composer__editor">
          {channel === 'email' && (
            <div className="crm-draft-composer__row">
              <label className="crm-draft-composer__label">Subject</label>
              <input
                type="text"
                className="crm-draft-composer__input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          <div className="crm-draft-composer__row">
            <label className="crm-draft-composer__label">
              Message
              {channel === 'sms' && (
                <span className="crm-muted" style={{ marginLeft: '0.5rem', fontWeight: 400 }}>
                  {charCount} chars ({smsSegments} segment{smsSegments !== 1 ? 's' : ''})
                </span>
              )}
            </label>
            <textarea
              className="crm-draft-composer__body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={channel === 'sms' ? 4 : 10}
            />
          </div>

          <div className="crm-draft-composer__actions">
            <button
              type="button"
              className="crm-btn crm-btn-ghost"
              onClick={() => { setGenerated(false); setBody(''); setSubject(''); }}
            >
              ← Regenerate
            </button>
            <div className="crm-draft-composer__actions-right">
              <button
                type="button"
                className="crm-btn crm-btn-ghost"
                onClick={() => { void navigator.clipboard.writeText(body); }}
              >
                Copy
              </button>
              <button
                type="button"
                className="crm-btn crm-btn-primary"
                onClick={handleSend}
              >
                {channel === 'email' && contactEmail ? '✉️ Open in Email' : '📋 Copy to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
