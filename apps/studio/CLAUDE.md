# apps/studio — Sanity CMS Authoring

Sanity Studio instance for content management. Provides structured content consumed by `apps/web`.

## Configuration

- Project ID: `phc36jlu`, Dataset: `production`
- Plugins: `structureTool()` (content structure), `visionTool()` (GROQ query testing)

## Schema Types

Defined in `schemaTypes/`:
- `town` — Town documents with metadata
- `neighborhood` — Neighborhood data
- `post` — Blog posts (Portable Text)
- `lead` — Lead schemas
- `testimonial` — Customer testimonials
- `faq` — FAQ documents
- `userProfile` — User profile schemas
- `videoScript` — Video content scripts
- `dataCacheEntry` — Data cache entries

## Commands

```bash
npm run dev --workspace @real-estate/studio
npm run build --workspace @real-estate/studio
npm run deploy --workspace @real-estate/studio
```

## Notes

- This app has its own ESLint config (`eslint-config-studio`)
- Dependencies are installed separately from the monorepo in some environments
- Content changes here affect `apps/web` via Sanity client queries
