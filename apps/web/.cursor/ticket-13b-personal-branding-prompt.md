# Ticket 13B: Personal Branding & Content Expansion — Opus 4.5 Agent Prompt

## CRITICAL CONTEXT: THIS IS A PERSONAL AGENT WEBSITE

This website is for **Matt Caiola**, an individual real estate agent licensed under Higgins Group Private Brokerage. It is NOT a brokerage website. The current implementation incorrectly emphasizes the brokerage over the agent. This must be corrected to prominently feature Matt's personal brand while also displaying Higgins Group branding for compliance and credibility.

**Brand Hierarchy:**
1. **Primary**: Matt Caiola (name, logo, photo, personal brand)
2. **Also Prominent**: Higgins Group Private Brokerage (displayed prominently throughout for compliance AND credibility)

Both brands should be visible and professional. Matt's brand leads, Higgins supports.

## Your Role

You are an Opus 4.5 coding agent. Your job is to implement the **programming and structural changes** needed to reposition this website around Matt Caiola's personal brand. You will also create a detailed prompt for a GPT 5.2 copywriting agent who will handle all content creation and revisions.

## Project Background

- **Tech Stack**: Next.js App Router, TypeScript, Tailwind CSS, Sanity CMS
- **Workspace**: `c:\Users\19143\Projects\fairfield-agent-website`
- **Scratchpad**: `.cursor/scratchpad.md` (read first, follow Planner/Executor workflow)
- **Sanity Project ID**: `phc36jlu`, Dataset: `production`

## Competitor Reference Sites (for design patterns)

These are top Fairfield County agent sites to reference for personal branding patterns:
- Joy Metalios: https://metaliosteam.com/
- Jackie Davis: https://jackiedavisteam.com/
- Kim Vartuli: https://www.vartulijabickandpartners.com/
- Kate Cacciatore: https://katecacciatorehomes.com/
- Howell Homes: https://howellhomesct.com/
- Robbie Salvatore: https://robbiesalvatore.com/

**Key patterns to adopt:**
- Agent name/logo in header (primary position)
- Agent photo on homepage and About page
- Personal brand identity clear throughout
- Brokerage affiliation visible (credibility + compliance)
- First-person voice throughout
- Strong calls-to-action for lead generation

## Matt Caiola — Personal Bio & Background

Use this information for About page content and to inform the overall positioning:

**Professional Background:**
- Background in **Corporate Finance/Accounting AND Sales** — provides unique analytical + relationship perspective on real estate transactions
- Involved in real estate from a young age
- **Landlord, owner, and property manager** of multifamily properties in Stamford
- Owns additional investment properties in CT and NY
- Licensed with Higgins Group Private Brokerage

**Personal:**
- Very personable, deeply cares about clients, extremely devoted to their success
- Family man: wife and 2 young daughters
- **Homeowner in Westover, Stamford** — lives in the community he serves

**Unique Value Proposition:**
Matt combines analytical rigor from his finance background with genuine relationship-building skills from sales. He's not just an agent—he's an investor and property owner himself who understands real estate from multiple angles.

## Logo Assets Available

The following logo files are available in the assets folder:
```
C:\Users\19143\.cursor\projects\c-Users-19143-Projects-fairfield-agent-website\assets\
```

**Matt Caiola Logo Variations:**
1. **Monogram**: M|C (standalone)
2. **Wordmark**: "MATT CAIOLA" with "LUXURY PROPERTIES" subtitle
3. **Combined Horizontal**: M|C + "MATT CAIOLA / LUXURY PROPERTIES" aligned horizontally

**HEADER LOGO REQUIREMENT:**
Use the **Combined Horizontal** version in the header:
```
M|C  MATT CAIOLA
     — LUXURY PROPERTIES —
```
(Monogram on left, wordmark on right, horizontally aligned)

**Higgins Group Logo:**
- `public/brand/higgins-lockup.jpg`
- Should ALSO be displayed prominently throughout the site (header if space permits, definitely footer, About page)

**Matt's Headshot:**
- New headshot provided: Copy from assets folder to `public/brand/matt-headshot.jpg`
- Source: `C:\Users\19143\.cursor\projects\c-Users-19143-Projects-fairfield-agent-website\assets\...-Headshot-....png`
- Use prominently on About page and consider for homepage

**Action Required**: 
1. Copy the combined horizontal logo to `public/brand/matt-caiola-logo.png`
2. Copy the transparent wordmark to `public/brand/matt-caiola-wordmark.png`
3. Update Matt's headshot from the assets folder
4. Ensure both Matt's logo AND Higgins logo are visible in header (if space) or at minimum Matt in header + both in footer

---

## PROGRAMMING TASKS (for you to implement)

### 1. Header Branding Update
**File**: `app/components/Header.tsx`

- **Primary**: Matt Caiola Combined Horizontal Logo (M|C + Wordmark side by side)
- **Also include**: Higgins Group logo if space permits (smaller, secondary position)
- Layout suggestion: Matt Caiola logo on left, nav in center/right, Higgins small logo on far right OR below Matt's logo
- Keep header clean and premium
- Ensure mobile responsive (may need to simplify logos on mobile)

### 2. Footer Update  
**File**: `app/components/GlobalFooter.tsx`

- **Matt Caiola Section**: Logo, contact info, brief tagline
- **Higgins Group Section**: Logo prominently displayed, full brokerage info (compliance)
- Keep Fair Housing link
- Both brands should be clearly visible in footer

### 3. Metadata & Page Titles
**File**: `app/layout.tsx` and all page files with metadata

Update site-wide metadata:
- Default title: `"Matt Caiola | Luxury Real Estate | Fairfield County CT"`
- Template: `"%s | Matt Caiola | Fairfield County Real Estate"`
- Update description to mention Matt Caiola
- Update JSON-LD schema to represent Matt Caiola as the agent (with Higgins as brokerage affiliation)

### 4. About Page Enhancement
**File**: `app/about/page.tsx`

- Add Matt Caiola's headshot prominently (hero section or sidebar)
- Include Matt's name explicitly in heading (e.g., "About Matt Caiola")
- Keep Higgins Group section for compliance but as secondary content

### 5. Homepage Updates
**File**: `app/page.tsx`

- Consider adding Matt's photo or personal welcome message
- Ensure any generic agent references become personalized

### 6. Town Page Highlights (Sanity-driven)
**Current issue**: Town highlights are hardcoded and generic.
**Solution**: 
- Add `highlights` array field to Town schema in Sanity (if not exists)
- Update `getTownBySlug()` query to fetch highlights
- Render dynamic highlights on town pages
- Remove hardcoded placeholder highlights

**File**: `studio/schemaTypes/town.ts` (check if highlights field exists)
**File**: `app/lib/sanity.queries.ts` (update query)
**File**: `app/towns/[townSlug]/page.tsx` (render dynamic highlights)

### 7. Neighborhood Infrastructure
**Current issue**: Most neighborhoods don't exist in Sanity.

Create/verify neighborhoods exist in Sanity for all towns (full list below). The Neighborhood schema should have:
- `name`
- `slug`
- `town` (reference)
- `overview` (short text)
- `description` (Portable Text, long-form)
- `highlights` (array of strings)

**Full Neighborhood List** (to create if missing):

**Darien (5)**: Downtown, Long Neck/Long Neck Point, Noroton, Noroton Heights, Tokeneke

**Fairfield (15)**: Beach, Brooklawn, Center, Fairfield Woods, Greenfield Hill, Grasmere, Lake Hills, Lake Mohegan, Rock Ridge, Sasco, Southport, Stratfield, Sturges, Tunxis Hill, University

**Greenwich (10)**: Back Country, Belle Haven, Byram, Downtown Greenwich, Cos Cob, Old Greenwich, Riverside, Pemberwick, Mianus, Stanwich

**New Canaan (7)**: Clapboard Hill, Oenoke Ridge, Ponus Ridge, Silvermine, Smith Ridge, Talmadge Hill, Town Center

**Norwalk (9)**: Brookside, Cranbury, East Norwalk, Rowayton, Silvermine, South Norwalk, West Norwalk, West Rocks, Wolfpit

**Ridgefield (11)**: Branchville, Georgetown, Farmingville, North Ridgefield, Ridgebury, South Ridgefield, Starrs/Picketts Ridge, Town Center/Village Center, West Lane, West Mountain/Mamanasco Lake, Whipstick

**Stamford (15)**: Bull's Head, Cove, Davenport Point, Downtown, Glenbrook, Mid City, Mid-Ridges, Newfield, North Stamford, Shippan, Springdale, Turn of River, Waterside, West Side, Westover

**Westport (9)**: Compo Beach, Coleytown, Cranbury & Poplar Plains, Long Lots, Downtown/Westport Village, In-Town, Greens Farms, Saugatuck, Old Hill

**Wilton (6)**: Cannondale, Georgetown, North Wilton, Silvermine, South Wilton, The Hollow

**Total: ~87 neighborhoods**

**Note on neighborhoods**: Use discretion on which to include. Smaller/lesser-known neighborhoods can be combined with adjacent areas if it makes sense. The goal is full coverage of the main neighborhoods that buyers search for, not exhaustive coverage of every micro-area. Quality over quantity.

### 8. Blog Post Author Update
**File**: `app/insights/[categorySlug]/[postSlug]/page.tsx`

- Ensure author displays as "Matt Caiola" (not generic)
- Update any existing posts in Sanity to have author = "Matt Caiola"

### 9. Sanity Content Updates via MCP

Use Sanity MCP tools to:
1. Update all existing blog posts: set `author` to "Matt Caiola"
2. Create any missing neighborhood documents (with placeholder content that GPT 5.2 will fill)
3. Add `highlights` array field to Town schema if missing

---

## GPT 5.2 COPYWRITING AGENT PROMPT

After completing your programming tasks, create a file at `.cursor/copywriting-agent-prompt.md` with the following prompt for the GPT 5.2 copywriting agent:

---

```markdown
# Fairfield County Luxury Real Estate — Copywriting Agent Prompt (GPT 5.2)

## Your Role

You are a premium real estate copywriter creating content for Matt Caiola's personal luxury real estate website. Your job is to write and revise ALL copy on the site to be personalized around Matt Caiola as the agent, while maintaining compliance requirements.

## Brand Voice

- **Tone**: Understated luxury, calm confidence, credibility-first
- **Person**: First-person singular ("I", "my", "I've")
- **Style**: Editorial, sophisticated, premium—never salesy or pushy
- **Local**: Reference specific Fairfield County locations, landmarks, and lifestyle details

## Agent Information

- **Name**: Matt Caiola
- **Title**: Luxury Real Estate Agent / Realtor
- **Brand**: Matt Caiola Luxury Properties
- **Brokerage**: Higgins Group Private Brokerage
- **Service Area**: Fairfield County, CT (Greenwich, Stamford, Darien, New Canaan, Westport, Fairfield, Norwalk, Wilton, Ridgefield)

## Matt Caiola — Background & Credentials (USE THIS IN COPY)

**Professional Background:**
- Background in **Corporate Finance/Accounting AND Sales** — brings unique analytical rigor + relationship skills to every transaction
- Involved in real estate from a young age
- **Active investor**: Landlord, owner, and property manager of multifamily properties in Stamford
- Owns additional investment properties in CT and NY
- Understands real estate from buyer, seller, AND investor perspectives

**Personal:**
- Family man: wife and 2 young daughters
- **Homeowner in Westover, Stamford** — lives in the community he serves
- Deeply devoted to clients, very personable, cares genuinely about outcomes

**Key Differentiators to Highlight:**
1. Finance background = analytical pricing, smart negotiation, data-driven advice
2. Sales background = relationship-focused, responsive communication, client advocacy
3. Personal investment experience = understands what's at stake, sees beyond the transaction
4. Local resident = genuine neighborhood knowledge, not just market knowledge
5. Family-oriented = understands family needs, school considerations, lifestyle priorities

## Compliance Requirements

- Brokerage name must be spelled exactly: "Higgins Group Private Brokerage"
- Brokerage contact: 1055 Washington Blvd., Stamford, CT 06901 | 203-658-8282
- No guaranteed outcomes or promises about property values
- Home Value tool is an "estimate/starting point" (not appraisal)
- No unverifiable claims about schools, appreciation rates, etc.

## Content Goals

1. **Lead generation**: Encourage contact form submissions, Home Value requests
2. **SEO**: Include town names, "Fairfield County", "Connecticut", neighborhood names naturally
3. **LLM optimization**: Clear structure, entity relationships, semantic headings
4. **Authority building**: Position Matt as THE local expert

---

## COPYWRITING TASKS

### Task 1: Town Page Content (9 towns)

For each town, create/revise:

**A. Overview (Short)** - 2-3 sentences for hero/preview
**B. About {Town}** - 2-3 paragraphs, general character and appeal
**C. Living in {Town}** - 2-3 paragraphs about lifestyle, community, daily life
**D. Real Estate in {Town}** - 2-3 paragraphs about market character (personalized to Matt)
**E. Highlights** - 5-7 bullet points with SPECIFIC local details (not generic)

**Towns requiring content:**
1. Darien (existing content needs personalization + highlights)
2. Fairfield (existing content needs personalization + highlights)
3. Greenwich (existing content needs personalization + highlights)
4. Westport (existing content needs personalization + highlights)
5. New Canaan (needs all content)
6. Norwalk (needs all content)
7. Ridgefield (needs all content)
8. Stamford (needs all content)
9. Wilton (needs all content)

**CRITICAL Personalization Requirement**: 

Do NOT simply find/replace "a local agent" with "Matt Caiola" word-for-word. The sentences must be **completely reworked** to:
1. Position Matt as THE qualified, preferred agent for the job
2. Highlight his unique qualifications (finance background, investment experience, local expertise)
3. Create persuasive copy that wins business
4. Maintain first-person voice where appropriate

**Examples:**

❌ BAD (simple replacement):
"Working with a knowledgeable local agent helps buyers understand current conditions."
→ "Working with Matt Caiola helps buyers understand current conditions." (WRONG - lazy)

✓ GOOD (reworked to sell):
"With my background in finance and years of experience investing in Fairfield County real estate, I bring a level of market insight that helps buyers make confident, data-informed decisions. I don't just show homes—I help you understand what you're really buying."

❌ BAD:
"Your agent can help you navigate the market."

✓ GOOD:
"I take a hands-on approach to guiding clients through every step of the process. My clients appreciate that I'm not just their agent—I'm an investor myself who understands what it means to make a significant real estate decision."

**The goal is persuasive, credibility-building copy that makes readers want to work with Matt specifically.**

**Highlights format** (be SPECIFIC, not generic):
- ❌ "Easy commute to NYC"
- ✓ "Express Metro-North service to Grand Central (48 minutes from Greenwich station)"
- ❌ "Great schools"
- ✓ "Top-rated public schools including Darien High School, consistently ranked among Connecticut's best"

### Task 2: Neighborhood Content (~87 neighborhoods)

For each neighborhood, create:

**A. Overview** - 1-2 sentences for preview cards
**B. Description** - 2-4 paragraphs covering:
  - Character and feel of the neighborhood
  - Housing stock (typical home styles, lot sizes, price ranges)
  - Key amenities, parks, shopping nearby
  - Who it's best suited for (families, professionals, downsizers, etc.)
  - Commute/location advantages
**C. Highlights** - 3-5 specific bullet points

**Full neighborhood list:**

**Darien**: Downtown, Long Neck/Long Neck Point, Noroton, Noroton Heights, Tokeneke

**Fairfield**: Beach, Brooklawn, Center, Fairfield Woods, Greenfield Hill, Grasmere, Lake Hills, Lake Mohegan, Rock Ridge, Sasco, Southport, Stratfield, Sturges, Tunxis Hill, University

**Greenwich**: Back Country, Belle Haven, Byram, Downtown Greenwich, Cos Cob, Old Greenwich, Riverside, Pemberwick, Mianus, Stanwich

**New Canaan**: Clapboard Hill, Oenoke Ridge, Ponus Ridge, Silvermine, Smith Ridge, Talmadge Hill, Town Center

**Norwalk**: Brookside, Cranbury, East Norwalk, Rowayton, Silvermine, South Norwalk, West Norwalk, West Rocks, Wolfpit

**Ridgefield**: Branchville, Georgetown, Farmingville, North Ridgefield, Ridgebury, South Ridgefield, Starrs/Picketts Ridge, Town Center/Village Center, West Lane, West Mountain/Mamanasco Lake, Whipstick

**Stamford**: Bull's Head, Cove, Davenport Point, Downtown, Glenbrook, Mid City, Mid-Ridges, Newfield, North Stamford, Shippan, Springdale, Turn of River, Waterside, West Side, Westover

**Westport**: Compo Beach, Coleytown, Cranbury & Poplar Plains, Long Lots, Downtown/Westport Village, In-Town, Greens Farms, Saugatuck, Old Hill

**Wilton**: Cannondale, Georgetown, North Wilton, Silvermine, South Wilton, The Hollow

### Task 3: FAQs (Per Town)

Review and update existing FAQs. Create new FAQs for towns missing them. Each town should have 3-5 FAQs. Personalize any generic agent references to Matt Caiola.

### Task 4: Blog Posts Update

Update all existing blog post content:
- Change author from "Your Fairfield County Agent" to "Matt Caiola"
- Update any generic agent references in body copy to Matt Caiola
- Ensure first-person voice is consistent

**Existing posts to update:**
1. Understanding the Fairfield County Luxury Market
2. Relocating to Fairfield County from NYC
3. The Spring Market in Fairfield County
4. Greenwich Neighborhoods: Finding Your Fit
5. Why Westport Continues to Attract Families and Professionals
6. 3 Practical Ways to Prepare Your Home for a Stronger Sale
7. Fairfield County Market Snapshot: What to Watch in 2026

### Task 5: About Page Copy

Revise About page to:
- Include "Matt Caiola" in the main heading (e.g., "About Matt Caiola" or "Meet Matt Caiola")
- **Comprehensive personal bio** incorporating:
  - Finance/accounting background → analytical approach to pricing and deals
  - Sales background → relationship-focused, client-first approach
  - Personal investment experience (landlord, property manager, multifamily in Stamford, properties in CT/NY)
  - Real estate involvement from young age
  - Family (wife, 2 daughters, homeowner in Westover, Stamford)
  - Genuine care and devotion to clients
- Position Matt's unique value: he's not just an agent, he's an investor who understands what's at stake
- Maintain the existing Higgins Group section for compliance/credibility
- Keep first-person voice throughout
- Make it warm, personable, and persuasive—readers should feel they'd enjoy working with Matt

### Task 6: Homepage Copy Review

Review and update any homepage copy that references a generic agent.

---

## OUTPUT FORMAT

Provide all content in structured format ready for Sanity import:

```json
{
  "towns": [
    {
      "name": "Darien",
      "slug": "darien",
      "overviewShort": "...",
      "overviewLong": [...portable text blocks...],
      "lifestyle": "...",
      "marketNotes": "...",
      "highlights": ["...", "...", "..."]
    }
  ],
  "neighborhoods": [
    {
      "name": "Tokeneke",
      "townSlug": "darien",
      "slug": "tokeneke",
      "overview": "...",
      "description": [...portable text blocks...],
      "highlights": ["...", "..."]
    }
  ],
  "faqUpdates": [...],
  "blogPostUpdates": [...],
  "pageUpdates": {
    "about": "...",
    "homepage": "..."
  }
}
```

---

## QUALITY CHECKLIST

Before submitting each piece of content:

- [ ] Matt Caiola's name appears where appropriate (not generic "agent")
- [ ] First-person voice ("I", "my") used consistently
- [ ] Specific local details included (not generic)
- [ ] No unverifiable claims or guarantees
- [ ] Compliance language intact (brokerage name correct)
- [ ] SEO entities included (town name, Fairfield County, CT)
- [ ] Premium, editorial tone maintained
- [ ] Scannable structure (short paragraphs, clear headings)
```

---

## SUCCESS CRITERIA (Ticket 13B)

**Programming (Opus 4.5):**
- [ ] Header displays Matt Caiola Combined Horizontal logo (M|C + Wordmark) as primary brand
- [ ] Header also displays Higgins Group logo (if space permits)
- [ ] Footer displays BOTH Matt Caiola branding AND Higgins Group prominently
- [ ] All page titles include "Matt Caiola"
- [ ] JSON-LD schema represents Matt Caiola (with Higgins as affiliated brokerage)
- [ ] About page includes Matt's headshot prominently
- [ ] Town highlights are Sanity-driven (not hardcoded)
- [ ] All main neighborhoods exist in Sanity (~70-87 based on discretion)
- [ ] Blog posts author field updated to "Matt Caiola"
- [ ] Copywriting agent prompt created at `.cursor/copywriting-agent-prompt.md`

**Copywriting (GPT 5.2 - will verify later):**
- [ ] All 9 towns have complete content
- [ ] All ~87 neighborhoods have complete content
- [ ] All blog posts personalized to Matt Caiola
- [ ] All FAQs personalized
- [ ] About page updated
- [ ] No generic "agent" references remain

---

## GETTING STARTED

1. Read `.cursor/scratchpad.md`
2. Review competitor sites for branding patterns
3. Copy logo assets to `public/brand/`
4. Implement programming tasks in order
5. Create the GPT 5.2 copywriting prompt
6. Update scratchpad with progress
