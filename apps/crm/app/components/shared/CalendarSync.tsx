'use client';

import { useState, useCallback } from 'react';

interface CalendarSyncProps {
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
}

export function CalendarSync({ connected, onConnect, onDisconnect }: CalendarSyncProps) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const res = await fetch('/api/integrations/google/calendar/sync', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        setSyncResult(data.sync);
        setLastSync(new Date().toLocaleString());
      } else {
        setError(data.error ?? 'Sync failed.');
      }
    } catch {
      setError('Network error during sync.');
    } finally {
      setSyncing(false);
    }
  }, []);

  if (!connected) {
    return (
      <div className="crm-integration-card">
        <div className="crm-integration-header">
          <span className="crm-integration-icon">📅</span>
          <div>
            <strong>Google Calendar</strong>
            <p className="crm-muted">Sync follow-ups to your Google Calendar</p>
          </div>
        </div>
        <button type="button" className="crm-secondary-button" onClick={onConnect}>
          Connect Google Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="crm-integration-card crm-integration-connected">
      <div className="crm-integration-header">
        <span className="crm-integration-icon">📅</span>
        <div>
          <strong>Google Calendar</strong>
          <span className="crm-integration-status crm-integration-status-connected">Connected</span>
        </div>
      </div>

      <div className="crm-integration-actions">
        <button
          type="button"
          className="crm-secondary-button"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
        <button
          type="button"
          className="crm-secondary-button crm-danger-button"
          onClick={onDisconnect}
        >
          Disconnect
        </button>
      </div>

      {lastSync && (
        <p className="crm-muted">Last synced: {lastSync}</p>
      )}

      {syncResult && (
        <div className="crm-sync-summary">
          <span>{syncResult.created} created</span>
          <span>{syncResult.updated} updated</span>
          <span>{syncResult.skipped} unchanged</span>
        </div>
      )}

      {error && (
        <p className="crm-integration-error">{error}</p>
      )}
    </div>
  );
}
