/**
 * Content Pipeline — Sanity CMS Patch Script
 *
 * Reads content JSON files and patches town/neighborhood documents in Sanity.
 * Supports single-document mode and batch mode.
 *
 * Usage:
 *   npx tsx apps/web/scripts/content-pipeline.ts \
 *     --type town --slug greenwich \
 *     --input ./scripts/content/greenwich/town-greenwich.json \
 *     --dry-run
 *
 *   npx tsx apps/web/scripts/content-pipeline.ts \
 *     --type neighborhood --slug old-greenwich --town-slug greenwich \
 *     --input ./scripts/content/greenwich/neighborhood-old-greenwich.json \
 *     --dry-run
 *
 *   npx tsx apps/web/scripts/content-pipeline.ts \
 *     --batch ./scripts/content/greenwich/ \
 *     --dry-run
 */

import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

// ── Load env ──────────────────────────────────────────────────
const envFiles = ['.env.local', '.env'];
envFiles.forEach(file => {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, ...values] = line.split('=');
            if (key && values.length > 0 && !process.env[key.trim()]) {
                process.env[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '');
            }
        });
    }
});

// ── CLI args ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

function getArg(name: string): string | undefined {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const MODE_BATCH = getArg('batch');
const MODE_TYPE = getArg('type') as 'town' | 'neighborhood' | undefined;
const MODE_SLUG = getArg('slug');
const MODE_TOWN_SLUG = getArg('town-slug');
const MODE_INPUT = getArg('input');

// ── Sanity client ─────────────────────────────────────────────
const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_WRITE_TOKEN,
    useCdn: false,
});

// ── Types ─────────────────────────────────────────────────────
interface FAQPayload {
    question: string;
    answer: string;
    tags?: string[];
    schemaEnabled?: boolean;
}

interface TownPayload {
    type: 'town';
    slug: string;
    overviewShort?: string;
    overviewLong?: unknown[];
    lifestyle?: string;
    marketNotes?: string;
    highlights?: string[];
    seoTitle?: string;
    seoDescription?: string;
    faqs?: FAQPayload[];
    // Metadata
    authorAgent?: string;
    promptVersion?: string;
    generatedAt?: string;
    reviewPassed?: boolean;
}

interface NeighborhoodPayload {
    type: 'neighborhood';
    slug: string;
    townSlug: string;
    overview?: string;
    description?: unknown[];
    highlights?: string[];
    housingCharacteristics?: string;
    marketNotes?: string;
    locationAccess?: string;
    seoTitle?: string;
    seoDescription?: string;
    faqs?: FAQPayload[];
    // Metadata
    authorAgent?: string;
    promptVersion?: string;
    generatedAt?: string;
    reviewPassed?: boolean;
}

type ContentPayload = TownPayload | NeighborhoodPayload;

// ── Validation ────────────────────────────────────────────────
interface ValidationResult {
    valid: boolean;
    errors: string[];
}

function validatePayload(payload: ContentPayload): ValidationResult {
    const errors: string[] = [];

    if (!payload.type || !['town', 'neighborhood'].includes(payload.type)) {
        errors.push('Missing or invalid "type" field (must be "town" or "neighborhood")');
    }
    if (!payload.slug) {
        errors.push('Missing "slug" field');
    }
    if (payload.type === 'neighborhood' && !(payload as NeighborhoodPayload).townSlug) {
        errors.push('Neighborhood payload requires "townSlug"');
    }

    // SEO field validation
    if (payload.seoTitle) {
        if (payload.seoTitle.length > 60) {
            errors.push(`seoTitle exceeds 60 chars (${payload.seoTitle.length}): "${payload.seoTitle}"`);
        }
    }
    if (payload.seoDescription) {
        if (payload.seoDescription.length < 150 || payload.seoDescription.length > 160) {
            errors.push(`seoDescription must be 150-160 chars (got ${payload.seoDescription.length})`);
        }
    }

    // Highlights validation
    if (payload.highlights) {
        if (payload.type === 'town' && (payload.highlights.length < 5 || payload.highlights.length > 7)) {
            errors.push(`Town highlights must be 5-7 (got ${payload.highlights.length})`);
        }
        if (payload.type === 'neighborhood' && (payload.highlights.length < 3 || payload.highlights.length > 5)) {
            errors.push(`Neighborhood highlights must be 3-5 (got ${payload.highlights.length})`);
        }
    }

    // FAQ validation
    if (payload.faqs) {
        for (const faq of payload.faqs) {
            if (!faq.question || !faq.answer) {
                errors.push('Each FAQ must have both "question" and "answer"');
            }
            if (faq.answer && faq.answer.length < 100) {
                errors.push(`FAQ answer too short (<100 chars): "${faq.question}"`);
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

// ── Backup ────────────────────────────────────────────────────
const BACKUP_DIR = path.resolve(process.cwd(), 'apps/web/scripts/content-backups');

function backupDocument(doc: Record<string, unknown>, type: string, slug: string): void {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}-${slug}-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(doc, null, 2));
    console.log(`  Backed up to ${filename}`);
}

// ── FAQ creation ──────────────────────────────────────────────
async function createFaqDocuments(faqs: FAQPayload[]): Promise<string[]> {
    const refs: string[] = [];

    for (const faq of faqs) {
        const faqDoc = {
            _type: 'faq',
            question: faq.question,
            answer: faq.answer,
            tags: faq.tags || [],
            schemaEnabled: faq.schemaEnabled !== false,
        };

        if (DRY_RUN) {
            console.log(`  [DRY RUN] Would create FAQ: "${faq.question}"`);
            refs.push('dry-run-ref');
        } else {
            const created = await client.create(faqDoc);
            console.log(`  Created FAQ ${created._id}: "${faq.question}"`);
            refs.push(created._id);
        }
    }

    return refs;
}

// ── Fetch existing document ───────────────────────────────────
async function fetchDocument(type: string, slug: string, townSlug?: string): Promise<Record<string, unknown> | null> {
    if (type === 'town') {
        return client.fetch(
            `*[_type == "town" && slug.current == $slug][0]`,
            { slug }
        );
    } else {
        return client.fetch(
            `*[_type == "neighborhood" && slug.current == $slug && town->slug.current == $townSlug][0]`,
            { slug, townSlug }
        );
    }
}

// ── Patch document ────────────────────────────────────────────
async function patchDocument(payload: ContentPayload): Promise<void> {
    const type = payload.type;
    const slug = payload.slug;
    const townSlug = type === 'neighborhood' ? (payload as NeighborhoodPayload).townSlug : undefined;

    console.log(`\nProcessing ${type}: ${slug}${townSlug ? ` (town: ${townSlug})` : ''}`);

    // Validate
    const validation = validatePayload(payload);
    if (!validation.valid) {
        console.error(`  VALIDATION FAILED:`);
        validation.errors.forEach(e => console.error(`    - ${e}`));
        throw new Error(`Validation failed for ${type}/${slug}`);
    }
    console.log(`  Validation passed`);

    // Fetch existing document
    const existing = await fetchDocument(type, slug, townSlug);
    if (!existing) {
        throw new Error(`Document not found: ${type} with slug "${slug}"${townSlug ? ` in town "${townSlug}"` : ''}`);
    }
    console.log(`  Found document: ${existing._id}`);

    // Backup
    backupDocument(existing, type, slug);

    // Create FAQ documents if needed
    let faqRefs: Array<{ _type: 'reference'; _ref: string; _key: string }> | undefined;
    if (payload.faqs && payload.faqs.length > 0) {
        const faqIds = await createFaqDocuments(payload.faqs);
        faqRefs = faqIds.map((id, i) => ({
            _type: 'reference' as const,
            _ref: id,
            _key: `faq-${i}`,
        }));
    }

    // Build patch object
    const patchFields: Record<string, unknown> = {};

    if (type === 'town') {
        const tp = payload as TownPayload;
        if (tp.overviewShort !== undefined) patchFields.overviewShort = tp.overviewShort;
        if (tp.overviewLong !== undefined) patchFields.overviewLong = tp.overviewLong;
        if (tp.lifestyle !== undefined) patchFields.lifestyle = tp.lifestyle;
        if (tp.marketNotes !== undefined) patchFields.marketNotes = tp.marketNotes;
        if (tp.highlights !== undefined) patchFields.highlights = tp.highlights;
    } else {
        const np = payload as NeighborhoodPayload;
        if (np.overview !== undefined) patchFields.overview = np.overview;
        if (np.description !== undefined) patchFields.description = np.description;
        if (np.highlights !== undefined) patchFields.highlights = np.highlights;
        if (np.housingCharacteristics !== undefined) patchFields.housingCharacteristics = np.housingCharacteristics;
        if (np.marketNotes !== undefined) patchFields.marketNotes = np.marketNotes;
        if (np.locationAccess !== undefined) patchFields.locationAccess = np.locationAccess;
    }

    // Common fields
    if (payload.seoTitle !== undefined) patchFields.seoTitle = payload.seoTitle;
    if (payload.seoDescription !== undefined) patchFields.seoDescription = payload.seoDescription;
    if (faqRefs) patchFields.faqs = faqRefs;

    // Always set lastReviewedAt
    patchFields.lastReviewedAt = new Date().toISOString();

    if (DRY_RUN) {
        console.log(`  [DRY RUN] Would patch ${existing._id} with:`);
        for (const [key, val] of Object.entries(patchFields)) {
            if (Array.isArray(val)) {
                console.log(`    ${key}: [${val.length} items]`);
            } else if (typeof val === 'string' && val.length > 80) {
                console.log(`    ${key}: "${val.substring(0, 77)}..."`);
            } else {
                console.log(`    ${key}: ${JSON.stringify(val)}`);
            }
        }
    } else {
        await client.patch(existing._id as string).set(patchFields).commit();
        console.log(`  Patched ${existing._id} (${Object.keys(patchFields).length} fields)`);
    }
}

// ── Batch mode ────────────────────────────────────────────────
async function processBatch(batchDir: string): Promise<void> {
    const dir = path.resolve(process.cwd(), batchDir);
    if (!fs.existsSync(dir)) {
        throw new Error(`Batch directory not found: ${dir}`);
    }

    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.json'))
        .sort();

    console.log(`Found ${files.length} content files in ${batchDir}`);

    let success = 0;
    let failed = 0;

    for (const file of files) {
        try {
            const filepath = path.join(dir, file);
            const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            await patchDocument(content);
            success++;
        } catch (err) {
            console.error(`  FAILED: ${file} — ${err instanceof Error ? err.message : err}`);
            failed++;
        }
    }

    console.log(`\nBatch complete: ${success} succeeded, ${failed} failed`);
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
    console.log(`Content Pipeline${DRY_RUN ? ' [DRY RUN]' : ''}`);
    console.log('─'.repeat(50));

    if (MODE_BATCH) {
        await processBatch(MODE_BATCH);
    } else if (MODE_TYPE && MODE_SLUG && MODE_INPUT) {
        const filepath = path.resolve(process.cwd(), MODE_INPUT);
        if (!fs.existsSync(filepath)) {
            throw new Error(`Input file not found: ${filepath}`);
        }
        const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));

        // Override type/slug from CLI if provided
        content.type = content.type || MODE_TYPE;
        content.slug = content.slug || MODE_SLUG;
        if (MODE_TOWN_SLUG) content.townSlug = content.townSlug || MODE_TOWN_SLUG;

        await patchDocument(content);
    } else {
        console.error('Usage:');
        console.error('  Single: --type town|neighborhood --slug <slug> --input <file> [--town-slug <slug>] [--dry-run]');
        console.error('  Batch:  --batch <directory> [--dry-run]');
        process.exit(1);
    }

    console.log('\nDone.');
}

main().catch(err => {
    console.error('\nFATAL:', err instanceof Error ? err.message : err);
    process.exit(1);
});
