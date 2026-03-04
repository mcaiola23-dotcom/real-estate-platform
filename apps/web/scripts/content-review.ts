/**
 * Content Review — Automated Quality Checker
 *
 * Validates authored content JSON against editorial quality criteria
 * from the content review report. Returns pass/fail with itemized feedback.
 *
 * Usage:
 *   npx tsx apps/web/scripts/content-review.ts --input <file>
 *   npx tsx apps/web/scripts/content-review.ts --batch <directory>
 */

import fs from 'fs';
import path from 'path';

// ── CLI args ──────────────────────────────────────────────────
const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const INPUT_FILE = getArg('input');
const BATCH_DIR = getArg('batch');

// ── Banned phrases ────────────────────────────────────────────
const BANNED_PHRASES = [
    'cadence',
    'in my experience',
    'from my perspective',
    'when i advise clients',
    'finance background',
    'price with discipline',
    'strong fit',
    'fits well',
    'day-to-day',
    'tucked-away',
    'for buyers who want',
    'for buyers who',
];

// "feel" as a descriptor (not in "feet" context)
const FEEL_REGEX = /\bfeel(s|ing)?\b/gi;

// ── Types ─────────────────────────────────────────────────────
interface ReviewIssue {
    level: 'blocker' | 'warning';
    field: string;
    message: string;
}

interface ReviewResult {
    file: string;
    type: string;
    slug: string;
    passed: boolean;
    blockers: ReviewIssue[];
    warnings: ReviewIssue[];
}

// ── Review logic ──────────────────────────────────────────────

/** Collect all text content from a payload for scanning */
function extractAllText(payload: Record<string, unknown>): string {
    const texts: string[] = [];

    function walk(value: unknown): void {
        if (typeof value === 'string') {
            texts.push(value);
        } else if (Array.isArray(value)) {
            value.forEach(walk);
        } else if (value && typeof value === 'object') {
            Object.values(value).forEach(walk);
        }
    }

    // Scan content fields (skip metadata fields)
    const contentKeys = [
        'overviewShort', 'overviewLong', 'lifestyle', 'marketNotes',
        'overview', 'description', 'housingCharacteristics', 'locationAccess',
        'highlights', 'seoTitle', 'seoDescription',
    ];
    for (const key of contentKeys) {
        if (payload[key] !== undefined) walk(payload[key]);
    }

    // Scan FAQ content
    if (Array.isArray(payload.faqs)) {
        for (const faq of payload.faqs) {
            if (typeof faq === 'object' && faq) {
                walk((faq as Record<string, unknown>).question);
                walk((faq as Record<string, unknown>).answer);
            }
        }
    }

    return texts.join('\n');
}

/** Extract Portable Text to plain string for sentence analysis */
function portableTextToString(blocks: unknown): string {
    if (!blocks || !Array.isArray(blocks)) return '';
    const texts: string[] = [];
    for (const block of blocks) {
        if (typeof block === 'object' && block && 'children' in block) {
            const children = (block as Record<string, unknown>).children;
            if (Array.isArray(children)) {
                for (const child of children) {
                    if (typeof child === 'object' && child && 'text' in child) {
                        texts.push((child as Record<string, unknown>).text as string);
                    }
                }
            }
        }
    }
    return texts.join(' ');
}

function reviewPayload(payload: Record<string, unknown>, filename: string): ReviewResult {
    const issues: ReviewIssue[] = [];
    const type = payload.type as string;
    const slug = payload.slug as string;

    // ── Blocker checks ────────────────────────────────────

    // 1. Banned phrases
    const allText = extractAllText(payload);
    const allTextLower = allText.toLowerCase();

    for (const phrase of BANNED_PHRASES) {
        if (allTextLower.includes(phrase)) {
            issues.push({
                level: 'blocker',
                field: 'content',
                message: `Banned phrase found: "${phrase}"`,
            });
        }
    }

    // Check "feel" as descriptor
    const feelMatches = allText.match(FEEL_REGEX);
    if (feelMatches && feelMatches.length > 0) {
        issues.push({
            level: 'blocker',
            field: 'content',
            message: `"feel/feels/feeling" found ${feelMatches.length}x — banned as descriptor`,
        });
    }

    // 2. SEO field lengths
    const seoTitle = payload.seoTitle as string | undefined;
    const seoDescription = payload.seoDescription as string | undefined;

    if (!seoTitle) {
        issues.push({ level: 'blocker', field: 'seoTitle', message: 'Missing seoTitle' });
    } else if (seoTitle.length > 60) {
        issues.push({
            level: 'blocker',
            field: 'seoTitle',
            message: `seoTitle exceeds 60 chars (${seoTitle.length})`,
        });
    }

    if (!seoDescription) {
        issues.push({ level: 'blocker', field: 'seoDescription', message: 'Missing seoDescription' });
    } else if (seoDescription.length < 150 || seoDescription.length > 160) {
        issues.push({
            level: 'blocker',
            field: 'seoDescription',
            message: `seoDescription must be 150-160 chars (got ${seoDescription.length})`,
        });
    }

    // 3. Highlights count and uniqueness
    const highlights = payload.highlights as string[] | undefined;
    if (highlights) {
        if (type === 'town' && (highlights.length < 5 || highlights.length > 7)) {
            issues.push({
                level: 'blocker',
                field: 'highlights',
                message: `Town must have 5-7 highlights (got ${highlights.length})`,
            });
        }
        if (type === 'neighborhood' && (highlights.length < 3 || highlights.length > 5)) {
            issues.push({
                level: 'blocker',
                field: 'highlights',
                message: `Neighborhood must have 3-5 highlights (got ${highlights.length})`,
            });
        }

        // No two highlights start with same 3 words
        const openers = highlights.map(h => h.split(/\s+/).slice(0, 3).join(' ').toLowerCase());
        const openerSet = new Set<string>();
        for (const opener of openers) {
            if (openerSet.has(opener)) {
                issues.push({
                    level: 'blocker',
                    field: 'highlights',
                    message: `Duplicate highlight opener: "${opener}..."`,
                });
            }
            openerSet.add(opener);
        }

        // No "Easy access to" openers
        for (const h of highlights) {
            if (h.toLowerCase().startsWith('easy access to')) {
                issues.push({
                    level: 'blocker',
                    field: 'highlights',
                    message: `Banned highlight opener "Easy access to": "${h}"`,
                });
            }
        }
    }

    // 4. Portable Text structure validation
    if (type === 'town' && payload.overviewLong !== undefined) {
        if (!Array.isArray(payload.overviewLong)) {
            issues.push({
                level: 'blocker',
                field: 'overviewLong',
                message: 'overviewLong must be a Portable Text array',
            });
        }
    }
    if (type === 'neighborhood' && payload.description !== undefined) {
        if (!Array.isArray(payload.description)) {
            issues.push({
                level: 'blocker',
                field: 'description',
                message: 'description must be a Portable Text array',
            });
        }
    }

    // 5. FAQ answer specificity
    if (Array.isArray(payload.faqs)) {
        for (const faq of payload.faqs as Array<Record<string, unknown>>) {
            const answer = faq.answer as string;
            if (answer && answer.length < 100) {
                issues.push({
                    level: 'blocker',
                    field: 'faqs',
                    message: `FAQ answer too short (<100 chars): "${faq.question}"`,
                });
            }
        }
    }

    // ── Warning checks ────────────────────────────────────

    // 1. At least 1 proper noun in overview
    const overview = (payload.overview || payload.overviewShort || '') as string;
    const properNounRegex = /[A-Z][a-z]{2,}/g;
    const properNouns = overview.match(properNounRegex);
    if (!properNouns || properNouns.length < 1) {
        issues.push({
            level: 'warning',
            field: 'overview',
            message: 'No proper nouns detected in overview — include specific place names',
        });
    }

    // 2. Varied sentence lengths (std dev > 8 chars)
    const longText = type === 'town'
        ? portableTextToString(payload.overviewLong) || (payload.lifestyle as string) || ''
        : portableTextToString(payload.description) || (payload.overview as string) || '';
    const sentences = longText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 3) {
        const lengths = sentences.map(s => s.trim().length);
        const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        const variance = lengths.reduce((a, len) => a + Math.pow(len - mean, 2), 0) / lengths.length;
        const stdDev = Math.sqrt(variance);
        if (stdDev < 8) {
            issues.push({
                level: 'warning',
                field: 'content',
                message: `Low sentence length variation (std dev: ${stdDev.toFixed(1)}, want > 8) — vary your sentence lengths`,
            });
        }
    }

    // 3. quiet/calm/quieter max 1x
    const quietMatches = allTextLower.match(/\b(quiet|calm|quieter)\b/g);
    if (quietMatches && quietMatches.length > 1) {
        issues.push({
            level: 'warning',
            field: 'content',
            message: `"quiet/calm/quieter" used ${quietMatches.length}x (max 1 per page)`,
        });
    }

    const blockers = issues.filter(i => i.level === 'blocker');
    const warnings = issues.filter(i => i.level === 'warning');

    return {
        file: filename,
        type,
        slug,
        passed: blockers.length === 0,
        blockers,
        warnings,
    };
}

// ── Cross-page duplicate detection ───────────────────────────
function checkCrossPageDuplicates(results: ReviewResult[], payloads: Record<string, unknown>[]): void {
    const allHighlights: Map<string, string> = new Map(); // highlight text -> source slug

    for (const payload of payloads) {
        const slug = payload.slug as string;
        const highlights = payload.highlights as string[] | undefined;
        if (!highlights) continue;

        for (const h of highlights) {
            const normalized = h.toLowerCase().trim();
            if (allHighlights.has(normalized)) {
                const existingSlug = allHighlights.get(normalized)!;
                // Find the result for this slug and add warning
                const result = results.find(r => r.slug === slug);
                if (result) {
                    result.warnings.push({
                        level: 'warning',
                        field: 'highlights',
                        message: `Duplicate highlight shared with "${existingSlug}": "${h}"`,
                    });
                }
            } else {
                allHighlights.set(normalized, slug);
            }
        }
    }
}

// ── Output ────────────────────────────────────────────────────
function printResult(result: ReviewResult): void {
    const status = result.passed ? 'PASS' : 'FAIL';
    const icon = result.passed ? '+' : 'X';
    console.log(`\n[${icon}] ${status}: ${result.type}/${result.slug} (${result.file})`);

    if (result.blockers.length > 0) {
        console.log('  BLOCKERS:');
        for (const b of result.blockers) {
            console.log(`    [${b.field}] ${b.message}`);
        }
    }
    if (result.warnings.length > 0) {
        console.log('  WARNINGS:');
        for (const w of result.warnings) {
            console.log(`    [${w.field}] ${w.message}`);
        }
    }
    if (result.blockers.length === 0 && result.warnings.length === 0) {
        console.log('  All checks passed with no issues.');
    }
}

// ── Main ──────────────────────────────────────────────────────
function main(): void {
    console.log('Content Review');
    console.log('─'.repeat(50));

    const files: string[] = [];

    if (BATCH_DIR) {
        const dir = path.resolve(process.cwd(), BATCH_DIR);
        if (!fs.existsSync(dir)) {
            console.error(`Directory not found: ${dir}`);
            process.exit(1);
        }
        const entries = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
        for (const entry of entries) {
            files.push(path.join(dir, entry));
        }
    } else if (INPUT_FILE) {
        const filepath = path.resolve(process.cwd(), INPUT_FILE);
        if (!fs.existsSync(filepath)) {
            console.error(`File not found: ${filepath}`);
            process.exit(1);
        }
        files.push(filepath);
    } else {
        console.error('Usage:');
        console.error('  Single: --input <file>');
        console.error('  Batch:  --batch <directory>');
        process.exit(1);
    }

    console.log(`Reviewing ${files.length} file(s)...\n`);

    const results: ReviewResult[] = [];
    const payloads: Record<string, unknown>[] = [];

    for (const filepath of files) {
        try {
            const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            payloads.push(content);
            const result = reviewPayload(content, path.basename(filepath));
            results.push(result);
        } catch (err) {
            console.error(`Error reading ${filepath}: ${err instanceof Error ? err.message : err}`);
            results.push({
                file: path.basename(filepath),
                type: 'unknown',
                slug: 'unknown',
                passed: false,
                blockers: [{ level: 'blocker', field: 'file', message: `Parse error: ${err instanceof Error ? err.message : err}` }],
                warnings: [],
            });
        }
    }

    // Cross-page duplicate check (batch mode)
    if (payloads.length > 1) {
        checkCrossPageDuplicates(results, payloads);
    }

    // Print results
    for (const result of results) {
        printResult(result);
    }

    // Summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const totalBlockers = results.reduce((sum, r) => sum + r.blockers.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    console.log('\n' + '─'.repeat(50));
    console.log(`Summary: ${passed} passed, ${failed} failed`);
    console.log(`  ${totalBlockers} blocker(s), ${totalWarnings} warning(s)`);

    if (failed > 0) {
        process.exit(1);
    }
}

main();
