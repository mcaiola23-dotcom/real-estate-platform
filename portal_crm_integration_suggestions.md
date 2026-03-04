# SmartMLS AI App & Real Estate Platform Review - Collaborative Notes

> **Note:** This document is intended to serve as a shared repository for agents and developers to document their suggestions and ideas for integrating the `smartmls-ai-app` (public portal) with the `real-estate-platform` (agent CRM).
> Please clearly author your suggestions.

---

## 1. Feature Improvements and Additions

**[Author: Gemini 3.1 Pro]**
- **Vector Database Integration for AI Search:** The current implementation of natural language search (using GPT-4o-mini function calling to map to strict JSON filters) is an excellent MVP. However, to truly differentiate from competitors like Zillow, I strongly recommend implementing a Vector Database (like `pgvector` or Pinecone).
    - *How it works:* Embed property descriptions (`public_remarks`, `private_remarks`) into vector embeddings.
    - *The Benefit:* This allows for true semantic searches (e.g., "Homes with a chef's kitchen perfect for hosting dinner parties and a view of the sound") that match the "vibe" of a home, even if the user's exact phrasing isn't explicitly written in the listing text or covered by standard filters like `bedrooms_min`.
    - *Hybrid Approach:* The ideal state is combining the vector semantic search with the existing strict LLM-extracted filters (e.g., City: Stamford, Max Price: $2M) to bound the similarity search.

**[Author: Opus 4.6]**

### Existing Feature Improvements

- **Decompose `properties/page.tsx`:** This file is ~2000+ lines and is the single largest piece of frontend tech debt. It handles search, map, filters, results, modals, and AI query state in one monolithic component. It should be broken into:
    - `SearchPanel` (filters, AI search bar)
    - `MapView` (Leaflet map + parcel layers)
    - `ResultsList` (property cards, pagination)
    - `PropertyDetailModal` (tabbed detail view)
    - A `usePropertySearch` custom hook for search state management
    - A `useMapState` hook for map viewport/interaction state

- **Remove Mapbox GL Dependency:** The portal currently ships both Leaflet and Mapbox GL (`mapbox-gl` + `react-map-gl`). Leaflet is the active map provider. The Mapbox dependencies should be removed to cut bundle size. If Mapbox tile styling is desired in the future, Mapbox tiles can be consumed as a Leaflet tile layer without the full GL library.
    - *[Matt's note: We attempted to use Mapbox originally as it was suggested to have more advanced features and be more polished, but ran into issues getting it working, so we fell back to Leaflet. The Mapbox dependencies are leftover from that attempt and should be cleaned up.]*

- **Clean Up Legacy `Property` Model:** The codebase contains both a `Property` model (legacy/simplified) and the primary `Parcel` + `Listing` model system. If the `Property` model is confirmed unused, it should be removed to reduce confusion.
    - *[Matt's note: Need to confirm this is truly dead weight. We intentionally have two separate property detail modals -- one for listings with active IDX/MLS data (active, pending, or sold) and one for off-market properties that pull from parcel data only. Both modals are designed to look similar, but they pull from different datasets. If the `Property` model is unrelated to this dual-modal system, it can be removed.]*

- **Add Alembic Migration Discipline:** Alembic is in the backend dependencies but there is no evidence of a structured migration history. As the schema evolves, version-controlled migrations are essential for reproducible deployments.

- **Implement React Error Boundaries:** The frontend needs error boundaries around key sections (map, search, property detail) so that a single component failure doesn't white-screen the entire app.

- **Rotate Default Auth Secret & Enforce Validation:** The backend auth secret key currently uses a placeholder default. A proper random secret must be generated, and the application should fail fast on startup if the placeholder is detected in a production environment.

- **Rate-Limit the AI Search Endpoint:** Each AI search call hits OpenAI's API. Without rate limiting, a bad actor could rack up API costs quickly. Per-user and global rate limits should be added to `POST /api/v1/search/ai`.

- **Add Input Sanitization on AI Queries:** User natural language queries are sent to OpenAI for function-calling parsing. Input should be sanitized to prevent prompt injection attempts that could manipulate the structured output.

- **Implement Server-Side Map Clustering:** With 272K parcels in the PostGIS database, sending all parcel polygons to the client at low zoom levels will kill performance. A tile-based approach or viewport-bounded queries with zoom-dependent geometry simplification should be implemented.

- **Database Connection Pooling:** Ensure SQLAlchemy async sessions use a properly configured connection pool with sensible limits, especially since PostGIS spatial queries can be expensive.

### New Feature Additions

- **Live MLS/IDX Data Feed:** This is the single most critical pre-launch requirement. The portal currently operates on mock/demo data (SimplyRETS demo credentials). A live IDX provider must be secured and an ingestion pipeline built to keep listing data current. Consider modeling this after the ingestion worker architecture already built in the `real-estate-platform` project (`services/ingestion-worker/`).
    - *[Matt's note: We are still in development and do not have an active/live IDX provider yet. Mock data is being used intentionally to simulate IDX API data during development. A live provider will be secured prior to launch.]*

- **Vector Database for AI Search (TOP PRIORITY):** Implement `pgvector` (PostgreSQL extension) rather than a separate vector DB like Pinecone. Since the portal already runs on PostgreSQL with PostGIS, adding pgvector keeps the stack simple and avoids managing another service.
    - *Embedding targets:* Property descriptions (`public_remarks`), neighborhood characteristics, town profiles, school information, and lifestyle attributes.
    - *Hybrid search architecture:* Combine the existing structured filter approach (LLM-extracted filters for beds, baths, price, location) with vector similarity for the subjective/experiential dimensions of queries (e.g., "charming colonial near good schools with a cozy feel" -- structured filters handle beds/baths/type, vectors handle "charming" and "cozy").
    - *[Matt's note: This has become a top priority. The current AI search is really just a wrapper over basic structured search. The vector DB will be a true replacement, not just an add-on. Because this will be an extremely important differentiating feature, it needs to be planned out thoroughly to maximize its value.]*

- **Multi-Turn AI Search Conversation:** Allow users to refine searches conversationally: "Show me homes in Westport under $800K" -> "Now only with pools" -> "What about in Fairfield instead?" This maintains context across turns and builds on the vector search foundation.
    - *[Matt's note: This combined with the vector DB search will be a game changer. This is a high priority feature.]*

- **Neighborhood & Town Profile Pages:** Build rich, SEO-friendly pages for each of the 23 Fairfield County towns and their neighborhoods. Content should include: school ratings, median home values (powered by AVM), commute times, walkability, local amenities, and lifestyle descriptions. These pages are critical for organic search traffic and establishing the portal as the local authority.
    - *[Matt's note: Similar town pages already exist in the agent website project for the towns I personally operate in. This should be expanded to cover all towns and neighborhoods in the county for the portal. The agent website pages can serve as a template.]*

- **Saved Search Email Alerts:** The `UserAlert` model already exists in the backend but email delivery is not implemented. Wire up an email service (SendGrid, AWS SES, or Resend) and a scheduled job (APScheduler is already a dependency) to notify users when new listings match their saved search criteria.
    - *[Matt's note: This is a critical pre-launch feature. A similar feature needs to be built into the agent website/CRM as well, so both implementations should be built in tandem to share logic and infrastructure where possible.]*

- **Market Trends Dashboard:** Leverage existing transaction history and AVM data to surface median price trends, days-on-market trends, inventory levels, and price-per-sqft trends by town and neighborhood. Agents love to share this kind of content with clients.
    - *[Matt's note: These are critical additions to the property detail modals as well -- users should see market context when viewing a specific property.]*

- **Deeper School Integration:** Parents drive a significant percentage of home searches in Fairfield County. Add GreatSchools ratings, school boundary map overlays, and the ability to search/filter by school district.
    - *[Matt's note: Agreed. GreatSchools integration is planned, but we are keeping the budget minimal during development. This will be added as the project matures.]*

- **Property Comparison Tool:** Allow users to compare 2-4 properties side-by-side across key dimensions: price, sqft, lot size, AVM estimate, tax history, schools, and commute times.
    - *[Matt's note: Great idea. Additionally, can we add an AI evaluation feature where the AI analyzes the selected properties and provides personalized suggestions based on the user's stated preferences and prior usage/search history? This would make the comparison tool uniquely intelligent rather than just a static grid.]*

- **Mobile-First Responsive Redesign:** Real estate search is heavily mobile. The map + filter + results experience needs to work beautifully on phones as a first-class experience, not just a responsive afterthought.
    - *[Matt's note: This is a critical feature. Mobile must be excellent.]*

- **Agent Profiles & Contact CTAs:** Listings should display agent information with "Contact Agent" calls-to-action. This is the bridge between the portal and the CRM and directly ties into the monetization strategy.
    - *[Matt's note: This also ties into monetization, which hasn't been fully mapped out yet. On launch, all pages will display and refer to me as the default agent. For buyer-side listings, listing agents must be referenced as required by MLS rules. Paid SAAS subscribers will get their branding displayed on portal pages as part of their subscription benefits.]*

- **Open House Calendar:** An aggregated open house schedule with a map view, filtering by town/date, and the ability to set reminders.

- **Mortgage Pre-Qualification Integration:** Partner with a lender API for real-time pre-qualification estimates embedded in the property detail experience.
    - *[Matt's note: There is a specific mortgage provider I have in mind that I would like to eventually partner with for this feature.]*

- **Property History Timeline:** A visual timeline showing ownership history, sales, renovations, tax assessment changes, and permit history for each property. Leverages existing `TransactionHistory` data.
    - *[Matt's note: This will be a huge improvement to the UI/UX and add significant value to the property detail modal.]*

- **AI-Powered "Why You'll Love This Home" Descriptions:** Generate personalized descriptions for each property based on the individual user's search history, saved preferences, and browsing behavior. Instead of generic listing descriptions, users see contextually relevant highlights.
    - *[Matt's note: Good idea. Will need to evaluate cost-effectiveness of running personalized LLM calls per user per property view. May need a caching/batching strategy.]*

- **AVM Enhancement (PRIORITY):** The current AVM achieves 5.44% MAPE with a LightGBM model and 193K+ pre-computed valuations. The goal is to match or exceed Zillow's Zestimate accuracy (2-3% nationally). Improvement avenues include:
    - Incorporating more granular features (renovation history, permit data, interior condition signals from listing photos/descriptions)
    - Temporal modeling (how have recent sales in the micro-neighborhood shifted the value curve?)
    - Ensemble methods (combine LightGBM with gradient boosting variants, neural network regressors)
    - More frequent retraining as new sales data comes in
    - *[Matt's note: Improving the AVM is a top priority. It needs to be at least as good as Zillow's Zestimate, preferably much better. Question: Can the development of the vector DB search play any role in improving the AVM?]*
    - *[Opus 4.6 response: Yes, there is a meaningful connection. Vector embeddings of property descriptions can capture qualitative features (condition, finishes, renovation quality, "move-in ready" vs. "handyman special") that are difficult to encode as structured features for the AVM model. You could: (1) Use the vector embeddings as additional input features to the AVM model -- extract the top-N principal components from the description embedding and include them as features alongside the structured data. (2) Use semantic similarity to improve comparable selection -- instead of just spatial proximity and basic feature matching, use vector similarity to find "truly comparable" properties that share qualitative characteristics, leading to better comp-based adjustments. (3) Extract structured signals from embeddings -- use the LLM to classify listing descriptions into condition tiers (excellent/good/fair/poor), identify recent renovations, and flag premium features, then feed those as categorical features into the AVM. This creates a virtuous cycle: the vector DB improves search quality AND AVM accuracy simultaneously.]*

**[Author: Codex 5.3]**

### Additional Feature Suggestions

- **Hybrid Ranking + "Why Matched" Transparency:** After implementing vectors, combine semantic similarity with structured constraints and expose "Why this matched" chips on each card (e.g., "water views", "3+ beds", "near Westport train"). This increases trust and helps users refine queries faster.

- **"Similar Homes" Retrieval:** Add a "Show homes like this" action on detail modals using vector-nearest neighbors bounded by structured filters (town, price band, beds). This is high-leverage for engagement and can drive more saved homes and shares.

- **Session-Aware AI Search Memory:** Maintain per-session search context so follow-up prompts inherit intent (budget, towns, style preferences) without re-entering constraints each turn.

---

## 1b. Property Detail Modal — Competitor-Informed Feature Roadmap (2026-03-03)

**[Author: Claude Opus 4.6]**

Based on competitor analysis of Zillow, Redfin, and Realtor.com property detail pages, plus user review and prioritization.

### Tier 1 & 2: Current Sprint (see `.brain/PORTAL_DETAIL_MODAL_SPRINT.md`)

| # | Feature | Status | Priority |
|---|---------|--------|----------|
| 1 | Accurate Property Tax + Payment Viz | Planned | P0 |
| 2 | Photo Mosaic Grid + Perf Optimization | Done (Session 33) | P1 |
| 3 | Sticky Header on Scroll | Done (Session 33) | P1 |
| 4 | Share Button (copy/email/SMS) | Planned | P1 |
| 5 | Price Change Indicator | Planned | P2 |
| 6 | Walk Score (Coming Soon placeholder) | Planned | P3 |
| 7 | Climate Risk (Coming Soon placeholder) | Planned | P3 |
| 8 | Listing Activity / Interest Badge | Planned | P2 |
| 9 | Print / PDF Export | Done (Session 33) | P3 |
| 10 | Property Comparison Tool (2-4 properties) | Planned | P2 |

### Additional Completed Items (Session 33, 2026-03-03)

**[Author: Claude Opus 4.6]**

- [x] **Market Stats Two-Column Table** — Replaced separate card boxes with a single table layout showing Neighborhood + Town columns (or Town-only when no neighborhood data). Rows: Median Price, Sales, DOM, $/sqft, Inventory, Price Trend.
- [x] **Comps Error Handling + Radius Expansion** — Backend returns empty 200 instead of 404 for missing subjects. Search radius expanded from 1.25mi to 3mi. Frontend uses soft stone-colored "not available" card instead of red error boxes.
- [x] **Neighborhood Display Throughout Modal** — Neighborhood name shown in quick details card, section heading, map heading ("Neighborhood Map: Westover"), and market stats column header. Resolved via Neighborhood table join in parcel detail API + `subdivision` field added to Pydantic schema.
- [x] **Photo Vertical Gallery** — "View all" button on last mosaic tile opens full-screen vertical scroll gallery with lazy loading, back button, and Escape key support.
- [x] **Transaction History Improvements** — Component now accepts `listingId` prop for reliable lookup. Removed redundant sub-header, reversed to most-recent-first chronological order, soft error styling.
- [x] **Neighborhood Data Pipeline** — Populated all 42 neighborhood boundary caches (was 23). Added nearest-neighbor fallback to `fix_parcel_assignments.py` for parcels outside Zillow polygons. 103,756 total parcels assigned to specific neighborhoods.
- [x] **Street View Heading Fix** — Added geodesic bearing calculation from panorama position to property coordinates. Images now face the property instead of pointing down the street.
- [x] **Off-Market Status Pill** — Replaced standalone card with "Currently Off-Market" pill overlay on Street View image.
- [x] **Map Scroll Zoom Disabled** — `scrollWheelZoom={false}` on neighborhood map to prevent scroll hijacking in the modal.

### Tier 3: Long-Term Roadmap

- **AI Property Chatbot** — Conversational Q&A per property. *Prerequisite: pgvector + multi-turn AI search.* *[Matt's note: More interested in this once vector DB search is built out.]*
- **AI Property Insight Chips** — AI-generated contextual badges ("Great for families", "Below market value"). *Prerequisite: vector DB embeddings.* *[Matt's note: Include in long-term roadmap; build after vector search and broader AI implementation.]*
- **Market Temperature Badge** — Real-time market heat indicator (hot/warm/cold) based on DOM, inventory, price trends.
- **Offer Strength Calculator** — Estimate competitiveness of a user's potential offer based on market conditions and comparable sales. *[Matt's note: I like this idea a lot.]*
- **Expected Proceeds Calculator (Off-Market)** — Zillow-style net proceeds estimate showing AVM minus closing costs, agent commissions, and estimated remaining loan balance. *[Matt's note: This should be on off-market properties specifically, similar to Zillow's feature.]*
- **"Similar Homes" Retrieval** — Vector-nearest-neighbor recommendations on detail modals. *Prerequisite: pgvector.*
- **AI "Why You'll Love This Home"** — Personalized descriptions based on user history/preferences. *Prerequisite: pgvector + user behavior tracking.*
- **Hybrid Ranking + "Why Matched" Transparency** — Semantic match reason chips on search cards. *Prerequisite: pgvector.*

---

## 2. UI/UX Suggestions

### Implementation Progress (2026-03-01, Session 24)

**[Author: Claude Opus 4.6]**

A full portal UI/UX makeover was completed to align the portal with the agent website's warm-neutral luxury aesthetic. Key changes:

- [x] **Cormorant Garamond typography** — Replaced Playfair Display with Cormorant Garamond (weights 300-700) in `apps/portal/src/app/layout.tsx`. Inter retained for body text.
- [x] **Stone warm-neutral palette** — Replaced blue/teal SaaS palette with stone-50 through stone-900 in `apps/portal/tailwind.config.js`. Teal retained as accent color.
- [x] **Globals.css rewrite** — Complete rewrite of `apps/portal/src/app/globals.css` with stone CSS variables, rounded-full buttons, rounded-2xl cards, emerald/amber/rose status badges.
- [x] **SiteHeader redesign** — Rewrote `apps/portal/src/components/layout/SiteHeader.tsx` with stone colors, uppercase tracking nav, scroll-responsive height, branded logo.
- [x] **Homepage redesign** — Rewrote `apps/portal/src/app/page.tsx` with stone-900 hero, radial gradient, warm feature cards, proper footer.
- [x] **PropertyCard restyle** — Rewrote `apps/portal/src/components/PropertyCard.tsx` with rounded-2xl, emerald/amber/rose status badges.
- [x] **PropertyDetailModal restyle** — Updated `apps/portal/src/components/PropertyDetailModal.tsx` with stone palette, kept multi-tab structure.
- [x] **ParcelDetailModal restyle** — Updated `apps/portal/src/components/ParcelDetailModal.tsx` with stone palette, kept multi-tab structure.
- [x] **Bulk color replacement** — All 60+ portal source files updated: gray→stone, blue→stone, green→emerald, yellow→amber.
- [x] **Header/Footer brand system** — Portal header and footer now match agent website design language.
- [x] **Duplicate utility class consolidation** — globals.css rewritten as single source of truth for component classes.
- [x] **Warm background treatment** — Stone-50 backgrounds with subtle stone-900 hero sections throughout.
- [x] **Consistent button & card patterns** — Rounded-full buttons, rounded-2xl cards, warm shadows matching agent website.
- [ ] **Deep redesign of portal properties page** — The properties page (`apps/portal/src/app/properties/page.tsx`) has the correct stone palette colors from Session 24, but the page layout, component structure, interactions, and visual polish do not yet match the quality of the agent website's home-search page (`apps/web/app/home-search/`). This is the **top priority** for the next UI/UX session. The home-search page is the design reference — study its layout and port patterns to the portal. **Do NOT modify the agent website home-search page.**
- [ ] **Upgrade to Tailwind CSS v4** — Portal remains on v3; upgrade planned for a future session.
- [ ] **Create Shared Design Tokens Package** — `packages/design-tokens` skeleton exists. Design tokens should be extracted FROM the agent website's existing styles (the source of truth) INTO this package, then consumed by the portal. The agent website home-search page design must not be changed.
- [ ] **Shared Component Library** — Future work: extract shared UI into `packages/ui` for portal/CRM visual parity.
- [ ] **Unify Form/Auth Surfaces** — Future work: standardize auth surfaces across portal and CRM.

---

### Original Suggestions (Reference)

**[Author: Gemini 3.1 Pro]**
- **Unified Luxury Branding:** The public portal (`smartmls-ai-app`) currently uses standard SaaS Tailwind gradients (bright blues and greens). For a hyper-local, high-end Fairfield County real estate platform, a more sophisticated aesthetic is required.
    - *Actionable Steps:*
        1. ~~Port the typography from `real-estate-platform`: Replace generic headings with `Cormorant Garamond` (serif) and use `Inter` (sans-serif) for body text to instantly achieve a luxury feel.~~ **DONE (2026-03-01)**
        2. ~~Adopt the "Stone" color palette (warm neutrals like `Stone 50` backgrounds and `#1c1917` text) from the CRM's `globals.css` to replace the bright gradients.~~ **DONE (2026-03-01)**
- **Shared Component Library:** To ensure a seamless user experience between the portal and the CRM, eventually extract shared UI components (buttons, modals, property listing cards) into an internal mono-repo/shared UI library. The listing card a buyer sees on the portal should be pixel-perfect identical to the listing card the agent sees in their CRM. *(Pending — future work after shared design tokens.)*

**[Author: Opus 4.6]**

- ~~**Adopt Cormorant Garamond for Headings:** Replace Playfair Display (currently used in the portal) with Cormorant Garamond to match the real-estate-platform.~~ **DONE (2026-03-01)**

- ~~**Shift to the Warm Stone Palette:** The portal's current navy blue (#1e3a8a) primary color feels generic. The warm stone/cream palette from the SAAS platform is distinctive and premium. Retain teal as accent.~~ **DONE (2026-03-01)**

- **Upgrade to Tailwind CSS v4:** The portal is on Tailwind 3, the platform on Tailwind 4. Standardize on v4 for its CSS custom property-based theming system. *(Planned for next session.)*

- **Create a Shared Design Tokens Package:** Extract the color palette, typography scale, spacing system, border radii, shadow definitions, and animation patterns into a shared configuration. *(Pending — skeleton exists in `packages/design-tokens`.)*

- ~~**Match the Warm Background Treatment:** Apply warm cream backgrounds and subtle radial gradients to replace flat white or gradient-heavy backgrounds.~~ **DONE (2026-03-01)**

- ~~**Adopt Consistent Button & Card Patterns:** Replace `glass-effect` and gradient-heavy styles with warm shadows, subtle borders, clean card surfaces.~~ **DONE (2026-03-01)**

- *[Matt's note: I am far happier with the real-estate-platform design and want to update the portal's design throughout to match it. The SAAS platform's aesthetic is the target -- the portal should feel like a natural extension of the same brand.]*

**[Author: Codex 5.3]**

### Additional UI/UX Suggestions

- ~~**Port Header/Footer Brand System First:** Prioritize moving the portal's header, nav spacing, logo lockups, and footer treatment to match `real-estate-platform`.~~ **DONE (2026-03-01)**

- **Unify Form/Auth Surfaces:** Standardize login, signup, saved-search modals, and profile forms so portal and CRM feel like one product family, especially if/when auth is unified via Clerk. *(Pending — future work.)*

- ~~**Eliminate Duplicate Utility Class Definitions:** The portal `globals.css` currently redefines key classes in multiple places. Consolidating this is important for consistent theming.~~ **DONE (2026-03-01) — globals.css fully rewritten as single source of truth.**

---

## 3. Integration Ideas

**[Author: Gemini 3.1 Pro]**
- **"Share to Client" Co-Branding Link (Highest Impact):** When an agent is using the Map Search/Prospecting tool within their CRM (`real-estate-platform`), they should be able to select multiple properties and click "Send to Client".
    - This generates a unique link to the public portal (`smartmls-ai-app`) with a query parameter (e.g., `?agent_id=123`).
    - The portal detects this parameter and overlays the Agent's headshot, name, and contact information via a sticky header/footer.
    - Crucially, all lead generation forms on these co-branded portal views route directly back to the specific agent's CRM, bypassing standard lead distribution.
- **Shared Auth State (SSO via Clerk):** Since the CRM currently leverages Clerk, extend this to the portal. If an agent is logged in to the CRM and visits the public portal, they should automatically be placed into an "Agent View", granting them access to private remarks, showing instructions, and a quick "Create CMA" button directly on the portal listings.
- **Client Collaborative Search Intelligence:** If a buyer registers on the public portal and "favorites" a home or saves a search, that action should trigger a webhook that appears in the activity feed of their assigned agent within the CRM, enabling real-time follow-up.

**[Author: Opus 4.6]**

### Tier 1: Shared Listing Data Layer (Foundation)

Both projects need listing data, and there should be one source of truth. The recommended approach:
- The portal's PostgreSQL/PostGIS database becomes the canonical listing data store. Both the portal's FastAPI backend and the SAAS platform's Next.js API routes read from this shared database.
- The SAAS platform's web app currently uses mock data (`mock-listings.json`). Replace the mocks with API calls to the portal's listing endpoints, or direct database reads if both backends can access the same PostgreSQL instance.
- The `packages/types/src/listings.ts` in the SAAS platform already defines a `Listing` interface. Map this to the portal's listing/parcel schema so both frontends speak the same data language.
- Schema separation within the shared database: portal tables (parcels, listings, AVM) vs. CRM tables (leads, activities, transactions) vs. shared tables (users, agents).

*[Matt's note: This sounds like a great idea to streamline the overall platform and simplify data management.]*

### Tier 2: "Share with Client" Feature (Must-Have)

Implementation approach:
1. Agent in CRM selects one or more listings and clicks "Share with Client," selecting a lead from their CRM.
2. System generates a branded share link: `https://portal.yourdomain.com/listing/12345?ref=agent-abc&utm_source=crm`
3. The portal renders the listing with the agent's branding (photo, contact info, brokerage) in a sticky footer or sidebar panel.
4. **Tracking:** When the client views the listing, the portal fires an event back to the CRM (via webhook or shared database write) logging the view, time spent, whether they saved/favorited it, and any actions taken.
5. The client can request a showing directly from the shared link, which creates an activity in the agent's CRM pipeline.

This requires:
- A shared authentication/identity layer (or at minimum, signed share tokens with expiry)
- An event bus or webhook system between the two backends
- Agent profile data accessible to the portal for branding overlay

*[Matt's note: This is a must-have feature. It is one of the primary integration points between the two platforms.]*

### Tier 3: Unified Authentication via Clerk (SSO)

The portal currently uses NextAuth.js + custom backend JWT. The SAAS platform uses Clerk. For seamless integration:
- **Recommended:** Migrate the portal to Clerk. This gives SSO between both platforms -- a user logs into the portal, the same identity works in the CRM. Agents log into the CRM, they're also authenticated on the portal.
- **Alternative:** Keep separate auth but implement a token exchange mechanism where the CRM generates a signed JWT that the portal accepts for agent-specific actions.
- Clerk migration is strongly preferred for long-term simplicity and user trust.

*[Matt's note: This will add credibility to the platform as a whole and make the portal a trusted resource for leads. Unified auth is important for the professional feel of the integrated platform.]*

### Tier 4: Portal as Data Provider for SAAS Agent Websites

Each agent's SAAS website needs a home search page. Instead of each site having its own search implementation, agent websites could consume the portal's search via:
- An iframe embed (quick but limited)
- A white-label React component exported from the portal (better UX, more work)
- A headless API where the SAAS website calls the portal's search endpoints and renders results in its own UI (most flexible)

*[Matt's note: Holding off on this for now. The current home-search feature on the agent SAAS site is simplified but powerful enough, and fits well with the needs of an individual agent site. Will revisit this later after the higher-priority integrations are in place.]*

### Tier 5: Shared Analytics & Lead Intelligence Pipeline (Critical Revenue Driver)

The portal generates leads (users searching, saving, requesting info). The CRM manages those leads. Connect them:
- **Behavioral tracking:** All portal user actions (searches, property views, favorites, time-on-page, contact requests, saved searches, comparison tool usage) are tracked and flow into the CRM as lead activity signals.
- **Predictive scoring:** The CRM's lead scoring engine uses portal engagement data as input signals (e.g., a user who has viewed 15 properties in Westport this week and saved 3 is a high-intent lead).
- **Market intelligence:** Aggregate portal search data (trending searches, popular neighborhoods, price range distribution) surfaces in the CRM's Market Digest for agents.
- **AVM integration across platforms:** The portal's AVM data powers multiple touchpoints:
    - The "Home Valuation" feature on agent SAAS websites (sellers enter their address, get an instant AVM estimate, which captures them as a seller lead)
    - CRM property views show AVM estimates alongside listing data for agent decision-making
    - CMA (Comparative Market Analysis) tools in the CRM use AVM data as a starting point
- **Monetization model:** Paying SAAS subscribers get the lead intelligence data for their assigned leads. Non-subscriber leads default to the platform owner (Matt), who can monetize through referrals or direct service.

*[Matt's note: This is critical and will be a major revenue generator. We need precise tracking of user behavior within the portal, and the ability to share that data with the CRM for clients who pay for the service. Non-subscriber leads get routed to me, which opens up alternative monetization pathways. The portal's AVM should be deeply incorporated into the agent SAAS sites' "home valuation" feature and utilized throughout the CRM.]*

### Suggested Overall Architecture

```
                    +-------------------------------+
                    |     Shared PostgreSQL          |
                    |  (PostGIS + pgvector + Prisma) |
                    +---------------+---------------+
                                    |
                +-------------------+-------------------+
                |                   |                   |
    +-----------v------+  +---------v--------+  +-------v----------+
    |  Portal API      |  |  SAAS API        |  |  Ingestion       |
    |  (FastAPI/Python) |  |  (Next.js/Node)  |  |  Worker          |
    +-----------+------+  +---------+--------+  +------------------+
                |                   |
    +-----------v------+  +---------v------------------+
    |  Portal UI       |  |  SAAS Apps                 |
    |  (Next.js)       |  |  (Web + CRM + Admin)       |
    +------------------+  +----------------------------+
```

The shared PostgreSQL database is the linchpin. Both backends read/write to it with proper schema separation (portal tables vs. CRM tables vs. shared tables like listings, users, and agents).

**[Author: Codex 5.3]**

### Additional Integration Suggestions

- **Define a Versioned "Listing Share" Contract:** Create a typed contract for "Share with Client" payloads (listing snapshot, source portal URL, agent context, tenant context, attribution fields, expiration). Keep it versioned for backward compatibility.

- **Queue-First Event Hand-Off to CRM:** Route portal behavioral events and share interactions into CRM via an ingestion queue + idempotent processors, not direct synchronous writes. This aligns with existing queue-first patterns already established in `real-estate-platform`.

- **Strict Tenant Scoping for Cross-Project Events:** Every portal->CRM event and listing-share request should carry tenant identity and be validated server-side before persistence. No cross-tenant reads/writes.

- **CRM Listing Actions as First-Class Integration Target:** Add "Copy Listing Link", "Email Listing", and "Send to Contact" actions in CRM lead/contact workflows as the primary downstream consumer of the portal integration.

---

## 4. Technicals

**[Author: Codex 5.3]**

### Security Hardening

- [ ] **Rotate Exposed Keys Immediately:** Rotate and replace all keys currently present in local env files, especially OpenAI and Google Maps API keys. Treat any committed/exposed key as compromised. *(Deferred by user until pre-launch.)*

- [~] **Harden Environment Secret Handling:** Keep all secrets in untracked env files and secret managers, update ignore rules to cover nested env files, and enforce pre-commit secret scanning. *(Nested env ignore coverage + repo pre-commit secret scanning are now implemented; secret-manager policy/rollout remains pending.)*

- [x] **Fail Fast on Weak Default Secrets:** Block startup in non-local environments if placeholder/fallback auth secrets are detected (backend JWT secret and frontend auth secret). *(Frontend + backend now enforce non-local secret validation.)*

- [x] **Protect Lead Data Endpoints:** Require authentication/authorization for lead retrieval endpoints, and restrict lead list/detail access to proper admin/agent scopes. *(Lead retrieval now requires authenticated `admin`/`agent` scope in backend `services/portal-api`.)*

- [x] **Lock Down Test/Debug Routes in Non-Dev:** Remove or strictly gate test endpoints (e.g., Sentry test routes) outside local development. *(Implemented for portal debug pages via `apps/portal/src/middleware.ts` and backend `/test-sentry` gating in `services/portal-api/app/main.py`.)*

- [x] **Add Rate Limiting on Costly/Public Endpoints:** Rate-limit AI search, auth, lead submission, favorites, and saved-search endpoints with user/IP/global controls. *(Implemented via `/api/portal` policy mapping + NextAuth credentials throttling.)*

### Stability

- [x] **Fix Known Runtime Field Mismatch:** Parcel favorites response currently references `favorite.parcel.address` while model field is `address_full`; fix this to prevent runtime errors. *(Implemented via favorites payload normalization in proxy utils.)*

- [x] **Resolve Alert Job Model/Field Drift:** Move alert models into canonical model modules, avoid importing ORM models from route files, and fix the `user.name` vs `user.full_name` mismatch in alert delivery code. *(Implemented in `services/portal-api` with canonical `SearchAlert` model + job import/name fix.)*

- [x] **Complete Backend Dependency Manifest:** Ensure all imported packages are declared (JWT, passlib/argon2, dotenv, etc.) so clean installs/deploys are deterministic. *(Implemented in `services/portal-api/requirements.txt` with explicit auth/dotenv/alembic deps.)*

- [x] **Standardize API Base URL Env Vars:** Unify on one frontend API base variable naming convention and usage pattern across all pages/components to avoid environment-specific failures. *(Portal client components now consistently use `/api/portal`; server-side portal fetches now resolve through shared `joinPortalApiPath(...)` in `apps/portal/src/lib/server/portal-api.ts` with canonical `PORTAL_API_URL`/`NEXT_PUBLIC_API_URL` fallback.)*

- [x] **Remove Production Debug Logging Noise:** Strip high-volume console/debug logs from hot UI paths (especially search/map flows) to reduce noise and improve runtime clarity. *(High-volume logs in `properties/page.tsx`, `LeafletParcelMap.tsx`, `OverlayLayer.tsx`, `UnifiedSearchBar.tsx`, and `StreetViewWidget.tsx` are now gated to development-only `debugLog`/`debugWarn` wrappers.)*

### Reliability

- [x] **Move Long-Running Schedulers Out of Web App Startup:** Run periodic import/alert jobs in dedicated worker processes to avoid duplicate execution in multi-worker web deployments. *(Implemented in `services/portal-api` via dedicated scheduler worker entrypoint; web startup no longer starts scheduler loops.)*

- [x] **Adopt Alembic-Backed Migration Discipline:** Keep schema changes versioned and reproducible with migration reviews and deployment checks. *(Alembic scaffolding + real revisions are in place and runtime validation now passes in both SQLite and deployment-like Postgres contexts: `current -> upgrade head -> current` reaches `20260302_000002 (head)`.)*

- [x] **Enforce CI Quality Gates:** Require backend tests, frontend lint/type checks, and critical route smoke tests before merge/deploy. *(Portal frontend CI passes end-to-end; backend CI gate is standardized via root `ci:portal-api` + `services/portal-api/scripts/ci-gate.sh`, requires PostgreSQL/PostGIS, defaults to `tests/test_hardening_smoke.py app/tests/test_api.py tests/test_phase0.py`, and now has authoritative Windows/Postgres runtime pass evidence.)*

- [ ] **Break Up Monolithic Search Page:** Decompose `properties/page.tsx` into smaller modules/hooks to reduce regression risk and improve testability.

- [ ] **Correct AI Cost Estimation Math:** Update token-to-cost calculations so usage analytics and budgeting dashboards are reliable.

### Implementation Progress (2026-03-02)

**[Author: Codex 5.3]**

- [x] **Fail Fast on Weak Default Secrets (frontend scope):** Implemented in `apps/portal/src/lib/server/env-security.ts` and enforced from `apps/portal/src/lib/auth.ts` for non-local environments.
- [x] **Protect Lead Data Endpoints (frontend gateway scope):** Implemented auth-required policy for `GET /leads` via `apps/portal/src/app/api/portal/[...path]/route.ts`; `/agents` now uses authenticated access and no sample lead fallback.
- [x] **Lock Down Test/Debug Routes in Non-Dev:** Implemented via `apps/portal/src/middleware.ts` for `/test-map` and `/test-leaflet`.
- [x] **Add Rate Limiting on Costly/Public Endpoints:** Implemented endpoint-specific limits for AI search, auth registration/credentials, lead submit/read, favorites, saved searches, and alerts through the `/api/portal` gateway + NextAuth credentials throttling.
- [x] **Fix Known Runtime Field Mismatch (`address` vs `address_full`)**: Implemented gateway-level favorites payload normalization in `apps/portal/src/app/api/portal/proxy-utils.ts`.
- [x] **Enforce CI Quality Gates (frontend scope):** Added `typecheck`, `test:routes`, and `check` in `apps/portal/package.json`, plus root `ci:portal` and route-smoke coverage (`proxy-utils.test.ts`).
- [x] **Fail Fast on Weak Default Secrets (backend scope):** Added startup validation in `services/portal-api/app/core/config.py` and enforced from `services/portal-api/app/main.py` for non-local environments.
- [x] **Protect Lead Data Endpoints (backend scope):** Added authn+authz guard on `GET /leads` and `GET /leads/{lead_id}` in `services/portal-api/app/api/routes/leads.py` for `admin`/`agent` user types.
- [x] **Resolve Alert Job Model/Field Drift (`user.name` vs `user.full_name`):** Moved alert ORM model to `services/portal-api/app/models/search_alert.py`, updated routes/jobs to import canonical model, and switched alert emails to `user.full_name`.
- [x] **Complete Backend Dependency Manifest:** Added missing `python-jose`, `passlib[argon2]`, `python-dotenv`, and `alembic` entries in `services/portal-api/requirements.txt`.
- [x] **Move Scheduler Out of Web Startup:** Removed scheduler start from `services/portal-api/app/main.py` and added dedicated worker runner `services/portal-api/app/workers/scheduler_worker.py`.
- [x] **Lock Down Test/Debug Routes in Non-Dev (backend scope):** Restricted `GET /test-sentry` to `local` environment in `services/portal-api/app/main.py`.
- [x] **Portal Typecheck Baseline Fix:** Updated `apps/portal/tsconfig.json` React module/type resolution so monorepo React 19 typings no longer leak into portal React 18 compilation.
- [x] **Pre-Commit Secret Scanning Rollout:** Added `scripts/security/scan-secrets.sh`, `.githooks/pre-commit`, hook installer script, and root security scripts; expanded `.gitignore` env coverage for nested app/service env files.
- [x] **Alembic Real Migration Flow:** Added revision `20260302_000002_search_alerts_constraints` (post-baseline schema change), aligned `SearchAlert` model, and validated `alembic upgrade head` in both SQLite (`sqlite:///./test.db`) and Postgres (`postgresql://postgres:user@localhost:5432/smartmls_db`) via Windows virtualenv.
- [x] **Adopt Alembic Discipline:** Added `services/portal-api/alembic.ini`, `alembic/env.py`, baseline revision `20260302_000001`, and first real revision `20260302_000002`; runtime validation now passes in SQLite and Postgres-backed upgrade checks.
- [x] **Standardize API Base URL Env Vars (frontend + server fetches):** Client components now use `/api/portal` consistently (no mixed `NEXT_PUBLIC_BACKEND_URL` usage), and SSR pages/sitemap now fetch upstream via `joinPortalApiPath(...)`.
- [x] **Remove Production Debug Logging Noise (search/map hot paths):** Converted noisy `console.log`/`console.warn` traces in map/search-heavy surfaces to development-only debug wrappers.
- [x] **Backend Hardening Smoke-Test Gate:** Added `services/portal-api/tests/test_hardening_smoke.py` covering `/health/`, `/test-sentry`, `/leads/` authn/authz behavior, authenticated `/api` write-path guard checks for `favorites`/`saved-searches`/`alerts`, and authenticated write success-path coverage for `saved-searches` + `favorites`.
- [x] **Legacy Backend Suite Modernization (`app/tests/test_api.py`, `tests/test_phase0.py`):** Replaced SQLite-coupled/stale endpoint assertions with deterministic dependency-override route-contract tests aligned to current health/leads/listings/cities behavior; suites are reintroduced into default backend gate targets.
- [x] **Authoritative Runtime Script (Windows + Postgres):** Added `services/portal-api/scripts/ci-gate-windows.cmd` and documented env/runtime usage in backend README to keep CI execution reproducible outside WSL tool drift.
- [x] **Backend CI + Alembic Runtime Validation:** Updated `services/portal-api/scripts/ci-gate.sh` to run configurable test targets (default: `tests/test_hardening_smoke.py app/tests/test_api.py tests/test_phase0.py`) plus Alembic `current -> upgrade head -> current` checks with explicit PostgreSQL/PostGIS requirement.
  - Authoritative host-runtime execution now passes via `cmd.exe /v:on /c "... && set DATABASE_URL=postgresql://postgres:user@localhost:5432/smartmls_db&& services\\portal-api\\scripts\\ci-gate-windows.cmd"`.
  - Backend tests pass with expanded smoke suite: `29 passed`.
  - Alembic checks pass pre/post-upgrade at `20260302_000002 (head)`.

---

## 5. Folder Structure Migration (Completed 2026-03-01)

**[Author: Claude Opus 4.6]**

### What Was Done

A **hybrid merge** was executed to bring the portal frontend into the real-estate-platform monorepo while keeping the Python/FastAPI backend standalone.

**Portal frontend (`smartmls-ai-app/frontend`)** → `real-estate-platform/apps/portal/`
- Package renamed from `smartmls-frontend` to `@real-estate/portal`
- Registered as an npm workspace via the existing `apps/*` glob in root `package.json`
- Workspace scripts added: `dev:portal`, `build:portal`, `lint:portal`
- Aggregate `build` and `lint` scripts updated to include portal

**Portal backend (`smartmls-ai-app/backend`)** → remains standalone as `portal-api`
- The Python/FastAPI backend has no code-sharing benefit from living in a TypeScript monorepo
- Portal frontend communicates with portal-api via `NEXT_PUBLIC_API_URL`
- The backend can be deployed independently

**Shared design tokens** → `real-estate-platform/packages/design-tokens/`
- Package: `@real-estate/design-tokens`
- Contains shared color palettes, typography scales, and spacing values
- Both portal and SaaS apps can import from this package for visual consistency

### New Folder Structure

```
real-estate-platform/
  apps/
    web/           — Tenant website runtime (Next.js)
    crm/           — Tenant CRM runtime (Next.js)
    admin/         — Internal SaaS control-plane portal (Next.js)
    studio/        — CMS authoring (Sanity Studio)
    portal/        — Public listing portal (Next.js) ← NEW
  packages/
    ui/            — Shared design system/components
    design-tokens/ — Shared color/typography/spacing tokens ← NEW
    config/        — Shared lint/ts/tailwind configs
    types/         — Shared domain/event type contracts
    auth/          — Authz/authn helpers + role policies
    db/            — Prisma schema, migrations, data access
    ...
  services/
    ...
```

### Naming Conventions
- Workspace packages follow `@real-estate/<name>` naming
- The monorepo remains `real-estate-platform` (no rename)
- The standalone Python backend is referred to as `portal-api` in documentation
- Backup copies: `real-estate-platform-backup/`, `smartmls-ai-app-backup/`

### Git Strategy
- All portal frontend changes are committed to the `real-estate-platform` repo
- Portal-api changes are managed in its own repository
- Cross-project integration (shared events, API contracts) is coordinated through documentation and typed contracts in `packages/types`

### Decision Record
See `.brain/DECISIONS_LOG.md` → **D-202** for the full architectural decision record.

---
