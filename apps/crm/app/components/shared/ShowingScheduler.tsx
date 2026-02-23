'use client';

import { useCallback, useState } from 'react';
import type { CrmShowing } from '@real-estate/types/crm';
import { formatDateTime } from '../../lib/crm-formatters';

interface ShowingSchedulerProps {
  leadId: string;
  contactId?: string | null;
  defaultAddress?: string;
  existingShowings: CrmShowing[];
  onShowingCreated: (showing: CrmShowing) => void;
}

export function ShowingScheduler({
  leadId,
  contactId,
  defaultAddress,
  existingShowings,
  onShowingCreated,
}: ShowingSchedulerProps) {
  const [address, setAddress] = useState(defaultAddress || '');
  const [dateTime, setDateTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!address.trim() || !dateTime) return;

      setSaving(true);
      setError('');

      try {
        const res = await fetch('/api/showings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            contactId: contactId || null,
            propertyAddress: address.trim(),
            scheduledAt: new Date(dateTime).toISOString(),
            duration: Number(duration) || 60,
            notes: notes.trim() || null,
          }),
        });

        const data = await res.json();
        if (data.ok && data.showing) {
          onShowingCreated(data.showing);
          setAddress(defaultAddress || '');
          setDateTime('');
          setDuration('60');
          setNotes('');
        } else {
          setError(data.error || 'Failed to schedule showing.');
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [address, dateTime, duration, notes, leadId, contactId, defaultAddress, onShowingCreated]
  );

  const upcoming = existingShowings
    .filter((s) => s.status === 'scheduled' && new Date(s.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <div className="crm-showing-scheduler">
      <h4 className="crm-showing-scheduler-title">Schedule Showing</h4>

      <form className="crm-showing-form" onSubmit={handleSubmit}>
        <label className="crm-field">
          Property Address
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, State"
            required
          />
        </label>

        <div className="crm-showing-form-row">
          <label className="crm-field">
            Date &amp; Time
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />
          </label>

          <label className="crm-field">
            Duration (min)
            <select value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="30">30 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">2 hours</option>
            </select>
          </label>
        </div>

        <label className="crm-field">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Gate code, parking instructions..."
            rows={2}
          />
        </label>

        {error && <p className="crm-banner-warning">{error}</p>}

        <button type="submit" className="crm-primary-button" disabled={saving || !address.trim() || !dateTime}>
          {saving ? 'Scheduling...' : 'Schedule Showing'}
        </button>
      </form>

      {upcoming.length > 0 && (
        <div className="crm-showing-upcoming">
          <h5>Upcoming Showings</h5>
          {upcoming.map((showing) => (
            <div key={showing.id} className="crm-showing-upcoming-item">
              <div className="crm-showing-upcoming-info">
                <strong>{showing.propertyAddress}</strong>
                <span className="crm-muted">
                  {formatDateTime(showing.scheduledAt)}
                  {showing.duration ? ` · ${showing.duration} min` : ''}
                </span>
              </div>
              {showing.notes && (
                <p className="crm-muted crm-showing-upcoming-notes">{showing.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
