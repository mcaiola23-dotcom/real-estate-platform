'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CrmAdSpend } from '@real-estate/types/crm';

const PLATFORMS = ['Google Ads', 'Facebook', 'Instagram', 'Zillow', 'Realtor.com', 'Other'];

export function AdSpendTracker() {
  const [adSpends, setAdSpends] = useState<CrmAdSpend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/ad-spend');
        const data = await res.json();
        if (data.ok) setAdSpends(data.adSpends || []);
      } catch {
        // Fetch failed
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || !startDate || !endDate) return;

      setSaving(true);
      try {
        const res = await fetch('/api/ad-spend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            amount: Math.round(Number(amount) * 100), // Convert to cents
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            notes: notes.trim() || null,
          }),
        });
        const data = await res.json();
        if (data.ok && data.adSpend) {
          setAdSpends((prev) => [data.adSpend, ...prev]);
          setShowForm(false);
          setPlatform(PLATFORMS[0]);
          setAmount('');
          setStartDate('');
          setEndDate('');
          setNotes('');
        }
      } catch {
        // Save failed
      } finally {
        setSaving(false);
      }
    },
    [platform, amount, startDate, endDate, notes]
  );

  const totalSpend = adSpends.reduce((sum, s) => sum + s.amount, 0);
  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(
      cents / 100
    );

  return (
    <div className="crm-ad-spend-tracker">
      <div className="crm-ad-spend-header">
        <div>
          <h4>Ad Spend Tracking</h4>
          <span className="crm-muted">Track advertising costs across platforms for ROI analysis.</span>
        </div>
        <button type="button" className="crm-secondary-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Log Spend'}
        </button>
      </div>

      {showForm && (
        <form className="crm-ad-spend-form" onSubmit={handleSubmit}>
          <div className="crm-ad-spend-form-row">
            <label className="crm-field">
              Platform
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="crm-field">
              Amount ($)
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                required
              />
            </label>
          </div>
          <div className="crm-ad-spend-form-row">
            <label className="crm-field">
              Start Date
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </label>
            <label className="crm-field">
              End Date
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </label>
          </div>
          <label className="crm-field">
            Notes
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Campaign name, targeting..." />
          </label>
          <button type="submit" className="crm-primary-button" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}

      {!loading && adSpends.length > 0 && (
        <>
          <div className="crm-ad-spend-total">
            <span className="crm-muted">Total Tracked Spend</span>
            <strong>{formatCurrency(totalSpend)}</strong>
          </div>
          <div className="crm-ad-spend-list">
            {adSpends.map((spend) => (
              <div key={spend.id} className="crm-ad-spend-item">
                <div className="crm-ad-spend-item-header">
                  <span className="crm-chip">{spend.platform}</span>
                  <strong>{formatCurrency(spend.amount)}</strong>
                </div>
                <span className="crm-muted">
                  {new Date(spend.startDate).toLocaleDateString()} – {new Date(spend.endDate).toLocaleDateString()}
                </span>
                {spend.notes && <span className="crm-muted">{spend.notes}</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && adSpends.length === 0 && !showForm && (
        <p className="crm-muted" style={{ padding: '1rem', textAlign: 'center' }}>
          No ad spend tracked yet. Log your first entry to start tracking ROI.
        </p>
      )}
    </div>
  );
}
