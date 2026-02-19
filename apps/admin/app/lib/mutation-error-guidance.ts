export type MutationErrorScope = 'onboarding' | 'domain-add' | 'domain-update' | 'settings';

export type MutationErrorField = 'name' | 'slug' | 'primaryDomain' | 'hostname' | 'planCode' | 'featureFlags';

export interface MutationErrorGuidance {
  scope: MutationErrorScope;
  summary: string;
  detail: string;
  fieldHints: Partial<Record<MutationErrorField, string>>;
  nextSteps: string[];
  focusStepIndex?: number;
}

interface MutationErrorGuidanceInput {
  scope: MutationErrorScope;
  status: number;
  message: string;
}

function hasAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function isAdminDenied(status: number, message: string): boolean {
  return status === 403 || hasAny(message, ['admin role is required', 'mutation requires admin role']);
}

function isUniqueConstraint(message: string): boolean {
  return message.includes('unique constraint failed');
}

function isSlugConflict(message: string): boolean {
  return (
    (isUniqueConstraint(message) && (message.includes('`slug`') || message.includes('(slug)'))) ||
    (isUniqueConstraint(message) && (message.includes('`id`') || message.includes('(id)'))) ||
    hasAny(message, ['slug already exists', 'slug is already in use'])
  );
}

function isDomainConflict(message: string): boolean {
  return (
    (isUniqueConstraint(message) && (message.includes('hostnamenormalized') || message.includes('`hostname`'))) ||
    hasAny(message, ['domain already exists', 'hostname already exists', 'hostname is already in use'])
  );
}

function isRuntimeUnavailable(message: string): boolean {
  return hasAny(message, ['requires prisma runtime availability', 'prisma runtime']);
}

function adminDeniedGuidance(scope: MutationErrorScope): MutationErrorGuidance {
  return {
    scope,
    summary: 'Admin permissions required',
    detail: 'This mutation was denied because the current actor does not have admin role access.',
    fieldHints: {},
    nextSteps: [
      'Sign in with an admin account (or set local dev role to `admin`).',
      'Retry and confirm the Audit Timeline shows `allowed` then `succeeded`.',
    ],
  };
}

function runtimeUnavailableGuidance(scope: MutationErrorScope): MutationErrorGuidance {
  return {
    scope,
    summary: 'Control-plane runtime unavailable',
    detail: 'Admin persistence is not currently available, so this mutation cannot complete.',
    fieldHints: {},
    nextSteps: [
      'Restore Prisma/runtime readiness for this environment.',
      'Retry the action after runtime checks pass.',
    ],
  };
}

function fallbackGuidance(scope: MutationErrorScope, detail: string): MutationErrorGuidance {
  if (scope === 'onboarding') {
    return {
      scope,
      summary: 'Tenant provisioning failed',
      detail,
      fieldHints: {},
      nextSteps: ['Review the draft values and retry.', 'Check Audit Timeline for mutation failure details.'],
    };
  }

  if (scope === 'domain-add') {
    return {
      scope,
      summary: 'Domain attach failed',
      detail,
      fieldHints: {},
      nextSteps: ['Check hostname format and uniqueness, then retry.', 'Review Audit Timeline for exact failure details.'],
    };
  }

  if (scope === 'domain-update') {
    return {
      scope,
      summary: 'Domain update failed',
      detail,
      fieldHints: {},
      nextSteps: ['Refresh the selected tenant state and retry.', 'Review Audit Timeline for exact failure details.'],
    };
  }

  return {
    scope,
    summary: 'Settings update failed',
    detail,
    fieldHints: {},
    nextSteps: ['Confirm plan and feature values are valid, then retry.', 'Review Audit Timeline for exact failure details.'],
  };
}

export function createMutationErrorGuidance(input: MutationErrorGuidanceInput): MutationErrorGuidance {
  const normalizedMessage = input.message.trim().toLowerCase();
  const detail = input.message.trim() || 'Unknown mutation error.';

  if (isAdminDenied(input.status, normalizedMessage)) {
    return adminDeniedGuidance(input.scope);
  }

  if (isRuntimeUnavailable(normalizedMessage)) {
    return runtimeUnavailableGuidance(input.scope);
  }

  if (input.scope === 'onboarding') {
    if (hasAny(normalizedMessage, ['name, slug, and primarydomain are required', 'valid slug and primarydomain are required'])) {
      return {
        scope: input.scope,
        summary: 'Complete required onboarding fields',
        detail: 'Tenant provisioning requires valid name, slug, and primary domain values.',
        fieldHints: {
          name: 'Tenant name is required.',
          slug: 'Provide a lowercase slug (letters, numbers, hyphens).',
          primaryDomain: 'Provide a valid primary domain hostname.',
        },
        nextSteps: ['Fill in the highlighted fields and continue through the wizard again.'],
        focusStepIndex: 0,
      };
    }

    if (isSlugConflict(normalizedMessage)) {
      return {
        scope: input.scope,
        summary: 'Slug already in use',
        detail: 'Another tenant already uses this slug-derived identity.',
        fieldHints: {
          slug: 'Choose a unique slug (for example, add a region or team suffix).',
        },
        nextSteps: ['Update Tenant Slug and retry provisioning.'],
        focusStepIndex: 0,
      };
    }

    if (isDomainConflict(normalizedMessage)) {
      return {
        scope: input.scope,
        summary: 'Primary domain already in use',
        detail: 'This hostname is already attached elsewhere and cannot be reused.',
        fieldHints: {
          primaryDomain: 'Use a different hostname or remove the existing attachment first.',
        },
        nextSteps: ['Update the Primary Domain value and retry provisioning.'],
        focusStepIndex: 1,
      };
    }
  }

  if (input.scope === 'domain-add') {
    if (hasAny(normalizedMessage, ['hostname is required'])) {
      return {
        scope: input.scope,
        summary: 'Hostname required',
        detail: 'A domain hostname is required to attach a tenant domain.',
        fieldHints: {
          hostname: 'Enter a valid hostname (for example, `tenant.example.com`).',
        },
        nextSteps: ['Enter a hostname and retry the domain attach action.'],
      };
    }

    if (isDomainConflict(normalizedMessage)) {
      return {
        scope: input.scope,
        summary: 'Hostname already in use',
        detail: 'This hostname is already registered and cannot be attached again.',
        fieldHints: {
          hostname: 'Choose a different hostname or detach it from the existing tenant first.',
        },
        nextSteps: ['Update the hostname value and retry.'],
      };
    }
  }

  if (input.scope === 'domain-update' && (input.status === 404 || hasAny(normalizedMessage, ['domain not found for tenant']))) {
    return {
      scope: input.scope,
      summary: 'Domain record not found',
      detail: 'The selected domain is no longer associated with this tenant.',
      fieldHints: {},
      nextSteps: ['Refresh tenant data.', 'If needed, re-attach the domain before updating status.'],
    };
  }

  if (input.scope === 'settings') {
    if (hasAny(normalizedMessage, ['plancode'])) {
      return {
        scope: input.scope,
        summary: 'Invalid plan code',
        detail,
        fieldHints: {
          planCode: 'Choose a valid plan code and retry.',
        },
        nextSteps: ['Re-select the plan and save again.'],
      };
    }

    if (hasAny(normalizedMessage, ['featureflags', 'feature flags'])) {
      return {
        scope: input.scope,
        summary: 'Invalid feature flags',
        detail,
        fieldHints: {
          featureFlags: 'Ensure feature flags are comma-separated identifiers.',
        },
        nextSteps: ['Correct feature flag formatting and retry.'],
      };
    }
  }

  return fallbackGuidance(input.scope, detail);
}
