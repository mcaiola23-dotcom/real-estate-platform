import type { Dispatch, SetStateAction } from 'react';

import type {
  ControlPlaneAdminAuditAction,
  ControlPlaneAdminAuditEvent,
  ControlPlaneAdminAuditStatus,
  ControlPlaneTenantSnapshot,
} from '@real-estate/types/control-plane';

interface AuditRequestAttributionLike {
  requestId: string | null;
  requestMethod: string | null;
  requestPath: string | null;
}

interface AuditChangeDetailLike {
  field: string;
  before: string;
  after: string;
}

interface AuditDriftSummaryLike {
  mode: string;
  missingCount: number;
  extraCount: number;
}

interface AuditTabBodyProps {
  snapshots: ControlPlaneTenantSnapshot[];
  globalAuditScope: string;
  auditStatusOptions: ControlPlaneAdminAuditStatus[];
  auditActionOptions: ControlPlaneAdminAuditAction[];
  auditActorRoleFilterOptions: string[];
  auditChangedFieldOptions: string[];
  selectedAuditTenantId: string;
  selectedAuditStatus: string;
  selectedAuditAction: string;
  selectedAuditActorRole: string;
  selectedAuditActorId: string;
  selectedAuditRequestId: string;
  selectedAuditChangedField: string;
  selectedAuditFromDate: string;
  selectedAuditToDate: string;
  selectedAuditLimit: number;
  selectedAuditSearch: string;
  selectedAuditErrorsOnly: boolean;
  setSelectedAuditTenantId: Dispatch<SetStateAction<string>>;
  setSelectedAuditStatus: Dispatch<SetStateAction<string>>;
  setSelectedAuditAction: Dispatch<SetStateAction<string>>;
  setSelectedAuditActorRole: Dispatch<SetStateAction<string>>;
  setSelectedAuditActorId: Dispatch<SetStateAction<string>>;
  setSelectedAuditRequestId: Dispatch<SetStateAction<string>>;
  setSelectedAuditChangedField: Dispatch<SetStateAction<string>>;
  setSelectedAuditFromDate: Dispatch<SetStateAction<string>>;
  setSelectedAuditToDate: Dispatch<SetStateAction<string>>;
  setSelectedAuditLimit: Dispatch<SetStateAction<number>>;
  setSelectedAuditSearch: Dispatch<SetStateAction<string>>;
  setSelectedAuditErrorsOnly: Dispatch<SetStateAction<boolean>>;
  parseAuditLimit: (value: string) => number;
  auditError: string | null;
  auditLoading: boolean;
  auditEvents: ControlPlaneAdminAuditEvent[];
  tenantNameById: Record<string, string>;
  formatTimestamp: (value: string) => string;
  getAuditRequestAttribution: (event: ControlPlaneAdminAuditEvent) => AuditRequestAttributionLike;
  getAuditChangeDetails: (event: ControlPlaneAdminAuditEvent) => AuditChangeDetailLike[];
  getBillingDriftSummaryForAuditRow: (event: ControlPlaneAdminAuditEvent) => AuditDriftSummaryLike | null;
}

export function AuditTabBody({
  snapshots,
  globalAuditScope,
  auditStatusOptions,
  auditActionOptions,
  auditActorRoleFilterOptions,
  auditChangedFieldOptions,
  selectedAuditTenantId,
  selectedAuditStatus,
  selectedAuditAction,
  selectedAuditActorRole,
  selectedAuditActorId,
  selectedAuditRequestId,
  selectedAuditChangedField,
  selectedAuditFromDate,
  selectedAuditToDate,
  selectedAuditLimit,
  selectedAuditSearch,
  selectedAuditErrorsOnly,
  setSelectedAuditTenantId,
  setSelectedAuditStatus,
  setSelectedAuditAction,
  setSelectedAuditActorRole,
  setSelectedAuditActorId,
  setSelectedAuditRequestId,
  setSelectedAuditChangedField,
  setSelectedAuditFromDate,
  setSelectedAuditToDate,
  setSelectedAuditLimit,
  setSelectedAuditSearch,
  setSelectedAuditErrorsOnly,
  parseAuditLimit,
  auditError,
  auditLoading,
  auditEvents,
  tenantNameById,
  formatTimestamp,
  getAuditRequestAttribution,
  getAuditChangeDetails,
  getBillingDriftSummaryForAuditRow,
}: AuditTabBodyProps) {
  return (
    <>
      <div className="admin-audit-filter-grid">
        <label className="admin-field">
          Tenant Scope
          <select
            value={selectedAuditTenantId}
            onChange={(event) => {
              setSelectedAuditTenantId(event.target.value);
            }}
          >
            <option value={globalAuditScope}>Global Recent Feed</option>
            {snapshots.map((snapshot) => (
              <option key={snapshot.tenant.id} value={snapshot.tenant.id}>
                {snapshot.tenant.name} ({snapshot.tenant.slug})
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          Status
          <select
            value={selectedAuditStatus}
            onChange={(event) => {
              setSelectedAuditStatus(event.target.value);
            }}
          >
            <option value="all">all</option>
            {auditStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          Action
          <select
            value={selectedAuditAction}
            onChange={(event) => {
              setSelectedAuditAction(event.target.value);
            }}
          >
            <option value="all">all</option>
            {auditActionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          Actor Role
          <select
            value={selectedAuditActorRole}
            onChange={(event) => {
              setSelectedAuditActorRole(event.target.value);
            }}
          >
            <option value="all">all</option>
            {auditActorRoleFilterOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          Actor ID
          <input
            type="text"
            value={selectedAuditActorId}
            onChange={(event) => {
              setSelectedAuditActorId(event.target.value);
            }}
            placeholder="contains actor id"
          />
        </label>

        <label className="admin-field">
          Request ID
          <input
            type="text"
            value={selectedAuditRequestId}
            onChange={(event) => {
              setSelectedAuditRequestId(event.target.value);
            }}
            placeholder="contains request id"
          />
        </label>

        <label className="admin-field">
          Changed Field
          <input
            type="text"
            value={selectedAuditChangedField}
            list="audit-changed-fields"
            onChange={(event) => {
              setSelectedAuditChangedField(event.target.value);
            }}
            placeholder="planCode / featureFlags / ..."
          />
          <datalist id="audit-changed-fields">
            {auditChangedFieldOptions.map((field) => (
              <option key={field} value={field} />
            ))}
          </datalist>
        </label>

        <label className="admin-field">
          From
          <input
            type="date"
            value={selectedAuditFromDate}
            onChange={(event) => {
              setSelectedAuditFromDate(event.target.value);
            }}
          />
        </label>

        <label className="admin-field">
          To
          <input
            type="date"
            value={selectedAuditToDate}
            onChange={(event) => {
              setSelectedAuditToDate(event.target.value);
            }}
          />
        </label>

        <label className="admin-field">
          Limit
          <input
            type="number"
            min={1}
            max={200}
            value={selectedAuditLimit}
            onChange={(event) => {
              setSelectedAuditLimit(parseAuditLimit(event.target.value));
            }}
          />
        </label>

        <label className="admin-field">
          Search
          <input
            type="text"
            value={selectedAuditSearch}
            onChange={(event) => {
              setSelectedAuditSearch(event.target.value);
            }}
            placeholder="action, tenant, path, error..."
          />
        </label>

        <label className="admin-inline-field admin-audit-toggle">
          <input
            type="checkbox"
            checked={selectedAuditErrorsOnly}
            onChange={(event) => {
              setSelectedAuditErrorsOnly(event.target.checked);
            }}
          />
          Show errors only
        </label>
      </div>

      {auditError ? <p className="admin-error">{auditError}</p> : null}
      {auditLoading ? <p className="admin-muted">Loading audit timeline...</p> : null}
      {!auditLoading && auditEvents.length === 0 ? <p className="admin-muted">No audit events found.</p> : null}

      {auditEvents.length > 0 ? (
        <ul className="admin-list">
          {auditEvents.map((event) => (
            <li key={event.id} className="admin-list-item">
              {(() => {
                const requestAttribution = getAuditRequestAttribution(event);
                const changeDetails = getAuditChangeDetails(event);
                const billingDriftSummary = getBillingDriftSummaryForAuditRow(event);

                return (
                  <>
                    <div className="admin-row admin-space-between">
                      <strong>{event.action}</strong>
                      <span className={`admin-chip admin-chip-status-${event.status}`}>{event.status}</span>
                    </div>
                    <div className="admin-row">
                      <span className="admin-chip">{formatTimestamp(event.createdAt)}</span>
                      <span className="admin-chip">role: {event.actorRole}</span>
                      <span className="admin-chip">actor: {event.actorId ?? 'unknown'}</span>
                      <span className="admin-chip">
                        tenant: {event.tenantId ? tenantNameById[event.tenantId] ?? event.tenantId : 'n/a'}
                      </span>
                      {event.domainId ? <span className="admin-chip">domain: {event.domainId}</span> : null}
                    </div>
                    {billingDriftSummary ? (
                      <div className="admin-row">
                        <span className="admin-chip admin-chip-warn">entitlement drift detected</span>
                        <span className="admin-chip">mode: {billingDriftSummary.mode}</span>
                        <span className="admin-chip">missing: {billingDriftSummary.missingCount}</span>
                        <span className="admin-chip">extra: {billingDriftSummary.extraCount}</span>
                      </div>
                    ) : null}
                    <div className="admin-row">
                      <span className="admin-chip">request: {requestAttribution.requestId ?? event.id}</span>
                      {requestAttribution.requestMethod ? (
                        <span className="admin-chip">method: {requestAttribution.requestMethod}</span>
                      ) : null}
                      {requestAttribution.requestPath ? (
                        <span className="admin-chip">path: {requestAttribution.requestPath}</span>
                      ) : null}
                    </div>
                    {changeDetails.length > 0 ? (
                      <details className="admin-audit-diff">
                        <summary>Change detail ({changeDetails.length})</summary>
                        <ul className="admin-audit-diff-list">
                          {changeDetails.map((change) => (
                            <li key={`${event.id}-${change.field}`}>
                              <strong>{change.field}</strong>
                              <span>
                                {change.before} {'->'} {change.after}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                    {event.error ? <p className="admin-error">{event.error}</p> : null}
                  </>
                );
              })()}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
