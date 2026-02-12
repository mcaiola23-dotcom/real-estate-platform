
import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

// Load env
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

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
});

async function main() {
    console.log("=== TOWNS ===\n");
    const towns = await client.fetch('*[_type == "town"] | order(name asc) { _id, name, "slug": slug.current, highlights }');
    for (const town of towns) {
        console.log(`## ${town.name} (${town.slug})`);
        if (town.highlights && town.highlights.length > 0) {
            town.highlights.forEach((h: string, i: number) => console.log(`  ${i + 1}. ${h}`));
        } else {
            console.log("  (no highlights)");
        }
        console.log("");
    }

    console.log("\n=== NEIGHBORHOODS ===\n");
    const neighborhoods = await client.fetch('*[_type == "neighborhood"] | order(name asc) { _id, name, "slug": slug.current, highlights, "townName": town->name }');
    for (const n of neighborhoods) {
        console.log(`## ${n.name} (${n.townName}) [${n.slug}]`);
        if (n.highlights && n.highlights.length > 0) {
            n.highlights.forEach((h: string, i: number) => console.log(`  ${i + 1}. ${h}`));
        } else {
            console.log("  (no highlights)");
        }
        console.log("");
    }
}

main();
