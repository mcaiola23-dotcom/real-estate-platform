'use client';

import { useCallback, useEffect, useState } from 'react';

interface CommissionSettingsPanelProps {
  tenantId: string;
}

interface CommissionSettings {
  defaultCommPct: number;
  brokerageSplitPct: number;
  marketingFee: number;
  referralFee: number;
}

export function CommissionSettingsPanel({ tenantId }: CommissionSettingsPanelProps) {
  const [settings, setSettings] = useState<CommissionSettings>({
    defaultCommPct: 3,
    brokerageSplitPct: 70,
    marketingFee: 0,
    referralFee: 0,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/commissions');
        const data = await res.json();
        if (data.ok && data.settings) {
          setSettings({
            defaultCommPct: data.settings.defaultCommPct,
            brokerageSplitPct: data.settings.brokerageSplitPct,
            marketingFee: data.settings.marketingFee,
            referralFee: data.settings.referralFee,
          });
        }
      } catch {
        // Use defaults
      }
    })();
  }, [tenantId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          ...settings,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // Save failed
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return (
    <div className="crm-commission-settings">
      <div className="crm-panel-head">
        <h4>Commission Defaults</h4>
        <span className="crm-muted">
          Set your default brokerage splits and fees. These pre-fill the commission calculator on transactions.
        </span>
      </div>

      <div className="crm-commission-settings-grid">
        <label className="crm-field">
          Default Commission %
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={settings.defaultCommPct}
            onChange={(e) => setSettings((prev) => ({ ...prev, defaultCommPct: Number(e.target.value) || 0 }))}
          />
        </label>

        <label className="crm-field">
          Your Brokerage Split %
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={settings.brokerageSplitPct}
            onChange={(e) => setSettings((prev) => ({ ...prev, brokerageSplitPct: Number(e.target.value) || 0 }))}
          />
        </label>

        <label className="crm-field">
          Default Marketing Fee ($)
          <input
            type="number"
            min="0"
            value={settings.marketingFee || ''}
            onChange={(e) => setSettings((prev) => ({ ...prev, marketingFee: Number(e.target.value) || 0 }))}
            placeholder="0"
          />
        </label>

        <label className="crm-field">
          Default Referral Fee ($)
          <input
            type="number"
            min="0"
            value={settings.referralFee || ''}
            onChange={(e) => setSettings((prev) => ({ ...prev, referralFee: Number(e.target.value) || 0 }))}
            placeholder="0"
          />
        </label>
      </div>

      <div className="crm-commission-settings-actions">
        <button
          type="button"
          className="crm-primary-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Defaults'}
        </button>
      </div>
    </div>
  );
}
