'use client';

import { useEffect, useState, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import type { TenantContext } from '@real-estate/types/tenant';
import type { CrmLead } from '@real-estate/types/crm';
import Image from 'next/image';
import { Moon, Sun } from 'lucide-react';
import type { AgentProfile, BrandPreferences } from '../../lib/crm-types';
import { normalizeHexColor, getBrandInitials } from '../../lib/crm-brand-theme';
import { passthroughImageLoader } from '../../lib/crm-formatters';
import { CalendarSync } from '../shared/CalendarSync';
import type { NotificationPrefs } from '../../lib/use-push-notifications';
import { NotificationPreferences } from '../shared/NotificationPreferences';
import { CommissionSettingsPanel } from './CommissionSettingsPanel';
import { AdSpendTracker } from '../shared/AdSpendTracker';
import { TeamRoster } from '../shared/TeamRoster';
import { AiWorkflowPanel } from '../shared/AiWorkflowPanel';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function resizeAndEncode(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          const ratio = Math.min(maxSize / w, maxSize / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

function HeadshotUpload({ headshotUrl, onChange }: { headshotUrl: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    if (file.size > MAX_FILE_SIZE) {
      setError('File must be under 2MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    try {
      const dataUrl = await resizeAndEncode(file, 300);
      onChange(dataUrl);
    } catch {
      setError('Failed to process image.');
    }
  }, [onChange]);

  return (
    <div className="crm-headshot-upload">
      <span className="crm-field-label">Headshot</span>
      <div
        className="crm-headshot-upload__dropzone"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('is-dragover'); }}
        onDragLeave={(e) => e.currentTarget.classList.remove('is-dragover')}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('is-dragover');
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {headshotUrl ? (
          <img src={headshotUrl} alt="Headshot preview" className="crm-headshot-upload__preview" />
        ) : (
          <span className="crm-headshot-upload__placeholder">Click or drag to upload</span>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="crm-headshot-upload__input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
      {headshotUrl && (
        <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => onChange('')}>
          Remove
        </button>
      )}
      {error && <span className="crm-field-error">{error}</span>}
      <button
        type="button"
        className="crm-btn crm-btn-ghost crm-btn-sm"
        onClick={() => setShowUrlFallback(!showUrlFallback)}
      >
        {showUrlFallback ? 'Hide URL input' : 'Or enter URL'}
      </button>
      {showUrlFallback && (
        <input
          type="url"
          className="crm-headshot-upload__url-input"
          value={headshotUrl.startsWith('data:') ? '' : headshotUrl}
          placeholder="https://example.com/headshot.jpg"
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

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
  agentProfile: AgentProfile;
  setAgentProfile: Dispatch<SetStateAction<AgentProfile>>;
  leads: CrmLead[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
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
  agentProfile,
  setAgentProfile,
  leads,
  theme,
  toggleTheme,
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
      <div className="crm-panel-head" style={{ marginTop: '0' }}>
        <h3>Personal Info</h3>
        <span className="crm-muted">Your agent profile — visible on profile cards and lead communications.</span>
      </div>
      <div className="crm-settings-grid">
        <article className="crm-settings-profile-section">
          <div className="crm-settings-profile-row">
            <div className="crm-settings-profile-avatar">
              {agentProfile.headshotUrl ? (
                <Image
                  loader={passthroughImageLoader}
                  src={agentProfile.headshotUrl}
                  alt={agentProfile.fullName || 'Agent headshot'}
                  width={80}
                  height={80}
                  unoptimized
                  style={{ borderRadius: '50%', objectFit: 'cover', width: 80, height: 80 }}
                />
              ) : (
                <span className="crm-profile-initials">{agentProfile.fullName ? getBrandInitials(agentProfile.fullName) : brandInitials}</span>
              )}
            </div>
            <div className="crm-settings-profile-stats">
              <div className="crm-profile-stat">
                <strong>{leads.length}</strong>
                <span>Total Leads</span>
              </div>
              <div className="crm-profile-stat">
                <strong>{leads.length > 0 ? `${Math.round((leads.filter((l) => l.status === 'won').length / leads.length) * 100)}%` : '0%'}</strong>
                <span>Win Rate</span>
              </div>
              <div className="crm-profile-stat">
                <strong>{leads.filter((l) => l.status === 'new' || l.status === 'qualified' || l.status === 'nurturing').length}</strong>
                <span>Active</span>
              </div>
            </div>
          </div>
          <label className="crm-field">
            Full Name
            <input
              type="text"
              value={agentProfile.fullName}
              placeholder="Jane Doe"
              onChange={(event) => setAgentProfile((prev) => ({ ...prev, fullName: event.target.value }))}
            />
          </label>
          <label className="crm-field">
            Email
            <input
              type="email"
              value={agentProfile.email}
              placeholder="jane@example.com"
              onChange={(event) => setAgentProfile((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label className="crm-field">
            Phone
            <input
              type="tel"
              value={agentProfile.phone}
              placeholder="(203) 555-0100"
              onChange={(event) => setAgentProfile((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </label>
          <label className="crm-field">
            Brokerage
            <input
              type="text"
              value={agentProfile.brokerage}
              placeholder="Luxury Properties Group"
              onChange={(event) => setAgentProfile((prev) => ({ ...prev, brokerage: event.target.value }))}
            />
          </label>
          <label className="crm-field">
            License Number
            <input
              type="text"
              value={agentProfile.licenseNumber}
              placeholder="RES.0123456"
              onChange={(event) => setAgentProfile((prev) => ({ ...prev, licenseNumber: event.target.value }))}
            />
          </label>
          <HeadshotUpload
            headshotUrl={agentProfile.headshotUrl}
            onChange={(url) => setAgentProfile((prev) => ({ ...prev, headshotUrl: url }))}
          />
          <label className="crm-field">
            Bio
            <textarea
              value={agentProfile.bio}
              placeholder="A brief description of your experience and specialties..."
              rows={3}
              onChange={(event) => setAgentProfile((prev) => ({ ...prev, bio: event.target.value }))}
            />
          </label>
        </article>
      </div>

      <div className="crm-panel-head" style={{ marginTop: '1.5rem' }}>
        <h3>Branding</h3>
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
          <div className="crm-settings-theme-toggle">
            <h4 style={{ marginTop: '1rem' }}>Appearance</h4>
            <button
              type="button"
              className="crm-secondary-button crm-settings-dark-mode-btn"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              <span>{theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}</span>
            </button>
          </div>
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
        <h3>Commissions</h3>
        <span className="crm-muted">Configure your default commission structure for transactions.</span>
      </div>
      <div className="crm-settings-grid">
        <article>
          <CommissionSettingsPanel tenantId={tenantContext.tenantId} />
        </article>
      </div>

      <div className="crm-panel-head" style={{ marginTop: '1.5rem' }}>
        <h3>Team</h3>
        <span className="crm-muted">Manage your team members and lead assignment rules.</span>
      </div>
      <div className="crm-settings-grid">
        <article>
          <TeamRoster />
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

      <div className="crm-panel-head" style={{ marginTop: '1.5rem' }}>
        <h3>AI Workflows</h3>
        <span className="crm-muted">Configure AI-powered automation for your pipeline.</span>
      </div>
      <div className="crm-settings-grid">
        <article>
          <AiWorkflowPanel />
        </article>
      </div>

      <details className="crm-settings-advanced" style={{ marginTop: '1.5rem' }}>
        <summary className="crm-panel-head" style={{ cursor: 'pointer' }}>
          <h3>Advanced: Ad Spend Tracking</h3>
        </summary>
        <div className="crm-settings-grid" style={{ marginTop: '0.5rem' }}>
          <article>
            <AdSpendTracker />
          </article>
        </div>
      </details>
    </section>
  );
}
