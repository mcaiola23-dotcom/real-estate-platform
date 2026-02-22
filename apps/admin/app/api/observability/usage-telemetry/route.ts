import { NextResponse } from 'next/server';

import {
  buildAuditRequestMetadata,
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../lib/admin-access';

interface ObservabilityUsageTelemetryPostDependencies {
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: ObservabilityUsageTelemetryPostDependencies = {};

function sanitizeRecordOfCounts(input: unknown): Record<string, number> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      result[key] = Math.trunc(value);
    }
  }
  return result;
}

function sanitizeBulkActionStats(input: unknown): Record<string, Record<string, number>> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  const result: Record<string, Record<string, number>> = {};
  for (const [actionKey, value] of Object.entries(input)) {
    result[actionKey] = sanitizeRecordOfCounts(value);
  }
  return result;
}

export function createObservabilityUsageTelemetryPostHandler(
  dependencies: ObservabilityUsageTelemetryPostDependencies = defaultDependencies
) {
  return async function POST(request: Request) {
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };

    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.observability.telemetry.publish' },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    let body: Record<string, unknown> | null = null;
    try {
      body = (await request.json()) as Record<string, unknown>;
      const payload = {
        version: body?.version === 1 ? 1 : 1,
        generatedAt: typeof body?.generatedAt === 'string' ? body.generatedAt : null,
        localSnapshotUpdatedAt: typeof body?.localSnapshotUpdatedAt === 'string' ? body.localSnapshotUpdatedAt : null,
        recentEventCount:
          typeof body?.recentEventCount === 'number' && Number.isFinite(body.recentEventCount)
            ? Math.max(0, Math.trunc(body.recentEventCount))
            : 0,
        countsByEvent: sanitizeRecordOfCounts(body?.countsByEvent),
        bulkActionStats: sanitizeBulkActionStats(body?.bulkActionStats),
        policy:
          body?.policy && typeof body.policy === 'object' && !Array.isArray(body.policy)
            ? {
                storage: typeof (body.policy as Record<string, unknown>).storage === 'string'
                  ? (body.policy as Record<string, unknown>).storage
                  : null,
                promotionMode: typeof (body.policy as Record<string, unknown>).promotionMode === 'string'
                  ? (body.policy as Record<string, unknown>).promotionMode
                  : null,
                includesRecentEvents: Boolean((body.policy as Record<string, unknown>).includesRecentEvents),
                includesTenantIds: Boolean((body.policy as Record<string, unknown>).includesTenantIds),
                retention: typeof (body.policy as Record<string, unknown>).retention === 'string'
                  ? (body.policy as Record<string, unknown>).retention
                  : null,
              }
            : null,
      };

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.observability.telemetry.publish',
          actor: access.actor,
          status: 'succeeded',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              telemetryVersion: { after: payload.version },
              recentEventCount: { after: payload.recentEventCount },
              publishedEventTypeCount: { after: Object.keys(payload.countsByEvent).length },
              publishedBulkActionTypeCount: { after: Object.keys(payload.bulkActionStats).length },
            },
            telemetryAggregate: payload,
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json({
        ok: true,
        accepted: true,
        publishedEventTypeCount: Object.keys(payload.countsByEvent).length,
        publishedBulkActionTypeCount: Object.keys(payload.bulkActionStats).length,
      });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.observability.telemetry.publish',
          actor: access.actor,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unable to publish telemetry aggregate.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              hasBody: { after: Boolean(body) },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Unable to publish telemetry aggregate.' },
        { status: 400 }
      );
    }
  };
}

export const POST = createObservabilityUsageTelemetryPostHandler();
