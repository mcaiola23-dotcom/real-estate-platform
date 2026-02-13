'use client';

import { useMemo, useState, type FormEvent } from 'react';

import type { ControlPlaneTenantSnapshot } from '@real-estate/types/control-plane';

interface ControlPlaneWorkspaceProps {
  initialSnapshots: ControlPlaneTenantSnapshot[];
  hasClerkKey: boolean;
}

function toCsv(values: string[]): string {
  return values.join(', ');
}

function fromCsv(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function buildPlanDraftMap(snapshots: ControlPlaneTenantSnapshot[]): Record<string, string> {
  return snapshots.reduce<Record<string, string>>((result, snapshot) => {
    result[snapshot.tenant.id] = snapshot.settings.planCode;
    return result;
  }, {});
}

function buildFlagsDraftMap(snapshots: ControlPlaneTenantSnapshot[]): Record<string, string> {
  return snapshots.reduce<Record<string, string>>((result, snapshot) => {
    result[snapshot.tenant.id] = toCsv(snapshot.settings.featureFlags);
    return result;
  }, {});
}

export function ControlPlaneWorkspace({ initialSnapshots, hasClerkKey }: ControlPlaneWorkspaceProps) {
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryDomain, setPrimaryDomain] = useState('');
  const [planCode, setPlanCode] = useState('starter');
  const [featureFlags, setFeatureFlags] = useState('');

  const [domainDraftByTenant, setDomainDraftByTenant] = useState<Record<string, string>>({});
  const [planDraftByTenant, setPlanDraftByTenant] = useState<Record<string, string>>(() => buildPlanDraftMap(initialSnapshots));
  const [flagsDraftByTenant, setFlagsDraftByTenant] = useState<Record<string, string>>(() => buildFlagsDraftMap(initialSnapshots));

  const totalTenants = useMemo(() => snapshots.length, [snapshots]);

  async function refresh() {
    const response = await fetch('/api/tenants', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Unable to refresh tenant list.');
    }

    const json = (await response.json()) as { tenants: ControlPlaneTenantSnapshot[] };
    setSnapshots(json.tenants);
    setPlanDraftByTenant(buildPlanDraftMap(json.tenants));
    setFlagsDraftByTenant(buildFlagsDraftMap(json.tenants));
  }

  async function createTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          primaryDomain,
          planCode,
          featureFlags: fromCsv(featureFlags),
        }),
      });

      if (!response.ok) {
        throw new Error('Tenant creation failed.');
      }

      setName('');
      setSlug('');
      setPrimaryDomain('');
      setPlanCode('starter');
      setFeatureFlags('');
      await refresh();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unknown tenant provisioning error.');
    } finally {
      setLoading(false);
    }
  }

  async function addDomain(tenantId: string) {
    const hostname = (domainDraftByTenant[tenantId] ?? '').trim();
    if (!hostname) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname }),
      });

      if (!response.ok) {
        throw new Error('Domain add failed.');
      }

      setDomainDraftByTenant((prev) => ({ ...prev, [tenantId]: '' }));
      await refresh();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unknown domain add error.');
    } finally {
      setLoading(false);
    }
  }

  async function patchDomain(
    tenantId: string,
    domainId: string,
    updates: {
      isPrimary?: boolean;
      isVerified?: boolean;
    }
  ) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/domains/${domainId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Domain status update failed.');
      }

      await refresh();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unknown domain update error.');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(tenantId: string) {
    const nextPlanCode = (planDraftByTenant[tenantId] ?? 'starter').trim() || 'starter';
    const nextFeatureFlags = flagsDraftByTenant[tenantId] ?? '';

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: nextPlanCode,
          featureFlags: fromCsv(nextFeatureFlags),
        }),
      });

      if (!response.ok) {
        throw new Error('Settings update failed.');
      }

      await refresh();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unknown settings update error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-shell">
      <section className="admin-card">
        <h1>Control Plane</h1>
        <p className="admin-muted">Tenant provisioning, domain lifecycle, and plan/feature operations dashboard.</p>
        <div className="admin-row">
          <span className="admin-chip">Tenants: {totalTenants}</span>
          {hasClerkKey ? <span className="admin-chip">Clerk auth enabled</span> : <span className="admin-chip">Clerk key missing</span>}
        </div>
      </section>

      <section className="admin-card">
        <h2>Provision Tenant</h2>
        <form className="admin-grid" onSubmit={createTenant}>
          <label className="admin-field">
            Tenant Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="admin-field">
            Tenant Slug
            <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="sunset-realty" required />
          </label>
          <label className="admin-field">
            Primary Domain
            <input
              value={primaryDomain}
              onChange={(event) => setPrimaryDomain(event.target.value)}
              placeholder="sunset.localhost"
              required
            />
          </label>
          <label className="admin-field">
            Plan
            <input value={planCode} onChange={(event) => setPlanCode(event.target.value)} />
          </label>
          <label className="admin-field">
            Feature Flags (comma separated)
            <input value={featureFlags} onChange={(event) => setFeatureFlags(event.target.value)} placeholder="crm_automation,beta_theme" />
          </label>
          <div className="admin-row">
            <button type="submit" disabled={loading}>
              Provision Tenant
            </button>
          </div>
        </form>
        {error ? <p className="admin-error">{error}</p> : null}
      </section>

      <section className="admin-card">
        <h2>Tenants</h2>
        {snapshots.length === 0 ? (
          <p className="admin-muted">No tenants available.</p>
        ) : (
          <ul className="admin-list">
            {snapshots.map((snapshot) => (
              <li key={snapshot.tenant.id} className="admin-list-item">
                <div className="admin-row">
                  <strong>{snapshot.tenant.name}</strong>
                  <span className="admin-chip">{snapshot.tenant.id}</span>
                  <span className="admin-chip">{snapshot.tenant.slug}</span>
                  <span className="admin-chip">{snapshot.tenant.status}</span>
                </div>

                <div className="admin-grid">
                  <label className="admin-field">
                    Plan Code
                    <input
                      value={planDraftByTenant[snapshot.tenant.id] ?? snapshot.settings.planCode}
                      onChange={(event) => {
                        setPlanDraftByTenant((prev) => ({ ...prev, [snapshot.tenant.id]: event.target.value }));
                      }}
                    />
                  </label>
                  <label className="admin-field">
                    Feature Flags (csv)
                    <input
                      value={flagsDraftByTenant[snapshot.tenant.id] ?? toCsv(snapshot.settings.featureFlags)}
                      onChange={(event) => {
                        setFlagsDraftByTenant((prev) => ({ ...prev, [snapshot.tenant.id]: event.target.value }));
                      }}
                    />
                  </label>
                  <div className="admin-row">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        void saveSettings(snapshot.tenant.id);
                      }}
                    >
                      Save Settings
                    </button>
                  </div>
                </div>

                <div className="admin-grid">
                  {snapshot.domains.map((domain) => (
                    <article key={domain.id} className="admin-card">
                      <div className="admin-row">
                        <strong>{domain.hostname}</strong>
                        {domain.isPrimary ? <span className="admin-chip">primary</span> : null}
                        {domain.isVerified ? <span className="admin-chip">verified</span> : <span className="admin-chip">unverified</span>}
                      </div>
                      <div className="admin-row">
                        <button
                          type="button"
                          disabled={loading || domain.isVerified}
                          onClick={() => {
                            void patchDomain(snapshot.tenant.id, domain.id, { isVerified: true });
                          }}
                        >
                          Mark Verified
                        </button>
                        <button
                          type="button"
                          disabled={loading || domain.isPrimary}
                          onClick={() => {
                            void patchDomain(snapshot.tenant.id, domain.id, { isPrimary: true });
                          }}
                        >
                          Set Primary
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="admin-row">
                  <label className="admin-inline-field">
                    Add Domain
                    <input
                      value={domainDraftByTenant[snapshot.tenant.id] ?? ''}
                      onChange={(event) => {
                        setDomainDraftByTenant((prev) => ({ ...prev, [snapshot.tenant.id]: event.target.value }));
                      }}
                      placeholder="new-domain.localhost"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={loading || (domainDraftByTenant[snapshot.tenant.id] ?? '').trim().length === 0}
                    onClick={() => {
                      void addDomain(snapshot.tenant.id);
                    }}
                  >
                    Attach Domain
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
