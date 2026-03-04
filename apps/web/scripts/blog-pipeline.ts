/**
 * Blog Pipeline — Sanity CMS Blog Post Script
 *
 * Creates or updates blog posts in Sanity, including featured image upload.
 *
 * Usage:
 *   npx tsx scripts/blog-pipeline.ts --input ./scripts/blog-posts/post-slug.json [--dry-run]
 *   npx tsx scripts/blog-pipeline.ts --batch ./scripts/blog-posts/ [--dry-run]
 *   npx tsx scripts/blog-pipeline.ts --patch-existing <post-id> --image <path> [--dry-run]
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
const MODE_INPUT = getArg('input');
const MODE_PATCH_EXISTING = getArg('patch-existing');
const MODE_IMAGE = getArg('image');

// ── Sanity client ─────────────────────────────────────────────
const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_WRITE_TOKEN,
    useCdn: false,
});

// ── Types ─────────────────────────────────────────────────────
interface BlogPostPayload {
    title: string;
    slug: string;
    category: string;
    author: string;
    publishedAt: string;
    updatedAt?: string;
    body: unknown[];
    featuredImage?: string; // local file path relative to public/
    seoTitle?: string;
    seoDescription?: string;
    faqs?: Array<{ question: string; answer: string; schemaEnabled?: boolean }>;
}

// ── Image upload ──────────────────────────────────────────────
async function uploadImage(imagePath: string): Promise<{ _type: string; asset: { _type: string; _ref: string } }> {
    const fullPath = path.resolve(process.cwd(), 'public', imagePath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`Image not found: ${fullPath}`);
    }

    const imageBuffer = fs.readFileSync(fullPath);
    const filename = path.basename(imagePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.png' ? 'image/png'
        : ext === '.webp' ? 'image/webp'
        : 'image/jpeg';

    const asset = await client.assets.upload('image', imageBuffer, {
        filename,
        contentType,
    });

    return {
        _type: 'image',
        asset: {
            _type: 'reference',
            _ref: asset._id,
        },
    };
}

// ── FAQ creation ──────────────────────────────────────────────
async function createFaqDocuments(faqs: BlogPostPayload['faqs']): Promise<Array<{ _type: string; _ref: string; _key: string }>> {
    if (!faqs || faqs.length === 0) return [];

    const refs: Array<{ _type: string; _ref: string; _key: string }> = [];
    for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        if (DRY_RUN) {
            console.log(`  [DRY RUN] Would create FAQ: "${faq.question}"`);
            refs.push({ _type: 'reference', _ref: 'dry-run-ref', _key: `faq-${i}` });
        } else {
            const created = await client.create({
                _type: 'faq',
                question: faq.question,
                answer: faq.answer,
                schemaEnabled: faq.schemaEnabled !== false,
            });
            console.log(`  Created FAQ ${created._id}: "${faq.question}"`);
            refs.push({ _type: 'reference', _ref: created._id, _key: `faq-${i}` });
        }
    }
    return refs;
}

// ── Create blog post ──────────────────────────────────────────
async function createBlogPost(payload: BlogPostPayload): Promise<void> {
    console.log(`\nProcessing post: "${payload.title}"`);

    // Check if post already exists
    const existing = await client.fetch(
        `*[_type == "post" && slug.current == $slug][0]{ _id }`,
        { slug: payload.slug }
    );

    if (existing) {
        console.log(`  Post already exists (${existing._id}) — updating...`);
        await updateExistingPost(existing._id, payload);
        return;
    }

    // Upload featured image
    let featuredImage: { _type: string; asset: { _type: string; _ref: string } } | undefined;
    if (payload.featuredImage) {
        if (DRY_RUN) {
            console.log(`  [DRY RUN] Would upload image: ${payload.featuredImage}`);
        } else {
            console.log(`  Uploading image: ${payload.featuredImage}`);
            featuredImage = await uploadImage(payload.featuredImage);
        }
    }

    // Create FAQ documents
    const faqRefs = await createFaqDocuments(payload.faqs);

    // Build document
    const doc: Record<string, unknown> = {
        _type: 'post',
        title: payload.title,
        slug: { _type: 'slug', current: payload.slug },
        category: payload.category,
        author: payload.author,
        publishedAt: payload.publishedAt,
        body: payload.body,
    };

    if (payload.updatedAt) doc.updatedAt = payload.updatedAt;
    if (featuredImage) doc.featuredImage = featuredImage;
    if (payload.seoTitle) doc.seoTitle = payload.seoTitle;
    if (payload.seoDescription) doc.seoDescription = payload.seoDescription;
    if (faqRefs.length > 0) doc.faqs = faqRefs;

    if (DRY_RUN) {
        console.log(`  [DRY RUN] Would create post with fields:`);
        for (const [key, val] of Object.entries(doc)) {
            if (Array.isArray(val)) {
                console.log(`    ${key}: [${val.length} items]`);
            } else if (typeof val === 'string' && val.length > 80) {
                console.log(`    ${key}: "${val.substring(0, 77)}..."`);
            } else {
                console.log(`    ${key}: ${JSON.stringify(val)}`);
            }
        }
    } else {
        const created = await client.create(doc);
        console.log(`  Created post: ${created._id}`);
    }
}

// ── Update existing post ──────────────────────────────────────
async function updateExistingPost(docId: string, payload: BlogPostPayload): Promise<void> {
    // Upload featured image if provided
    let featuredImage: { _type: string; asset: { _type: string; _ref: string } } | undefined;
    if (payload.featuredImage) {
        if (DRY_RUN) {
            console.log(`  [DRY RUN] Would upload image: ${payload.featuredImage}`);
        } else {
            console.log(`  Uploading image: ${payload.featuredImage}`);
            featuredImage = await uploadImage(payload.featuredImage);
        }
    }

    // Create FAQ documents
    const faqRefs = await createFaqDocuments(payload.faqs);

    // Build patch
    const patchFields: Record<string, unknown> = {};
    if (payload.title) patchFields.title = payload.title;
    if (payload.category) patchFields.category = payload.category;
    if (payload.author) patchFields.author = payload.author;
    if (payload.body) patchFields.body = payload.body;
    if (payload.seoTitle) patchFields.seoTitle = payload.seoTitle;
    if (payload.seoDescription) patchFields.seoDescription = payload.seoDescription;
    if (payload.updatedAt) patchFields.updatedAt = payload.updatedAt;
    if (featuredImage) patchFields.featuredImage = featuredImage;
    if (faqRefs.length > 0) patchFields.faqs = faqRefs;

    if (DRY_RUN) {
        console.log(`  [DRY RUN] Would patch ${docId} with ${Object.keys(patchFields).length} fields`);
    } else {
        await client.patch(docId).set(patchFields).commit();
        console.log(`  Patched ${docId} (${Object.keys(patchFields).length} fields)`);
    }
}

// ── Add image to existing post by ID ──────────────────────────
async function patchExistingImage(postId: string, imagePath: string): Promise<void> {
    console.log(`\nAdding image to post: ${postId}`);
    console.log(`  Image: ${imagePath}`);

    if (DRY_RUN) {
        console.log(`  [DRY RUN] Would upload and attach image`);
        return;
    }

    const featuredImage = await uploadImage(imagePath);
    await client.patch(postId).set({ featuredImage }).commit();
    console.log(`  Image attached successfully`);
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

    console.log(`Found ${files.length} blog post files in ${batchDir}`);

    let success = 0;
    let failed = 0;

    for (const file of files) {
        try {
            const filepath = path.join(dir, file);
            const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            await createBlogPost(content);
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
    console.log(`Blog Pipeline${DRY_RUN ? ' [DRY RUN]' : ''}`);
    console.log('─'.repeat(50));

    if (MODE_BATCH) {
        await processBatch(MODE_BATCH);
    } else if (MODE_INPUT) {
        const filepath = path.resolve(process.cwd(), MODE_INPUT);
        if (!fs.existsSync(filepath)) {
            throw new Error(`Input file not found: ${filepath}`);
        }
        const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        await createBlogPost(content);
    } else if (MODE_PATCH_EXISTING && MODE_IMAGE) {
        await patchExistingImage(MODE_PATCH_EXISTING, MODE_IMAGE);
    } else {
        console.error('Usage:');
        console.error('  Single:  --input <file.json> [--dry-run]');
        console.error('  Batch:   --batch <directory> [--dry-run]');
        console.error('  Image:   --patch-existing <post-id> --image <path> [--dry-run]');
        process.exit(1);
    }

    console.log('\nDone.');
}

main().catch(err => {
    console.error('\nFATAL:', err instanceof Error ? err.message : err);
    process.exit(1);
});
