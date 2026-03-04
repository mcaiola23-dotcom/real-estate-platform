/**
 * Derives varied H2 heading text from content signals to avoid
 * repetitive "Living in X" / "What Makes X Special" patterns across pages.
 */

type AreaCharacter = 'coastal' | 'village' | 'rural' | 'urban' | 'suburban' | 'general';

const COASTAL_KEYWORDS = [
  'waterfront', 'harbor', 'shore', 'beach', 'sound', 'marina',
  'coastal', 'ocean', 'cove', 'sailing', 'island', 'seaside',
];

const VILLAGE_KEYWORDS = [
  'village', 'town center', 'walkable downtown', 'main street',
  'historic district', 'charming', 'boutique',
];

const RURAL_KEYWORDS = [
  'acres', 'farmland', 'equestrian', 'horse', 'conservation',
  'woodland', 'backcountry', 'country', 'pastoral', 'rolling hills',
];

const URBAN_KEYWORDS = [
  'downtown', 'urban', 'high-rise', 'mixed-use', 'transit hub',
  'metro', 'commuter', 'city',
];

function detectCharacter(overview: string, highlights: string[]): AreaCharacter {
  const text = [overview, ...highlights].join(' ').toLowerCase();

  const scores: Record<AreaCharacter, number> = {
    coastal: 0,
    village: 0,
    rural: 0,
    urban: 0,
    suburban: 0,
    general: 0,
  };

  for (const kw of COASTAL_KEYWORDS) if (text.includes(kw)) scores.coastal++;
  for (const kw of VILLAGE_KEYWORDS) if (text.includes(kw)) scores.village++;
  for (const kw of RURAL_KEYWORDS) if (text.includes(kw)) scores.rural++;
  for (const kw of URBAN_KEYWORDS) if (text.includes(kw)) scores.urban++;

  const top = Object.entries(scores)
    .filter(([key]) => key !== 'general' && key !== 'suburban')
    .sort((a, b) => b[1] - a[1]);

  if (top[0][1] >= 2) return top[0][0] as AreaCharacter;
  if (top[0][1] === 1) return top[0][0] as AreaCharacter;
  return 'general';
}

const LIFESTYLE_HEADINGS: Record<AreaCharacter, (name: string) => string> = {
  coastal: (name) => `Coastal Living in ${name}`,
  village: (name) => `Village Life in ${name}`,
  rural: (name) => `Country Living in ${name}`,
  urban: (name) => `City Living in ${name}`,
  suburban: (name) => `Life in ${name}`,
  general: (name) => `Living in ${name}`,
};

const HIGHLIGHTS_HEADINGS: Record<AreaCharacter, (name: string) => string> = {
  coastal: (name) => `Why Buyers Choose ${name}`,
  village: (name) => `The Appeal of ${name}`,
  rural: (name) => `What Draws Buyers to ${name}`,
  urban: (name) => `Why Buyers Choose ${name}`,
  suburban: (name) => `What Makes ${name} Stand Out`,
  general: (name) => `What Makes ${name} Special`,
};

/**
 * Returns a varied "lifestyle" heading (for the overview/description section).
 * e.g. "Coastal Living in Old Greenwich" instead of always "Living in X"
 */
export function getLifestyleHeading(
  name: string,
  overview?: string,
  highlights?: string[],
): string {
  const character = detectCharacter(overview || '', highlights || []);
  return LIFESTYLE_HEADINGS[character](name);
}

/**
 * Returns a varied "highlights" heading.
 * e.g. "Why Buyers Choose Belle Haven" instead of always "What Makes X Special"
 */
export function getHighlightsHeading(
  name: string,
  overview?: string,
  highlights?: string[],
): string {
  const character = detectCharacter(overview || '', highlights || []);
  return HIGHLIGHTS_HEADINGS[character](name);
}
