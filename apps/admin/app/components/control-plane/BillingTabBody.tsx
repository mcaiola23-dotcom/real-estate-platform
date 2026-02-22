import type { ReactNode } from 'react';

import type {
  ControlPlaneAdminAuditStatus,
  ControlPlaneTenantSnapshot,
  TenantBillingPaymentStatus,
  TenantBillingSubscription,
  TenantBillingSubscriptionStatus,
} from '@real-estate/types/control-plane';

interface BillingDraftLike {
  planCode: string;
  status: TenantBillingSubscriptionStatus;
  paymentStatus: TenantBillingPaymentStatus;
  billingProvider: string;
  billingCustomerId: string;
  billingSubscriptionId: string;
  trialEndsAt: string;
  currentPeriodEndsAt: string;
  cancelAtPeriodEnd: boolean;
  syncEntitlements: boolean;
}

interface BillingDriftSignalLike {
  auditEventId: string;
  createdAt: string;
  status: ControlPlaneAdminAuditStatus;
  mode: string;
  missingCount: number;
  extraCount: number;
  missingFlags: string[];
  extraFlags: string[];
  duplicate: boolean | null;
  applied: boolean | null;
  requestId: string | null;
  error: string | null;
}

interface BillingPlanOptionLike {
  code: string;
  label: string;
}

interface BillingTabBodyProps {
  selectedTenant: ControlPlaneTenantSnapshot | null;
  selectedTenantBilling: TenantBillingSubscription | null;
  selectedTenantBillingDraft: BillingDraftLike | null;
  selectedTenantBillingDriftSignals: BillingDriftSignalLike[];
  billingLoading: boolean;
  billingDriftLoading: boolean;
  billingDriftError: string | null;
  busy: boolean;
  settingsEditable: boolean;
  planOptions: BillingPlanOptionLike[];
  billingSubscriptionStatusOptions: TenantBillingSubscriptionStatus[];
  billingPaymentStatusOptions: TenantBillingPaymentStatus[];
  entitlementDriftHelp: ReactNode;
  formatTimestamp: (value: string) => string;
  setBillingDraftField: (tenantId: string, field: keyof BillingDraftLike, value: BillingDraftLike[keyof BillingDraftLike]) => void;
  onLoadBillingDriftSignals: (tenantId: string) => void;
  onApplyBillingDriftAuditPreset: (tenantId: string) => void;
  onApplyBillingDriftRemediation: (tenantId: string, signal: BillingDriftSignalLike, mode: 'missing' | 'extra' | 'all') => void;
  onSaveBillingSubscription: (tenantId: string) => void;
}

export function BillingTabBody({
  selectedTenant,
  selectedTenantBilling,
  selectedTenantBillingDraft,
  selectedTenantBillingDriftSignals,
  billingLoading,
  billingDriftLoading,
  billingDriftError,
  busy,
  settingsEditable,
  planOptions,
  billingSubscriptionStatusOptions,
  billingPaymentStatusOptions,
  entitlementDriftHelp,
  formatTimestamp,
  setBillingDraftField,
  onLoadBillingDriftSignals,
  onApplyBillingDriftAuditPreset,
  onApplyBillingDriftRemediation,
  onSaveBillingSubscription,
}: BillingTabBodyProps) {
  if (!selectedTenant) {
    return <p className="admin-muted">Select a tenant to manage plan transitions, billing status, and entitlement sync.</p>;
  }

  if (!selectedTenantBillingDraft) {
    return <p className="admin-muted">{billingLoading ? 'Loading billing details...' : 'No billing details loaded yet.'}</p>;
  }

  return (
    <>
      <div className="admin-row">
        <span className="admin-chip">{selectedTenant.tenant.name}</span>
        {selectedTenantBilling ? <span className="admin-chip">subscription: {selectedTenantBilling.status}</span> : null}
        {selectedTenantBilling ? <span className="admin-chip">payment: {selectedTenantBilling.paymentStatus}</span> : null}
        <span className={`admin-chip ${selectedTenantBillingDriftSignals.length > 0 ? 'admin-chip-warn' : 'admin-chip-ok'}`}>
          entitlement drift: {selectedTenantBillingDriftSignals.length}
        </span>
      </div>

      <div className="admin-grid">
        <label className="admin-field">
          Plan Code
          <select
            value={selectedTenantBillingDraft.planCode}
            disabled={!settingsEditable || busy}
            onChange={(event) => {
              setBillingDraftField(selectedTenant.tenant.id, 'planCode', event.target.value);
            }}
          >
            {planOptions.map((plan) => (
              <option key={plan.code} value={plan.code}>
                {plan.label} ({plan.code})
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          Subscription Status
          <select
            value={selectedTenantBillingDraft.status}
            disabled={!settingsEditable || busy}
            onChange={(event) => {
              setBillingDraftField(selectedTenant.tenant.id, 'status', event.target.value as TenantBillingSubscriptionStatus);
            }}
          >
            {billingSubscriptionStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          Payment Status
          <select
            value={selectedTenantBillingDraft.paymentStatus}
            disabled={!settingsEditable || busy}
            onChange={(event) => {
              setBillingDraftField(selectedTenant.tenant.id, 'paymentStatus', event.target.value as TenantBillingPaymentStatus);
            }}
          >
            {billingPaymentStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-grid">
        <label className="admin-field">
          Billing Provider
          <input
            value={selectedTenantBillingDraft.billingProvider}
            disabled={!settingsEditable || busy}
            onChange={(event) => {
              setBillingDraftField(selectedTenant.tenant.id, 'billingProvider', event.target.value);
            }}
            placeholder="manual or stripe"
          />
        </label>
        <label className="admin-field">
          Customer ID
          <input
            value={selectedTenantBillingDraft.billingCustomerId}
            disabled={!settingsEditable || busy}
            onChange={(event) => {
              setBillingDraftField(selectedTenant.tenant.id, 'billingCustomerId', event.target.value);
            }}
            placeholder="cus_xxx"
          />
        </label>
        <label className="admin-field">
          Subscription ID
          <input
            value={selectedTenantBillingDraft.billingSubscriptionId}
            disabled={!settingsEditable || busy}
            onChange={(event) => {
              setBillingDraftField(selectedTenant.tenant.id, 'billingSubscriptionId', event.target.value);
            }}
            placeholder="sub_xxx"
          />
        </label>
      </div>

      <div className="admin-grid">
        <label className="admin-field">
          Trial Ends
          <input
            type="date"
            value={selectedTenantBillingDraft.trialEndsAt}
            disabled={!settingsEditable || busy}
            onChange={(event) => {
              setBillingDraftField(selectedTenant.tenant.id, 'trialEndsAt', event.target.value);
            }}
          />
        </label>
        <label className="admin-field">
          Current Period Ends
          <input
            type="date"
            value={selectedTenantBillingDraft.currentPeriodEndsAt}
            disabled={!settingsEditable || busy}
            onChange={(event) => {
              setBillingDraftField(selectedTenant.tenant.id, 'currentPeriodEndsAt', event.target.value);
            }}
          />
        </label>
        <label className="admin-inline-field admin-inline-toggle admin-billing-toggle">
          <input
            type="checkbox"
            checked={selectedTenantBillingDraft.cancelAtPeriodEnd}
            disabled={!settingsEditable || busy}
            onChange={(event) => {
              setBillingDraftField(selectedTenant.tenant.id, 'cancelAtPeriodEnd', event.target.checked);
            }}
          />
          Cancel at period end
        </label>
      </div>

      <label className="admin-inline-field admin-inline-toggle admin-billing-toggle">
        <input
          type="checkbox"
          checked={selectedTenantBillingDraft.syncEntitlements}
          disabled={!settingsEditable || busy}
          onChange={(event) => {
            setBillingDraftField(selectedTenant.tenant.id, 'syncEntitlements', event.target.checked);
          }}
        />
        Sync entitlement flags from current settings draft when saving plan transition
      </label>

      <section className="admin-billing-drift-panel">
        <div className="admin-row admin-space-between">
          <strong>
            Entitlement Drift Triage {entitlementDriftHelp}
          </strong>
          <div className="admin-row">
            <button
              type="button"
              className="admin-secondary"
              disabled={busy || billingDriftLoading}
              onClick={() => {
                onLoadBillingDriftSignals(selectedTenant.tenant.id);
              }}
            >
              {billingDriftLoading ? 'Refreshing...' : 'Refresh Drift Signals'}
            </button>
            <button
              type="button"
              className="admin-secondary"
              disabled={busy}
              onClick={() => {
                onApplyBillingDriftAuditPreset(selectedTenant.tenant.id);
              }}
            >
              Open in Audit Timeline
            </button>
          </div>
        </div>
        <p className="admin-muted">
          Drift compares provider entitlement flags against persisted tenant settings. Investigate and remediate
          missing/extra flag mismatches before billing escalations.
        </p>
        {billingDriftError ? <p className="admin-error">{billingDriftError}</p> : null}
        {billingDriftLoading ? <p className="admin-muted">Loading entitlement drift signals...</p> : null}
        {!billingDriftLoading && selectedTenantBillingDriftSignals.length === 0 ? (
          <p className="admin-muted">No entitlement drift signals detected for recent billing sync events.</p>
        ) : null}
        {selectedTenantBillingDriftSignals.length > 0 ? (
          <ul className="admin-billing-drift-list">
            {selectedTenantBillingDriftSignals.slice(0, 5).map((signal) => (
              <li key={signal.auditEventId} className="admin-billing-drift-item">
                <div className="admin-row admin-space-between">
                  <span className="admin-chip">{formatTimestamp(signal.createdAt)}</span>
                  <span className={`admin-chip admin-chip-status-${signal.status}`}>{signal.status}</span>
                </div>
                <div className="admin-row">
                  <span className="admin-chip admin-chip-warn">mode: {signal.mode}</span>
                  <span className="admin-chip">missing: {signal.missingCount}</span>
                  <span className="admin-chip">extra: {signal.extraCount}</span>
                  {signal.duplicate !== null ? <span className="admin-chip">duplicate: {signal.duplicate ? 'yes' : 'no'}</span> : null}
                  {signal.applied !== null ? <span className="admin-chip">applied: {signal.applied ? 'yes' : 'no'}</span> : null}
                  {signal.requestId ? <span className="admin-chip">request: {signal.requestId}</span> : null}
                </div>
                {signal.missingFlags.length > 0 ? (
                  <p className="admin-muted">Missing provider flags: {signal.missingFlags.join(', ')}</p>
                ) : null}
                {signal.extraFlags.length > 0 ? (
                  <p className="admin-muted">Extra tenant flags: {signal.extraFlags.join(', ')}</p>
                ) : null}
                {signal.error ? <p className="admin-error">{signal.error}</p> : null}
                <div className="admin-row">
                  <button
                    type="button"
                    className="admin-secondary"
                    disabled={busy || !settingsEditable || signal.missingFlags.length === 0}
                    onClick={() => {
                      onApplyBillingDriftRemediation(selectedTenant.tenant.id, signal, 'missing');
                    }}
                  >
                    Add Missing Flags
                  </button>
                  <button
                    type="button"
                    className="admin-secondary"
                    disabled={busy || !settingsEditable || signal.extraFlags.length === 0}
                    onClick={() => {
                      onApplyBillingDriftRemediation(selectedTenant.tenant.id, signal, 'extra');
                    }}
                  >
                    Remove Extra Flags
                  </button>
                  <button
                    type="button"
                    className="admin-secondary"
                    disabled={busy || !settingsEditable || (signal.missingFlags.length === 0 && signal.extraFlags.length === 0)}
                    onClick={() => {
                      onApplyBillingDriftRemediation(selectedTenant.tenant.id, signal, 'all');
                    }}
                  >
                    Apply Both
                  </button>
                </div>
                <p className="admin-muted admin-audit-guidance">
                  Quick actions update the Settings draft and arm Billing entitlement sync. Save Settings, then Save Billing
                  Workflow to persist corrections.
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="admin-row">
        <button
          type="button"
          disabled={busy || !settingsEditable || billingLoading}
          onClick={() => {
            onSaveBillingSubscription(selectedTenant.tenant.id);
          }}
        >
          Save Billing Workflow
        </button>
      </div>

      {!settingsEditable ? (
        <p className="admin-warning">Billing mutation controls are disabled while tenant/settings status is archived.</p>
      ) : null}
    </>
  );
}
