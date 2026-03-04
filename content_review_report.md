# Town and Neighborhood Content Review

## Executive Summary
I have conducted a full review of the written content for the towns and neighborhoods (currently housed in Sanity CMS). The core information—such as parks, Metro-North stations, and local landmarks—is accurate and highly relevant. However, from a qualitative and SEO/AEO perspective, the content exhibits a noticeable "AI-generated" footprint due to repetitive sentence structures and formulaic phrasing. 

To achieve the high-end, luxury-site feel you are aiming for and to maximize Google Search/AEO ranking potential, the content requires a stylistic overhaul to remove the templated feel and deepen the editorial authority.

---

## 1. The "AI-Generated" Footprint & Human-Like Quality
### Current State:
The content heavily relies on a recurring formula. Across almost all neighborhood descriptions, we see the exact same sentence structures used to open and close paragraphs.
- **The "First-Person" Formula:** Phrasing such as *"In my experience..."*, *"From my perspective..."*, and *"When I advise clients here..."* is used repeatedly. While intended to sound like a human agent, when applied identically across 40+ neighborhoods, it immediately flags the content as automated or templated.
- **The Cloned Conclusion:** Almost every neighborhood description ends with a Mad-Libs style conclusion: *"For buyers who want [Town] with a [Adjective] setting, [Neighborhood] is a strong fit / stands out / fits well."*
- **Repetitive Adjectives:** Words like *"tucked-away"*, *"polished"*, *"refined"*, and *"cadence/rhythm"* are heavily overused across different towns, diluting their impact.

### Recommendations for Human-Quality:
- **Adopt an Editorial Third-Person Voice (or Unified Brand Voice):** Drop the artificial "I/My" narrative unless the site is strictly a solo-agent brand. A luxury editorial voice (think *Architectural Digest*, *Monocle*, or high-end hospitality) speaks with authoritative, quiet confidence without needing to say "in my experience."
- **Shatter the Templates:** Rewrite the conclusions so no two paragraphs follow the same rhythmic structure. Vary sentence lengths drastically. Human writers naturally employ varied syntax; AI tends to default to balanced, medium-length sentences.

---

## 2. Luxury Tone & Insightfulness
### Current State:
The content tells the reader that an area is luxury (*"estate-like", "refined"*), but often fails to *show* them. True luxury copywriting relies on hyper-specificity rather than buzzwords.
- The content effectively points out logical amenities (e.g., *The Aldrich Museum*, *Waveny Park*, *Metro-North ticket machines*). This is great for practical insight.
- However, it lacks the sensory and historic details that make a luxury buyer fall in love with a neighborhood before they even visit.

### Recommendations for Luxury Tone:
- **Describe the Canvas, Not Just the Amenities:** Instead of simply saying "it has a wooded feel," describe the *actual* environment: *"Winding lanes framed by centuries-old stone walls,"* *"Sweeping lawns that gently grade down to the Long Island Sound,"* or *"A canopy of mature oaks that offers deep privacy."*
- **Focus on Architectural Heritage:** Luxury buyers care about architecture. Introduce specific terms (e.g., *Center-hall Colonials, shingle-style waterfronts, mid-century moderns, historic antique farmhouses*). 
- **Understated Elegance:** Don't go overboard with superlatives (avoid "the most amazing," "breathtaking," "unbelievable"). Keep the tone informed, objective, and deeply knowledgeable. 

---

## 3. SEO & AEO (Answer Engine Optimization)
### Current State:
Search engines (and LLMs like ChatGPT/Claude) prize **Originality**, **Information Gain**, and **Entity Density**.
- **Positives (AEO):** The content is excellent at naming specific entities—exact addresses for parks, specific train lines (*Danbury Branch, New Haven Line*), and specific museum names. LLMs love this structured, factual data. This will help you rank well in AI answer engines.
- **Risks (SEO):** Google’s "Helpful Content System" penalizes programmatic or "scaled" content that follows strict templates. Because the sentence structures are nearly identical from page to page, Google may view these pages as low-effort or low-originality, which will severely hurt organic ranking.

### Recommendations for SEO/AEO Maximization:
- **Semantic Keyword Expansion:** Currently, the content uses the same core keywords (*single-family homes, privacy, commuter*). Expand the semantic net to capture long-tail luxury searches. Include terms like: *turnkey estates, deep-water docks, equestrian-friendly zoning, historic preservation, walkable village lifestyle, multi-acre parcels*.
- **Varied Headings (H2s/H3s):** Ensure that the headings used on the pages aren't just universally "Overview" and "Lifestyle". Mixing up H2s (e.g., *"The Waterfront Lifestyle in Tokeneke"* vs *"Everyday Living in Noroton Heights"*) adds unique on-page SEO signals.
- **Deepen the "Information Gain":** Google rewards pages that offer information not easily found elsewhere. Including specific real estate nuances—such as typical lot sizes in a neighborhood (e.g., *"zoning here typically requires 2-acre minimums"*), or the specific character of the local beach (e.g., *"sandy at low tide, rocky at high tide"*)—proves human expertise and boosts SEO.

---

## Proposed Next Steps
1. **Strategic Rewrite:** I can begin a systematic rewrite of the Sanity content, stripping away the "AI-isms" and applying a high-end, editorial, SEO-optimized tone.
2. **Review a Pilot Batch:** I can rewrite 1 Town and its associated Neighborhoods (e.g., Greenwich and its neighborhoods) as a proof-of-concept for your approval before updating the rest of the database.
3. **No Code Changes Required:** Since this is entirely content-driven from the Sanity CMS, we can execute this through a script or direct updates without modifying the application code.

---
---

# Opus 4.6 Review

## Methodology

I pulled all content directly from the Sanity CMS production dataset (project `phc36jlu`) via the public API, covering all 9 towns and 69 neighborhoods. I reviewed every field: `overviewShort`, `overviewLong`, `lifestyle`, `marketNotes`, `highlights`, `faqs`, `seoTitle`, `seoDescription` for towns, and `overview`, `description`, `highlights`, `housingCharacteristics`, `marketNotes`, `locationAccess`, `seoTitle`, `seoDescription` for neighborhoods. I also reviewed the page rendering components, JSON-LD structured data, SEO metadata generation, the copywriting brief, the highlight update scripts, and the FAQ generation logic.

---

## 1. Agreement with Gemini's Findings

Gemini's diagnosis is largely correct. I want to be specific about where I agree, where I partially disagree, and what was missed.

### What Gemini Got Right

**The "AI fingerprint" is real and measurable.** I ran a phrase-frequency analysis across all 69 neighborhood overviews and the numbers confirm the templated pattern:

| Phrase | Occurrences (out of 69 overviews) |
|---|---|
| "feel" (as a descriptor) | 69/69 — literally every single one |
| "lifestyle" | 49/69 |
| em dashes (—) | 47 instances |
| "primarily single-family" | 40/69 |
| "For buyers who" | 37/69 |
| "quieter" | 23/69 |
| "practical" | 22/69 |
| "cadence" | 19/69 |
| "tucked-away" / "tucked" | 15/69 |
| "day-to-day" | 14/69 |
| "strong fit" / "fits well" / "stands out" | 25+ across overviews |

When every neighborhood overview uses the word "feel" and more than half use "lifestyle," the content reads like a single template was filled in 69 times. Any human reader—and certainly Google's classifiers—will pick up on this.

**The "cloned conclusion" pattern is severe.** Gemini flagged this qualitatively; here's the quantitative proof. Seven of nine town `overviewShort` fields end with the identical pattern:

- Darien: *"If you value shoreline access and a tight-knit day-to-day routine, Darien delivers."*
- Fairfield: *"If you want shoreline access without giving up everyday convenience, Fairfield is a strong fit."*
- Greenwich: *"If you want a highly polished Fairfield County lifestyle with real variety by neighborhood, Greenwich delivers."*
- New Canaan: *"If you want a refined small-town rhythm with real community identity, New Canaan fits beautifully."*
- Norwalk: *"If you want variety and you want the option to live close to the water, Norwalk is a strong choice."*
- Ridgefield: *"If you want a strong town identity with more room to breathe than the shoreline corridor, Ridgefield is a great fit."*
- Wilton: *"If you want Fairfield County living with more breathing room, Wilton fits well."*

That's "If you want [X], [Town] [delivers / is a strong fit / fits well / is a great fit / is a strong choice / fits beautifully]" repeated seven times. A reader browsing multiple town pages will notice this immediately.

**The "lifestyle" section opening formula is identical.** Every town's lifestyle field opens with "[Town]'s lifestyle is [defined by / built around / anchored by / centered on / depends on]..." Nine for nine.

**The "marketNotes" three-paragraph template is universal.** Every town follows the exact same structure:
1. Paragraph 1: "[Town] is [a/primarily] [market type description]."
2. Paragraph 2: "My approach is... / When I advise... With a/my finance background..."
3. Paragraph 3: "For sellers, [Town] [rewards / performs best / typically rewards]..."

This is the single most templated section of the content. The phrase "finance background" appears 9 times across 9 towns. "For sellers" appears as a paragraph opener in all 9 towns. "Discipline" (as in "price with discipline") appears 8 times. When every market section reads the same way, it undermines the impression of genuine local expertise—which is the opposite of what the content is trying to achieve.

### Where I Partially Disagree with Gemini

**On dropping first-person voice entirely:** Gemini recommends adopting "an editorial third-person voice" and dropping the "I/My" narrative. I disagree with this as a blanket recommendation. This is explicitly a solo-agent brand (Matt Caiola Luxury Properties). First-person voice is a legitimate and effective choice for personal brand real estate sites. The problem is not the first person itself—the problem is that first-person insertions are formulaic and evenly distributed. A skilled human writer would use "I" sparingly and only where genuine personal knowledge adds credibility (e.g., "I've walked this beach at low tide—it's sandy and gentle, ideal for families" or "I live in Westover, so I know this stretch of High Ridge Road well"). Currently, "In my experience" and "From my perspective" are sprinkled mechanically into paragraphs where they add no real personal insight. The fix is selective, authentic first-person use—not elimination.

**On "hyper-specificity" in luxury copy:** Gemini's recommendation to "describe the canvas" is directionally right, but some of their example rewrites risk replacing one AI voice with another. Phrases like *"Sweeping lawns that gently grade down to the Long Island Sound"* read like AI-generated luxury copy—ornate and generic in a different way. The specificity needs to be genuinely informative, not decoratively purple. Better: *"Lots in Tokeneke commonly run one to two acres, and many of the original stone boundary walls from the 1800s still line the roads."* That's specific, verifiable, and sounds like someone who actually knows the neighborhood. The standard should be: would a knowledgeable local agent say this in conversation? If not, it's decoration, not information.

---

## 2. Issues Gemini Did Not Flag

### 2A. Critical SEO Infrastructure Gaps

This is the most actionable finding in this review. The content quality issues are real, but these structural SEO gaps are arguably more damaging right now:

**`seoTitle` is MISSING for all 9 towns and all 69 neighborhoods.** The Sanity schema defines `seoTitle` and `seoDescription` fields, but not a single document has them populated. The page components fall back to auto-generated titles:

- Town pages: `"{Town} CT Real Estate | Homes, Neighborhoods & Market Info"` (hard-coded pattern in `generateMetadata`)
- Neighborhood pages: `"{Neighborhood}, {Town} CT | Neighborhood Guide"` (hard-coded pattern in `generateMetadata`)

These are acceptable fallbacks, but custom SEO titles allow you to target specific keyword variations, include branded terms, and differentiate pages from competitors. Every competing luxury real estate site in Fairfield County will have similar auto-generated titles. Custom titles are low-effort, high-impact SEO.

**`seoDescription` is MISSING for all 9 towns and all 69 neighborhoods.** The meta description falls back to `overviewShort` for towns and `overview` for neighborhoods. Since those fields were written for on-page display (not search result snippets), they're suboptimal for SERP click-through. Meta descriptions should be 150-160 characters, action-oriented, and include a call to action. Current overviews are 400-600+ characters and conversational in tone.

**5 of 9 towns have zero FAQs** (New Canaan, Norwalk, Ridgefield, Stamford, Wilton). The FAQ section drives FAQ Schema markup via the `TownFAQs` component, which directly impacts rich snippet eligibility in Google Search. Missing FAQs = missing rich results. The 3 existing FAQ sets for the towns that do have them (generated by the `generateFAQs()` function in `update-sanity-content.ts`) are themselves templated and thin:

- *"Commuting to New York City is convenient via Metro-North Railroad's New Haven Line. Peak travel times to Grand Central Terminal are typically between 60-70 minutes..."* — This same answer template was applied to all towns, with only the town name swapped. The commute time claim of "60-70 minutes" is inaccurate for several towns (Greenwich express is ~47 min, Stamford express is ~45 min). Inaccurate FAQ answers can actively harm search credibility.

**Zero neighborhoods have FAQs.** The neighborhood schema supports FAQs but the page component doesn't render them, and none are populated. Neighborhood-level FAQs are high-value for long-tail search capture ("What is it like to live in Old Greenwich?" "Is Rowayton a good place to raise a family?").

**No neighborhood pages have JSON-LD structured data.** Town pages include a `Place` schema.org JSON-LD block, but neighborhood pages have none. Adding `Place` or `Neighborhood` structured data to neighborhood pages would improve entity recognition by search engines and LLMs.

**Town JSON-LD uses a placeholder domain.** The structured data URL is hard-coded as `https://example.com/towns/${townSlug}`. This should be the actual production domain. Incorrect structured data URLs can confuse search engines and void the benefit of the markup.

### 2B. Empty Schema Fields — Wasted Content Depth

The neighborhood Sanity schema defines three fields that are **populated for zero neighborhoods**:

| Field | Purpose | Status |
|---|---|---|
| `housingCharacteristics` | Housing stock details | 0/69 populated |
| `marketNotes` | Market insights per neighborhood | 0/69 populated |
| `locationAccess` | Location and access details | 0/69 populated |

These fields exist in the schema (and could be rendered on the page), but no content was written for them. If these were populated and rendered, each neighborhood page would have significantly more unique content, reducing the "thin content" risk and providing genuine information gain that Google rewards.

### 2C. The "Cadence" Problem

Gemini mentions "cadence" as overused. I want to flag this more strongly: the word "cadence" is used 19 times in neighborhood overviews and 2 times in town content to describe the pace or rhythm of a neighborhood. This is not how human real estate professionals talk. Nobody says "this neighborhood has a residential cadence." It's a word that AI language models favor because it's sophisticated-sounding and vague. It is arguably the single most recognizable AI tell in the entire content set. Every instance should be rewritten with concrete language that describes the actual daily experience.

### 2D. MTA Ticket Machine Citations

The town `lifestyle` sections include oddly specific MTA infrastructure details: *"the MTA notes three ticket machines, no ticket office, and a waiting area and public restrooms (daily 5 a.m.–10 p.m.)"*. This appears in 7 of 9 towns. This is:

1. **Not luxury copy.** A high-end real estate site should not read like a transit agency FAQ.
2. **Actively harmful for credibility.** Citing "per the MTA" makes it sound like the content was assembled by scraping public data sources—which is exactly what happened.
3. **A maintenance burden.** MTA amenity details change. If a station adds or removes a ticket machine, the content becomes inaccurate.
4. **Irrelevant to the buying decision.** Nobody chooses a $2M home because the train station has three ticket machines instead of two.

The commuter information itself is valuable (commute times, line names, express service availability), but the delivery needs to sound like an agent who rides the train, not someone who read the MTA website.

### 2E. Highlight Bullet Repetition

The 345 neighborhood highlight bullets contain significant repetition:

- **21 bullets end with "for commuter rail access"** — identical phrasing across 21 different neighborhoods.
- **37 bullets start with "Easy access to"** — over 10% of all bullets open the same way.
- **Multiple exact duplicates** exist across neighborhoods: "Lake Mohegan nearby for fresh-water swimming and nature trails" (3x), "Easy drive to downtown Stamford dining, arts, and Metro-North service" (3x), "Westport Metro-North (New Haven Line) within reach for commuting" (3x).
- **"Predominantly single-family" or "Primarily single-family"** appears in 32 of 345 bullets.

Google does read and index bullet-point content. When the same phrases recur across dozens of pages within a single domain, it signals programmatic generation to Google's systems.

### 2F. Page Section Heading Uniformity

Gemini mentioned varied headings briefly. I want to emphasize the severity. Currently:

**All 9 town pages use identical H2 headings:**
- "About {Town}"
- "Living in {Town}"
- "Real Estate in {Town}"
- "What Makes {Town} Special"
- "Frequently Asked Questions About {Town}"

**All 69 neighborhood pages use identical H2 headings:**
- "Overview"
- "Living in {Neighborhood}"
- "What Makes {Neighborhood} Special"
- "Walkability & Transit"

Identical heading structures across 78 pages reinforce the "programmatic content" signal. Each page should have at least one unique or varied heading that reflects the actual character of the area (e.g., "The Waterfront in Shippan" vs. "Ridgefield's Main Street Culture" vs. "Wilton's Trail Network").

**Note:** The heading uniformity is in the page components (`[townSlug]/page.tsx` and `[neighborhoodSlug]/page.tsx`), not in Sanity content. Fixing this requires either: (a) adding a custom heading field to the Sanity schema, or (b) modifying the page components to derive varied headings from content properties. Option (b) is simpler and probably sufficient—e.g., if a town has "coastal" in its overviewShort, the lifestyle heading could be "Coastal Living in {Town}" instead of "Living in {Town}."

---

## 3. Content Quality — Specific Examples

### 3A. Town-Level Content

**Darien `overviewLong` (representative of all towns):**
> *"Darien has a very specific kind of appeal: coastal Connecticut living with a compact footprint and a true sense of community... What I like about Darien for many clients is how 'easy' it feels once you're here..."*

Issues:
- "Very specific kind of appeal" is vague—what is the specific appeal?
- "True sense of community" is a cliché that could apply to any town.
- Quotes around "easy" are a verbal tic—either it's easy or explain why it feels that way.
- The paragraph lacks a single named street, landmark, building, restaurant, or school. A knowledgeable agent would name things.

**Stamford `overviewShort` — the best of the nine:**
> *"Stamford is where Fairfield County's urban energy meets true neighborhood variety... I live in Stamford, and it's a city I know street-by-street—not just by market stats."*

This is the only town overview that references Matt's actual personal connection. It breaks the formula and sounds authentic. The rest of the content should aspire to this level of specificity and personal grounding.

### 3B. Neighborhood-Level Overviews

**Downtown Greenwich overview (representative of the formulaic pattern):**
> *"Downtown Greenwich is Fairfield County's most polished village center—Greenwich Avenue shopping, restaurants, and a true 'walkable luxury' routine. Housing nearby ranges from apartments and condos to..."*

Pattern: [Neighborhood] is [superlative/descriptor]—[amenity], [amenity], and [lifestyle claim]. Housing [ranges from X to Y]...

Compare this to how a luxury real estate site like Sotheby's International Realty or Brown Harris Stevens would describe the same area—they would lead with a specific detail or scene, not a category label.

**The "quiet streets" and "calm pace" rut:** At least 35 of the 69 neighborhood overviews describe the area as "quiet," "calm," or "quieter." While many of these neighborhoods genuinely are quieter, using the same descriptor across half the content makes the entire site read like it only has one note. Some of these neighborhoods are quite different from each other (South Norwalk vs. North Wilton, for instance), but the language homogenizes them.

### 3C. Neighborhood Descriptions (PortableText / "Living In" Section)

All 69 neighborhoods have populated descriptions (~800-1200 chars each). The quality is consistent but consistently formulaic. Nearly every description follows this structure:

1. Opening sentence establishing character/feel
2. "Real estate here is [primarily/predominantly] single-family..." paragraph
3. "In my experience, [this area] [appeals to / fits / works well for]..." paragraph
4. One specific local landmark or amenity citation
5. Closing about commuter access or lifestyle fit

The content would benefit from breaking this formula entirely. Some neighborhoods should lead with their history. Others should lead with a specific experience (walking the harbor at Rowayton, the Dogwood Festival in Greenfield Hill). The current structure reads like a well-organized database report, not editorial content.

---

## 4. Prioritized Recommendations

In order of impact and urgency:

### Priority 1 — Fix SEO Infrastructure (No Content Rewrite Needed)

These are low-effort, high-impact fixes that don't require rewriting any prose:

1. **Populate `seoTitle` and `seoDescription`** for all 9 towns and 69 neighborhoods. This can be scripted—generate targeted meta titles (under 60 chars) and meta descriptions (150-160 chars) that include primary keywords and a call to action. Example for Greenwich: Title: `"Greenwich CT Homes for Sale | Neighborhood Guide"`, Description: `"Explore Greenwich, Connecticut real estate by neighborhood. From downtown condos to backcountry estates—find the lifestyle that fits. Contact Matt Caiola."`

2. **Add FAQs for the 5 towns that lack them** (New Canaan, Norwalk, Ridgefield, Stamford, Wilton). Write 3-5 unique, specific FAQs per town with accurate commute times and local details. Don't use the `generateFAQs()` template—it produces identical answers with inaccurate commute times.

3. **Fix the JSON-LD placeholder domain** in `apps/web/app/towns/[townSlug]/page.tsx` — replace `https://example.com` with the actual production URL.

4. **Add JSON-LD structured data to neighborhood pages** — currently only town pages have it.

5. **Fix inaccurate commute times** in existing FAQs. The template says "60-70 minutes" for all towns, but Greenwich express is ~47 min, Stamford express is ~45 min, Darien is ~50-55 min. Inaccurate information in FAQ Schema hurts trust signals.

### Priority 2 — Eliminate the Most Obvious AI Tells

Targeted find-and-replace operations that dramatically reduce the AI footprint without a full rewrite:

1. **Remove or replace every instance of "cadence"** (21 total across all content). Replace with concrete descriptions of daily experience.
2. **Remove all MTA ticket machine citations** from lifestyle sections. Replace with agent-perspective commute advice.
3. **Break the "If you want [X], [Town] delivers" closing pattern** in all 9 town overviewShort fields. Write unique closing sentences.
4. **Break the "[Town]'s lifestyle is [defined by / built around]..." opening pattern** in all 9 lifestyle fields.
5. **Vary the marketNotes structure** — not every town needs the same "here's the market / here's my approach / here's what sellers should know" three-paragraph format.
6. **Diversify highlight bullet openings** — replace at least half of the 37 "Easy access to..." bullets with varied phrasing.
7. **Remove exact duplicate highlights** across neighborhoods.

### Priority 3 — Content Depth and Luxury Positioning

A more involved rewrite, best done town-by-town as Gemini suggested:

1. **Add genuine local specificity** to every neighborhood overview and description: named streets, named restaurants, named schools, approximate lot sizes, architectural styles, and seasonal details.
2. **Populate the empty `housingCharacteristics`, `marketNotes`, and `locationAccess` fields** for neighborhoods—or remove them from the schema if they won't be used.
3. **Create neighborhood-level FAQs** for at least the most-searched neighborhoods (Old Greenwich, Westport downtown, SoNo, Belle Haven, Rowayton, etc.).
4. **Use first-person voice selectively.** Reserve "I" and "my experience" for moments where Matt's genuine personal knowledge adds something no other site would say. In neighborhoods where Matt has actual transaction experience or personal familiarity, lean into that. In others, a confident editorial voice without personal pronouns will read better.
5. **Vary the page section headings** (requires a small code change to the page components or a new Sanity field).

### Priority 4 — Long-Term SEO/AEO Strategy

1. **Add `lastReviewedAt` timestamps** to Sanity documents and display "Last updated: [date]" on pages. Google values content freshness signals.
2. **Build internal linking** between related neighborhood and town pages within the prose content (e.g., a Darien overview that naturally mentions "neighboring Norwalk's SoNo district" with a link).
3. **Add neighborhood-specific images** — currently all neighborhood pages fall back to the town hero image. Unique images per neighborhood improve engagement metrics and provide additional indexable assets.
4. **Consider adding a "Neighborhoods at a Glance" comparison table** on town pages — structured data that's easy for search engines and LLMs to parse.

---

## 5. Summary Assessment

| Dimension | Current Grade | Notes |
|---|---|---|
| Factual accuracy | B+ | Core facts are correct; some commute times are wrong in FAQs |
| Content completeness | C | Many schema fields empty; 5 towns missing FAQs; no SEO fields populated |
| AI detectability | D | Extremely templated; any content classifier will flag this as AI-generated |
| Luxury tone | C+ | Information is present but delivery lacks editorial polish and specificity |
| SEO readiness | D+ | Good entity density but missing meta fields, FAQ schema gaps, thin content risk |
| AEO readiness | B- | Good entity naming; structured data needs work; content uniqueness is a risk |

The content is a solid foundation of accurate local information organized in the right fields. It needs a quality pass to break the templates, add specificity, and fill the SEO infrastructure gaps. The recommended approach is to fix Priority 1 (SEO infrastructure) immediately—it requires no content rewriting and provides fast SEO value—then tackle the content rewrite town-by-town starting with the highest-traffic markets (likely Greenwich, Westport, Stamford).
