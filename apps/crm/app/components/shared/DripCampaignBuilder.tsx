'use client';

import { useCallback, useState } from 'react';
import type { CrmCampaign } from '@real-estate/types/crm';

interface CampaignStep {
  type: 'email' | 'wait';
  templateName?: string;
  subject?: string;
  body?: string;
  delayDays?: number;
}

interface DripCampaignBuilderProps {
  campaign?: CrmCampaign;
  onSave: (campaign: CrmCampaign) => void;
  onCancel: () => void;
}

export function DripCampaignBuilder({ campaign, onSave, onCancel }: DripCampaignBuilderProps) {
  const [name, setName] = useState(campaign?.name || '');
  const [steps, setSteps] = useState<CampaignStep[]>(() => {
    try {
      return campaign?.stepsJson ? JSON.parse(campaign.stepsJson) : [];
    } catch {
      return [];
    }
  });
  const [saving, setSaving] = useState(false);

  const addStep = useCallback((type: 'email' | 'wait') => {
    setSteps((prev) => [
      ...prev,
      type === 'email'
        ? { type: 'email', templateName: '', subject: '', body: '' }
        : { type: 'wait', delayDays: 3 },
    ]);
  }, []);

  const updateStep = useCallback((index: number, updates: Partial<CampaignStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  }, []);

  const removeStep = useCallback((index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        stepsJson: JSON.stringify(steps),
      };

      if (campaign) {
        payload.action = 'update';
        payload.campaignId = campaign.id;
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.ok && data.campaign) {
        onSave(data.campaign);
      }
    } catch {
      // Save failed
    } finally {
      setSaving(false);
    }
  }, [name, steps, campaign, onSave]);

  return (
    <div className="crm-campaign-builder">
      <div className="crm-campaign-builder-header">
        <h3>{campaign ? 'Edit Campaign' : 'New Campaign'}</h3>
        <button type="button" className="crm-icon-button" onClick={onCancel} aria-label="Close">
          ✕
        </button>
      </div>

      <label className="crm-field">
        Campaign Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New Buyer Follow-Up Sequence"
        />
      </label>

      <div className="crm-campaign-steps">
        <h4>Steps</h4>
        {steps.length === 0 && (
          <p className="crm-muted">No steps yet. Add an email or wait step to get started.</p>
        )}
        {steps.map((step, index) => (
          <div key={index} className={`crm-campaign-step crm-campaign-step--${step.type}`}>
            <div className="crm-campaign-step-header">
              <span className="crm-campaign-step-number">{index + 1}</span>
              <span className="crm-campaign-step-type">
                {step.type === 'email' ? '✉ Email' : '⏳ Wait'}
              </span>
              <button
                type="button"
                className="crm-icon-button"
                onClick={() => removeStep(index)}
                aria-label="Remove step"
              >
                ✕
              </button>
            </div>

            {step.type === 'email' ? (
              <div className="crm-campaign-step-body">
                <label className="crm-field">
                  Subject
                  <input
                    value={step.subject || ''}
                    onChange={(e) => updateStep(index, { subject: e.target.value })}
                    placeholder="Just checking in..."
                  />
                </label>
                <label className="crm-field">
                  Body
                  <textarea
                    value={step.body || ''}
                    onChange={(e) => updateStep(index, { body: e.target.value })}
                    placeholder="Hi {{firstName}}, ..."
                    rows={3}
                  />
                </label>
              </div>
            ) : (
              <div className="crm-campaign-step-body">
                <label className="crm-field">
                  Wait (days)
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={step.delayDays || 3}
                    onChange={(e) => updateStep(index, { delayDays: Number(e.target.value) || 1 })}
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="crm-campaign-add-steps">
        <button type="button" className="crm-secondary-button" onClick={() => addStep('email')}>
          + Email Step
        </button>
        <button type="button" className="crm-secondary-button" onClick={() => addStep('wait')}>
          + Wait Step
        </button>
      </div>

      <div className="crm-campaign-builder-actions">
        <button type="button" className="crm-secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="crm-primary-button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
        >
          {saving ? 'Saving...' : 'Save Campaign'}
        </button>
      </div>
    </div>
  );
}
