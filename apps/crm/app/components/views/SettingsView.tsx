import type { Dispatch, SetStateAction } from 'react';
import type { TenantContext } from '@real-estate/types/tenant';
import Image from 'next/image';
import type { BrandPreferences } from '../../lib/crm-types';
import { normalizeHexColor } from '../../lib/crm-brand-theme';
import { passthroughImageLoader } from '../../lib/crm-formatters';

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
}: SettingsViewProps) {
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
    </section>
  );
}
