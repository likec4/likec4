export const METADATA_SEARCH_PREFIX = 'meta:'

/**
 * Builds a search query that finds elements with the given metadata key,
 * and optionally the given value: `meta:key` or `meta:key=value`.
 */
export function metadataSearchQuery(key: string, value?: string): string {
  return value === undefined ? `${METADATA_SEARCH_PREFIX}${key}` : `${METADATA_SEARCH_PREFIX}${key}=${value}`
}

function metadataValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String)
  }
  if (typeof value === 'string') {
    return value.includes('\n') ? value.split('\n').map(s => s.trim()).filter(Boolean) : [value]
  }
  return []
}

/**
 * Checks if metadata matches a normalized (lowercased) `meta:` search.
 * - `meta:key` matches elements having a key that includes `key`
 * - `meta:key=value` matches elements having exactly `key`, with any value that includes `value`
 */
export function matchesMetadataSearch(
  metadata: Readonly<Record<string, unknown>>,
  normalizedSearch: string,
): boolean {
  const query = normalizedSearch.slice(METADATA_SEARCH_PREFIX.length)
  if (query === '') {
    return Object.keys(metadata).length > 0
  }
  const eq = query.indexOf('=')
  if (eq < 0) {
    return Object.keys(metadata).some(key => key.toLowerCase().includes(query))
  }
  const searchKey = query.slice(0, eq).trim()
  const searchValue = query.slice(eq + 1).trim()
  return Object.entries(metadata).some(([key, value]) =>
    key.toLowerCase() === searchKey
    && (searchValue === '' || metadataValues(value).some(v => v.toLowerCase().includes(searchValue)))
  )
}
