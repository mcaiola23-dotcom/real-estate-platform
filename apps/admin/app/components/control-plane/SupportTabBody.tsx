import type {
  ControlPlaneTenantSnapshot,
  TenantSupportDiagnosticStatus,
  TenantSupportDiagnosticsSummary,
  TenantSupportRemediationAction,
} from '@real-estate/types/control-plane';

interface SupportTabBodyProps {
  selectedTenant: ControlPlaneTenantSnapshot | null;
  selectedTenantDiagnostics: TenantSupportDiagnosticsSummary | null;
  diagnosticsError: string | null;
  diagnosticsLoading: boolean;
  diagnosticsActionBusy: boolean;
  busy: boolean;
  formatTimestamp: (value: string) => string;
  diagnosticStatusLabel: (status: TenantSupportDiagnosticStatus) => string;
  diagnosticStatusChipClass: (status: TenantSupportDiagnosticStatus) => string;
  onRunDiagnosticRemediation: (tenantId: string, action: TenantSupportRemediationAction) => void;
}

export function SupportTabBody({
  selectedTenant,
  selectedTenantDiagnostics,
  diagnosticsError,
  diagnosticsLoading,
  diagnosticsActionBusy,
  busy,
  formatTimestamp,
  diagnosticStatusLabel,
  diagnosticStatusChipClass,
  onRunDiagnosticRemediation,
}: SupportTabBodyProps) {
  if (!selectedTenant) {
    return <p className="admin-muted">Select a tenant to run auth/domain/ingestion diagnostics.</p>;
  }

  return (
    <>
      {diagnosticsError ? <p className="admin-error">{diagnosticsError}</p> : null}
      {diagnosticsLoading && !selectedTenantDiagnostics ? <p className="admin-muted">Loading diagnostics...</p> : null}

      {selectedTenantDiagnostics ? (
        <>
          <div className="admin-row">
            <span className={`admin-chip ${diagnosticStatusChipClass(selectedTenantDiagnostics.overallStatus)}`}>
              overall {diagnosticStatusLabel(selectedTenantDiagnostics.overallStatus)}
            </span>
            <span className="admin-chip">ok: {selectedTenantDiagnostics.counts.ok}</span>
            <span className="admin-chip">warning: {selectedTenantDiagnostics.counts.warning}</span>
            <span className="admin-chip">failed: {selectedTenantDiagnostics.counts.failed}</span>
            <span className="admin-chip">checked: {formatTimestamp(selectedTenantDiagnostics.generatedAt)}</span>
          </div>

          <div className="admin-diagnostics-grid">
            {selectedTenantDiagnostics.checks.map((check) => (
              <article key={check.id} className="admin-observability-panel">
                <div className="admin-row admin-space-between">
                  <strong>{check.label}</strong>
                  <span className={`admin-chip ${diagnosticStatusChipClass(check.status)}`}>
                    {diagnosticStatusLabel(check.status)}
                  </span>
                </div>
                <p className="admin-muted">{check.detail}</p>
                <div className="admin-row">
                  <span className="admin-chip">{check.category}</span>
                </div>
                {check.remediation.length > 0 ? (
                  <div className="admin-row">
                    {check.remediation.map((remediation) => (
                      <button
                        key={`${check.id}-${remediation.action}`}
                        type="button"
                        className="admin-secondary"
                        disabled={busy || diagnosticsActionBusy}
                        onClick={() => {
                          onRunDiagnosticRemediation(selectedTenant.tenant.id, remediation.action);
                        }}
                        title={remediation.detail}
                      >
                        {remediation.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
