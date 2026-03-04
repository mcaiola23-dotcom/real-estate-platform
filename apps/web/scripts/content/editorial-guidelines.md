# Editorial Guidelines — Town & Neighborhood Content

## Voice & Tone
- Luxury editorial voice with selective, authentic first-person (Matt Caiola's brand)
- Matt lives in Stamford and works across all of Fairfield County
- Use "I" sparingly — only where genuine personal knowledge adds value a competitor site wouldn't have
- Tone: informed, confident, specific. Think experienced advisor, not brochure
- No purple prose or decorative language. Every sentence should inform

## Absolute Banned Phrases
These must NEVER appear in any content:
- "cadence" (in any context)
- "feel" / "feels" / "feeling" (as a descriptor — "it feels like a village" etc.)
- "In my experience"
- "From my perspective"
- "When I advise clients"
- "finance background"
- "price with discipline"
- "strong fit"
- "fits well"
- "day-to-day"
- "tucked-away"
- "For buyers who want"
- "For buyers who"
- "Easy access to" (as a highlight opener)

## Structural Rules

### No Template Repetition
- No two towns may share the same opening sentence structure
- No two towns may share the same closing sentence structure
- No two neighborhoods in the same town may open or close identically
- Sentence length must vary — mix short punchy sentences with longer descriptive ones

### Specificity Requirements
- Every overview must contain 2+ named local entities (streets, restaurants, parks, landmarks)
- Every description must reference specific architectural styles, lot characteristics, or price context
- Commute times must be verified and specific (express vs local, exact minutes)

### Highlights
- Towns: 5-7 highlights
- Neighborhoods: 3-5 highlights
- No two highlights across the entire site may start with the same 3 words
- No exact duplicate highlights across pages
- No "Easy access to" openers
- Each highlight should contain a specific detail, not a generic claim

### SEO Fields
- seoTitle: max 60 chars, include location + CT + a differentiator
- seoDescription: exactly 150-160 chars, include a CTA, action-oriented for SERP click-through

### FAQs
- Towns: 3-5 FAQs each, unique and specific
- Prominent neighborhoods: 2-3 FAQs
- FAQ answers must be 100+ chars with specific facts
- Commute times must be accurate (Greenwich express ~47 min, Stamford express ~45 min, etc.)
- No templated FAQ answers — each must be genuinely unique

### Portable Text Format
For overviewLong (towns) and description (neighborhoods), use this structure:
```json
[
  {
    "_type": "block",
    "_key": "unique-key",
    "style": "normal",
    "children": [
      { "_type": "span", "_key": "span-key", "text": "Paragraph text here." }
    ],
    "markDefs": []
  }
]
```

## Content Field Descriptions

### Town Fields
- **overviewShort**: 2-3 sentence summary. Lead with what makes this town distinctive. Max ~400 chars
- **overviewLong**: 3-5 paragraphs (Portable Text). Deep dive into the town's character, history, and appeal
- **lifestyle**: 2-3 paragraphs. Daily life, commuting, dining, recreation — with named places
- **marketNotes**: 2-3 paragraphs. Market character, price ranges, what buyers should know. Not templated
- **highlights**: 5-7 bullet points. Each with a specific, verifiable detail

### Neighborhood Fields
- **overview**: 2-4 sentences. What this neighborhood is in one breath. Named entities required
- **description**: 3-4 paragraphs (Portable Text). Detailed character, housing, and daily life
- **highlights**: 3-5 bullet points with specific details
- **housingCharacteristics**: 1-2 paragraphs. Architecture, lot sizes, price context, building ages
- **marketNotes**: 1-2 paragraphs. What buyers should expect in this specific micro-market
- **locationAccess**: 1-2 paragraphs. Commute details, highway access, proximity to amenities
