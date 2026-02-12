
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

const DRY_RUN = process.argv.includes('--dry-run');

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_WRITE_TOKEN,
    useCdn: false,
});

// =====================================================
// REVISED HIGHLIGHTS — Towns
// Focus: generalized lifestyle, no MTA details, no addresses, no ticket machines
// =====================================================
const TOWN_HIGHLIGHTS: Record<string, string[]> = {
    "darien": [
        "Walkable downtown village with shops, restaurants, and daily essentials close to home",
        "Metro-North commuter rail access on the New Haven Line for convenient NYC commuting",
        "Coastal lifestyle with easy access to beaches, including Weed Beach and Pear Tree Point Beach",
        "Predominantly single-family neighborhoods with a strong sense of community",
        "A refined, quiet day-to-day rhythm that stays practical for commuters",
        "Seasonal shoreline routines - beach days, waterfront parks, and outdoor recreation"
    ],
    "fairfield": [
        "Multiple Metro-North stations on the New Haven Line for flexible commuting options",
        "Beautiful shoreline beaches and waterfront parks for year-round outdoor enjoyment",
        "A town with distinct neighborhood identities - from shoreline sections to inland, spacious areas",
        "Strong blend of beach lifestyle and practical, year-round suburban living",
        "Vibrant town center with diverse dining, shopping, and community events",
        "Commuter flexibility - choose neighborhoods based on the lifestyle and station that fits best"
    ],
    "greenwich": [
        "Greenwich Avenue as the town's signature dining and shopping corridor",
        "Neighborhood variety - downtown walkability, coastal villages, and backcountry privacy within one town",
        "Beautiful parks and nature preserves including Bruce Park and Greenwich Point (Tod's Point)",
        "Metro-North commuter rail access on the New Haven Line for NYC commuting",
        "A 'choose your lifestyle' town - train convenience, shoreline access, or retreat-like privacy",
        "World-class cultural institutions, galleries, and community events throughout the year"
    ],
    "new-canaan": [
        "Charming village center with boutique shopping, fine dining, and daily conveniences",
        "Waveny Park - 130 acres of open space with woodland trails and seasonal activities",
        "Metro-North commuter rail access on the New Canaan Branch for NYC commuting",
        "Architectural variety - classic New England homes alongside modern design",
        "Strong fit for buyers who want a quieter routine without giving up commuter access",
        "A neighborhood-driven town where your choice of area meaningfully shapes your lifestyle"
    ],
    "norwalk": [
        "Vibrant South Norwalk (SoNo) district with dining, arts, and waterfront entertainment",
        "Coastal access with beautiful beaches and harbor activities",
        "Metro-North commuter rail access on the New Haven Line for NYC commuting",
        "Family-friendly attractions including The Maritime Aquarium and Stepping Stones Museum",
        "Neighborhood diversity - waterfront villages, coastal residential, and inland communities",
        "A strong fit for buyers who want options - walkable routine, shoreline lifestyle, or a calmer home base"
    ],
    "ridgefield": [
        "Historic Main Street with dining, shopping, and a true town center atmosphere",
        "Rich cultural scene including The Aldrich Contemporary Art Museum and Ridgefield Playhouse",
        "Metro-North commuter access via the Danbury Branch line",
        "Town variety - village-center living versus more private, space-forward sections",
        "Strong year-round community energy with local events and traditions",
        "A great fit for buyers who want culture and community without needing a shoreline address"
    ],
    "stamford": [
        "A true mix of lifestyles - downtown energy plus quieter single-family neighborhoods",
        "Metro-North commuter rail with express service to NYC on the New Haven Line",
        "Beautiful waterfront parks and beaches along Long Island Sound",
        "Broad housing options - condos, townhomes, and single-family homes depending on the neighborhood",
        "Thriving dining, arts, and entertainment scene in the downtown and Harbor Point areas",
        "Strong fit for NYC commuters who want flexibility and housing variety"
    ],
    "westport": [
        "Walkable village core with Main Street dining, shopping, and a strong community atmosphere",
        "Beautiful shoreline including Compo Beach for year-round outdoor lifestyle",
        "Metro-North commuter rail access on the New Haven Line for NYC commuting",
        "Distinct neighborhood options - commuter-friendly, downtown-adjacent, and coastal sections",
        "Shoreline lifestyle without sacrificing day-to-day practicality for commuters",
        "A town where weekends feel local - beach time, walks, and community events close to home"
    ],
    "wilton": [
        "Weir Farm National Historical Park - a rare National Park dedicated to American art",
        "A spacious, wooded setting with a calm and private day-to-day lifestyle",
        "Metro-North commuter rail access on the Danbury Branch for NYC commuting",
        "Primarily single-family living with an emphasis on privacy and outdoor space",
        "Wilton Center as a friendly town hub for errands, dining, and community life",
        "Strong fit for buyers who want breathing room while keeping Fairfield County access practical"
    ]
};

// =====================================================
// REVISED HIGHLIGHTS — Neighborhoods
// =====================================================
const NEIGHBORHOOD_HIGHLIGHTS: Record<string, string[]> = {
    // --- Darien ---
    "downtown-darien": [
        "Walkable village lifestyle with shops, restaurants, and daily errands close to home",
        "Darien Metro-North station (New Haven Line) for commuter rail access",
        "Easy access to Darien's shoreline parks and beaches, including Weed Beach and Pear Tree Point Beach",
        "A charming downtown setting with a blend of convenience and coastal-town character",
        "Strong community atmosphere with local events and neighborhood traditions"
    ],
    "long-neck-point-darien": [
        "A private peninsula setting with a calm, coastal atmosphere and limited through-traffic",
        "Single-family homes with an emphasis on privacy and outdoor living",
        "Close to Darien's shoreline amenities, including Weed Beach and Pear Tree Point Beach",
        "Pear Tree Point Beach nearby with swimming, picnic areas, and kayak access",
        "Easy access to downtown Darien and Metro-North service"
    ],
    "noroton-darien": [
        "A settled, residential pocket with classic coastal-town character",
        "Predominantly single-family homes with traditional New England charm",
        "Easy access to shoreline parks and beaches, including Weed Beach",
        "Two nearby Metro-North station options (Darien and Noroton Heights) on the New Haven Line",
        "Quick access to parks and shoreline amenities in a convenient location"
    ],
    "noroton-heights-darien": [
        "Noroton Heights Metro-North station (New Haven Line) for commuter rail access",
        "A convenience-first neighborhood with residential streets plus nearby shops and services",
        "Family-friendly setting with good schools and community resources",
        "Easy access to Darien's downtown and shoreline amenities",
        "A practical neighborhood for commuters and families alike"
    ],
    "tokeneke-darien": [
        "A private, quiet coastal neighborhood with larger single-family properties",
        "Strong shoreline lifestyle with beaches and waterfront recreation nearby",
        "Community-oriented atmosphere with local clubs and neighborhood traditions",
        "Close to Darien's parks and shoreline amenities",
        "Practical access to downtown Darien and Metro-North service"
    ],

    // --- Fairfield ---
    "beach-fairfield": [
        "Beautiful shoreline setting with sandy beaches and waterfront parks",
        "A true coastal neighborhood feel - easy to walk, bike, and enjoy the outdoors",
        "Coastal home styles from classic cottages to updated and newer builds",
        "Close to Fairfield Center dining, shopping, and Metro-North commuter service",
        "Strong community atmosphere with a beach-oriented lifestyle"
    ],
    "brooklawn-fairfield": [
        "Central Fairfield location with easy access to shops, dining, and daily services",
        "Predominantly single-family housing with an established residential feel",
        "Convenient access to Fairfield Center and Metro-North service",
        "Easy access to Fairfield's beaches and parks for outdoor recreation",
        "Family-friendly neighborhood close to schools and community resources"
    ],
    "center-fairfield": [
        "Fairfield Metro-North station (New Haven Line) for commuter rail access",
        "A walkable downtown routine - restaurants, shops, and daily errands close to home",
        "Residential side streets just off the center for a quieter feel",
        "Easy access to Fairfield's beaches and parks on weekends",
        "Strong community atmosphere with year-round local events"
    ],
    "fairfield-woods-fairfield": [
        "A traditional residential feel with quiet streets and established single-family homes",
        "Easy access to Fairfield Center for restaurants, shops, and Metro-North",
        "Quick drive to shoreline beaches and waterfront parks",
        "Lake Mohegan nearby for fresh-water swimming and nature trails",
        "Balanced positioning - convenient without feeling commercial"
    ],
    "grasmere-fairfield": [
        "A quiet residential feel with easy access to both shoreline and inland recreation",
        "Predominantly single-family housing in an established Fairfield streetscape",
        "Nearby beaches and waterfront parks for outdoor lifestyle",
        "Lake Mohegan nearby for fresh-water swimming and nature trails",
        "Convenient access to Fairfield Center and Metro-North service"
    ],
    "greenfield-hill-fairfield": [
        "A quieter, 'country Fairfield' atmosphere with larger-lot single-family homes",
        "Spacious streetscape with mature trees and a private residential cadence",
        "Easy access to Fairfield Center and shoreline amenities",
        "Strong community identity built around local traditions and events",
        "Annual Dogwood Festival as a cherished community tradition"
    ],
    "southport-fairfield": [
        "Southport Metro-North station (New Haven Line) for commuter rail access",
        "A true harbor-village feel with historic character and a refined coastal atmosphere",
        "Pequot Library as a beloved cultural anchor and community institution",
        "Quiet beach and waterfront setting with a relaxed vibe",
        "Classic New England charm with boutique shops and local dining"
    ],
    "stratfield-fairfield": [
        "Central Fairfield positioning with convenient access to major routes",
        "Predominantly single-family housing with a practical neighborhood feel",
        "Easy drive to Fairfield Center dining, shops, and Metro-North service",
        "Close to parks and Long Island Sound beaches",
        "A convenient, no-fuss neighborhood for daily living"
    ],
    "tunxis-hill-fairfield": [
        "Lake Mohegan nearby for fresh-water swimming and nature trails",
        "Predominantly single-family housing with a straightforward residential feel",
        "Convenient access to Fairfield Center and beaches",
        "Outdoor recreation built into the neighborhood - trails and open space nearby",
        "A strong option for buyers who want Fairfield with easy nature access"
    ],
    "university-fairfield": [
        "Vibrant neighborhood feel influenced by proximity to Fairfield University",
        "Quick access to Fairfield Center dining, shops, and Metro-North service",
        "Easy drive to shoreline beaches and waterfront parks",
        "A mix of housing options including single-family streets and more compact inventory",
        "Active community with university events and local amenities"
    ],

    // --- Greenwich ---
    "back-country-greenwich": [
        "A lower-density, estate-oriented setting where privacy and land are the main draw",
        "Predominantly single-family homes on larger parcels with a quiet day-to-day rhythm",
        "Greenwich Audubon Center as a local nature and outdoor resource",
        "A true retreat feel while remaining part of Greenwich for services and commuting",
        "Strong fit for buyers prioritizing space, trees, and privacy over walkable retail"
    ],
    "belle-haven-greenwich": [
        "A peninsula-style coastal enclave known for privacy and quiet residential atmosphere",
        "Higher-end single-family housing with strong outdoor-living appeal",
        "Close to downtown Greenwich for dining, retail, and Metro-North access",
        "Greenwich Point Park (Tod's Point) nearby for beach and recreation",
        "An exclusive setting with a strong sense of community"
    ],
    "byram-greenwich": [
        "Byram Park with beach, pool, playground, marina and walking trails",
        "A close-knit, residential neighborhood with a practical day-to-day feel",
        "Waterfront-oriented lifestyle with recreation amenities close to home",
        "Quick access to downtown Greenwich and surrounding communities",
        "A welcoming Greenwich neighborhood with strong community bonds"
    ],
    "cos-cob-greenwich": [
        "Cos Cob Metro-North station (New Haven Line) for commuter rail access",
        "Mianus River Park with 100+ acres of trails and natural beauty",
        "A village-centered Greenwich lifestyle with a relaxed, residential cadence",
        "Easy access to downtown Greenwich, Old Greenwich, and the rest of Fairfield County",
        "Family-friendly community with local shops and neighborhood character"
    ],
    "downtown-greenwich": [
        "Greenwich Avenue shopping and dining as the town's signature retail corridor",
        "Greenwich Metro-North station (New Haven Line) for commuter rail access",
        "Bruce Park - Greenwich's oldest public park with walking paths and Sound views",
        "A true walkable lifestyle with downtown amenities and the train close by",
        "World-class dining, boutique shopping, and cultural events"
    ],
    "mianus-greenwich": [
        "Mianus River Park with 100+ acres of trails and natural beauty",
        "A quieter, wooded Greenwich feel with a tucked-away residential atmosphere",
        "Primarily single-family housing with an emphasis on privacy and outdoor space",
        "Easy access toward Cos Cob, Riverside, and downtown Greenwich amenities",
        "A strong fit for buyers who want nature access built into daily life"
    ],
    "old-greenwich-greenwich": [
        "Greenwich Point Park (Tod's Point) - a premier 147-acre beach and recreation destination",
        "Old Greenwich Metro-North station (New Haven Line) for commuter rail access",
        "A true coastal village feel with a strong community cadence",
        "Charming downtown area with local shops, cafes, and restaurants",
        "Family-friendly neighborhood with excellent schools and waterfront access"
    ],
    "riverside-greenwich": [
        "Riverside Metro-North station (New Haven Line) for commuter rail access",
        "Greenwich Point Park (Tod's Point) nearby for beach and recreation",
        "A quieter, residential Greenwich cadence with a strong 'neighborhood' feel",
        "Easy access to downtown Greenwich and Old Greenwich village amenities",
        "Family-oriented community with tree-lined streets and a welcoming atmosphere"
    ],
    "stanwich-greenwich": [
        "A quieter, estate-oriented Greenwich setting with strong emphasis on privacy",
        "Predominantly single-family homes on larger parcels with mature landscaping",
        "Easy access toward major corridors for commuting around Fairfield County",
        "A 'country Greenwich' feel while still being within reach of downtown amenities",
        "Beautiful natural surroundings and a tranquil residential atmosphere"
    ],

    // --- New Canaan ---
    "clapboard-hill-new-canaan": [
        "A quiet residential setting with more privacy than the town center",
        "Predominantly single-family housing with space and established streetscapes",
        "Waveny Park nearby - 130 acres of open space with seasonal activities",
        "New Canaan Metro-North station within reach for commuting",
        "Easy access to New Canaan's village amenities for dining, shopping, and errands"
    ],
    "oenoke-ridge-new-canaan": [
        "A more estate-oriented New Canaan setting where privacy and space are central",
        "Predominantly single-family homes on larger parcels with mature landscaping",
        "Waveny Park nearby - 130 acres of open space with trails and recreation",
        "Easy access to New Canaan Town Center dining, shopping, and services",
        "Metro-North New Canaan Branch access for convenient commuting"
    ],
    "ponus-ridge-new-canaan": [
        "A quieter residential setting with a family-oriented cadence",
        "Predominantly single-family homes with outdoor space and established streets",
        "Waveny Park nearby - 130 acres of open space with seasonal activities",
        "New Canaan station on Metro-North for commuting",
        "Easy access to New Canaan Town Center for dining, shopping, and daily services"
    ],
    "silvermine-new-canaan": [
        "Silvermine Arts Center as a major cultural anchor with a creative community spirit",
        "A wooded, tucked-away neighborhood with distinctive local character",
        "Primarily single-family housing with privacy and established landscaping",
        "A creative, arts-oriented identity within New Canaan living",
        "Easy access to New Canaan Town Center for shopping, dining, and Metro-North"
    ],
    "talmadge-hill-new-canaan": [
        "Talmadge Hill Metro-North station (New Canaan Branch) for commuter rail access",
        "A quieter, wooded New Canaan setting with a more private residential feel",
        "Predominantly single-family housing with an emphasis on trees and outdoor space",
        "Easy access to New Canaan Town Center for dining, shopping, and daily services",
        "A peaceful retreat that's still well-connected to the village"
    ],
    "town-center-new-canaan": [
        "New Canaan Metro-North station (New Canaan Branch) for commuter rail access",
        "Waveny Park - 130 acres of open space with trails and seasonal activities",
        "A true walkable village routine with shops, dining, and daily errands close to home",
        "Residential streets just outside the center for a quieter feel",
        "Charming New England town center atmosphere with boutique shops and fine dining"
    ],

    // --- Norwalk ---
    "cranbury-norwalk": [
        "Cranbury Park - 227 acres with wooded trails, sculpture garden, and recreation",
        "A quieter, residential neighborhood with more breathing room",
        "Primarily single-family housing with a calm, neighborhood-oriented cadence",
        "Easy access to South Norwalk dining, the shoreline, and commuter corridors",
        "Dog-friendly outdoor spaces and nature areas"
    ],
    "east-norwalk-norwalk": [
        "Beautiful beaches including Calf Pasture Beach with extensive recreation amenities",
        "East Norwalk Metro-North station (New Haven Line) for commuter rail access",
        "A coastal, residential neighborhood feel with waterfront lifestyle",
        "Close to South Norwalk (SoNo) dining, arts, and entertainment",
        "Family-friendly with playgrounds, splash pads, and water activities"
    ],
    "rowayton-norwalk": [
        "A true coastal village feel with a quiet, community-centered atmosphere",
        "Rowayton Metro-North station (New Haven Line) for commuter rail access",
        "Beautiful shoreline access for boating, kayaking, and beach activities",
        "Charming village character with local shops and community events",
        "Strong fit for buyers prioritizing a coastal lifestyle and tight-knit community"
    ],
    "silvermine-norwalk": [
        "Silvermine Arts Center as a major cultural anchor in the area",
        "A wooded, tucked-away feel with a strong local identity",
        "Primarily single-family housing with privacy and outdoor space",
        "A quieter alternative to coastal or downtown Norwalk living",
        "Easy access toward SoNo, East Norwalk, and Fairfield County amenities"
    ],
    "south-norwalk-norwalk": [
        "South Norwalk (SoNo) walkability with dining, nightlife, and a waterfront feel",
        "South Norwalk Metro-North station (New Haven Line) for commuter rail access",
        "The Maritime Aquarium as a family-friendly cultural destination",
        "A vibrant urban lifestyle with restaurants, galleries, and entertainment",
        "Strong fit for buyers who want energy, convenience, and a walkable routine"
    ],
    "west-norwalk-norwalk": [
        "A quieter, residential neighborhood away from the SoNo energy",
        "Primarily single-family housing with a calmer day-to-day cadence",
        "Norwalk River Valley Trail nearby for hiking and outdoor recreation",
        "Strong fit for buyers who prioritize trails, outdoor time, and a residential setting",
        "Easy access to the rest of Norwalk for dining, the train, and shoreline amenities"
    ],
    "wolfpit-norwalk": [
        "An established residential neighborhood with a steady, community-oriented feel",
        "Primarily single-family housing with practical access around the city",
        "Cranbury Park nearby - 227 acres with wooded trails and recreation",
        "Norwalk River Valley Trail for hiking and outdoor activities",
        "A strong fit for buyers who prioritize a classic neighborhood feel"
    ],

    // --- Ridgefield ---
    "branchville-ridgefield": [
        "Branchville Metro-North station (Danbury Branch) for commuter rail access",
        "A quieter, village-style setting with a wooded, relaxed atmosphere",
        "Primarily single-family housing with a 'country Connecticut' feel",
        "Easy access to Ridgefield Center for Main Street dining, shopping, and culture",
        "A peaceful setting for buyers who want nature and quiet close to home"
    ],
    "georgetown-ridgefield": [
        "A quieter, more rural-feeling part of Ridgefield with a spacious lifestyle",
        "Predominantly single-family homes with more land and privacy",
        "A strong fit for buyers prioritizing a country-Connecticut atmosphere",
        "Easy access to Ridgefield Center for dining, shopping, and community events",
        "Rich cultural scene nearby including The Aldrich and Ridgefield Playhouse"
    ],
    "north-ridgefield-ridgefield": [
        "A more rural, spacious setting with a quiet day-to-day rhythm",
        "Predominantly single-family homes with larger parcels and more privacy",
        "Strong fit for buyers prioritizing land, trees, and a country atmosphere",
        "Easy access to Ridgefield Center for dining, shopping, and community events",
        "Rich cultural scene in town including The Aldrich and Ridgefield Playhouse"
    ],
    "ridgefield-center-ridgefield": [
        "Historic Main Street with a true town center feel - shops, dining, and community energy",
        "The Aldrich Contemporary Art Museum as a signature cultural destination",
        "Ridgefield Playhouse as a major live-events and entertainment venue",
        "A walkable lifestyle by Fairfield County standards, with culture built in",
        "Classic Ridgefield character with strong local identity and year-round activity"
    ],
    "south-ridgefield-ridgefield": [
        "Convenient positioning with easy access to Ridgefield's southern corridors",
        "Predominantly single-family housing with a calm, neighborhood-first cadence",
        "Close to Ridgefield Center's cultural scene and dining options",
        "Branchville Metro-North station nearby for commuter rail access",
        "A great fit for buyers who want convenience without sacrificing Ridgefield character"
    ],
    "west-lane-ridgefield": [
        "A scenic, quieter Ridgefield setting that leans private and estate-oriented",
        "Predominantly single-family housing with an emphasis on space and landscaping",
        "Easy access to Ridgefield Center's dining and cultural scene",
        "Rich cultural amenities in town including The Aldrich and Ridgefield Playhouse",
        "Beautiful natural surroundings with a tranquil residential atmosphere"
    ],

    // --- Stamford ---
    "bulls-head-stamford": [
        "Shopping and dining hub close to home for daily convenience",
        "Convenient access to major highways for commuting around Fairfield County",
        "A practical mix of housing types - single-family homes plus condo options",
        "Easy drive to downtown Stamford dining, events, and Metro-North service",
        "Family-friendly neighborhood with good access to schools and parks"
    ],
    "cove-stamford": [
        "Cove Island Park with beaches, walking paths, and waterfront views on Long Island Sound",
        "A coastal neighborhood with easy access to downtown Stamford dining and arts",
        "Waterfront recreation including fishing, walking trails, and seasonal beach activities",
        "Convenient commuting access to the Stamford Transportation Center and Metro-North",
        "A relaxed, outdoors-forward lifestyle within the city"
    ],
    "davenport-point-stamford": [
        "A quiet peninsula-style waterfront setting with a removed, peaceful atmosphere",
        "Primarily single-family coastal properties with Long Island Sound views",
        "Nearby parks with beaches, marina, and recreation facilities",
        "Close to Cove Island Park for walking, beaches, and outdoor time",
        "Easy drive to downtown Stamford dining, arts, and Metro-North service"
    ],
    "downtown-stamford": [
        "Mill River Park as a beautiful urban green space with year-round activities",
        "The Palace Theatre for live performances and cultural entertainment",
        "Stamford Transportation Center for Metro-North and broad transit connectivity",
        "A true walkable downtown lifestyle with restaurants, shops, and daily essentials",
        "Vibrant arts, dining, and nightlife scene"
    ],
    "glenbrook-stamford": [
        "Glenbrook Metro-North station for commuter rail access",
        "A mix of single-family streets plus condo options for flexible housing needs",
        "Easy drive to downtown Stamford restaurants, events, and entertainment",
        "Family-friendly neighborhood with a residential feel",
        "Convenient positioning between downtown energy and suburban quiet"
    ],
    "mid-ridges-stamford": [
        "Shopping centers nearby for convenient daily errands",
        "Central Stamford positioning with easy access to downtown dining, arts, and Metro-North",
        "Varied housing options including single-family homes and townhome/condo inventory",
        "Convenient access to major corridors for commuting",
        "A practical, well-connected neighborhood for daily living"
    ],
    "newfield-stamford": [
        "A quieter, spacious Stamford setting with a more suburban feel",
        "Predominantly single-family housing with yards and a tucked-away atmosphere",
        "Stamford Museum & Nature Center nearby with trails and family activities",
        "Easy access to North Stamford parks and trails for outdoor time",
        "Practical drive to downtown Stamford dining, events, and rail connections"
    ],
    "north-stamford-stamford": [
        "Bartlett Arboretum & Gardens with free admission, miles of trails, and natural beauty",
        "Stamford Museum & Nature Center with trails, farm, and planetarium",
        "Lower-density, wooded setting with many homes on larger parcels",
        "A retreat feel while remaining within Stamford for shopping and commuting",
        "Perfect for nature lovers who want outdoor recreation at their doorstep"
    ],
    "shippan-stamford": [
        "Cummings Park - a waterfront park with beach, boardwalk, and recreation facilities",
        "A peninsula setting with Long Island Sound views and coastal living appeal",
        "Active boating community with marina access",
        "Easy drive to downtown Stamford dining, arts, and Metro-North service",
        "Strong community identity with neighborhood events and traditions"
    ],
    "springdale-stamford": [
        "Springdale Metro-North station for commuter rail access",
        "Mix of single-family streets plus condo options near the neighborhood center",
        "Quick drive to downtown Stamford restaurants, arts, and entertainment",
        "Family-friendly community with a neighborhood village feel",
        "Convenient positioning for commuters and families"
    ],
    "turn-of-river-stamford": [
        "Parks and recreation facilities with outdoor pools, courts, and hiking trails",
        "North Stamford residential feel with quieter streets and more yard space",
        "Convenient access for daily errands, dining, and services",
        "Predominantly single-family housing with a classic neighborhood cadence",
        "Easy drive to downtown Stamford for restaurants, events, and Metro-North"
    ],
    "waterside-stamford": [
        "Coastal parks with beach, marina, and recreation facilities",
        "Coastal Stamford setting with a relaxed, outdoors-forward lifestyle near Long Island Sound",
        "Mix of home styles and price points for different buyer needs",
        "Easy drive to downtown Stamford dining, arts, and Metro-North service",
        "Birdwatching and nature areas in nearby parks"
    ],
    "west-side-stamford": [
        "Between downtown Stamford and the Greenwich line for strong regional positioning",
        "Varied housing mix including multi-family, townhouse, and single-family options",
        "Quick access to I-95 and major corridors for commuting",
        "Easy drive to the Stamford Transportation Center for Metro-North rail access",
        "Close to downtown restaurants, arts, and events without needing a downtown address"
    ],
    "westover-stamford": [
        "Mianus River Park trail access for wooded hiking and walking",
        "Fort Stamford Park and Goodbody Garden - historic site and formal garden",
        "Public golf course nearby for outdoor recreation",
        "Quick access to the Merritt Parkway and an easy drive to downtown Stamford",
        "A residential neighborhood with a blend of nature and convenience"
    ],

    // --- Westport ---
    "coleytown-westport": [
        "A quieter, spacious Westport neighborhood with a strong residential feel",
        "Predominantly single-family homes with larger lots and more privacy",
        "Easy access to downtown Westport and Main Street dining and shopping",
        "Westport Metro-North (New Haven Line) within reach for commuting",
        "Quick access to Westport's beaches and parks for weekend lifestyle"
    ],
    "compo-beach-westport": [
        "Compo Beach Park - 29-acre town park with extensive sand beach and boardwalk",
        "A true coastal Westport lifestyle with an outdoors-forward routine",
        "Playground, concession stand, and volleyball courts at the beach",
        "Strong fit for buyers prioritizing shoreline access and beach-day convenience",
        "Beautiful waterfront location ideal for families and active lifestyles"
    ],
    "downtown-westport": [
        "Westport's walkable village core - Main Street dining, shopping, and daily amenities",
        "Westport Metro-North station (New Haven Line) for commuter rail access",
        "A 'do more on foot' routine with dining, errands, and community life close by",
        "Easy access to Westport's beaches and parks when you want the shoreline",
        "Charming town center with boutique shops, galleries, and restaurants"
    ],
    "greens-farms-westport": [
        "Green's Farms Metro-North station (New Haven Line) for commuter rail access",
        "A quieter, established Westport neighborhood with coastal proximity",
        "Easy access to downtown Westport and the Saugatuck area for dining and shopping",
        "Strong fit for buyers who want a residential setting with rail convenience",
        "Beautiful landscapes and a peaceful suburban atmosphere"
    ],
    "long-lots-westport": [
        "A classic, established Westport residential neighborhood",
        "Predominantly single-family housing with a steady, neighborhood-oriented feel",
        "Convenient access to downtown Westport amenities and Main Street",
        "Westport Metro-North (New Haven Line) within reach for commuting",
        "Easy access to beaches and parks, including Compo Beach"
    ],
    "old-hill-westport": [
        "A quiet Westport enclave with an established, residential feel",
        "Predominantly single-family homes with mature landscaping and character",
        "Easy access to downtown Westport and Main Street dining/shopping",
        "Westport Metro-North (New Haven Line) within reach for commuting",
        "Compo Beach Park nearby for shoreline recreation"
    ],
    "saugatuck-westport": [
        "Westport Metro-North station (New Haven Line) as a major commuter anchor",
        "A transit-forward Westport pocket with convenient access to downtown",
        "A range of housing options including lower-maintenance living near the train",
        "Easy access to Main Street dining, shopping, and shoreline amenities",
        "Vibrant neighborhood bridging downtown convenience and waterfront access"
    ],

    // --- Wilton ---
    "cannondale-wilton": [
        "Cannondale Metro-North station (Danbury Branch) for commuter rail access",
        "A quiet, village-style pocket with a calm residential feel",
        "Predominantly single-family housing with an understated, local cadence",
        "Strong fit for commuters who want rail access in a peaceful setting",
        "Beautiful wooded surroundings and a relaxed atmosphere"
    ],
    "georgetown-wilton": [
        "A more rural-feeling Wilton setting with a quiet, spacious day-to-day rhythm",
        "Predominantly single-family homes with larger-lot potential and privacy",
        "Weir Farm National Historical Park nearby for outdoor recreation and art",
        "Strong fit for buyers who want a country-Connecticut feel within Wilton",
        "Dog-friendly trails and nature areas close to home"
    ],
    "north-wilton-wilton": [
        "A spacious, wooded setting with a quiet day-to-day rhythm",
        "Predominantly single-family homes with an emphasis on privacy and outdoor space",
        "Weir Farm National Historical Park nearby for trails and cultural enrichment",
        "Strong fit for buyers who want a retreat-like home base",
        "Beautiful natural surroundings with room to breathe"
    ],
    "silvermine-wilton": [
        "Silvermine Arts Center as a major cultural anchor with creative community spirit",
        "A wooded, tucked-away feel with a strong local identity and character",
        "Primarily single-family housing with privacy and outdoor space",
        "A quieter alternative to town-center living while staying connected",
        "Easy access to Wilton Center and Metro-North options on the Danbury Branch"
    ],
    "wilton-center-wilton": [
        "Wilton's town hub with a relaxed village cadence - shops, dining, and community life",
        "Wilton Metro-North station (Danbury Branch) for commuter rail access",
        "Norwalk River Valley Trail nearby for hiking and outdoor activities",
        "A strong fit for buyers who want 'close to town' convenience without a big-city feel",
        "Charming small-town atmosphere with local events and community spirit"
    ]
};

async function main() {
    console.log(`Starting highlights revision... Dry Run: ${DRY_RUN}\n`);

    // Update Towns
    const towns = await client.fetch('*[_type == "town"] { _id, name, "slug": slug.current }');
    console.log(`Found ${towns.length} towns.\n`);

    for (const town of towns) {
        const newHighlights = TOWN_HIGHLIGHTS[town.slug];
        if (newHighlights) {
            console.log(`[Town] ${town.name}: Updating ${newHighlights.length} highlights`);
            if (!DRY_RUN) {
                await client.patch(town._id).set({ highlights: newHighlights }).commit();
                console.log(`  ✓ Updated`);
            } else {
                newHighlights.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));
            }
        } else {
            console.log(`[Town] ${town.name}: No revision defined, skipping`);
        }
        console.log('');
    }

    // Update Neighborhoods
    const neighborhoods = await client.fetch('*[_type == "neighborhood"] { _id, name, "slug": slug.current, "townSlug": town->slug.current }');
    console.log(`\nFound ${neighborhoods.length} neighborhoods.\n`);

    for (const n of neighborhoods) {
        const key = `${n.slug}-${n.townSlug}`;
        const newHighlights = NEIGHBORHOOD_HIGHLIGHTS[key];
        if (newHighlights) {
            console.log(`[Neighborhood] ${n.name} (${n.townSlug}): Updating ${newHighlights.length} highlights`);
            if (!DRY_RUN) {
                await client.patch(n._id).set({ highlights: newHighlights }).commit();
                console.log(`  ✓ Updated`);
            } else {
                newHighlights.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));
            }
        } else {
            console.log(`[Neighborhood] ${n.name} (${n.townSlug}) [key: ${key}]: No revision defined, skipping`);
        }
    }

    console.log('\nDone.');
}

main();
