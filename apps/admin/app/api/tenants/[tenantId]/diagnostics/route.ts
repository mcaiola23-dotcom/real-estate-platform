import { NextResponse } from 'next/server';

import {
  getTenantSupportDiagnosticsSummary,
  runTenantSupportRemediationAction,
} from '@real-estate/db/control-plane';
import type { TenantSupportRemediationAction } from '@real-estate/types/control-plane';
import {
  buildAuditRequestMetadata,
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../../lib/admin-access';

interface TenantDiagnosticsRouteDependencies {
  getTenantSupportDiagnosticsSummary: typeof getTenantSupportDiagnosticsSummary;
  runTenantSupportRemediationAction: typeof runTenantSupportRemediationAction;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: TenantDiagnosticsRouteDependencies = {
  getTenantSupportDiagnosticsSummary,
  runTenantSupportRemediationAction,
};

function parseRemediationAction(value: unknown): TenantSupportRemediationAction | null {
  if (
    value === 'domain.mark_primary_verified' ||
    value === 'ingestion.requeue_dead_letters' ||
    value === 'ingestion.schedule_pending_now'
  ) {
    return value;
  }

  return null;
}

export function createDiagnosticsGetHandler(dependencies: TenantDiagnosticsRouteDependencies = defaultDependencies) {
  return async function GET(_request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;

    try {
      const summary = await dependencies.getTenantSupportDiagnosticsSummary(tenantId);
      return NextResponse.json({ ok: true, summary });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Unable to load tenant diagnostics.' },
        { status: 404 }
      );
    }
  };
}

export function createDiagnosticsPostHandler(dependencies: TenantDiagnosticsRouteDependencies = defaultDependencies) {
  return async function POST(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };
    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.diagnostics.remediate', tenantId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    let body: { action?: unknown } | null = null;

    try {
      body = (await request.json()) as { action?: unknown };
      const action = parseRemediationAction(body.action);
      if (!action) {
        return NextResponse.json({ ok: false, error: 'Valid remediation action is required.' }, { status: 400 });
      }

      const result = await dependencies.runTenantSupportRemediationAction(tenantId, action);
      const summary = await dependencies.getTenantSupportDiagnosticsSummary(tenantId);

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.diagnostics.remediate',
          actor: access.actor,
          status: result.ok ? 'succeeded' : 'failed',
          tenantId,
          error: result.ok ? undefined : result.message,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              remediationAction: { after: action },
              ok: { after: result.ok },
              changedCount: { after: result.changedCount ?? 0 },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json(
        {
          ok: result.ok,
          result,
          summary,
          error: result.ok ? null : result.message,
        },
        { status: result.ok ? 200 : 400 }
      );
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.diagnostics.remediate',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Diagnostics remediation failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              remediationAction: { after: parseRemediationAction(body?.action) ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Diagnostics remediation failed.' },
        { status: 400 }
      );
    }
  };
}

export const GET = createDiagnosticsGetHandler();
export const POST = createDiagnosticsPostHandler();
