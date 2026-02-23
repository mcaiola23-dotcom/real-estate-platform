'use client';

import { useEffect, useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import type { TenantContext } from '@real-estate/types/tenant';
import Image from 'next/image';
import type { BrandPreferences } from '../../lib/crm-types';
import { normalizeHexColor } from '../../lib/crm-brand-theme';
import { passthroughImageLoader } from '../../lib/crm-formatters';
import { CalendarSync } from '../shared/CalendarSync';
import type { NotificationPrefs } from '../../lib/use-push-notifications';
import { NotificationPreferences } from '../shared/NotificationPreferences';

interface SettingsViewProps {
  brandPreferences: BrandPreferences;
  setBrandPreferences: Dispatch<SetStateAction<BrandPreferences>>;
  resetBrandPreferences: () => void;
  websiteFaviconUrl: string;
  showBrandLogo: boolean;
  resolvedLogoUrl: string;
  brandInitials: string;
  setLogoLoadErrored: Dispatch<SetStateAction<boolean>>;
  tenantContext: TenantContext;
  notificationPrefs: NotificationPrefs;
  notificationPermission: NotificationPermission;
  onRequestNotificationPermission: () => void;
  onUpdateNotificationPrefs: (updates: Partial<NotificationPrefs>) => void;
}

export function SettingsView({
  brandPreferences,
  setBrandPreferences,
  resetBrandPreferences,
  websiteFaviconUrl,
  showBrandLogo,
  resolvedLogoUrl,
  brandInitials,
  setLogoLoadErrored,
  tenantContext,
  notificationPrefs,
  notificationPermission,
  onRequestNotificationPermission,
  onUpdateNotificationPrefs,
}: SettingsViewProps) {
  const [googleStatus, setGoogleStatus] = useState<{
    connected: boolean;
    capabilities?: { calendar: boolean; gmail: boolean };
    connectedAt?: string;
  } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchGoogleStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/google/status', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) {
        setGoogleStatus({
          connected: data.connected,
          capabilities: data.capabilities,
          connectedAt: data.connectedAt,
        });
      }
    } catch {
      setGoogleStatus({ connected: false });
    }
  }, []);

  useEffect(() => { void fetchGoogleStatus(); }, [fetchGoogleStatus]);

  const handleGoogleConnect = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/google/connect');
      const data = await res.json();
      if (data.ok && data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      // Connection attempt failed
    }
  }, []);

  const handleGoogleDisconnect = useCallback(async () => {
    setDisconnecting(true);
    try {
      await fetch('/api/integrations/google/disconnect', { method: 'POST' });
      setGoogleStatus({ connected: false });
    } catch {
      // Disconnect failed
    } finally {
      setDisconnecting(false);
    }
  }, []);

  return (
    <section className="crm-panel">
      <div className="crm-panel-head">
        <h3>Settings</h3>
        <span className="crm-muted">Tenant-scoped brand, look-and-feel, and workspace preferences.</span>
      </div>
      <div className="crm-settings-grid">
        <article>
          <h4>Brand Identity</h4>
          <label className="crm-field">
            Workspace Brand Name
            <input
              value={brandPreferences.brandName}
              onChange={(event) => {
                const value = event.target.value;
                setBrandPreferences((prev) => ({ ...prev, brandName: value }));
              }}
              placeholder="Caiola Realty"
            />
          </label>
          <label className="crm-field">
            Custom Logo URL
            <input
              value={brandPreferences.customLogoUrl}
              onChange={(event) => {
                const value = event.target.value;
                setBrandPreferences((prev) => ({ ...prev, customLogoUrl: value, useWebsiteFavicon: false }));
              }}
              placeholder="https://.../logo.svg"
            />
          </label>
          <div className="crm-inline-controls">
            <button
              type="button"
              className={`crm-sort-toggle ${brandPreferences.useWebsiteFavicon ? 'is-active' : ''}`}
              onClick={() =>
                setBrandPreferences((prev) => ({
                  ...prev,
                  useWebsiteFavicon: true,
                }))
              }
            >
              Use Website Logo
            </button>
            <button
              type="button"
              className={`crm-sort-toggle ${!brandPreferences.useWebsiteFavicon ? 'is-active' : ''}`}
              onClick={() =>
                setBrandPreferences((prev) => ({
                  ...prev,
                  useWebsiteFavicon: false,
                }))
              }
            >
              Use Custom URL
            </button>
          </div>
          <p className="crm-muted">
            Website logo source: <code>{websiteFaviconUrl}</code>
          </p>
        </article>
        <article>
          <h4>Theme Controls</h4>
          <label className="crm-field">
            Accent Color
            <input
              type="color"
              value={normalizeHexColor(brandPreferences.accentColor, '#1c1917')}
              onChange={(event) =>
                setBrandPreferences((prev) => ({
                  ...prev,
                  accentColor: event.target.value,
                }))
              }
            />
          </label>
          <label className="crm-field">
            Surface Tint
            <input
              type="color"
              value={normalizeHexColor(brandPreferences.surfaceTint, '#d6cec4')}
              onChange={(event) =>
                setBrandPreferences((prev) => ({
                  ...prev,
                  surfaceTint: event.target.value,
                }))
              }
            />
          </label>
          <label className="crm-checkbox-row">
            <input
              type="checkbox"
              checked={brandPreferences.showTexture}
              onChange={(event) =>
                setBrandPreferences((prev) => ({
                  ...prev,
                  showTexture: event.target.checked,
                }))
              }
            />
            <span>Enable decorative background texture</span>
          </label>
          <button type="button" className="crm-secondary-button" onClick={resetBrandPreferences}>
            Reset Branding Defaults
          </button>
        </article>
        <article>
          <h4>Brand Preview</h4>
          <div className="crm-brand-preview">
            <span className="crm-brand-mark" aria-hidden="true">
              {showBrandLogo ? (
                <Image
                  loader={passthroughImageLoader}
                  src={resolvedLogoUrl}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  onError={() => setLogoLoadErrored(true)}
                />
              ) : (
                <span>{brandInitials}</span>
              )}
            </span>
            <div>
              <strong>{brandPreferences.brandName}</strong>
              <p className="crm-muted">Tenant: {tenantContext.tenantSlug}</p>
              <p className="crm-muted">Domain: {tenantContext.tenantDomain}</p>
            </div>
          </div>
          <p className="crm-muted">
            Your logo and colors appear in navigation, header, footer, and key workflow surfaces for stronger brand recognition.
          </p>
        </article>
      </div>

      <div className="crm-panel-head" style={{ marginTop: '1.5rem' }}>
        <h3>Integrations</h3>
        <span className="crm-muted">Connect external services to enhance your CRM workflow.</span>
      </div>
      <div className="crm-settings-grid">
        <article>
          <h4>Google Account</h4>
          {googleStatus === null ? (
            <p className="crm-muted">Checking connection...</p>
          ) : googleStatus.connected ? (
            <div className="crm-integration-status-block">
              <div className="crm-integration-status-row">
                <span className="crm-integration-dot crm-integration-dot-connected" />
                <span>Connected</span>
              </div>
              {googleStatus.capabilities && (
                <div className="crm-integration-capabilities">
                  {googleStatus.capabilities.calendar && (
                    <span className="crm-chip">Calendar</span>
                  )}
                  {googleStatus.capabilities.gmail && (
                    <span className="crm-chip">Gmail</span>
                  )}
                </div>
              )}
              {googleStatus.connectedAt && (
                <p className="crm-muted">
                  Connected since {new Date(googleStatus.connectedAt).toLocaleDateString()}
                </p>
              )}
              <button
                type="button"
                className="crm-secondary-button crm-danger-button"
                onClick={handleGoogleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect Google'}
              </button>
            </div>
          ) : (
            <div>
              <p className="crm-muted">
                Connect your Google account to sync calendar events and send/view emails from the CRM.
              </p>
              <button
                type="button"
                className="crm-secondary-button"
                onClick={handleGoogleConnect}
              >
                Connect Google Account
              </button>
            </div>
          )}
        </article>
        <article>
          <h4>Calendar Sync</h4>
          <CalendarSync
            connected={googleStatus?.connected ?? false}
            onConnect={handleGoogleConnect}
            onDisconnect={handleGoogleDisconnect}
          />
        </article>
        <article>
          <h4>Gmail</h4>
          {googleStatus?.connected && googleStatus.capabilities?.gmail ? (
            <div>
              <div className="crm-integration-status-row">
                <span className="crm-integration-dot crm-integration-dot-connected" />
                <span>Gmail Active</span>
              </div>
              <p className="crm-muted">
                Send emails and view conversation threads directly from lead profiles.
              </p>
            </div>
          ) : (
            <div>
              <div className="crm-integration-status-row">
                <span className="crm-integration-dot" />
                <span>Not Connected</span>
              </div>
              <p className="crm-muted">
                Connect your Google account to send emails and view threads in the CRM.
              </p>
            </div>
          )}
        </article>
      </div>

      <div className="crm-panel-head" style={{ marginTop: '1.5rem' }}>
        <h3>Notifications</h3>
        <span className="crm-muted">Configure how and when you receive alerts.</span>
      </div>
      <div className="crm-settings-grid">
        <article>
          <NotificationPreferences
            prefs={notificationPrefs}
            permissionState={notificationPermission}
            onRequestPermission={onRequestNotificationPermission}
            onUpdatePrefs={onUpdateNotificationPrefs}
          />
        </article>
      </div>
    </section>
  );
}
