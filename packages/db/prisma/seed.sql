INSERT OR REPLACE INTO "Tenant" ("id", "slug", "name", "status", "createdAt", "updatedAt")
VALUES ('tenant_fairfield', 'fairfield', 'Fairfield Baseline', 'active', '2026-02-12T00:00:00.000Z', '2026-02-12T00:00:00.000Z');

INSERT OR REPLACE INTO "TenantDomain" (
  "id",
  "tenantId",
  "hostname",
  "hostnameNormalized",
  "isPrimary",
  "isVerified",
  "verifiedAt",
  "createdAt",
  "updatedAt"
)
VALUES (
  'tenant_domain_fairfield_localhost',
  'tenant_fairfield',
  'fairfield.localhost',
  'fairfield.localhost',
  1,
  1,
  '2026-02-12T00:00:00.000Z',
  '2026-02-12T00:00:00.000Z',
  '2026-02-12T00:00:00.000Z'
);

INSERT OR REPLACE INTO "WebsiteConfig" ("id", "tenantId", "createdAt", "updatedAt")
VALUES (
  'website_config_tenant_fairfield',
  'tenant_fairfield',
  '2026-02-12T00:00:00.000Z',
  '2026-02-12T00:00:00.000Z'
);

INSERT OR REPLACE INTO "TenantControlSettings" (
  "id",
  "tenantId",
  "planCode",
  "featureFlagsJson",
  "createdAt",
  "updatedAt"
)
VALUES (
  'tenant_control_settings_tenant_fairfield',
  'tenant_fairfield',
  'starter',
  '[]',
  '2026-02-12T00:00:00.000Z',
  '2026-02-12T00:00:00.000Z'
);

INSERT OR REPLACE INTO "TenantBillingSubscription" (
  "id",
  "tenantId",
  "planCode",
  "status",
  "paymentStatus",
  "billingProvider",
  "billingCustomerId",
  "billingSubscriptionId",
  "trialEndsAt",
  "currentPeriodEndsAt",
  "cancelAtPeriodEnd",
  "createdAt",
  "updatedAt"
)
VALUES (
  'tenant_billing_subscription_tenant_fairfield',
  'tenant_fairfield',
  'starter',
  'trialing',
  'pending',
  'manual',
  NULL,
  NULL,
  '2026-02-26T00:00:00.000Z',
  NULL,
  0,
  '2026-02-12T00:00:00.000Z',
  '2026-02-12T00:00:00.000Z'
);

INSERT OR REPLACE INTO "ModuleConfig" (
  "id",
  "websiteConfigId",
  "tenantId",
  "moduleKey",
  "enabled",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
VALUES
  ('module_config_tenant_fairfield_at_a_glance', 'website_config_tenant_fairfield', 'tenant_fairfield', 'at_a_glance', 1, 0, '2026-02-12T00:00:00.000Z', '2026-02-12T00:00:00.000Z'),
  ('module_config_tenant_fairfield_schools', 'website_config_tenant_fairfield', 'tenant_fairfield', 'schools', 1, 1, '2026-02-12T00:00:00.000Z', '2026-02-12T00:00:00.000Z'),
  ('module_config_tenant_fairfield_taxes', 'website_config_tenant_fairfield', 'tenant_fairfield', 'taxes', 1, 2, '2026-02-12T00:00:00.000Z', '2026-02-12T00:00:00.000Z'),
  ('module_config_tenant_fairfield_walk_score', 'website_config_tenant_fairfield', 'tenant_fairfield', 'walk_score', 1, 3, '2026-02-12T00:00:00.000Z', '2026-02-12T00:00:00.000Z'),
  ('module_config_tenant_fairfield_points_of_interest', 'website_config_tenant_fairfield', 'tenant_fairfield', 'points_of_interest', 1, 4, '2026-02-12T00:00:00.000Z', '2026-02-12T00:00:00.000Z'),
  ('module_config_tenant_fairfield_listings', 'website_config_tenant_fairfield', 'tenant_fairfield', 'listings', 1, 5, '2026-02-12T00:00:00.000Z', '2026-02-12T00:00:00.000Z');
