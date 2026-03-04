# Portal Property Detail Modal — Tier 1 & 2 Sprint Plan

> **Created**: 2026-03-03 | **Author**: Claude Opus 4.6
> **Context**: Competitor analysis (Zillow, Redfin, Realtor.com) + user feedback from Session 25
> **Prerequisite**: Unified PropertyDetailModal overhaul (Phase 1-5) is complete

---

## Research Findings Summary

### Tax Data
- **Listings** have `tax_annual_amount` (from SimplyRETS MLS data) — actual annual tax paid
- **Parcels** only have assessment/appraisal values (`assessment_total`, `assessment_land`, `assessment_building`, `appraised_total`, etc.) — NOT actual tax amounts
- Backend MortgageCalculator already accepts `property_tax_annual` and calculates `property_tax_monthly`
- PropertyDetailModal already passes `taxAnnualAmount` to MortgageCalculator, but only listings populate it
- **For off-market properties**: Tax must be calculated from assessment values using CT mill rates

### Photo Performance
- Next.js `Image` component used throughout with responsive `sizes` props
- Hero image has `priority` for LCP — correct
- `next.config.js` uses catch-all `hostname: '**'` — should whitelist specific MLS domains
- No `quality` prop set anywhere — missing optimization opportunity
- No `placeholder="blur"` — no blur-up effect for perceived performance
- Gallery thumbnails (20 photos) don't lazy load — all fetched on mount
- No `onError` handler on PropertyDetailModal main photos

### Uncompleted Items from portal_crm_integration_suggestions.md
These items overlap with Tier 1-2 and should be incorporated:
- [ ] **Property Comparison Tool** (matches Tier 2 #9)
- [ ] **Decompose `properties/page.tsx`** (tech debt, separate sprint)
- [ ] **Remove Mapbox GL dependency** (cleanup, separate sprint)
- [ ] **Property History Timeline** (overlaps with existing TransactionHistory — enhance)
- [ ] **Mobile-First Responsive Redesign** (ongoing concern)
- [ ] **Deep redesign of portal properties page** (separate sprint, blocked by comparison tool)

---

## Tier 1: High Impact, Moderate Effort

### 1.1 — Sticky Header on Scroll
**Priority**: P1 | **Effort**: S (2-3 hours) | **Files**: PropertyDetailModal.tsx

**What**: When user scrolls past the hero photo + price bar, a compact sticky header appears at the top of the modal with: address, price, key stats, and action buttons (heart, share).

**Implementation**:
1. Add `IntersectionObserver` on the price bar element
2. When price bar scrolls out of view, show a fixed header bar inside the modal scroll container
3. Header bar: `sticky top-0 z-20` with `backdrop-blur-md bg-white/95 border-b border-stone-200`
4. Content: address (truncated), price, beds/baths/sqft, heart button, share button
5. Animate in with `translateY(-100%) → 0` transition

**Design**:
```
┌─────────────────────────────────────────────────────────────────┐
│ 123 Main St, Westport  │  $1,250,000  │  4bd 3ba 2,800sf  │ ♡ ↗ │
└─────────────────────────────────────────────────────────────────┘
```

---

### 1.2 — Photo Mosaic Grid + Performance Optimization
**Priority**: P1 | **Effort**: M (4-6 hours) | **Files**: PropertyDetailModal.tsx, next.config.js

**What**: Replace single-photo hero with Zillow-style mosaic grid (1 large + 4 small). Simultaneously fix photo loading speed issues.

**Implementation — Mosaic Grid**:
1. When `photos.length >= 5`: render mosaic (1 large left 60%, 4 small right 40% in 2x2 grid)
2. When `photos.length >= 2 && < 5`: render 1 large + remaining small in single row
3. When `photos.length === 1`: render single full-width (current behavior)
4. When `photos.length === 0`: render StreetView (current behavior)
5. "View all X photos" button overlaid on last mosaic tile
6. Click any tile → opens existing full-screen gallery at that index

**Implementation — Performance Fixes** (critical per user feedback):
1. **Whitelist image domains** in `next.config.js`: Replace `hostname: '**'` with specific MLS/SimplyRETS domains (`simplyrets.s3.amazonaws.com`, `ap.rdcpix.com`, etc.) — audit actual photo URLs in database first
2. **Add `quality` props**: Hero/mosaic = `quality={80}`, thumbnails = `quality={60}`, full-screen = `quality={85}`
3. **Add `placeholder="blur"`**: Generate tiny blurDataURL for the first photo (or use a generic stone-colored placeholder)
4. **Lazy load gallery thumbnails**: Only render thumbnails visible in viewport using `loading="lazy"` or IntersectionObserver
5. **Add `onError` fallback**: Show `PropertyImagePlaceholder` SVG when photo fails to load
6. **Preload adjacent photos**: When viewing full-screen gallery, preload `currentIndex ± 1`

**Mosaic Layout**:
```
┌──────────────────────┬───────────┐
│                      │   Photo 2 │
│     Photo 1 (large)  ├───────────┤
│                      │   Photo 3 │
│                      ├───────────┤
│     60% width        │   Photo 4 │
│     h-[28rem]        ├───────────┤
│                      │ Photo 5   │
│                      │ "View 23" │
└──────────────────────┴───────────┘
```

---

### 1.3 — Share Button
**Priority**: P1 | **Effort**: XS (1-2 hours) | **Files**: PropertyDetailModal.tsx

**What**: Share button placed next to the heart/favorite button. Options: copy link, email, SMS.

**Implementation**:
1. Add share button (arrow-up-from-square icon) next to the existing heart button in the modal header
2. On click, show a small dropdown: "Copy Link", "Email", "Text Message"
3. Copy Link: `navigator.clipboard.writeText(shareUrl)` with toast confirmation
4. Email: `window.open('mailto:?subject=...&body=...')`
5. Text Message: `window.open('sms:?body=...')`
6. Share URL format: `https://portal.doortag.com/property/{parcelId}` (or listing-based URL)
7. Also include in sticky header (1.1)

---

### 1.4 — Price Change Indicator
**Priority**: P2 | **Effort**: S (2-3 hours) | **Files**: PropertyDetailModal.tsx

**What**: Show price change badge when `listPrice !== originalListPrice` (data already available in PropertyData).

**Implementation**:
1. Check `property.originalListPrice && property.listPrice !== property.originalListPrice`
2. Calculate percentage change: `((listPrice - originalListPrice) / originalListPrice * 100)`
3. Display badge next to price: green down-arrow for reduction, red up-arrow for increase
4. Format: "↓ $50K (4.2%)" or "↑ $25K (2.1%)"
5. Badge styling: `bg-emerald-50 text-emerald-700` for reduction, `bg-rose-50 text-rose-700` for increase
6. Add tooltip: "Price reduced from $1,300,000 on Jan 15, 2026"

---

### 1.5 — Listing Activity / Interest Badge
**Priority**: P2 | **Effort**: M (4-6 hours) | **Files**: PropertyDetailModal.tsx, portal-api (new endpoint)

**What**: "Hot" / "Popular" / "New" badges based on view counts and listing recency. Requires backend analytics tracking.

**Implementation — Backend**:
1. New table `property_views` in portal-api: `(id, parcel_id, listing_id, session_id, viewed_at, source)`
2. New endpoint `GET /api/analytics/property-activity/{parcel_id}`: returns `{ views_7d, saves_count, is_new, is_hot, is_popular }`
3. Logic:
   - `is_new`: listed within 7 days (`listDate` check)
   - `is_hot`: > 50 views in last 7 days OR > 5 saves
   - `is_popular`: > 20 views in last 7 days
4. Track views: `POST /api/analytics/property-view` called when modal opens (debounced, session-scoped)

**Implementation — Frontend**:
1. Fetch activity data when modal opens (alongside property data)
2. Display badges on hero photo: "New Listing", "Popular", "Hot Home"
3. Badge styling: New = teal, Popular = amber, Hot = rose
4. Show "X people viewed this week" text below badges (like Redfin)

---

## Tier 2: Medium Effort, Strong Differentiation

### 2.1 — Walk Score (Coming Soon)
**Priority**: P3 | **Effort**: XS (30 min) | **Files**: PropertyDetailModal.tsx

**What**: User cannot access Walk Score API without a live domain. Add a polished "Coming Soon" placeholder.

**Implementation**:
1. In the Neighborhood section, add a Walk Score card
2. Card shows Walk Score / Transit Score / Bike Score icons with "Coming Soon" badges
3. Match the existing Coming Soon style in NeighborhoodSection.tsx
4. When API access is available later, swap placeholder for real data

---

### 2.2 — Climate Risk (Coming Soon)
**Priority**: P3 | **Effort**: XS (30 min) | **Files**: PropertyDetailModal.tsx

**What**: No live data source yet. Add "Coming Soon" placeholder.

**Implementation**:
1. Add climate risk card to Neighborhood section
2. Show flood, fire, heat, wind risk categories with "Coming Soon" badges
3. Brief explanation text: "Environmental risk assessment for this property"

---

### 2.3 — Accurate Property Tax + Payment Breakdown Visualization
**Priority**: P0 (CRITICAL) | **Effort**: L (6-8 hours) | **Files**: PropertyDetailModal.tsx, MortgageCalculator.tsx, portal-api

**What**: The mortgage calculator is "effectively useless" without accurate property taxes. Fix tax data for all property types, display tax in Property Details section, and add a visual payment breakdown (donut/bar chart).

**Implementation — Tax Data Pipeline**:

#### Step A: Ensure tax data flows for ALL properties
1. **Listings (already working)**: `tax_annual_amount` from SimplyRETS → displayed in modal, passed to MortgageCalculator
2. **Off-market parcels (GAP)**: Need to calculate tax from assessment values
   - CT property tax formula: `Annual Tax = (Assessment Total × Mill Rate) / 1000`
   - Mill rates vary by town — need a lookup table
   - Create `services/portal-api/app/data/ct_mill_rates.json` with all 169 CT towns and current mill rates
   - Add helper: `calculate_annual_tax(assessment_total: float, town: str) -> float | None`
   - Expose calculated tax in parcel detail endpoint response: `estimated_annual_tax`
   - Frontend: Use `estimated_annual_tax` when `taxAnnualAmount` is null (off-market)
   - Display "(Estimated)" label when using calculated tax

#### Step B: Display tax in Property Details section
1. Add "Annual Property Tax" to the Property Details section grid
2. Show: `$X,XXX / year` (or `$X,XXX / year (Est.)` for calculated)
3. Show assessment breakdown: Total / Land / Building values in a sub-card
4. Show tax year if available

#### Step C: Visual Payment Breakdown
1. Add a donut chart (or stacked bar) showing monthly payment components:
   - Principal & Interest (stone-700)
   - Property Tax (teal-600)
   - Home Insurance (amber-500)
   - PMI if applicable (rose-400)
   - HOA if applicable (stone-400)
2. Use lightweight SVG donut (no chart library dependency)
3. Legend shows each component with dollar amount
4. Total monthly payment prominently displayed in center of donut
5. This replaces or augments the existing MortgageCalculator output display

#### Step D: Update MortgageCalculator defaults
1. When `propertyTaxAnnual` is provided, pre-fill it (already done)
2. When NOT provided (off-market without listing tax), use the CT mill rate calculation as default
3. Show the tax source: "From MLS data" or "Estimated from CT mill rates"
4. Allow user to override the tax amount

**CT Mill Rate Data** (sample — full table needed):
```json
{
  "Westport": 17.89,
  "Fairfield": 26.79,
  "Greenwich": 11.59,
  "Stamford": 24.53,
  "Norwalk": 26.60,
  "Darien": 14.53,
  "New Canaan": 16.48,
  "Wilton": 25.16,
  "Weston": 29.76,
  "Ridgefield": 27.04,
  "Danbury": 30.80,
  "Bridgeport": 54.37,
  "Stratford": 39.58,
  "Trumbull": 34.17,
  "Shelton": 28.12,
  "Monroe": 33.64,
  "Newtown": 32.13,
  "Bethel": 32.12,
  "Brookfield": 28.39,
  "New Fairfield": 30.16,
  "Sherman": 19.25,
  "Redding": 29.70,
  "Easton": 29.55
}
```

---

### 2.4 — Property Comparison Tool
**Priority**: P2 | **Effort**: L (8-10 hours) | **Files**: New component, PropertyDetailModal.tsx, properties/page.tsx

**What**: Allow users to compare 2-4 properties side-by-side. This was previously agreed upon (from portal_crm_integration_suggestions.md).

**Implementation**:
1. **Comparison bar** (persistent footer): Shows 0-4 property thumbnails, "Compare" button
2. **"Add to Compare" button** in PropertyDetailModal and PropertyCard
3. **Comparison modal/page**: Full-screen overlay with side-by-side columns

**Comparison grid rows**:
- Photo (thumbnail)
- Price
- Price/sqft
- Status
- Beds / Baths / Sqft / Lot / Year
- Property Type / Style
- AVM Estimate + confidence
- Annual Tax
- HOA
- School ratings (elementary, middle, high)
- Walk Score (when available)
- Days on Market
- Key features (pool, waterfront, garage)

**State management**:
- Store comparison list in `localStorage` (persists across page navigation)
- Max 4 properties
- Show badge count on comparison bar
- Clear individual or all

---

### 2.5 — Print / PDF Export
**Priority**: P3 | **Effort**: M (4-6 hours) | **Files**: PropertyDetailModal.tsx, new print styles

**What**: Professional PDF/print output for property details. Adds credibility and utility.

**Implementation**:
1. **Print button** in modal header (printer icon)
2. **Print-optimized layout** via `@media print` CSS:
   - Hide modal chrome (close button, section nav, scrollbar)
   - Show all sections expanded (no tabs/scroll)
   - Format as clean single-page or multi-page document
   - Include DoorTag branding in header/footer
   - Show QR code linking back to the property on the portal
3. **Key sections in print**:
   - Hero photo (first photo only, reasonable size)
   - Address, price, key stats
   - Property details grid
   - Assessment/tax info
   - Market stats
   - AVM estimate
   - School info
   - Map (static image from Google Static Maps API)
4. Use `window.print()` — no additional library needed
5. Add print-specific CSS to `globals.css`

---

## Implementation Order

| Phase | Items | Effort | Dependencies |
|-------|-------|--------|-------------|
| **Phase A** | 2.3 (Tax + Payment Viz) | L | None — CRITICAL, do first |
| **Phase B** | 1.2 (Photo Mosaic + Perf) | M | None |
| **Phase C** | 1.1 (Sticky Header) + 1.3 (Share) + 1.4 (Price Change) | S+XS+S | None |
| **Phase D** | 2.1 (Walk Score CS) + 2.2 (Climate CS) | XS+XS | None |
| **Phase E** | 1.5 (Activity Badge) | M | Backend analytics table |
| **Phase F** | 2.5 (Print/PDF) | M | All sections finalized |
| **Phase G** | 2.4 (Comparison Tool) | L | Tax data, all modal sections |

**Total estimated effort**: ~30-40 hours across 7 phases

---

## Verification Checklist

- [ ] Tax data accurate for listings (from MLS `tax_annual_amount`)
- [ ] Tax data calculated for off-market (CT mill rate × assessment)
- [ ] MortgageCalculator pre-fills accurate tax for both property types
- [ ] Payment breakdown donut/bar renders with correct proportions
- [ ] Photo mosaic renders for 1, 2-4, and 5+ photo counts
- [ ] Photo loading is noticeably faster (quality props, lazy thumbnails)
- [ ] Broken photo URLs show placeholder gracefully
- [ ] Sticky header appears/disappears on scroll
- [ ] Share button copies link, opens email/SMS
- [ ] Price change badge shows for reduced/increased listings
- [ ] Activity badges render for new/popular/hot properties
- [ ] Walk Score and Climate show Coming Soon cards
- [ ] Property comparison allows 2-4 properties side-by-side
- [ ] Print output is clean, professional, branded
- [ ] All features work for both listing-based and parcel-based modal entries
- [ ] `npm run lint:portal` passes with 0 new errors
- [ ] Mobile responsive at 768px, 1024px, 1440px
