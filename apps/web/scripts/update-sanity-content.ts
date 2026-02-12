
import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

// Load env manually since we are running a standalone script
const envFiles = ['.env.local', '.env'];

envFiles.forEach(file => {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, ...values] = line.split('=');
            if (key && values.length > 0 && !process.env[key.trim()]) {
                process.env[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, ''); // Remove quotes
            }
        });
    }
});

const DRY_RUN = process.argv.includes('--dry-run');

if (!process.env.SANITY_API_TOKEN) {
    console.warn('Warning: SANITY_API_TOKEN not found in .env.local.');
    console.warn('Write operations will fail without a token.');
}

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function main() {
    console.log(`Starting content update... Dry Run: ${DRY_RUN}`);

    try {
        const towns = await client.fetch('*[_type == "town"]');
        console.log(`Found ${towns.length} towns.`);

        for (const town of towns) {
            console.log(`\nProcessing ${town.name} (${town.slug.current})...`);

            // 1. Remove MTA references from highlights
            if (town.highlights && Array.isArray(town.highlights)) {
                const newHighlights = town.highlights.filter((h: string) =>
                    !h.toLowerCase().includes('ticket machines') &&
                    !h.toLowerCase().includes('(per mta)')
                );

                if (newHighlights.length !== town.highlights.length) {
                    console.log(`  - Removing ${town.highlights.length - newHighlights.length} MTA references.`);
                    if (!DRY_RUN && process.env.SANITY_API_TOKEN) {
                        try {
                            await client.patch(town._id).set({ highlights: newHighlights }).commit();
                            console.log('    [Updated]');
                        } catch (err: unknown) {
                            console.error('    [Error updating highlights]:', err instanceof Error ? err.message : String(err));
                        }
                    } else {
                        console.log('    [Dry Run] Would update highlights.');
                    }
                }
            }

            // 2. Fix Darien Overview (Just Logging)
            if (town.slug.current === 'darien') {
                console.log('  - [Attention] Check "About Darien" in Sanity Studio for paragraph spacing.');
            }

            // 3. Add Missing FAQs
            if (!town.faqs || town.faqs.length === 0) {
                const targetTowns = ['New Canaan', 'Norwalk', 'Ridgefield', 'Stamford', 'Wilton'];
                // Flexible matching
                if (targetTowns.some(t => t.toLowerCase() === town.name.toLowerCase())) {
                    console.log(`  - Missing FAQs. Generating defaults...`);

                    if (!DRY_RUN && process.env.SANITY_API_TOKEN) {
                        try {
                            const faqs = generateFAQs(town.name);
                            const faqRefs = [];

                            for (const faqData of faqs) {
                                const faqDoc = await client.create({
                                    _type: 'faq',
                                    question: faqData.question,
                                    answer: faqData.answer,
                                    schemaEnabled: true
                                });
                                console.log(`    Created FAQ: ${faqData.question}`);
                                faqRefs.push({
                                    _type: 'reference',
                                    _ref: faqDoc._id,
                                    _key: faqDoc._id
                                });
                            }

                            await client.patch(town._id).set({ faqs: faqRefs }).commit();
                            console.log(`    [Updated] Linked ${faqRefs.length} FAQs to ${town.name}.`);
                        } catch (err: unknown) {
                            console.error('    [Error creating FAQs]:', err instanceof Error ? err.message : String(err));
                        }
                    } else {
                        console.log(`    [Dry Run] Would create and link 3 FAQs.`);
                    }
                }
            } else {
                console.log(`  - FAQs present (${town.faqs.length}). Skipping.`);
            }
        }
        console.log('\nDone.');
    } catch (error) {
        console.error('Error fetching data:', error);
        process.exit(1);
    }
}

function generateFAQs(townName: string) {
    return [
        {
            question: `What is the commute like from ${townName} to NYC?`,
            answer: `Commuting to New York City is convenient via Metro-North Railroad's New Haven Line. Peak travel times to Grand Central Terminal are typically between 60-70 minutes, making ${townName} a popular choice for city professionals.`
        },
        {
            question: `How are the schools in ${townName}?`,
            answer: `${townName} is renowned for its exceptional public school system, consistently ranking among the top districts in Connecticut. The town offers a comprehensive curriculum with strong support for arts, athletics, and academic excellence.`
        },
        {
            question: `What lifestyle does ${townName} offer?`,
            answer: `Residents enjoy a blend of suburban charm and modern amenities, including a vibrant downtown with diverse dining and shopping, scenic parks, and active community events throughout the year.`
        }
    ];
}

main();
