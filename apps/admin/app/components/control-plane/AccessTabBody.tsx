import type { Dispatch, SetStateAction } from 'react';

import type {
  ControlPlaneActorPermission,
  ControlPlaneActorRole,
  ControlPlaneTenantSnapshot,
  TenantControlActor,
} from '@real-estate/types/control-plane';

interface ActorDraftLike {
  actorId: string;
  displayName: string;
  email: string;
  role: ControlPlaneActorRole;
  permissions: ControlPlaneActorPermission[];
}

interface ActorSupportSessionDraftLike {
  durationMinutes: number;
}

interface ActorRoleOptionLike {
  value: ControlPlaneActorRole;
  label: string;
}

interface ActorPermissionOptionLike {
  id: ControlPlaneActorPermission;
  label: string;
  detail: string;
}

interface ActorSeedPresetLike {
  id: string;
  label: string;
  role: ControlPlaneActorRole;
  actorIdTemplate: string;
}

interface AccessTabBodyProps {
  selectedTenant: ControlPlaneTenantSnapshot | null;
  selectedTenantPlanCode: string;
  selectedPlanActorSeedPresets: ActorSeedPresetLike[];
  selectedTenantActorDraft: ActorDraftLike;
  selectedTenantActors: TenantControlActor[];
  actorsLoading: boolean;
  actorRoleDraftByActorKey: Record<string, ControlPlaneActorRole>;
  actorPermissionsDraftByActorKey: Record<string, ControlPlaneActorPermission[]>;
  supportSessionDraftByActorKey: Record<string, ActorSupportSessionDraftLike>;
  defaultSupportSessionDurationMinutes: number;
  busy: boolean;
  actorRoleOptions: ActorRoleOptionLike[];
  actorPermissionOptions: ActorPermissionOptionLike[];
  roleDefaultPermissions: Record<ControlPlaneActorRole, ControlPlaneActorPermission[]>;
  formatTimestamp: (value: string) => string;
  formatActorRole: (role: ControlPlaneActorRole) => string;
  toActorKey: (tenantId: string, actorId: string) => string;
  uniquePermissions: (permissions: ControlPlaneActorPermission[]) => ControlPlaneActorPermission[];
  resolveActorSeedPresetText: (template: string, tenantSlug: string) => string;
  setActorDraftField: (tenantId: string, field: keyof ActorDraftLike, value: ActorDraftLike[keyof ActorDraftLike]) => void;
  setActorRoleDraft: (tenantId: string, actorId: string, role: ControlPlaneActorRole) => void;
  toggleActorPermissionDraft: (tenantId: string, actorId: string, permission: ControlPlaneActorPermission) => void;
  setSupportSessionDraftByActorKey: Dispatch<SetStateAction<Record<string, ActorSupportSessionDraftLike>>>;
  onApplyActorSeedPresetToDraft: (tenantId: string, tenantSlug: string, presetId: string) => void;
  onAddActor: (tenantId: string) => void;
  onSaveActor: (tenantId: string, actor: TenantControlActor) => void;
  onStartSupportSession: (tenantId: string, actorId: string) => void;
  onEndSupportSession: (tenantId: string, actorId: string) => void;
  onRemoveActor: (tenantId: string, actorId: string) => void;
}

export function AccessTabBody({
  selectedTenant,
  selectedTenantPlanCode,
  selectedPlanActorSeedPresets,
  selectedTenantActorDraft,
  selectedTenantActors,
  actorsLoading,
  actorRoleDraftByActorKey,
  actorPermissionsDraftByActorKey,
  supportSessionDraftByActorKey,
  defaultSupportSessionDurationMinutes,
  busy,
  actorRoleOptions,
  actorPermissionOptions,
  roleDefaultPermissions,
  formatTimestamp,
  formatActorRole,
  toActorKey,
  uniquePermissions,
  resolveActorSeedPresetText,
  setActorDraftField,
  setActorRoleDraft,
  toggleActorPermissionDraft,
  setSupportSessionDraftByActorKey,
  onApplyActorSeedPresetToDraft,
  onAddActor,
  onSaveActor,
  onStartSupportSession,
  onEndSupportSession,
  onRemoveActor,
}: AccessTabBodyProps) {
  if (!selectedTenant) {
    return <p className="admin-muted">Select a tenant to manage roles, permissions, and support-session controls.</p>;
  }

  return (
    <>
      <section className="admin-governance-panel">
        <div className="admin-row admin-space-between">
          <strong>Recommended Actor Seed Presets</strong>
          <span className="admin-chip">plan: {selectedTenantPlanCode}</span>
        </div>
        <p className="admin-muted">
          Apply plan-based actor seed defaults to prefill the add-actor draft, then adjust values before saving.
        </p>
        <div className="admin-feature-grid">
          {selectedPlanActorSeedPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="admin-feature-chip"
              onClick={() => {
                onApplyActorSeedPresetToDraft(selectedTenant.tenant.id, selectedTenant.tenant.slug, preset.id);
              }}
              title={`Role: ${preset.role}`}
            >
              <span>{preset.label}</span>
              <small>{preset.role} · {resolveActorSeedPresetText(preset.actorIdTemplate, selectedTenant.tenant.slug)}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="admin-rbac-add-grid">
        <label className="admin-field">
          Actor ID
          <input
            value={selectedTenantActorDraft.actorId}
            onChange={(event) => {
              setActorDraftField(selectedTenant.tenant.id, 'actorId', event.target.value);
            }}
            placeholder="user_abc123"
          />
        </label>
        <label className="admin-field">
          Display Name
          <input
            value={selectedTenantActorDraft.displayName}
            onChange={(event) => {
              setActorDraftField(selectedTenant.tenant.id, 'displayName', event.target.value);
            }}
            placeholder="Alex Support"
          />
        </label>
        <label className="admin-field">
          Email
          <input
            value={selectedTenantActorDraft.email}
            onChange={(event) => {
              setActorDraftField(selectedTenant.tenant.id, 'email', event.target.value);
            }}
            placeholder="alex@tenant.com"
          />
        </label>
        <label className="admin-field">
          Role
          <select
            value={selectedTenantActorDraft.role}
            onChange={(event) => {
              const role = event.target.value as ControlPlaneActorRole;
              setActorDraftField(selectedTenant.tenant.id, 'role', role);
              setActorDraftField(
                selectedTenant.tenant.id,
                'permissions',
                uniquePermissions([...roleDefaultPermissions[role], ...selectedTenantActorDraft.permissions])
              );
            }}
          >
            {actorRoleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-feature-grid">
        {actorPermissionOptions.map((permission) => {
          const enabled = selectedTenantActorDraft.permissions.includes(permission.id);
          return (
            <button
              key={permission.id}
              type="button"
              className={`admin-feature-chip ${enabled ? 'is-active' : ''}`}
              onClick={() => {
                const next = enabled
                  ? selectedTenantActorDraft.permissions.filter((entry) => entry !== permission.id)
                  : [...selectedTenantActorDraft.permissions, permission.id];
                setActorDraftField(selectedTenant.tenant.id, 'permissions', uniquePermissions(next));
              }}
            >
              <span>{permission.label}</span>
              <small>{permission.detail}</small>
            </button>
          );
        })}
      </div>

      <div className="admin-row">
        <button
          type="button"
          disabled={busy || selectedTenantActorDraft.actorId.trim().length === 0}
          onClick={() => {
            onAddActor(selectedTenant.tenant.id);
          }}
        >
          Add Actor
        </button>
      </div>

      {actorsLoading ? <p className="admin-muted">Loading tenant actors...</p> : null}

      {selectedTenantActors.length === 0 ? (
        <p className="admin-muted">No actors configured yet for this tenant.</p>
      ) : (
        <ul className="admin-list">
          {selectedTenantActors.map((actor) => {
            const actorKey = toActorKey(selectedTenant.tenant.id, actor.actorId);
            const roleDraft = actorRoleDraftByActorKey[actorKey] ?? actor.role;
            const permissionDraft = actorPermissionsDraftByActorKey[actorKey] ?? actor.permissions;
            const supportSessionDraft =
              supportSessionDraftByActorKey[actorKey]?.durationMinutes ?? defaultSupportSessionDurationMinutes;

            return (
              <li key={actor.id} className="admin-list-item">
                <div className="admin-row admin-space-between">
                  <div>
                    <strong>{actor.displayName || actor.actorId}</strong>
                    <p className="admin-muted admin-list-subtitle">{actor.actorId}</p>
                  </div>
                  <span className="admin-chip">{formatActorRole(actor.role)}</span>
                </div>
                {actor.email ? <p className="admin-muted">Email: {actor.email}</p> : null}

                <label className="admin-field">
                  Role
                  <select
                    value={roleDraft}
                    onChange={(event) => {
                      setActorRoleDraft(selectedTenant.tenant.id, actor.actorId, event.target.value as ControlPlaneActorRole);
                    }}
                  >
                    {actorRoleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="admin-feature-grid">
                  {actorPermissionOptions.map((permission) => {
                    const enabled = permissionDraft.includes(permission.id);
                    return (
                      <button
                        key={`${actor.id}-${permission.id}`}
                        type="button"
                        className={`admin-feature-chip ${enabled ? 'is-active' : ''}`}
                        onClick={() => {
                          toggleActorPermissionDraft(selectedTenant.tenant.id, actor.actorId, permission.id);
                        }}
                      >
                        <span>{permission.label}</span>
                        <small>{permission.detail}</small>
                      </button>
                    );
                  })}
                </div>

                <div className="admin-support-session-row">
                  <span className="admin-chip">support session: {actor.supportSessionActive ? 'active' : 'inactive'}</span>
                  {actor.supportSessionExpiresAt ? (
                    <span className="admin-chip">expires {formatTimestamp(actor.supportSessionExpiresAt)}</span>
                  ) : null}
                  <label className="admin-inline-field">
                    Duration (minutes)
                    <input
                      type="number"
                      min={10}
                      max={240}
                      value={supportSessionDraft}
                      onChange={(event) => {
                        const parsed = Number.parseInt(event.target.value, 10);
                        if (Number.isNaN(parsed)) {
                          return;
                        }
                        setSupportSessionDraftByActorKey((prev) => ({
                          ...prev,
                          [actorKey]: {
                            durationMinutes: Math.min(Math.max(parsed, 10), 240),
                          },
                        }));
                      }}
                    />
                  </label>
                </div>

                <div className="admin-row">
                  <button
                    type="button"
                    className="admin-secondary"
                    disabled={busy}
                    onClick={() => {
                      onSaveActor(selectedTenant.tenant.id, actor);
                    }}
                  >
                    Save Access
                  </button>
                  {actor.supportSessionActive ? (
                    <button
                      type="button"
                      className="admin-secondary"
                      disabled={busy}
                      onClick={() => {
                        onEndSupportSession(selectedTenant.tenant.id, actor.actorId);
                      }}
                    >
                      End Support Session
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-secondary"
                      disabled={busy}
                      onClick={() => {
                        onStartSupportSession(selectedTenant.tenant.id, actor.actorId);
                      }}
                    >
                      Start Support Session
                    </button>
                  )}
                  <button
                    type="button"
                    className="admin-secondary"
                    disabled={busy}
                    onClick={() => {
                      onRemoveActor(selectedTenant.tenant.id, actor.actorId);
                    }}
                  >
                    Remove Actor
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
