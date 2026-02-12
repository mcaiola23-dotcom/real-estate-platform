# Fairfield County Luxury Real Estate Website — Scratchpad

## Background and Motivation

Build a **custom, compliant, high-end real estate website** for a Fairfield County, CT real estate agent with three primary goals:

- **Lead generation**: capture high-intent sellers and serious buyers via Home Value (hybrid estimate), contact forms, and town/neighborhood + editorial content.
- **Authority & trust**: understated luxury aesthetic, credibility-first, aligned with brokerage **Higgins Group Private Brokerage**.
- **SEO + LLM optimization**: structured pages with clear hierarchy and entity relationships so both Google and LLMs can interpret/cite the site.

This document is the **single source of truth** for planning and execution. Foundation work is complete; remaining work is **layered refinement**, not re-architecture.

## Non-Negotiables (Compliance)

Must always maintain:

- Brokerage name spelled in full: **“Higgins Group Private Brokerage”**
- Brokerage contact info:
  - 1055 Washington Blvd., Stamford CT 06901
  - 203-658-8282
- Fair Housing disclaimer present site-wide (footer)
- No misleading valuation language (Home Value is an **estimate / starting point**, not an appraisal)
- IDX (later) must follow MLS + brokerage rules

## Locked Tech Stack

- **Next.js (App Router)**, TypeScript, Tailwind CSS
- `next/image` for imagery, Server Components where possible
- **Sanity (hosted)** with structured schemas (Town, Neighborhood, Post/Insights, FAQ; testimonials + video scripts later)
- Deployment target: Vercel (SEO blocked until launch; staged release after QA)

## Current State (What’s Built)

### Global

- Premium typography system (serif headlines + clean sans body)
- Neutral warm palette, responsive layout
- Header nav finalized: Buy, Sell, Towns, Insights, About, Contact, **Home Value (CTA button)**
- Footer includes compliance block

### Homepage (`/`)

- Hero: crossfade background imagery
- Explore Towns: hover-based background switching
- CTAs placed cleanly; no layout instability; image system live

### Towns & Neighborhoods

Routing complete:

- `/towns`
- `/towns/[townSlug]`
- `/towns/[townSlug]/[neighborhoodSlug]`

Each Town/Neighborhood page includes:

- Hero image with overlay
- Title + breadcrumb (for neighborhoods)
- Overview section (Sanity-driven)
- Placeholders for highlights, schools, market snapshot, listings (“Coming soon”)

### Insights (Blog)

- `/insights`
- `/insights/[category]`
- `/insights/[category]/[postSlug]`
- Categories: Market Update, Community, Real Estate Tips, News
- SEO fields included (title + description)
- Post rendering working

### Lead Generation

- Home Value tool (`/home-value`): hybrid model (Option A), compliance-safe language, placeholder estimate (intentional), submissions logged, leads stored in Sanity
- Contact form implemented; leads stored in Sanity

### Imagery

- 3 hero images implemented
- 6 town images implemented
- Graceful missing-image handling; no console errors; performance-safe

## Explicitly Out of Scope (for now)

- IDX / MLS listings
- Automated school/demographic/market stats
- Video generation/embedding
- Investor-focused tools

## Design Guardrails

- Calm, editorial, premium; understated luxury (credibility over flash)
- Full-bleed imagery + whitespace + hierarchy
- Motion subtle only (crossfades/hover transitions)
- No clutter/widgets/gimmicks

## Key Challenges and Analysis

- **Scope discipline**: do not redesign completed systems (routing, imagery system, nav, homepage behavior).
- **Compliance**: home value language and brokerage requirements must remain correct site-wide.
- **SEO foundation**: metadata + sitemap/robots + schema.org needs to be comprehensive but staged (block indexing until launch).
- **Content expansion**: town/neighborhood pages should stay structured and “LLM-readable” (clear sections, headings, entities).
- **Future IDX readiness**: keep placeholders and route structure intact; integrate later without route changes.
- **Data licensing + accuracy**: many “market stats” and “school ratings” are paid/licensed or easy to misstate. Ticket 16 must prioritize **traceable sources**, “last updated” dates, and conservative disclaimers.
- **Neighborhood specificity**: “neighborhood boundaries” and “assigned schools” can be ambiguous. We must avoid implying official boundaries/assignments unless we have authoritative boundary data we can cite.

## High-level Task Breakdown (Planner-Approved Tickets)

### Ticket 11 — Core Pages: Buy / Sell / About (Immediate)

**Goal**: publish three premium editorial pages consistent with tone, compliance, and CT-local specificity, with tasteful CTAs.

**Subtasks (Executor completes one at a time; stop after each for review):**

1. **Buy page** (`/buy`)
   - Success criteria:
     - Renders premium editorial layout consistent with existing typography system
     - CT-focused copy: relocations, neighborhood knowledge, process clarity
     - CTA(s) present but not aggressive (contact + home value cross-link as appropriate)
     - No regressions to global nav/footer compliance
2. **Sell page** (`/sell`)
   - Success criteria:
     - Emphasizes valuation + process + strategy; compliance-safe valuation language
     - Links to Home Value tool as “estimate / starting point”
     - Strong trust signals (method, confidentiality, negotiation, marketing) without unverifiable claims
3. **About page** (`/about`) — refine/upgrade if needed
   - Success criteria:
     - Agent story + local roots + approach
     - Professional credibility tone; no gimmicks; clear contact CTA
4. **Copy QA pass**
   - Success criteria:
     - No compliance violations; brokerage name/contact present where required (footer)
     - Mobile readability excellent; no broken links

### Ticket 12 — SEO Foundation

**Goal**: make every route SEO-complete while keeping indexing blocked until launch.

**Subtasks**

1. Route metadata coverage (title/description) for all primary routes
2. OpenGraph + Twitter cards
3. `sitemap.xml`
4. `robots.txt` (block indexing pre-launch; allow in launch ticket)
5. Schema markup:
   - RealEstateAgent / LocalBusiness (site-level)
   - BlogPosting (insights posts)
   - Place (towns)

**Success criteria**

- All core pages have deterministic metadata (no missing titles/descriptions)
- `sitemap.xml` includes canonical routes (towns + neighborhoods + insights)
- `robots.txt` blocks indexing pre-launch
- Structured data validates in Google Rich Results Test (where applicable)

### Ticket 13 — Editorial Expansion

**Goal**: increase authority with town long-form content + FAQs and a sustainable Insights cadence.

#### Schema Status (Confirmed)

The Sanity schemas are already in place and need no modifications:

- **Town schema**: Has `overviewLong` (Portable Text), `lifestyle`, `marketNotes`, `faqs` (array of FAQ references), plus SEO fields
- **FAQ schema**: Has `question`, `answer`, `schemaEnabled`, `tags`
- **Post schema**: Has all needed fields including `relatedTowns`, `relatedNeighborhoods`, `faqs`, and SEO fields

#### Subtasks (Executor completes one at a time)

**1. Expand Town Page Rendering**
- Update `getTownBySlug()` query to fetch `lifestyle`, `marketNotes`, and `faqs` (with dereferenced FAQ data)
- Update Town type in `sanity.queries.ts` to include new fields
- Render new sections on `/towns/[townSlug]` page:
  - "Lifestyle" section (semantic H2)
  - "Market Notes" section (semantic H2)
  - Keep existing placeholders for schools/listings
- Success criteria: Town pages render all Sanity-driven content with proper heading hierarchy

**3. Populate Town Long-Form Content (Sanity) (PARTIAL)**
- [x] About / Living In / Real Estate content done for all towns.
- [ ] **OPEN ITEM**: Missing FAQs for New Canaan, Norwalk, Ridgefield, Stamford, Wilton.

**4. Create Editorial Calendar (COMPLETE)**

**Success Criteria (Ticket 13)**
- All towns have full long-form content including FAQs.

**4. Create Editorial Calendar + Publish Initial Insights Batch**
- Document editorial calendar in `.cursor/editorial-calendar.md`:
  - Categories: Market Update, Community, Real Estate Tips, News
  - Suggested cadence: 2-4 posts/month
  - Initial batch topics (10-15 titles) aligned to Fairfield County luxury positioning
- Publish initial batch (3-5 posts) in Sanity with:
  - Clear thesis, scannable structure, local relevance
  - Town entity mentions where appropriate
  - Proper SEO title/description
- Success criteria: Editorial calendar documented; 3-5 posts live and rendering

**5. QA Pass**
- Verify town pages with new sections render correctly
- Verify FAQ accessibility (keyboard navigation, heading structure)
- Verify new Insights posts render with correct metadata
- No compliance regressions (brokerage name/contact + Fair Housing)
- Success criteria: All new content displays correctly; no regressions

**Success Criteria (Ticket 13 Complete)**

- Town pages display expanded long-form content (lifestyle, market notes) with clean semantic headings
- Each town can display a set of FAQs pulled from Sanity
- Editorial calendar documented with sustainable publishing cadence
- Insights has 3-5 initial posts live
- No compliance regressions

### Ticket 14 — Production Deployment / Launch Prep

**Goal**: deploy to Vercel, complete QA and compliance verification, then enable indexing.

**Subtasks**

- Vercel deploy + staging review
- Desktop + mobile QA pass
- Compliance verification checklist
- Flip robots/indexing to allow crawling

**Success criteria**

- No critical UX issues on mobile/desktop
- Compliance verified
- Indexing enabled only after sign-off

---

## Roadmap: Remaining Work (Post–Ticket 13)

### Planner execution order (build-first; launch last)

You are **not ready to launch** yet. The roadmap is reordered so we continue building and polishing first, and treat launch/indexing as the final step:

- **Ticket 16** → **Ticket 18–19** → **Ticket 17** → **Ticket 15** → **Ticket 14**

### Ticket 16 — Data Modules (Pre-launch build)

**Goal**: Add high-trust, premium “data modules” to Town/Neighborhood pages without clutter or accuracy risk.

### Competitive Notes (from Westport examples)
Both example sites emphasize:
- **Demographics snapshot** (population, age, income) with a “data provided by the U.S. Census Bureau” label
- **Walkability / bikeability** scores
- **Nearby points of interest** (restaurant/shopping/etc.) sourced from Yelp-like feeds
- **Schools list** (basic directory-style list)
- **Property listings/search** (IDX/search UI)

Our advantage: keep this **cleaner** and **more trustworthy** with (a) fewer but better modules, (b) always-visible sourcing + dates, and (c) “outside-the-box” modules that answer real buyer/seller questions.

### Proposed Data Module Library (Town + Neighborhood)
**Module UI standard (all modules)**
- Title + 1-sentence “why it matters”
- 3–6 key facts (chips or a compact table)
- “Source” + “Last updated” line (and optional “Method” disclosure)
- Conservative disclaimers where appropriate (times vary, boundaries may differ, verify with district/town)

#### A) “At a Glance” (top-of-page module cluster)
- **Town**: population, median household income, median age, owner-occupied %, median year built (where available)
- **Neighborhood**: smaller set + “Within {Town}” context; avoid over-precision if neighborhood stats are inferred
**Primary source (v1)**: US Census Bureau ACS (5-year).

#### B) Schools (expand to Town + Neighborhood)
**What we should display (v1, accuracy-first)**
- **Town page**:
  - District(s) serving {Town} + link(s)
  - Public schools in/serving {Town} grouped by level (Elementary / Middle / High)
  - For each school: name, grades, address, phone, website link, and a “CT School Report Card” link
- **Neighborhood page**:
  - “Nearby public schools” (within X miles of neighborhood center) grouped by level
  - Prominent note: “Nearby schools (not a guarantee of assignment) — verify with the district.”

**What we should avoid claiming until we have authoritative boundary data**
- “Assigned schools for this neighborhood” (unless we can cite district attendance-zone sources)
- Rankings/scores unless licensed and consistently sourced

**Candidate sources**
- NCES (school directory + basic facts)
- CT State Department of Education (Report Cards) for official context
- Optional later: GreatSchools / Niche (requires licensing/API + careful use)

#### C) Housing & Built Environment
- Housing units by type (single-family / multifamily / etc.)
- Owner vs renter share
- Median year built
**Primary source (v1)**: ACS housing tables.

#### D) Commute & Connectivity (buyer convenience)
- Closest Metro-North station(s) + approximate distance
- “Drive-time to” key anchors as ranges (not promises)
- Broadband availability snapshot (stretch goal)
**Sources**
- Distances/drive-time: geocoding + routing API (v1.5+; requires keys)
- Broadband (stretch): FCC broadband datasets (likely v2 due to complexity)

#### E) Lifestyle & Amenities (quantified local feel)
- Walk / bike score (if licensed/API)
- “Everyday essentials” counts: grocery, coffee, parks, gyms within X miles
- Top nearby parks/beaches/trails (curated editorial list with official notes/links)
**Sources**
- Walk Score API (if available)
- Yelp/Google Places API (v1.5+; requires keys)
- Town/parks official pages (manual, low-risk)

#### F) Taxes & Ownership Costs (high trust)
- Town mill rate + plain-English explainer (“how CT property taxes work”)
- Example estimates at 3 price points (clearly labeled as examples)
**Sources (v1)**: CT OPM mill rates and/or town assessor pages (links required).

#### G) Risk & Resilience (outside-the-box, buyer-relevant)
- Flood risk overview (e.g., “Portions may fall within FEMA flood zones”)
- Link to FEMA flood map + “Check an address” tool
**Sources (v1.5+)**: FEMA NFHL (API and/or official map links).

#### H) Market Snapshot (defer “real stats” until IDX/MLS-grade data)
- **v1 (pre-IDX)**: a curated “Market Notes” module (already in Sanity) + optional manually-updated “As of {Month Year}” mini-snapshot if Matt has a reliable source.
- **v2 (IDX/paid)**: median sale price, YoY %, days on market, list-to-sale ratio, months of supply, sales volume, active inventory.
**Sources (v2)**: IDX provider / MLS feed / licensed vendor (TBD; compliance gated).

### Sourcing Strategy (Phased, to minimize risk)
- **Phase 1 (Ticket 16a: public + curated)**: ACS demographics/housing, school directory + CT report card links, town mill rate, curated amenities list. Always show source+date.
- **Phase 2 (Ticket 16b: API enrichment)**: walk/bike score, POI counts, drive-time ranges, FEMA flood lookups (requires API keys + caching).
- **Phase 3 (Ticket 16c: market stats)**: MLS-grade market snapshots + listings modules (tied to Ticket 15).

### Cost / Licensing Reality Check (Free-first plan)
**Goal**: keep development + early production costs near $0 while still shipping useful, trustworthy modules.

**Free / government sources (good for v1)**
- **US Census Bureau (ACS 5-year)**: free (demographics + housing).
- **NCES school directory**: free (school names/addresses/grades, basic facts).
- **CT State Dept of Education report cards**: free (official context; we can deep-link rather than re-host data).
- **CT OPM / town assessor mill rates**: free (tax context; we must link + date).
- **Town / park / beach official pages**: free (curated “local anchors”).

**Likely paid / contract sources (optional; can defer)**
- **Walk Score / Transit Score / Bike Score**: has a **free tier** (good candidate for v1) but premium usage can be paid depending on needs/terms; premium pricing listed starting around **$115/month** (vendor-based). Source: Walk Score pricing page.
- **Yelp data (Places API / licensing)**: appears **paid for commercial use**, with plans starting around **$229/month** plus per-call overage (vendor-based). Source: Yelp data pricing page.
- **Google Places / Maps**: **paid usage** (pay-as-you-go SKUs); cost depends heavily on which endpoints (Nearby/Text Search, Details, Autocomplete) and traffic volume. We can keep costs low with caching + limiting fields, but it’s not “free” at scale. Source: Google Maps Platform pricing docs/calculator.
- **GreatSchools / Niche ratings**: typically require licensing/terms; treat as **paid/contract** unless confirmed otherwise.

**Practical recommendation**
- Ship **Phase 1** with only the free sources above.
- If we want POIs/drive-times, prefer a controlled “API enrichment” phase with strict caching and a hard budget cap.

### Ticket 16 Decisions (User-approved direction)
- **Free/government-first**: Yes (ACS + NCES + CT report cards + mill rates + curated official links).
- **Walk / bike / transit scores**: Yes, start with **Walk Score free tier**; add caching and clear “Source/Updated” labels. Walk Score pricing/tiers: `https://www.walkscore.com/professional/pricing.php`.
- **Yelp-powered POIs**: Defer (too expensive at start). Yelp pricing reference: `https://business.yelp.com/data/resources/pricing/`.
- **POIs alternative**: Use **Google Places** only if we can keep usage within a small budget (by aggressive caching + minimal fields). Pricing/docs: `https://mapsplatform.google.com/pricing-calculator/`, `https://developers.google.com/maps/documentation/places/web-service/usage-and-billing`.
- **GreatSchools/Niche ratings**:
  - Do **not** scrape/copy ratings and hardcode them without an explicit license/permission. Even “manual” copying at scale is typically still a ToS/licensing violation and creates legal/takedown risk.
  - v1 approach: show **official CT report card links** + a small set of clearly-defined official metrics (graduation rate, chronic absenteeism, assessment proficiency where available) if we can source them cleanly; otherwise link out and keep on-site summary qualitative.
- **IDX direction**: Prefer **API integration**. Build all listing/search UI against **mock data** behind a provider interface so we can plug in the chosen IDX vendor later without changing routes/components.

---

### Ticket 16 — Full Build Plan (handoff-ready)
This is the step-by-step implementation plan for building the “data features” system with the approved constraints:
- Start with **free/government sources**
- Add **Walk Score free-tier** (Walk/Bike/Transit)
- Add **Google Places POIs** with strict cost controls + **curated fallback**
- Build **IDX UI** now using **mock data** behind a provider interface; integrate real IDX feed later

#### 16.A — Scope lock (v1 modules)
**Town pages (`/towns/[townSlug]`)**
- At a Glance (ACS)
- Schools (directory + official links)
- Walk/Bike/Transit Score (Walk Score)
- Points of Interest (Google Places → fallback to curated)
- Taxes (mill rate)
- Market Notes (already in Sanity)
- Listings (IDX UI using mock provider)

**Neighborhood pages (`/towns/[townSlug]/[neighborhoodSlug]`)**
- At a Glance (town-level with a label; neighborhood-level demographics deferred)
- Nearby Schools (distance-based; not “assigned”)
- Walk/Bike/Transit Score (Walk Score)
- Points of Interest (Google Places → fallback to curated)
- “Within {Town}” Taxes link (town-level)
- Listings (IDX UI using mock provider)

**Deferred (explicitly not planned yet)**
- GreatSchools/Niche ratings
- Yelp POIs
- MLS-grade market statistics + real listings feed (depends on IDX/MLS compliance and chosen vendor)

**Success criteria**
- A v1 checklist exists and each module renders consistently on all Town pages and all Neighborhood pages (with graceful fallbacks).

---

#### 16.B — Core architecture (providers + caching + UI wrapper)
**B1) DataModule UI wrapper**
- Create a reusable module wrapper component (e.g., `DataModule`) that enforces:
  - title + optional “why it matters” line
  - a content slot (table/list/chips)
  - a footer: **Source** + **Last updated** + optional “Method” disclosure link/tooltip
- This wrapper is used by every module so the site stays premium and consistent.

**B2) Provider interfaces (swap sources without UI rewrites)**
- Create provider interfaces for:
  - `AtAGlanceProvider` (ACS)
  - `SchoolsProvider` (directory + official links)
  - `WalkScoreProvider`
  - `PlacesProvider` (Google Places)
  - `ListingsProvider` (mock now, IDX later)
- UI components only talk to the provider interfaces (not to vendor APIs directly).

**B3) Persistent caching (to control costs)**
Because serverless caches aren’t durable, store API snapshots in **Sanity**.
Add a new schema type:
- `dataCacheEntry`
  - `key` (unique string; e.g., `walkscore:town:westport`)
  - `provider` (`walkscore` | `googlePlaces` | `acs` | `schools` | `listingsMock`)
  - `scope` (`town` | `neighborhood`)
  - `town` ref (required)
  - `neighborhood` ref (optional)
  - `payload` (JSON)
  - `fetchedAt`, `expiresAt` (datetimes)
  - `sourceUrl` (optional)
- Fetch rules:
  - use cache if not expired
  - otherwise fetch → write cache → return payload

**Success criteria**
- Walk Score and Places do not fire on every page view; cached results are reused for a defined TTL.

---

#### 16.C — At a Glance (ACS) implementation plan
**Data source**: US Census Bureau ACS 5-year (free).

**Town data model (v1 fields)**
- population
- median age
- median household income
- owner-occupied %
- median year built
- `asOf` (ACS vintage/year) + `sourceName`

**Neighborhood display rule (v1)**
- Show the **town** snapshot on neighborhood pages with a label:
  - “Town-level snapshot (neighborhood-level data varies).”

**Implementation method (cheapest/stablest)**
- Use a build-time script that produces a committed JSON file for the 9 towns (manual refresh monthly/quarterly).
- Render from that JSON (no runtime API calls).

**Success criteria**
- All towns show At a Glance; neighborhood pages show the town snapshot + label.

---

#### 16.D — Schools module (directory + official links) implementation plan
**Goal**: useful, accurate, and defensible without paid ratings.

**Town page**
- Group schools by level: Elementary / Middle / High.
- Each row/card includes: name, grades (if available), address, phone, website link, **CT Report Card link**.

**Neighborhood page**
- “Nearby public schools” using distance-to-neighborhood-center.
- Must include disclaimer: “Nearby schools are not a guarantee of assignment. Verify with the district.”

**Data sources (free)**
- NCES directory for baseline info
- CT DOE report cards (deep links; don’t re-host if it’s messy)

**Implementation method (v1)**
- Start with a curated canonical list per town (either in code JSON or in Sanity) to avoid NCES “false positives” during development.
- Optionally reconcile to NCES IDs later.

**Success criteria**
- Town pages show consistent, correct school lists with official links.
- Neighborhood pages show “nearby schools” (or gracefully fall back if neighborhood lacks coordinates).

---

#### 16.E — Walk/Bike/Transit Score implementation plan
**Source**: Walk Score API (free tier). Pricing/tiers: `https://www.walkscore.com/professional/pricing.php`.

**Inputs required**
- A representative **lat/lng** for each town and neighborhood.

**Caching**
- Cache per town/neighborhood with a long TTL (e.g., 30 days).

**Display**
- 3 score chips (Walk/Bike/Transit) + label text if provided.
- Source + last updated in module footer.

**Success criteria**
- Scores display for all towns; neighborhoods display where a coordinate exists.

---

#### 16.F — Points of Interest (Google Places) implementation plan
**Primary**: Google Places (paid, but controllable).
- Pricing calculator: `https://mapsplatform.google.com/pricing-calculator/`
- Usage/billing docs: `https://developers.google.com/maps/documentation/places/web-service/usage-and-billing`

**Fallback (always available, $0)**
- Curated POIs stored in Sanity (per town/neighborhood), “Matt’s picks”:
  - category, name, short note, external link

**Strict cost controls**
- Server-side only (no client key exposure)
- Cache results in Sanity with a long TTL (weekly/monthly)
- Max 6 results per category
- Minimal fields (only what we display)
- Limit categories in v1 (e.g., Coffee, Restaurants, Parks/Trails)

**Neighborhood method (v1)**
- Use neighborhood “center” coordinate and label results as “nearby”.

**Success criteria**
- POIs module always renders:
  - Places results if available/cached
  - otherwise curated fallback list

---

#### 16.G — Taxes (mill rate) implementation plan
**Sources (free)**: CT OPM and/or town assessor pages (link required).

**Display**
- Mill rate value + “What this means” explainer.
- Optional example taxes at 3 price points (clearly labeled as examples).
- Source + last updated.

**Success criteria**
- Each town page displays mill rate with an official link and date.

---

#### 16.H — IDX UI with mock data (API-first) implementation plan
**Goal**: build the listing experience now; swap in real IDX later.

**H1) Define the internal listing contract (mock schema)**
Minimum `Listing` fields:
- id, status (active/pending/sold)
- address (street/city/state/zip)
- price, beds, baths, sqft
- propertyType
- photos[] (supports placeholders)
- lat/lng (optional for future map)
- mlsNumber (optional)
- attribution/courtesy fields (reserved for compliance later)
- listedAt, updatedAt

**H2) Provider interface**
Implement a `ListingsProvider` with methods like:
- `searchListings({ scope, slug, filters, pagination })`
- `getListingById(id)`
- `getAvailableFilters()`

Providers:
- `MockListingsProvider` (v1)
- `IdxListingsProvider` (later; depends on vendor)

**H3) UI components to build now**
- Filters: price range, beds, baths, property type, status
- Sort: price, newest
- Listing cards grid (photo, price, address, key facts)
- Pagination / load more
- Listing detail page skeleton (gallery, facts, CTA, disclaimer placeholder)
- Town/neighborhood “Listings” section that uses the provider

**H4) Future compliance hooks**
- Reserve UI space for MLS attribution + “data deemed reliable but not guaranteed” language.
- Ensure `Listing` includes attribution fields so we don’t refactor later.

**Success criteria**
- Listings UI works end-to-end using mock data on Town + Neighborhood pages.
- Provider swap does not require UI rewrites.

---

#### 16.I — QA checklist (what the executor must verify)
- Every module shows **Source** + **Last updated**.
- No API keys appear in browser/devtools.
- Places/Walk Score calls are cached (Sanity cache entries created and reused).
- Neighborhood school disclaimer is present.
- POIs fallback works when Places is disabled/unavailable.
- Listings UI works with mock data and handles empty results gracefully.

---

#### 16.J — Required schema + content prerequisites (so APIs can work)
**Why this matters**: Walk Score + Google Places require **coordinates**. Neighborhood pages also need a “center” coordinate for “nearby” logic.

**J1) Add coordinates to Town + Neighborhood schemas**
- Add `center` (Sanity `geopoint`) to:
  - `town`
  - `neighborhood`
- Naming: `center` (single source of truth for all geo-based modules).
- Validation:
  - Optional at schema level (so Studio doesn’t block publishing), but executor must handle missing centers gracefully.

**J2) Add curated POI fallback fields in Sanity**
Add to both `town` and `neighborhood` (or create a reusable object type):
- `curatedPois` (array)
  - each item: `{ category, name, note?, url? }`
- Categories (enum): `coffee`, `restaurants`, `parksTrails`, `shopping`, `fitness`, `family`

**J3) Minimum content entry rules**
- For each of the 9 towns: set `center` at least (town hall/downtown coordinate is fine).
- For neighborhoods: set `center` for the neighborhoods you want geo-features on first; missing centers should show fallback-only behavior.

**Success criteria**
- Town and neighborhood documents support geo-powered modules without requiring any paid boundary datasets.

---

#### 16.K — Environment variables, secrets, and feature flags (cost control)
**Principle**: no keys in the browser; all API calls server-side.

**K1) Env vars (expected)**
- `WALKSCORE_API_KEY` (server-only)
- `GOOGLE_MAPS_API_KEY` (server-only; restricted by API + referrer/IP where possible)

**K2) Feature flags**
Implement simple toggles so we can ship safely even if keys aren’t present:
- `DATA_ENABLE_WALKSCORE=true|false`
- `DATA_ENABLE_GOOGLE_PLACES=true|false`
- `DATA_ENABLE_LISTINGS=true|false` (mock listings can stay true in dev)

**K3) Safe defaults**
- If any key is missing, the module should **render** but use fallback:
  - Walk Score: “Score data coming soon” + source label explaining it’s unavailable.
  - POIs: curated fallback list only.

**Success criteria**
- Site runs in development with zero paid keys configured.
- Turning on keys enables enhancements without code changes.

---

#### 16.L — Cache key conventions + TTL policy (prevents accidental overspend)
**Key format**
`{provider}:{scope}:{townSlug}:{neighborhoodSlug?}:{variant}`
Examples:
- `walkscore:town:westport:v1`
- `walkscore:neighborhood:westport:saugatuck:v1`
- `places:town:westport:coffee:v1`
- `places:neighborhood:westport:saugatuck:parksTrails:v1`

**Recommended TTLs**
- Walk Score: 30 days
- Places POIs: 14–30 days (weekly/monthly refresh)
- ACS (JSON file): manual refresh cadence (monthly/quarterly) + embedded `asOf`
- Schools (curated list): manual refresh as needed

**Manual refresh**
- Provide a simple internal admin-only “refresh” route later if needed (not required for v1; can be CLI/script).

**Success criteria**
- Cache entries are stable and predictable; no accidental “cache key drift” multiplying calls.

---

#### 16.M — Google Places “strict budget mode” (implementation guardrails)
**Rules**
- Never call Places from the client.
- Only fetch for a small, fixed set of categories in v1.
- Hard-limit results to 6 per category.
- Use minimal fields only.
- Never refresh more frequently than TTL unless manually triggered.

**Operational note**
- During early development, disable Places by default; only enable once caching is verified end-to-end.

**Success criteria**
- Places usage stays bounded by: `towns + (neighborhoods with centers) × categories × refreshes`.

---

#### 16.N — IDX UI implementation details (so the agent can build without decisions)
**Routing plan**
- Town listings section remains inside `/towns/[townSlug]` (no new route needed for v1).
- Neighborhood listings section remains inside `/towns/[townSlug]/[neighborhoodSlug]`.
- Add a dedicated listing detail route only if desired later (optional): `/listings/[listingId]`.

**UI behavior spec (v1)**
- Default view: grid of cards.
- Filters:
  - Price range (min/max)
  - Beds (min)
  - Baths (min)
  - Property type (multi-select)
  - Status (active/pending/sold) — default active
- Sorting:
  - Newest (default)
  - Price (low→high, high→low)
- Pagination:
  - Page-based or “Load more” (either is fine; pick one and keep it consistent)

**Empty state**
- “No listings match your filters” + one-click “Reset filters”.

**Success criteria**
- Fully interactive listings UI on both Town + Neighborhood pages using mock provider.

---

#### 16.O — Suggested file/dir layout (implementation map)
This is to keep code organized and future IDX/provider swaps easy.

- `app/components/data/`
  - `DataModule.tsx`
  - `AtAGlanceModule.tsx`
  - `SchoolsModule.tsx`
  - `WalkScoreModule.tsx`
  - `PoisModule.tsx`
  - `TaxesModule.tsx`
- `app/lib/data/`
  - `providers/` (interfaces + implementations)
    - `atAGlance.provider.ts`
    - `walkscore.provider.ts`
    - `places.provider.ts`
    - `schools.provider.ts`
    - `listings.provider.ts`
    - `mockListings.provider.ts`
  - `cache/`
    - `sanityCache.ts` (get/set with TTL)
  - `geo/`
    - `distance.ts` (distance calc for “nearby schools”)
- `app/data/`
  - `acs/` (generated JSON snapshots)
  - `schools/` (curated JSON if not in Sanity)
  - `listings/` (mock listing JSON)

**Success criteria**
- The implementation is modular, and each module can be swapped/extended without touching page layout logic.

---

#### 16.P — Executor sequencing checklist (do in this order)
This is the recommended step-by-step order for an implementation agent (Opus) to follow.

- [ ] **P1: Schema updates (Sanity)**: add `center` geopoint + `curatedPois` to Town and Neighborhood; add `dataCacheEntry` type.
- [ ] **P2: Cache utilities**: implement Sanity cache read/write with TTL + key conventions.
- [ ] **P3: DataModule wrapper**: build the shared UI wrapper and confirm styling.
- [ ] **P4: At a Glance**: generate ACS JSON for 9 towns + render Town + Neighborhood (town-level label).
- [ ] **P5: Schools**: add curated school data + render Town list; implement Neighborhood “nearby schools” using centers + disclaimer.
- [ ] **P6: Walk Score**: provider + caching + Town/Neighborhood display; graceful fallback if disabled/missing.
- [ ] **P7: POIs**: curated fallback first; then Google Places provider + caching + category tabs with strict limits.
- [ ] **P8: Taxes**: mill rate data source + module rendering + official links + last updated.
- [ ] **P9: Listings UI**: define listing contract + mock provider + filters/sort/pagination + empty state.
- [ ] **P10: Wire modules into pages**: Town page + Neighborhood page section order and spacing; ensure “no clutter” aesthetic.
- [ ] **P11: QA pass**: run through 16.I checklist; verify caching works and no keys leak.

**Done definition**
- Ticket 16 is “complete” when P1–P11 are complete and verified, even without real IDX feed or paid ratings providers.

### How We’ll Display It (premium + “LLM-readable”)
- Use consistent section headings: “Schools”, “Demographics”, “Housing”, “Commute”, “Lifestyle”, “Taxes”, “Risk & Resilience”, “Market”
- Each module includes: **Source**, **Last updated**, and (when needed) a short “Method” disclosure
- Prefer clean cards + compact tables over dashboards; add charts only when we have dependable time-series data

**Subtasks (Planner breakdown)**
- Finalize v1 module set (Town + Neighborhood) with exact field lists + disclaimers per module
- Decide specific data sources per module and what’s automatable pre-launch
- Define neighborhood handling (radius-based “nearby” vs authoritative boundary-based) and lock wording standards
- Implement a reusable “DataModule” UI pattern (card/table) + standard “Source/Updated” footer
- Optional: add a “Data & Sources” page describing methodology and definitions

**Success criteria**
- Town/Neighborhood pages gain useful modules that are clearly sourced and dated
- No compliance/accuracy risk introduced; no visual clutter

### Ticket 18 — Investing / Commercial Pages (Pre-launch build)

**Goal**: Expand investor credibility without diluting the primary residential brand.

**Subtasks**
- Expand `/services/investing` into a premium editorial page (aligned voice + CT specificity)
- Decide whether “Commercial” is a separate page or a section within investing
- Add appropriate CTAs (discreet, high-intent)

**Success criteria**
- Page(s) feel premium and aligned with Matt’s positioning (finance + investor experience)
- Clear service scope; no unverifiable performance claims

### Ticket 19 — Live Chat + AI Chatbot (Post-Launch; optional)

**Goal**: Improve lead capture and responsiveness without harming premium UX.
**Status**: Deferred to post-launch.
- Implement human escalation (email/SMS) if desired

**Success criteria**
- Chat feels premium (not intrusive), captures leads, and escalates reliably

### Ticket 17 — Video Strategy (Pre-launch build)

**Goal**: Design a repeatable, premium, **AI-first** video system that increases trust and conversion (subtle CTAs) while staying performance-safe and compliance-safe.

#### What we already have (confirmed)
- `studio/schemaTypes/town.ts` has `videoEmbedUrl` (URL)
- `studio/schemaTypes/neighborhood.ts` has `videoEmbedUrl` (URL)
- `studio/schemaTypes/post.ts` does **not** have video fields yet

#### Strategy decisions (Planner)
- **Primary use**: Trust + “orientation” videos (town + services), not entertainment.
- **UX posture**: Poster + play, *never* a heavy embed on initial load.
- **AI-first production**: voiceover + curated visuals + captions; no requirement to film on-camera.

#### Video library (tiered)
- **Tier A (launch-critical, 4–6 total)**
  - Matt intro (45–75s)
  - Buy process (90–150s)
  - Sell process (90–150s)
  - Investing/Commercial overview (90–150s)
  - Optional: “Fairfield County market in 90 seconds” (60–120s)
- **Tier B (town authority, 9 total)**
  - Town videos (60–90s) for the 9 core towns
- **Tier C (scale content, optional)**
  - Neighborhood shorts (20–35s vertical) created from town template + 1–2 neighborhood specifics
  - Insight post explainer clips (45–90s) for selected posts only

#### Placement decisions (performance + UX)
- **Town pages** (`/towns/[townSlug]`):
  - Add a “Watch” module after the editorial overview and before dense modules (schools/POIs/etc.)
  - Default state: poster image with play button; optional “Transcript” collapsible below
- **Neighborhood pages** (`/towns/[townSlug]/[neighborhoodSlug]`):
  - Smaller “Neighborhood in 30 seconds” module; default collapsed on mobile (tap to open)
- **Service pages** (`/services/buy`, `/services/sell`, `/services/investing`):
  - One video per page near the top, but not in the hero (avoid clutter/CLS)
- **Insights posts** (`/insights/...`):
  - Optional per-post; if present, place after the intro paragraph as a “Watch” callout
- **Homepage**:
  - Optional “Meet Matt” poster + modal (do not autoplay)

#### Hosting recommendation (plan)
- **Preferred**: Vimeo for the on-site embed (premium player, fewer brand distractions).
- **Secondary**: YouTube for discoverability (optional channel growth), but embed only if Vimeo budget is not available.
- **Avoid**: Self-host for v1 (bandwidth + adaptive streaming + device QA burden).

#### Technical design spec (performance-safe)
**Principles**
- No heavy iframe embeds in SSR/initial render.
- Zero CLS: fixed aspect ratio container (16:9; vertical 9:16 for shorts).
- Lazy load iframe on interaction only (click/tap).
- Use `next/image` for posters, with explicit `sizes` and stable layout.

**Preferred playback pattern**
- Poster card with “Play” button
- On click:
  - Inline replace on desktop *or* open a modal/lightbox (modal recommended for consistency + focus)
  - Inject iframe only after interaction

#### CMS workflow plan (Sanity)
**Phase 1 (no schema changes; fastest)**
- Use existing `videoEmbedUrl` on `town` + `neighborhood`.
- Posters come from existing town/neighborhood imagery (or a generic poster) until we add poster fields.
- No transcripts stored yet (page may include a short “Key takeaways” text block).

**Phase 2 (recommended schema upgrade for SEO/LLM readiness)**
Add a reusable `video` object used by Town/Neighborhood/Post:
- `video` (object)
  - `provider` (string enum: `youtube` | `vimeo`)
  - `embedUrl` (url, required when `video` is present)
  - `title` (string)
  - `durationSeconds` (number)
  - `poster` (image) with alt text
  - `transcript` (array of blocks) OR `transcriptText` (text)
  - `captionsUrl` (url, optional)
  - `uploadDate` (datetime, optional)
Validation:
- Require HTTPS URL
- Provider must be selected if embedUrl exists
- If used on Town videos: transcript recommended (warning-level guidance; don’t block publishing)

#### AI-first production workflow (repeatable)
**Batch approach (1 session = multiple towns)**
- Script → voiceover → captions/transcript → assemble visuals → export → upload → paste embed URL → publish.
Notes:
- Prefer “voiceover + elegant motion typography + licensed b-roll + maps + still photography” over AI-talking-head.
- Captions always on (burned-in or via platform), plus transcript on page for accessibility + LLM readability.

#### Compliance/voice guardrails (non-negotiable)
- No guarantees or performance claims.
- Town claims must be phrased as “known for” / “often” / “many buyers appreciate” (no absolutes).
- Schools: never imply assignment certainty; use “verify with the district.”
- Home value: avoid appraisal language; if mentioned, always “estimate/starting point.”

#### Minimal implementation plan (phased)
- **17.A Strategy lock**: confirm tiers, placement, hosting choice, and the “AI-first” workflow.
  - Success criteria: single approved strategy + cadence + template list.
- **17.B Design spec**: define component behavior (poster, modal, aspect ratio), and page placements.
  - Success criteria: wireframe-level spec for Town/Neighborhood/Service/Insights placements.
- **17.C CMS plan**: choose Phase 1 vs Phase 2 schema direction; list exact fields + editor instructions.
  - Success criteria: schema change list and editor workflow documented.
- **17.D Script templates**: deliver reusable templates in Matt’s voice + disclaimers.
  - Success criteria: templates ready to produce videos with minimal custom edits.

#### Open questions (only the ones that matter)
- Budget preference: Vimeo embed for site (preferred) vs YouTube-only.
- Comfort level: synthetic voice (AI) vs recorded voice (real). If synthetic: do we want a voice clone of Matt?
- Initial rollout priority: which 3 towns first for Tier B (recommended: Greenwich, Westport, Darien).

#### Ticket 17 — User decisions (2026-02-02)
- Hosting: **YouTube** (user familiarity + perceived professionalism).
- Priority order: **Town videos first (Greenwich, Westport, Darien)** → then Service videos (Buy/Sell/Investing) → then optional Neighborhood shorts.
- Insights videos: **not planned**.

#### Video production plan (AI-first, premium, low-friction)
We will treat videos as **voice-led micro-documentaries**:
- Voiceover (Matt recorded, preferred) + premium b-roll / stills + subtle motion typography
- Always captions + transcript (LLM-readable)
- Never “hype” claims; compliance-safe language

**Three viable production approaches**
1) **Fastest / simplest (recommended to start)**
   - Matt voiceover + still images/b-roll montage + on-screen headings + captions
2) **Avatar presenter (optional)**
   - AI avatar speaking Matt script + supporting b-roll
3) **Generative b-roll (optional)**
   - Text-to-video shots for “mood” scenes + real imagery overlays + voiceover

**Batch workflow**
- Write scripts in one batch (3 towns)
- Record VO in one sitting
- Generate captions/transcripts
- Assemble with reusable template (same intro/outro/music/typography)

### Ticket 15 — IDX Integration (Pre-launch build; gated by compliance)

**Goal**: Deliver a **luxury, portal-like** home search experience now using **mock data**, with an architecture that allows swapping to real IDX data later **without redesigning routes or UI**.

#### Key product decisions (Planner lock)
- **Home Search page**: Dedicated route for a “Zillow/Realtor-like” experience (clean filters + map + results list).
- **Town/Neighborhood pages**: Add **map embeds** that default to **Active + Pending** within that town/neighborhood.
- **Saved homes + saved searches**: Must exist in v1.
- **User accounts (profiles)**: Plan for it, but do not let it block launch if we can deliver an excellent “saved” experience without login.
- **Luxury aesthetic constraint**: Must match the site’s editorial/luxury styling (no generic “AI looking” icons/colors). Keep UI calm, minimal, and consistent with the existing palette/typography.

---

## Ticket 15.A — “Home Search” + Maps + Saves (Mock Data, Pre-IDX Agreement) (PLANNED)

### Ticket 15.A Phasing (do in this order; same ticket)
We will build this in **two phases inside the same ticket** to avoid duplicate implementations while keeping risk low:

- **Phase 1 (core)**: Build `/home-search` end-to-end (filters + map + right-side results panel + listing detail modal + favorites + inquiry + saved searches + address autocomplete).
- **Phase 2 (embeds)**: Reuse the same components to add **smaller map embeds** on Town and Neighborhood pages, pre-scoped to that town/neighborhood with **Active + Pending** as defaults.

**Success criteria**
- Phase 1 is stable and polished before Phase 2 begins; Phase 2 introduces no UX regressions to `/home-search`.

### A1) Routes & navigation
- Add a dedicated page: **`/home-search`** (“Home Search”)
- Add nav entry in header: **Buy → Home Search** (or top-level “Home Search” if preferred)
- Ensure SEO metadata is present and consistent with luxury tone (no hype language)

**Success criteria**
- `/home-search` exists, is reachable from nav, and matches site typography + spacing conventions.

### A2) Upgrade the internal listings contract for “portal search”
The existing provider contract supports town/neighborhood scopes. The Home Search page needs broader queries.

**Extend the provider contract to support:**
- **scope**: add `'global'` (in addition to `town | neighborhood`)
- **location filters**:
  - `townSlugs?: string[]`
  - `neighborhoodSlugs?: string[]`
- **map viewport**:
  - `bounds?: { north: number; south: number; east: number; west: number }`
- **text query (optional v1)**:
  - `q?: string` (address keyword, neighborhood keyword, etc.)

**Add address autocomplete support (required for v1 UX)**
- Add a provider-level autocomplete capability so we can swap mock → IDX later without rewriting UI logic:
  - `suggestListings(params: { q: string; townSlugs?: string[]; status?: ListingStatus[]; limit?: number }): Promise<Listing[]>`
- Behavior:
  - matches partial input against listing street address (primary), plus city/zip as secondary
  - returns only listings within our dataset universe (mock now, IDX later)
  - respects status filter (active/pending/sold) and optional town restriction
  - returns results ordered by “best match” then recency

**Success criteria**
- Autocomplete results can be fetched without loading the entire dataset into the UI layer; mock provider implements it now; IDX provider can implement it later.

**Provider behavior rules (v1)**
- If `bounds` present, filter results to listings with lat/lng inside bounds.
- If no `bounds`, default results to the chosen towns/neighborhoods (or “all covered towns”).

**Success criteria**
- Mock provider implements new params with predictable results; UI can request “global + bounds”.

### A3) Mock dataset expansion for credibility
The current mock data is too small to feel like a real portal search.

**Dataset goals (v1)**
- Include **Active / Pending / Sold** across **all 9 towns**
- Include enough volume for realistic filtering:
  - At least **25–40 listings per town** (mix of statuses and property types)
  - At least **3–6 neighborhoods per town** represented (where neighborhoods exist)
- Every listing must have:
  - `town` derivable (currently `address.city`) and `address.neighborhood` (slug)
  - **lat/lng** (required for map)
  - at least 1 photo path (should be realistic — see photo library plan below)

**Sample listing photo library (required for v1 realism)**
- Create a small, tasteful library of **royalty-free** home photos (exteriors + interiors) and commit them into `public/visual/listings/`.
- Use sources with clear commercial-friendly licenses (e.g., Unsplash / Pexels) and keep a small attribution log in-repo.
- Target: **24–40 images total**, curated to match the site’s luxury/editorial tone (no “cheap realtor stock”).
- Update mock listings so:
  - each listing has **3–8 photos** selected from the library
  - photos feel consistent (balanced mix of exterior/front + kitchen/living + bedroom + bathroom)
  - optional: a small set of “hero” images for higher-priced listings

**Success criteria**
- Home Search + listing detail modal feel real because photos are varied and high-quality; no licensing ambiguity.

**Success criteria**
- Home Search can show meaningful pagination and map density in every town.

### A4) Home Search page UX (luxury portal)
**Layout (desktop)**
- **Top filter bar** (sticky within page):
  - “Home Search” label + subdued subhead (Fairfield County / towns covered)
  - Filters row (compact, high quality) **above the map**
  - **Address search bar (with autocomplete)**:
    - placeholder example: “Search by address…”
    - results show matching listing address + town + status chip + price
    - selecting an autocomplete item opens the **Listing Detail Modal** for that listing
  - Status tabs (Active/Pending/Sold)
  - Price range
  - Beds, Baths
  - Property type
  - Town and Neighborhood (searchable select; neighborhood list depends on town)
  - Sort
- Secondary actions:
  - “Save search”
  - “View saved”

- **Main canvas** (below filter bar):
  - **Map** fills the canvas (luxury, uncluttered)
  - **Results panel** appears on the **right side** once a search is triggered:
    - Wide, scrollable panel
    - Grid is **2 cards per row**
    - Shows total count + sort summary
    - Infinite scroll or pagination inside panel (implementation choice; keep UX smooth)

**Layout (mobile)**
- Toggle: **List / Map**
- Filters open as a drawer/sheet with clean spacing

**Behavior**
- Map move triggers “Search this area” button (not constant refetch)
- Click listing highlights pin; click pin highlights listing
- URL is shareable and reflects filters (query string)

**Success criteria**
- UX feels intentional and premium; map/list interactions work on desktop + mobile; URL deep links reproduce the same search state.

### A4.2) Address autocomplete (detail spec)
**Goal**: As the user types an address, show a small, premium dropdown of matching listings from our listings data.

**v1 data source**
- Autocomplete matches against the **current listings universe** (mock listings now; real IDX later).
- No external geocoding/autocomplete services in v1 (keeps cost and legal complexity down).

**Matching rules (v1)**
- Case-insensitive prefix/substring match against:
  - `address.street` (primary)
  - `address.city`, `address.zip` (secondary)
- If multiple matches, order by:
  - street match quality (prefix > substring)
  - then `updatedAt`/`listedAt` recency

**UX rules (luxury)**
- Debounced input (e.g., 150–250ms), minimal animation, no loud icons.
- Dropdown:
  - max 6–8 items
  - keyboard support: up/down + enter
  - “No matches” empty state (subtle)

**Action**
- Clicking (or Enter) on a suggestion immediately opens the **Listing Detail Modal** for that listing.

**Success criteria**
- Autocomplete feels fast and polished; selecting a result opens the correct listing modal; no janky reflows; works on mobile.

### A4.1) Listing Detail Modal (Zillow-style) + favorite + Matt inquiry CTA (required)
When a user clicks a listing from the map or results list, open a **Listing Detail Modal** that overlays the Home Search page (over the map), similar to the detail windows on Zillow/Realtor.

**Modal behavior (v1)**
- Desktop: **centered modal** with dimmed backdrop; scrollable interior; preserves underlying search state.
- Mobile: full-screen sheet/modal with sticky actions at bottom.
- Close restores user to the same map/list position and selection.

**Modal content (v1)**
- **Prominent image gallery**:
  - large hero image + thumbnail strip or carousel controls
  - shows the listing’s `photos[]` (from the sample library in mock mode; from IDX later)
- Status chip + price + address (clear hierarchy)
- Key facts row: beds/baths/sqft/property type
- Secondary details section (v1 mock-friendly, IDX-ready):
  - “Listed” date and “Updated” date
  - Neighborhood label (if present)
  - MLS number field reserved (optional in mock)
- Primary action: **Favorite** (save/unsave) with subtle iconography (luxury, not loud).
- Primary CTA: **Matt inquiry card** inside the modal:
  - Matt headshot next to copy
  - Button label example: **“Contact Matt today about {street address}”**
  - On mobile, show a secondary CTA: **“Call Matt”** → `tel:914-325-6746`

**Inquiry flow (2-step, no-login required)**
- Step 1: user types optional comments/questions about the selected listing.
- Step 2: user provides contact details and sends:
  - name, email, phone (recommended), optional preferred contact method
  - includes the comment + listing context automatically
- Submission storage:
  - store to Sanity via the existing lead pipeline (preferred)
  - tag as:
    - `source: "listing-inquiry"`
    - `listingId`, `listingAddress`, `listingStatus`, `listingPrice`
    - `searchContext` (filters/town/neighborhood/bounds when available)

**Success criteria**
- From map → listing detail modal → favorite → inquiry submit works end-to-end; on mobile “Call Matt” is one tap; visuals feel premium and consistent with site design.

### A5) Map implementation approach (v1)
Use **Leaflet + OpenStreetMap tiles** for v1 to avoid paid map keys while we’re still on mock data.

**Map capabilities (v1)**
- Marker clustering at medium zoom (optional; recommended if dataset is large)
- Minimal, custom marker styling (no loud default icons)
- Hover/selection states that feel “luxury” (subtle ring/glow, muted colors)

**Success criteria**
- Map renders fast, matches site theme, no layout shift, no exposed API keys.

### A6) Saved homes (“Like”)
We need a **save/heart** affordance without making the site feel like a discount consumer portal.

**v1: No-login required**
- Store saved listing IDs in **local storage**.
- Provide a “Saved” panel showing saved listings.
- Allow easy remove/un-save.

**v1.1: Optional account sync (planned)**
- If user signs in, sync saved items to their profile (see A8).

**Success criteria**
- A user can save/unsave listings; their saved list persists across refreshes; UI stays premium (no gaudy icons).

### A7) Saved searches
**v1: No-login required**
- Save the current filter state as a named saved search in local storage.
- Saved searches list shows:
  - name
  - summary chips (towns, price range, beds, status)
  - “Run search” (restores URL state)
  - delete

**v1.1: Optional account sync (planned)**
- Signed-in users can sync saved searches to profile.

**Success criteria**
- Users can save, re-run, and delete saved searches without login.

### A8) Authentication + profiles (planned, phased — do not block v1)
We plan for accounts because cross-device persistence and future IDX features (alerts, notes, etc.) will require it.

**Phased strategy**
- **Phase 1 (launch-safe)**: Saved homes/searches in local storage (no auth).
- **Phase 2 (accounts)**: Add optional sign-in to sync data across devices.

**Auth requirements (technical)**
- Must support **passwordless email login (magic link)** to keep UX premium and low-friction.
- Must work with App Router and be reliable on Vercel.

**Data model (for Phase 2)**
- `User` profile (id, email, createdAt)
- `SavedListing` (userId, listingId, createdAt)
- `SavedSearch` (userId, name, params JSON, createdAt, updatedAt)

**Storage decision (Planner decision needed before implementation of Phase 2)**
- Option A: Auth.js/NextAuth + Vercel Postgres (simple “native stack” on Vercel)
- Option B: Supabase (auth + database in one; strong magic link story)
- Option C: Clerk (fastest hosted auth UX; store saved data in Postgres/Supabase)

**Success criteria**
- Phase 2 design is documented enough that the executing agent can implement it without revisiting architecture.

### A9) Town + Neighborhood pages: map embeds
Add a **compact listings map** module to:
- `/towns/[townSlug]`
- `/towns/[townSlug]/[neighborhoodSlug]`

**Defaults**
- Filters default to **Active + Pending**.
- The map is pre-scoped to that town/neighborhood; include a “View full Home Search” link that passes context.

**Success criteria**
- Town/Neighborhood pages show a map that feels integrated (not bolted-on) and defaults correctly.

### A10) Luxury UI polish pass (explicit requirement)
The existing listings UI uses default-looking SVG icons and loud status colors. The Home Search experience must feel bespoke and aligned with the current design system.

**Polish checklist**
- Replace generic icons with a minimal, consistent icon set (stroke width, size, alignment).
- Remove “portal-ish” bright blues/greens/reds; use restrained neutrals + a single accent aligned with site branding.
- Improve listing cards: typography hierarchy, whitespace, image treatment, hover states.
- Ensure filters feel like the rest of the site (not “dashboard controls”).

**Success criteria**
- A designer-looking UI: calm, premium, consistent with existing header/footer and editorial pages.

### A11) Executor build sheet (Ticket 15.A) — step-by-step (stop after each step for review)
This is the execution order we will hand to the executing agent. The agent should complete **one checkbox at a time**, verify the success criteria locally, then stop for Planner review.

- **Phase 1 (core `/home-search`)**
- [x] **15A-1: Add `/home-search` route (skeleton + metadata + nav link)**
  - Success criteria: route renders, nav link works, no layout regressions.
- [x] **15A-2: Extend listings provider contract for global search + bounds**
  - Success criteria: TypeScript contract supports `scope: global`, optional towns/neighborhoods, and `bounds`.
- [x] **15A-3: Update mock provider to implement global + bounds filtering**
  - Success criteria: changing bounds changes results deterministically; no crashes when bounds absent.
- [x] **15A-4: Expand mock listings dataset (volume + lat/lng + neighborhoods across towns)**
  - Success criteria: each town produces enough results for pagination and map density.
- [x] **15A-4B: Add sample listing photo library + wire into mock listings**
  - Success criteria: 24–40 royalty-free photos exist in `public/visual/listings/`; mock listings have 3–8 photos each; listing detail modal gallery looks realistic.
- [x] **15A-5: Build luxury Home Search UI (filters + results list + map pane)**
  - Success criteria: desktop split view works; mobile list/map toggle works; no “dashboard-y” styling.
- [x] **15A-5B: Listing Detail Modal (gallery + favorite + Matt inquiry card + click-to-call)**
  - Success criteria: clicking a listing opens a premium listing detail modal over the map; favorites work; inquiry card displays Matt headshot and uses the listing address; mobile shows “Call Matt” with `tel:914-325-6746`.
- [x] **15A-5D: Address search bar + autocomplete (opens listing modal)**
  - Success criteria: debounced autocomplete returns matching listings; keyboard + click selection opens the correct listing modal; dropdown looks premium and matches site styling.
- [x] **15A-5C: Listing inquiry lead capture (API + Sanity tagging)**
  - Success criteria: inquiry submits successfully and is stored as a lead with `source: listing-inquiry` and listing fields present.
- [x] **15A-6: URL-driven search state (shareable links)**
  - Success criteria: copy/paste URL reproduces the same results and map state (as applicable); deep linking to listening modal works.
- [x] **15A-7: Saved homes (local-first)**
  - Success criteria: user can save/unsave; saved state persists across refresh; “Saved” panel works.
- [x] **15A-8: Saved searches (local-first)**
  - Success criteria: user can name + save a search; re-running restores filters; delete works.

- **Phase 2 (embeds on Town + Neighborhood pages)**
- [x] **15A-9: Town + Neighborhood map embeds (Active + Pending default)**
  - Success criteria: map appears on both page types and defaults correctly; link to `/home-search` passes context.
- [x] **15A-10: Luxury polish pass (icons/colors/cards/hover states)**
  - Success criteria: UI looks bespoke and consistent with the site; no loud defaults; no “AI template” feel.
- [x] **15A-11: QA pass**
  - Success criteria: no console errors, no key leakage, no CLS, works on mobile/desktop.
- [x] **15A-12: Refine Search UI**
  - Success criteria: Multi-select status/town filters; Enter key submits.

### Phase 2: User Accounts & Profiles (Next)
- [ ] **15.B-1: Authentication (Clerk/NextAuth)**
  - Implement basic Sign Up / Login / Sign Out.
- [ ] **15.B-2: Saved Homes & Searches**
  - Sync local storage to database on login.
- [ ] **15.B-3: Lead Notifications**
  - Email alerts on new signups/saves.

---

## Ticket 14 — Launch Prep
**Goal**: Launch safely with professional QA, analytics, and crawl readiness.
**Subtasks**
- [ ] **Analytics (PostHog)** Setup
- [ ] **Real IDX Integration** (Provider Swap)
- [ ] Compliance sign-off & Indexing flip

**Success criteria**
- Site is stable on production domain; no critical UX issues
- Forms + lead capture work reliably
- Indexing enabled intentionally (only when ready)
- Compliance verified before public launch

## Project Status Board

- [x] Ticket 11: Buy / Sell / About pages
  - [x] Buy page (`/services/buy`) — approved
  - [x] Sell page (`/services/sell`) — approved
  - [x] About page refinement (`/about`) — approved
  - [x] Copy QA pass — all checks passed
- [x] Ticket 12: SEO foundation
  - [x] Metadata coverage for all routes
  - [x] OpenGraph + Twitter cards
  - [x] `sitemap.xml` (already existed)
  - [x] `robots.txt` (already existed, blocking pre-launch)
  - [x] Schema markup (RealEstateAgent, BlogPosting, Place)
- [x] Ticket 13: Editorial expansion (towns + FAQs + insights batch)
  - [x] Expand town page rendering (lifestyle, marketNotes sections)
  - [x] FAQ rendering component (`TownFAQs.tsx`)
  - [x] Town content in Sanity (4 towns: Westport, Fairfield, Greenwich, Darien)
  - [x] Editorial calendar (`.cursor/editorial-calendar.md`)
  - [x] Initial Insights batch (5 posts published)
  - [x] QA pass (rendering + compliance verified)
- [ ] **Ticket 13B: Personal Branding & Content Expansion (IN PROGRESS)**
  - [x] Task 1: Copy & verify logo assets — Matt Caiola logo copied to `public/brand/matt-caiola-logo.png`
  - [x] Task 2: Header branding update — Matt's logo primary, Higgins secondary on right
  - [x] Task 3: Footer branding update — Both brands displayed with service areas
  - [x] Task 4: Metadata & JSON-LD update — All titles include "Matt Caiola", JSON-LD represents Matt
  - [x] Task 5: Homepage personalization — Hero says "Matt Caiola Luxury Properties", CTAs personalized
  - [x] Task 6: About page enhancement — Headshot added, heading updated to "About Matt Caiola"
  - [x] Task 7: Town schema - add highlights field — Deployed to Sanity
  - [x] Task 8: Town page - dynamic highlights rendering — Renders from Sanity with fallback
  - [x] Task 9: Neighborhood schema - add description & highlights fields — Deployed to Sanity
  - [x] Task 10: Create neighborhoods in Sanity — 69 total neighborhoods created and published
  - [x] Task 11: Blog post author update — All 7 posts now show "Matt Caiola"
  - [x] Task 12: Create GPT 5.2 copywriting agent prompt — `.cursor/copywriting-agent-prompt.md`
  - [x] Task 12B: Neighborhood page — render `description` + `highlights` from Sanity (no hardcoded placeholder bullets)
  - [x] Task 13: QA pass — complete (build passes; branding + compliance verified)
- [x] **Ticket 13C: Copywriting Content Population — Neighborhoods (COMPLETE)**
  - [x] Neighborhood: Westover (Stamford) — overview + description + highlights written and published
  - [x] Neighborhoods: Stamford batch 1 — Bull's Head, Shippan, Springdale (published)
  - [x] Neighborhoods: Stamford remaining — Cove, Davenport Point, Downtown Stamford, Glenbrook, Mid-Ridges, Newfield, North Stamford, Turn of River, Waterside, West Side (published)
  - [x] Neighborhoods: Darien — Downtown Darien, Long Neck Point, Noroton, Noroton Heights, Tokeneke (published)
  - [x] Neighborhoods: Fairfield — Beach, Brooklawn, Fairfield Center, Fairfield Woods, Grasmere, Greenfield Hill, Southport, Stratfield, Tunxis Hill, University (published)
  - [x] Neighborhoods: Greenwich — Back Country, Belle Haven, Byram, Cos Cob, Downtown Greenwich, Mianus, Old Greenwich, Riverside, Stanwich (published)
  - [x] Neighborhoods: New Canaan — Clapboard Hill, Oenoke Ridge, Ponus Ridge, Silvermine, Talmadge Hill, Town Center (published)
  - [x] Neighborhoods: Norwalk — Cranbury, East Norwalk, Rowayton, Silvermine, South Norwalk, West Norwalk, Wolfpit (published)
  - [x] Neighborhoods: Ridgefield — Branchville, Georgetown, North Ridgefield, Ridgefield Center, South Ridgefield, West Lane (published)
  - [x] Neighborhoods: Westport — Coleytown, Compo Beach, Downtown Westport, Greens Farms, Long Lots, Old Hill, Saugatuck (published)
  - [x] Neighborhoods: Wilton — Cannondale, Georgetown, North Wilton, Silvermine, Wilton Center (published)
  - [x] Neighborhoods: All remaining towns — **complete** (verified: no neighborhoods missing `description` or `highlights`)

- [ ] **Ticket 13D: Copywriting Content Population — Town Pages (About + Living in + Real Estate in + Highlights) (PLANNED)**
  - **Source of requirements**: `.cursor/copywriting-agent-prompt.md` → “Task 1: Town Page Content (9 towns)”
  - **Rendered sections currently missing on site** (based on Sanity field state + town page rendering logic):
    - **About {Town}** uses `overviewLong` (Portable Text) → currently `null` across towns, so pages show “Description coming soon.”
    - **Living in {Town}** uses `lifestyle` → only renders when present; missing for multiple towns.
    - **Real Estate in {Town}** uses `marketNotes` → only renders when present; missing for multiple towns.
    - **Highlights** uses `highlights[]` → currently `null` across towns, so pages show “Highlights coming soon.”

  - **Sanity field mapping (what we need to populate)**
    - **Overview (Short)** → `overviewShort` (TownHero subtitle + metadata fallback)
    - **About {Town}** → `overviewLong` (Portable Text; 2–3 paragraphs)
    - **Living in {Town}** → `lifestyle` (2–3 paragraphs; first-person Matt voice)
    - **Real Estate in {Town}** → `marketNotes` (2–3 paragraphs; Matt’s market/investor perspective)
    - **Highlights** → `highlights` (5–7 bullets; specific local details)

  - **Town list (9)**
    - Darien, Fairfield, Greenwich, Westport (existing content must be rewritten to fully match Matt voice + add highlights + add About)
    - New Canaan, Norwalk, Ridgefield, Stamford, Wilton (need all content)

  - **Plan / Task Breakdown**
    - [ ] **13D-1: Town-by-town audit matrix**
      - List each town and mark each of the 5 required fields as: missing / present-but-needs-rewrite / complete.
      - **Success criteria**: We have a single checklist of exactly what must be written for each town.
    - [ ] **13D-2: Research pass (authoritative anchors per town)**
      - Gather named parks/beaches, village/downtown anchors, and Metro-North station details to support non-generic highlights.
      - **Compliance-first note**: No rankings/guarantees; if commute minutes are used, phrase conservatively and/or note that times vary by train.
      - **Success criteria**: Every town has enough named specifics to write 5–7 non-generic highlights.
    - [ ] **13D-3: Write content in the required structure**
      - Produce copy in first-person voice and naturally incorporate Matt’s differentiators (finance + sales + investor + local resident) without sounding salesy.
      - **Success criteria**: Draft copy exists for all missing fields for all 9 towns.
    - [ ] **13D-4: Populate Sanity + publish**
      - Patch each town document with `overviewShort`, `overviewLong`, `lifestyle`, `marketNotes`, `highlights`, then publish.
      - **Success criteria**: All 9 town pages render About/Living/Real Estate/Highlights with no “coming soon” placeholders.
    - [ ] **13D-5: QA pass (town pages)**
      - Verify each `/towns/[townSlug]` page shows:
        - About section renders (PortableText)
        - Living in + Real Estate sections render (non-empty)
        - Highlights list renders (5–7 bullets)
      - **Success criteria**: No missing sections, tone consistent, compliance maintained.

- [x] **Ticket 13D: Copywriting Content Population — Town Pages (COMPLETE)**
  - [x] Populated **all 9 towns** with:
    - `overviewShort` (2–3 sentences)
    - `overviewLong` (Portable Text; 2–3 paragraphs)
    - `lifestyle` (2–3 paragraphs, first-person Matt voice)
    - `marketNotes` (2–3 paragraphs, Matt’s perspective)
    - `highlights` (6 bullets each; specific local anchors + MTA/town sources where available)
  - [x] Published all town updates
  - [x] Verified in published content: all 9 towns have `overviewLong`, `lifestyle`, `marketNotes`, and 6 highlights
- [x] **Ticket 16: Data modules (pre-launch) — COMPLETE**
  - [x] P1: Schema updates - added `center` geopoint + `curatedPois` to Town/Neighborhood; added `dataCacheEntry` type
  - [x] P2: Cache utilities - implemented Sanity cache read/write with TTL + key conventions
  - [x] P3: DataModule wrapper - built shared UI wrapper component with Source/Last updated footer
  - [x] P4: At a Glance - generated ACS JSON for 9 towns + renders on Town/Neighborhood pages
  - [x] P5: Schools - added curated school data + renders on Town/Neighborhood with disclaimer for neighborhoods
  - [x] P6: Walk Score - provider + caching + graceful fallback when disabled
  - [x] P7: POIs - curated fallback first; Google Places provider + caching with strict limits
  - [x] P8: Taxes - mill rate data for 9 towns + module rendering + official links
  - [x] P9: Listings UI - full filters/sort/pagination with mock data behind provider interface
  - [x] P10: Wired modules into Town + Neighborhood pages
  - [x] P11: QA pass - no linter errors, all modules show Source + Last updated
- [x] Ticket 18: Investing / Commercial pages (pre-launch)
  - [x] Investing page (`/services/investing`) — premium editorial layout with investing + commercial sections
  - [x] Underwriting models section (coming soon) — included on investing page
  - [x] QA pass — complete (hero image updated; nav + sitemap updated)
- [ ] Ticket 19: Live chat + AI chatbot (pre-launch, optional) — **ON HOLD (per user, 2026-02-03)**
  - [ ] Evaluate platforms (Intercom, Crisp, Tidio, Chatwoot, custom)
  - [ ] AI chatbot for common questions
  - [ ] Human escalation with SMS/app notification to agent
  - [ ] Scope TBD based on budget and integration preference
- [ ] Ticket 17: Video strategy (pre-launch) — **ON HOLD (per user, 2026-02-03)**
- [ ] Ticket 15: IDX integration / Home Search (pre-launch; gated by MLS/brokerage compliance)
- [ ] Ticket 14: Deployment + QA + enable indexing (LAUNCH)

## Current Status / Progress Tracking

- Planning scratchpad updated and aligned to current launch scope.
- **User scope update (2026-02-03)**: Videos + AI chatbot are on hold; focus is now **Home Search (mock now, IDX later)**.
- Next planned execution: **Ticket 15.A** (Home Search + maps + saved homes/searches using mock listings).
- **Ticket 15.A progress**: 15A-1 implemented (route + metadata + header nav link). 15A-2 implemented (contract updated + autocomplete method added to provider). 15A-3 implemented (mock provider supports global scope, town/neighborhood filters, bounds, and q). 15A-4 implemented (25 listings per town across all 9 towns; lat/lng + neighborhoods). 15A-4B implemented (24 listing photos + attributions + 3–8 photos per listing). 15A-5 implemented (home search layout with sticky filters, map, results panel, mobile toggle).
- 2026-02-04: Home Search filter panel spacing tightened (reduced top padding/gap to minimize dead space).
- 2026-02-04: Home Search filter bar made opaque + padding tightened to remove map bleed and top dead space.
- 2026-02-04: Further reduced Home Search filter panel padding and control heights.
- 2026-02-04: Fixed Home Search panel opacity and spacing - solid white bg, z-40, stronger shadow, minimal top padding (pt-1.5), tight gaps (gap-1.5).
- Executor note: Header nav routes Buy/Sell to `/services/buy` and `/services/sell` (not `/buy` and `/sell`).
- **Ticket 11 complete**: Buy, Sell, About pages implemented and QA passed.
- **Ticket 12 COMPLETE**: SEO foundation.
  - **Subtask 1 (Metadata coverage)**: All routes now have title/description metadata.
    - Static pages: `/`, `/services/investing`, `/insights`, `/towns`, `/fair-housing`, `/privacy`, `/terms`
    - Dynamic pages with `generateMetadata`: `/insights/[categorySlug]`, `/insights/[categorySlug]/[postSlug]`, `/towns/[townSlug]`, `/towns/[townSlug]/[neighborhoodSlug]`
  - **Pre-existing**: `sitemap.xml` and `robots.txt` already implemented
  - **Subtask 2 (OpenGraph + Twitter cards)**:
    - Root layout: Default OG/Twitter with site-wide image, title template "| Fairfield County Luxury Real Estate"
    - Town pages: Town-specific images
    - Insights posts: Article type with publishedTime and author
  - **Subtask 3 (Schema markup)**:
    - RealEstateAgent (layout.tsx): Enhanced with geo, areaServed (9 towns), sameAs
    - BlogPosting (post pages): headline, datePublished, author, publisher, articleSection
    - Place (town pages): name, description, address, containedInPlace
- **POIs quality improvements (2026-02-01)**:
  - Added address-based town filtering (prevents out-of-town POIs).
  - Added chain filtering (exclude fast food; limit Starbucks/Dunkin to one per town).
  - Added 4th category: Fitness & Recreation.
  - **Ticket 18 in progress**: `/services/investing` built, header nav updated, sitemap updated — awaiting user verification.

---

**Ticket 16 COMPLETE** (Data Modules) — 2026-01-31

All data modules implemented following P1-P11 checklist:

**Architecture Delivered:**
- `app/components/data/` — UI components: DataModule wrapper, AtAGlance, Schools, WalkScore, POIs, Taxes, Listings
- `app/lib/data/providers/` — Provider interfaces with caching: atAGlance, schools, walkscore, places, listings
- `app/lib/data/cache/sanityCache.ts` — Persistent Sanity-based cache with TTL
- `app/lib/data/config.ts` — Feature flags and env var configuration
- `app/lib/data/geo/distance.ts` — Distance calculation for nearby schools
- `app/data/` — Static JSON: ACS demographics, schools directory, mill rates, mock listings

**Sanity Schema Additions:**
- `town.center` (geopoint) + `town.curatedPois[]`
- `neighborhood.center` (geopoint) + `neighborhood.curatedPois[]`
- `dataCacheEntry` document type for persistent API caching

**Environment Variables Added to `.env.local`:**
- `DATA_ENABLE_WALKSCORE`, `WALKSCORE_API_KEY`
- `DATA_ENABLE_GOOGLE_PLACES`, `GOOGLE_MAPS_API_KEY`
- `DATA_ENABLE_LISTINGS` (default true for mock data)

**Key Features:**
- All modules show **Source + Last updated** in footer
- Walk Score and Google Places use Sanity caching (not on every page view)
- POIs always render (Google Places if cached/enabled, otherwise curated fallback)
- Listings UI fully functional with filters/sort/pagination using mock data
- No API keys leak to browser (all server-side)
- Neighborhood schools show "nearby" disclaimer per spec

**Files Changed:**
- `studio/schemaTypes/town.ts`, `neighborhood.ts` — Added center + curatedPois
- `studio/schemaTypes/dataCacheEntry.ts` — New cache schema
- `studio/schemaTypes/index.ts` — Export dataCacheEntry
- `app/lib/sanity.queries.ts` — Added GeoPoint, CuratedPoi types; updated queries
- `app/towns/[townSlug]/page.tsx` — Integrated all data modules
- `app/towns/[townSlug]/[neighborhoodSlug]/page.tsx` — Integrated all data modules
- `.env.local` — Added feature flags and API key placeholders

**Next Steps (for later tickets):**
- Deploy Sanity schema changes to production (`npx sanity@latest schema deploy`)
- Add `center` coordinates to Town and Neighborhood documents in Sanity
- Enable Walk Score / Google Places when API keys are configured
- Swap mock listings provider for real IDX integration (Ticket 15)

---

**Ticket 13 COMPLETE** (Editorial Expansion) — 2026-01-30

- **Planning complete**: Detailed subtask breakdown confirmed schema readiness
- **Subtask 1 COMPLETE**: Town page rendering expanded
  - Added `FAQ` type and extended `Town` type in `sanity.queries.ts`
  - Updated `getTownBySlug()` to fetch `lifestyle`, `marketNotes`, `faqs[]->{ _id, question, answer, schemaEnabled }`
  - Added "Living in {Town}" and "Real Estate in {Town}" sections to town page
- **Subtask 2 COMPLETE**: FAQ rendering component
  - Created `TownFAQs.tsx` accessible accordion component (ARIA, keyboard nav)
  - Added FAQ section to town pages (renders when FAQs exist)
- **Subtask 3 COMPLETE**: Town content populated in Sanity
  - Created 12 FAQs (3 per town) for Westport, Fairfield, Greenwich, Darien
  - Added lifestyle + marketNotes content for 4 priority towns
  - All content published and live
- **Subtask 4 COMPLETE**: Editorial calendar + Insights batch
  - Created `.cursor/editorial-calendar.md` with categories, cadence, 20+ backlog topics
  - Published 5 initial Insights posts (2 Market Update, 2 Community, 1 Tips)
- **Subtask 5 COMPLETE**: QA pass
  - All sections render correctly, no linter errors
  - Compliance verified (brokerage name, address, phone, Fair Housing)

**Next**: Ticket 13B (Personal Branding + Content Expansion) — **PLANNING COMPLETE, READY FOR EXECUTION**

---

## Ticket 13B: Personal Branding & Content Expansion (ACTIVE)

### Executor Progress Notes (Post-Planning)

- Added Sanity-driven neighborhood rendering on `/towns/[townSlug]/[neighborhoodSlug]`:
  - Fetches `description` (Portable Text) and `highlights` (bullet array) from Sanity
  - Removes hardcoded placeholder highlight bullets on the neighborhood detail page
  - Gracefully falls back to “coming soon” when fields are empty
- Started copywriting population in Sanity:
  - Published expanded neighborhood content for **Westover (Stamford)** (overview, description, highlights)

### Context & Problem Statement

This website is for **Matt Caiola**, an individual real estate agent licensed under Higgins Group Private Brokerage. The current implementation incorrectly emphasizes the brokerage over the agent. This must be corrected to prominently feature Matt's personal brand while also displaying Higgins Group branding for compliance and credibility.

**Brand Hierarchy:**
1. **Primary**: Matt Caiola (name, logo, photo, personal brand)
2. **Also Prominent**: Higgins Group Private Brokerage (displayed prominently throughout for compliance AND credibility)

### Current State Analysis

**Header (`app/components/Header.tsx`):**
- ❌ Shows ONLY Higgins Group logo
- ❌ No Matt Caiola branding

**Footer (`app/components/GlobalFooter.tsx`):**
- ❌ Shows ONLY Higgins Group logo
- ❌ No Matt Caiola branding section
- ✅ Brokerage compliance info present

**Metadata (`app/layout.tsx`):**
- ❌ Default title: "Fairfield County CT Luxury Real Estate | Higgins Group Private Brokerage"
- ❌ No mention of Matt Caiola
- ❌ JSON-LD represents Higgins Group as RealEstateAgent (should be Matt with Higgins as affiliation)

**About Page (`app/about/page.tsx`):**
- ❌ No headshot displayed
- ❌ Heading says "About" not "About Matt Caiola"
- ✅ First-person voice used
- ✅ Higgins Group section for compliance

**Homepage (`app/page.tsx`):**
- ❌ Hero mentions "Higgins Group Private Brokerage" prominently
- ❌ No Matt Caiola personal presence
- ❌ CTAs say "Contact Us" instead of personalizing to Matt

**Town Pages (`app/towns/[townSlug]/page.tsx`):**
- ❌ Highlights are HARDCODED (lines 180-192)
- ❌ Not Sanity-driven

**Town Schema (`studio/schemaTypes/town.ts`):**
- ❌ No `highlights` field

**Neighborhood Schema (`studio/schemaTypes/neighborhood.ts`):**
- Has: name, slug, town (ref), overview, housingCharacteristics, marketNotes, locationAccess, faqs
- ❌ No `highlights` field  
- ❌ No `description` (Portable Text) field

**Assets Available:**
- `public/brand/higgins-lockup.jpg` ✅
- `public/brand/matt-headshot.jpg` ✅ (already exists)
- Logo files in assets folder (need to copy Matt Caiola combined horizontal logo)

### High-level Task Breakdown

#### Task 1: Copy & Verify Logo Assets
- [ ] Identify Matt Caiola combined horizontal logo in assets folder
- [ ] Copy to `public/brand/matt-caiola-logo.png`
- [ ] Verify headshot exists at `public/brand/matt-headshot.jpg`
- **Success Criteria**: Logo files in place, correct dimensions for header/footer use

#### Task 2: Header Branding Update
- [ ] Update `app/components/Header.tsx`
- [ ] Primary: Matt Caiola Combined Horizontal Logo (M|C + Wordmark)
- [ ] Also include: Higgins Group logo in secondary position (if space permits) OR keep in footer only
- [ ] Mobile responsive (simplified on mobile)
- **Success Criteria**: Matt's logo displays prominently; header remains clean and premium; mobile works

#### Task 3: Footer Branding Update
- [ ] Update `app/components/GlobalFooter.tsx`
- [ ] Add Matt Caiola section: Logo, contact info, brief tagline
- [ ] Keep Higgins Group section prominently: Logo, full brokerage info (compliance)
- [ ] Keep Fair Housing link
- **Success Criteria**: Both brands clearly visible in footer; compliance maintained

#### Task 4: Metadata & JSON-LD Update
- [ ] Update `app/layout.tsx`
- [ ] Default title: "Matt Caiola | Luxury Real Estate | Fairfield County CT"
- [ ] Template: "%s | Matt Caiola | Fairfield County Real Estate"
- [ ] Update description to mention Matt Caiola
- [ ] Update JSON-LD: Matt Caiola as RealEstateAgent with Higgins as worksFor/affiliation
- [ ] Update OpenGraph/Twitter cards
- **Success Criteria**: All page titles include "Matt Caiola"; JSON-LD validates in Rich Results Test

#### Task 5: Homepage Personalization
- [ ] Update `app/page.tsx`
- [ ] Hero: Change "Higgins Group Private Brokerage" subtitle to reference Matt Caiola
- [ ] Consider adding personal welcome message
- [ ] Update CTAs from "Contact Us" to more personal language
- **Success Criteria**: Homepage reflects Matt as the agent while maintaining Higgins presence

#### Task 6: About Page Enhancement
- [ ] Update `app/about/page.tsx`
- [ ] Add Matt's headshot prominently (hero or sidebar)
- [ ] Change heading to "About Matt Caiola"
- [ ] Update metadata to include Matt's name
- [ ] Keep existing Higgins Group section for compliance
- **Success Criteria**: Matt's headshot visible; page clearly about Matt Caiola

#### Task 7: Town Schema - Add Highlights Field
- [ ] Update `studio/schemaTypes/town.ts` - add `highlights` array field (array of strings)
- [ ] Deploy schema change to Sanity
- **Success Criteria**: Town documents can have highlights array populated via Sanity Studio

#### Task 8: Town Page - Dynamic Highlights
- [ ] Update `getTownBySlug()` in `app/lib/sanity.queries.ts` to fetch `highlights`
- [ ] Update Town type to include `highlights?: string[]`
- [ ] Update `app/towns/[townSlug]/page.tsx` to render dynamic highlights (replace hardcoded)
- [ ] Graceful fallback if no highlights exist
- **Success Criteria**: Town highlights display from Sanity; no hardcoded content; graceful empty state

#### Task 9: Neighborhood Schema - Add Description & Highlights Fields
- [ ] Update `studio/schemaTypes/neighborhood.ts`:
  - Add `description` (Portable Text array of blocks)
  - Add `highlights` (array of strings)
- [ ] Deploy schema change to Sanity
- **Success Criteria**: Neighborhood schema matches spec; ready for content population

#### Task 10: Create Neighborhoods in Sanity (Infrastructure)
- [ ] Use Sanity MCP tools to create ~87 neighborhood documents with placeholder content
- [ ] Full list by town:
  - Darien (5): Downtown, Long Neck/Long Neck Point, Noroton, Noroton Heights, Tokeneke
  - Fairfield (15): Beach, Brooklawn, Center, Fairfield Woods, Greenfield Hill, Grasmere, Lake Hills, Lake Mohegan, Rock Ridge, Sasco, Southport, Stratfield, Sturges, Tunxis Hill, University
  - Greenwich (10): Back Country, Belle Haven, Byram, Downtown Greenwich, Cos Cob, Old Greenwich, Riverside, Pemberwick, Mianus, Stanwich
  - New Canaan (7): Clapboard Hill, Oenoke Ridge, Ponus Ridge, Silvermine, Smith Ridge, Talmadge Hill, Town Center
  - Norwalk (9): Brookside, Cranbury, East Norwalk, Rowayton, Silvermine, South Norwalk, West Norwalk, West Rocks, Wolfpit
  - Ridgefield (11): Branchville, Georgetown, Farmingville, North Ridgefield, Ridgebury, South Ridgefield, Starrs/Picketts Ridge, Town Center/Village Center, West Lane, West Mountain/Mamanasco Lake, Whipstick
  - Stamford (15): Bull's Head, Cove, Davenport Point, Downtown, Glenbrook, Mid City, Mid-Ridges, Newfield, North Stamford, Shippan, Springdale, Turn of River, Waterside, West Side, Westover
  - Westport (9): Compo Beach, Coleytown, Cranbury & Poplar Plains, Long Lots, Downtown/Westport Village, In-Town, Greens Farms, Saugatuck, Old Hill
  - Wilton (6): Cannondale, Georgetown, North Wilton, Silvermine, South Wilton, The Hollow
- **Success Criteria**: All neighborhoods exist in Sanity with proper town references; visible on town pages

#### Task 11: Blog Post Author Update
- [ ] Use Sanity MCP tools to update all existing blog posts: set author = "Matt Caiola"
- [ ] Verify author displays correctly on blog post pages
- **Success Criteria**: All posts show "By Matt Caiola"

#### Task 12: Create GPT 5.2 Copywriting Agent Prompt
- [ ] Create `.cursor/copywriting-agent-prompt.md` with detailed instructions for:
  - Town content (all 9 towns)
  - Neighborhood content (~87 neighborhoods)
  - FAQ personalization
  - Blog post content updates
  - About page copy revision
- **Success Criteria**: Comprehensive prompt ready for GPT 5.2 to execute copywriting tasks

#### Task 13: QA Pass
- [ ] Verify header displays correctly (desktop + mobile)
- [ ] Verify footer displays both brands
- [ ] Verify all page titles include "Matt Caiola"
- [ ] Verify JSON-LD validates
- [ ] Verify about page shows headshot
- [ ] Verify town highlights render from Sanity (or graceful fallback)
- [ ] Verify neighborhoods display on town pages
- [ ] Verify blog author is "Matt Caiola"
- [ ] No compliance regressions (brokerage name, address, phone, Fair Housing)
- **Success Criteria**: All programming tasks complete; site ready for copywriting phase

### Dependencies & Sequencing

```
Task 1 (Assets) → Task 2 (Header) → Task 3 (Footer)
                            ↓
Task 4 (Metadata) ← Task 5 (Homepage)
                            ↓
                    Task 6 (About Page)

Task 7 (Town Schema) → Task 8 (Town Highlights Rendering)

Task 9 (Neighborhood Schema) → Task 10 (Create Neighborhoods)

Task 11 (Blog Authors) - independent

Task 12 (Copywriting Prompt) - can be done in parallel

Task 13 (QA) - after all others complete
```

### Success Criteria (Ticket 13B Complete)

**Programming:**
- [ ] Header displays Matt Caiola Combined Horizontal logo as primary brand
- [ ] Header also displays Higgins Group logo (if space permits) OR footer-only
- [ ] Footer displays BOTH Matt Caiola branding AND Higgins Group prominently
- [ ] All page titles include "Matt Caiola"
- [ ] JSON-LD schema represents Matt Caiola (with Higgins as affiliated brokerage)
- [ ] About page includes Matt's headshot prominently
- [ ] Town highlights are Sanity-driven (not hardcoded)
- [ ] All main neighborhoods exist in Sanity (~70-87 based on discretion)
- [ ] Blog posts author field updated to "Matt Caiola"
- [ ] Copywriting agent prompt created at `.cursor/copywriting-agent-prompt.md`

**Status**: PLANNING COMPLETE - Ready for Executor

## Local Development (View on localhost)

### Goal

Enable viewing the site locally in a browser via the Next.js dev server.

### Key Requirements / Notes

- **Node.js**: use Node **20 LTS** (recommended) or another version compatible with Next.js `16.1.1`.
- **Sanity env vars are required for reads**: the app uses non-null assertions for `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `NEXT_PUBLIC_SANITY_API_VERSION`. If these are missing, the server will likely error at runtime.
- **Sanity write token is optional for viewing**: `SANITY_API_WRITE_TOKEN` is only needed to persist leads to Sanity. If it’s missing, lead endpoints should still respond “success” but warn in logs.

### One-time Setup Steps (Windows / Cursor terminal)

1. Install dependencies (run from repo root):

```bash
npm install
```

2. Create a file named `.env.local` in the repo root with:

```bash
# Sanity (required for reading towns/posts/etc.)
NEXT_PUBLIC_SANITY_PROJECT_ID=phc36jlu
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01

# Sanity (optional: required only if you want /api/lead to save leads in Sanity)
# SANITY_API_WRITE_TOKEN=...
```

### Start the Site (Dev Server)

Run from repo root:

```bash
npm run dev
```

Then open:

- `http://localhost:3000`

### Success Criteria (Planner verification checklist)

- Homepage loads at `http://localhost:3000` without a runtime crash.
- `Towns` and `Insights` pages render (Sanity reads working).
- Contact + Home Value pages render (lead/valuation APIs respond locally).

## Executor's Feedback or Assistance Requests

- Confirmed: Buy/Sell routes exist at `app/services/buy/page.tsx` and `app/services/sell/page.tsx` (these match header nav).
- 15A-1 review note: Header nav wrap fixed for “Home Search” (desktop now single line).
- 15A-2 complete: provider contract now supports `scope: global`, optional town/neighborhood filters, `bounds`, `q`, and `suggestListings()` for autocomplete.
- 15A-3 complete: mock provider now applies global town/neighborhood filters, bounds (lat/lng), and q text filtering.
- 15A-4 complete: mock dataset expanded to 25 listings per town (Westport, Greenwich, Darien, New Canaan, Fairfield, Norwalk, Ridgefield, Stamford, Wilton).
- 15A-4B complete: added 24 listing photos (12 exterior + 12 interior) with attribution log; mock listings now include 3–8 photos each.
- 15A-5 complete: `/home-search` UI built (filters + map + results panel + mobile toggle).
- 2026-02-04: Reduced dead space above filter row in `/home-search` filter bar (tighter padding/gap).
- 2026-02-04: Made `/home-search` filter bar opaque and tightened padding to remove map bleed.
- 2026-02-04: Reduced `/home-search` filter control heights for a thinner panel.
- 2026-02-04: Corrected Home Search panel - solid white bg, z-40, shadow-md, minimal top padding (pt-1.5 pb-2), tight gaps (gap-1.5).
- Note: `npm audit` reports 6 vulnerabilities after installing Leaflet/react-leaflet; no fixes applied.
- 15A-5 complete: `/home-search` now renders the luxury portal layout with sticky filter bar, Leaflet map canvas, right-side results grid, and mobile list/map toggle.
- Buy page has been upgraded to premium editorial layout and is ready for review at `/services/buy`.
- If copy guidance is needed, ask Planner for preferred voice (more “editorial narrative” vs “process-driven”).
- `npm run lint` currently fails due to pre-existing issues (e.g., `no-explicit-any`, `react/no-unescaped-entities`) and also appears to lint built files under `studio/dist/**`, producing a very large number of warnings/errors. Consider excluding `studio/dist/**` in ESLint config or ignore patterns as a separate cleanup ticket.
- **Image decision**: User chose Option B — finish text/structure for Buy/Sell/About first, then add images in a batch pass later to ensure visual consistency. Will add a follow-up ticket for service page imagery after Ticket 11 text work is complete.
- POIs tuning request completed: strict town-only address match + chain filtering + Fitness category added. Cache still in place to control API usage.
- User approved town-specific address aliases for POI matching; will add alias map and clear Places cache for retest.
- Ticket 18 build ready for review: `/services/investing` created with hero image, investing + commercial sections, CTAs, and underwriting models (coming soon). Please verify copy and layout.
- Hero image updated to `/visual/services/investing-hero.png` (user-provided commercial building image).

## Lessons

- Keep compliance language exact; avoid “valuation” phrasing that implies appraisal.
- Prefer additive changes; no silent refactors.
- Include debugging info in outputs when relevant (forms/leads).
- Zod v3 errors use `error.issues` (not `error.errors`) — ensure API routes return issues correctly.
- When importing JSON data, assert/normalize types if TS widens literals (e.g., schools `level`).