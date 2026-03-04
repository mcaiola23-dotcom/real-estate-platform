// Keywords that suggest AI search intent
const AI_SEARCH_KEYWORDS = [
  'homes', 'houses', 'house', 'home', 'property', 'properties',
  'bedroom', 'bedrooms', 'bed', 'beds', 'bath', 'baths', 'bathroom', 'bathrooms',
  'acre', 'acres', 'sqft', 'sq ft', 'square feet',
  'single family', 'multi-family', 'multifamily', 'townhouse', 'condo',
  'under', 'over', 'between', 'less than', 'more than', 'around',
  'near', 'close to', 'walking distance',
  'pool', 'garage', 'yard', 'garden', 'waterfront', 'lakefront',
  'luxury', 'affordable', 'cheap', 'expensive', 'modern', 'new', 'renovated',
  'family', 'starter', 'investment', 'rental',
  'looking for', 'want', 'need', 'find me', 'show me', 'search for',
  'with', 'that has', 'featuring',
  '$', 'million', 'thousand',
]

export function detectSearchType(query: string): 'ai' | 'address' | 'unknown' {
  const trimmed = query.trim().toLowerCase()

  if (trimmed.length < 3) return 'unknown'

  const hasAiKeyword = AI_SEARCH_KEYWORDS.some((keyword) =>
    trimmed.includes(keyword.toLowerCase())
  )

  const hasPricePattern = /\$[\d,]+(?:\.\d+)?(?:\s*[km])?\b|\b\d{6,}\b|\b\d+\s*(k|m|million|thousand)\b/i.test(trimmed)
  const hasBedBathPattern = /\d+\s*(bed|bath|br|ba)/i.test(trimmed)
  const wordCount = trimmed.split(/\s+/).length
  const isDescriptive = wordCount >= 3 && (hasAiKeyword || hasPricePattern || hasBedBathPattern)

  if (isDescriptive || hasAiKeyword || hasPricePattern || hasBedBathPattern) {
    return 'ai'
  }

  // Address detection comes after AI checks so "2 bed, 2 bath..." does not
  // get misclassified as a street address.
  const strictAddressPattern = /^\d+\s+[\w'.-]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|place|pl|boulevard|blvd|way|circle|cir|trail|trl)\b/i
  const looseAddressPattern = /^\d+\s+\w/
  if (strictAddressPattern.test(trimmed) || looseAddressPattern.test(trimmed)) {
    return 'address'
  }

  return 'unknown'
}
