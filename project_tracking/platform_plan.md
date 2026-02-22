# Reusable Client Website System - Implementation Plan (Expanded)

## Goal
Build a reusable, tenant-driven website system where new client sites are produced from shared components/templates with configurable branding/layout/content, without requiring major code edits per client.

## Non-goal (launch)
- Full drag-and-drop no-code builder.
- Arbitrary page composer for every page type.

## Launch target (practical)
- Curated template system with reusable sections.
- Adjustable branding (colors/fonts/logo/etc.).
- Configurable page layouts for core pages.
- Content editing via Studio/Admin.
- Tenant-specific website + CRM provisioning via Admin.

## Current Starting Point (what we already have)
- Multi-tenant web runtime in `apps/web` with host-based tenant resolution.
- Tenant provisioning/domain/plan ops in `apps/admin`.
- Tenant-scoped CRM runtime in `apps/crm`.
- Tenant website module toggles for data sections (town/neighborhood modules like schools/taxes/listings) via shared config:
  - `packages/types/src/website-config.ts`
  - `packages/db/src/website-config.ts`
  - `apps/web/app/lib/modules/tenant-modules.ts`

## Current Gaps (what needs to be built)
- Tenant visual brand config (logo/colors/fonts/theme tokens).
- Page layout recipes for core marketing pages (`home`, `about`, `contact`, `home-value`, etc.).
- Reusable section orchestration for non-data pages.
- Tenant-specific brand/content schemas in Studio.
- Admin UI for "Website Setup" (template/theme/content preview/publish).
- Asset management flow for logos/headshots/brand media.

## Target Architecture (MVP)
### 1) Tenant Brand Config (shared + DB)
Store tenant-specific branding and identity:
- logo(s)
- agent name
- brokerage name
- phone/email
- social links
- colors (primary/accent/background/text)
- typography choices (curated font sets)
- button/card style options

### 2) Tenant Website Page Config (shared + DB)
Store page-level layout recipes for core pages:
- ordered section list
- section variant
- section settings
- visibility toggles

### 3) Reusable Section Components (`apps/web`)
Shared components should accept:
- `brand`
- `content`
- `settings`

Constraints:
- no Matt-specific hardcoded copy/assets in reusable components
- curated variants instead of arbitrary visual logic

### 4) Content Authoring
- `apps/studio` for structured content and rich text/media
- `apps/admin` for operational config (template/theme/toggles/launch readiness)

### 5) Renderer (`apps/web`)
`apps/web` resolves tenant and renders from:
- tenant config
- theme
- page layout recipe
- tenant content

## MVP Scope (recommended)
### Supported pages (initial)
- Home
- About
- Contact
- Home Value (lead gen)
- Header / Footer (global shell)

### Supported configuration (initial)
- Logo / wordmark
- Colors
- Fonts (curated sets)
- CTA labels/links
- Hero layout variant (2-3 options)
- Section order (within curated page templates)
- Show/hide sections
- Brokerage/contact/legal details
- Social links

### Keep code-managed initially
- Complex SEO logic beyond basic metadata templates
- Deep custom layout requests outside template variants
- Fully custom animations/interactions

## Phase Plan

### Phase 1: Template Foundation (Brand Tokens + Global Shell)
**Objective**
Remove Matt-specific hardcoding from the global shell and make branding tenant-driven.

**Build**
- Add shared types (new file such as `packages/types/src/website-theme.ts`, or extend existing website config types):
  - `TenantBrandConfig`
  - `TenantThemeConfig`
  - `TenantSiteIdentity`
- Add DB persistence (Prisma + shared db helpers) for brand/theme config.
- Refactor `apps/web` global shell to read tenant brand config:
  - `apps/web/app/layout.tsx`
  - `apps/web/app/components/Header.tsx`
  - `apps/web/app/components/GlobalFooter.tsx`
- Add safe fallback to Matt/Fairfield defaults if tenant brand config is missing.

**Outcome**
- The same website runtime shell can support multiple client brands without code edits.

### Phase 2: Section Inventory + Reusable Component Contracts
**Objective**
Turn Matt site sections into a reusable section library with explicit props.

**Build**
- Inventory existing sections and classify them:
  - global shell
  - marketing/hero sections
  - credibility/testimonial sections
  - CTA/forms
  - town/neighborhood/data modules
- Normalize props for reusable sections (`brand`, `content`, `settings`).
- Extract hardcoded text/assets from reusable sections into config/content inputs.
- Create curated variants (e.g., `hero.split`, `hero.full-bleed`, `cta.minimal`).

**Outcome**
- Matt site becomes a reusable section library and template baseline.

### Phase 3: Page Recipe System (Curated Layouts)
**Objective**
Enable per-client page composition from reusable sections without code edits.

**Build**
- Define page recipe contracts:
  - `TenantPageConfig`
  - `SectionInstanceConfig` (`type`, `variant`, `order`, `enabled`, `settings`)
- Implement page renderer in `apps/web` for core pages:
  - Home
  - About
  - Contact
  - Home Value
- Create 1-2 starter templates:
  - `Luxury Classic` (Matt-inspired)
  - `Modern Minimal`
- Add seed/default recipes for new tenants.

**Outcome**
- New client sites can reuse the same components in different layouts.

### Phase 4: Content Model in Studio (Tenant Content)
**Objective**
Move client-specific copy/assets into structured content editing.

**Build**
- Add Sanity schemas for tenant website content, for example:
  - `tenantSiteProfile`
  - `tenantPageContent` (home/about/contact/home-value)
  - `tenantSectionContent` (optional if needed)
  - `tenantBrandAssets`
- Store agent bio, hero copy, CTA copy, testimonials, contact details, legal text.
- Link content records to tenant slug/id.
- Add web query layer for tenant page content.

**Outcome**
- Content changes stop requiring code changes for each client.

### Phase 5: Admin "Website Setup" Workspace (Operator-Friendly)
**Objective**
Give your team one internal place to configure client sites operationally.

**Build**
- Add a new Admin panel/workspace in `apps/admin` for Website Setup:
  - choose template
  - set brand/theme tokens
  - toggle page sections
  - set page variants
  - preview status / publish readiness checklist
- Reuse the guided UX approach (similar to current Admin guided/full mode work).
- Keep advanced content authoring in Studio for now.

**Outcome**
- Ops can provision + configure site shell/layout without engineering involvement.

### Phase 6: Preview, QA, and Launch Workflow
**Objective**
Make the build process repeatable and safe.

**Build**
- Preview flow per tenant (tenant domain / localhost domain).
- Launch readiness checks in Admin:
  - brand config complete
  - core pages configured
  - contact info present
  - domain primary/verified
  - legal pages enabled
- Seed defaults for new tenants based on plan/template.
- Create internal SOP/runbook for:
  - sales -> ops -> build -> launch

**Outcome**
- Internal team can reliably produce sites at higher volume.

## Phase 7+ (Post-launch toward no-code)
This is the path toward the long-term goal, but not required at launch:

1. Drag-and-drop section ordering UI in Admin/Studio.
2. Visual theme editor with live preview.
3. More template families + vertical styles.
4. Reusable block presets (luxury, first-time buyer, investor, relocation).
5. AI-assisted content drafting (`packages/ai`) for onboarding.
6. Client approval workflow (draft/review/publish).
7. Role-based client access to limited content edits.

## Practical Production Workflow (after MVP phases 1-6)
1. Close client (call/video/in-person).
2. Create tenant in Admin.
3. Choose template + apply brand theme in Admin Website Setup.
4. Fill client content in Studio (bio, copy, testimonials, media).
5. Review preview on tenant domain.
6. Final QA / stakeholder approval.
7. Domain verify + launch.
8. CRM access already provisioned via tenant runtime.

This supports a high-touch service workflow now, while moving toward low-code/no-code later.

## Key Technical Design Choices (recommended)
- Use curated variants, not arbitrary free-form layouts (faster, safer, more consistent).
- Use CSS variables for tenant theming (colors/fonts/styles).
- Keep contracts in shared packages (`packages/types`, `packages/db`).
- Keep rendering in `apps/web`, configuration in `apps/admin`, content in `apps/studio`.
- Fail-open to defaults so incomplete tenant config still renders a usable site.

## Immediate Next Build Steps (best first sprint, when work starts)
1. Implement `TenantBrandConfig` + DB persistence + shared helpers.
2. Refactor `Header`, `GlobalFooter`, and `layout.tsx` to tenant-driven brand config.
3. Create `TenantPageConfig` schema/contracts for `home/about/contact`.
4. Convert Matt homepage into a page recipe rendered from reusable sections.
5. Add Admin Website Setup (template + branding only, no drag-and-drop yet).

## Definition of Done for "Reusable Components Setup" (launch need)
- New client branding can be changed without editing code.
- Core page layout can be chosen/swapped from curated templates.
- Sections can be enabled/disabled/reordered within supported pages.
- Header/footer/global style are tenant-driven.
- Content is mostly tenant-authored (not hardcoded Matt copy).
- Engineering is only needed for true custom requests, not standard new-client builds.
