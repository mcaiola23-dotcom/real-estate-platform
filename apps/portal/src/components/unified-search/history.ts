const STORAGE_KEY = 'portal-unified-search-history'
const SEARCH_HISTORY_LIMIT = 8
const PROPERTY_HISTORY_LIMIT = 8

export type RecentSearchKind = 'ai' | 'address' | 'city' | 'neighborhood' | 'google_place'

export interface RecentSearchEntry {
  kind: RecentSearchKind
  query: string
  label: string
  value: string
  city?: string
  placeId?: string
  updatedAt: number
}

export interface RecentPropertyEntry {
  parcelId?: string
  listingId?: number
  address: string
  city?: string
  status?: string
  updatedAt: number
}

interface SearchHistoryPayload {
  searches: RecentSearchEntry[]
  properties: RecentPropertyEntry[]
}

interface RecentSearchInput {
  kind: RecentSearchKind
  query: string
  label?: string
  value?: string
  city?: string
  placeId?: string
}

interface RecentPropertyInput {
  parcelId?: string
  listingId?: number
  address: string
  city?: string
  status?: string
}

const emptyHistory = (): SearchHistoryPayload => ({
  searches: [],
  properties: [],
})

const normalizeText = (value?: string): string => (value || '').trim()

const canUseLocalStorage = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

const buildSearchKey = (entry: Pick<RecentSearchEntry, 'kind' | 'value'>): string =>
  `${entry.kind}:${entry.value.toLowerCase()}`

const buildPropertyKey = (entry: Pick<RecentPropertyEntry, 'parcelId' | 'listingId'>): string => {
  if (entry.listingId) return `listing:${entry.listingId}`
  return entry.parcelId ? `parcel:${entry.parcelId}` : ''
}

const parseRecentSearch = (value: unknown): RecentSearchEntry | null => {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<RecentSearchEntry>
  const kind = candidate.kind
  const query = normalizeText(candidate.query)
  const label = normalizeText(candidate.label || candidate.query)
  const entryValue = normalizeText(candidate.value || candidate.query)
  const updatedAt = Number(candidate.updatedAt)

  if (
    kind !== 'ai' &&
    kind !== 'address' &&
    kind !== 'city' &&
    kind !== 'neighborhood' &&
    kind !== 'google_place'
  ) {
    return null
  }

  if (!query || !label || !entryValue) return null

  return {
    kind,
    query,
    label,
    value: entryValue,
    city: normalizeText(candidate.city) || undefined,
    placeId: normalizeText(candidate.placeId) || undefined,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
  }
}

const parseRecentProperty = (value: unknown): RecentPropertyEntry | null => {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<RecentPropertyEntry>
  const parcelId = normalizeText(candidate.parcelId)
  const address = normalizeText(candidate.address)
  const listingId =
    typeof candidate.listingId === 'number' && Number.isFinite(candidate.listingId)
      ? candidate.listingId
      : undefined
  const updatedAt = Number(candidate.updatedAt)

  if (!address || (!parcelId && listingId === undefined)) return null

  return {
    parcelId: parcelId || undefined,
    listingId,
    address,
    city: normalizeText(candidate.city) || undefined,
    status: normalizeText(candidate.status) || undefined,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
  }
}

const readHistory = (): SearchHistoryPayload => {
  if (!canUseLocalStorage()) return emptyHistory()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyHistory()

    const parsed = JSON.parse(raw) as Partial<SearchHistoryPayload> | null
    const parsedSearches = Array.isArray(parsed?.searches)
      ? parsed.searches.map(parseRecentSearch).filter((entry): entry is RecentSearchEntry => entry !== null)
      : []
    const parsedProperties = Array.isArray(parsed?.properties)
      ? parsed.properties
          .map(parseRecentProperty)
          .filter((entry): entry is RecentPropertyEntry => entry !== null)
      : []

    return {
      searches: parsedSearches,
      properties: parsedProperties,
    }
  } catch {
    return emptyHistory()
  }
}

const writeHistory = (payload: SearchHistoryPayload): void => {
  if (!canUseLocalStorage()) return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore localStorage write failures.
  }
}

export const addRecentSearch = ({
  kind,
  query,
  label,
  value,
  city,
  placeId,
}: RecentSearchInput): void => {
  const normalizedQuery = normalizeText(query)
  const normalizedValue = normalizeText(value || query)
  const normalizedLabel = normalizeText(label || query)
  if (!normalizedQuery || !normalizedValue || !normalizedLabel) return

  const existing = readHistory()
  const nextEntry: RecentSearchEntry = {
    kind,
    query: normalizedQuery,
    label: normalizedLabel,
    value: normalizedValue,
    city: normalizeText(city) || undefined,
    placeId: normalizeText(placeId) || undefined,
    updatedAt: Date.now(),
  }
  const nextEntryKey = buildSearchKey(nextEntry)
  const updatedSearches = [
    nextEntry,
    ...existing.searches.filter((entry) => buildSearchKey(entry) !== nextEntryKey),
  ].slice(0, SEARCH_HISTORY_LIMIT)

  writeHistory({
    ...existing,
    searches: updatedSearches,
  })
}

export const addRecentPropertyView = ({
  parcelId,
  listingId,
  address,
  city,
  status,
}: RecentPropertyInput): void => {
  const normalizedParcelId = normalizeText(parcelId)
  const normalizedAddress = normalizeText(address)
  if (!normalizedAddress || (!normalizedParcelId && listingId === undefined)) return

  const existing = readHistory()
  const nextEntry: RecentPropertyEntry = {
    parcelId: normalizedParcelId || undefined,
    listingId,
    address: normalizedAddress,
    city: normalizeText(city) || undefined,
    status: normalizeText(status) || undefined,
    updatedAt: Date.now(),
  }
  const nextEntryKey = buildPropertyKey(nextEntry)
  if (!nextEntryKey) return
  const updatedProperties = [
    nextEntry,
    ...existing.properties.filter((entry) => buildPropertyKey(entry) !== nextEntryKey),
  ].slice(0, PROPERTY_HISTORY_LIMIT)

  writeHistory({
    ...existing,
    properties: updatedProperties,
  })
}

export const getRecentSearches = (limit = SEARCH_HISTORY_LIMIT): RecentSearchEntry[] =>
  readHistory().searches.slice(0, Math.max(0, limit))

export const getRecentPropertyViews = (limit = PROPERTY_HISTORY_LIMIT): RecentPropertyEntry[] =>
  readHistory().properties.slice(0, Math.max(0, limit))

export const clearRecentSearchHistory = (): void => {
  if (!canUseLocalStorage()) return

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore localStorage delete failures.
  }
}
