import type { LikeC4Model } from '@likec4/core/model'
import { createFuzzySearch } from './fuzzy'
import { matchesMetadataSearch, METADATA_SEARCH_PREFIX } from './metadata-search'

/**
 * Search over relationships with the syntax of the elements column: `#tag`, `kind:` and `meta:` filter,
 * any other text is a fuzzy search over the title, technology, kind, summary and both endpoints.
 * Takes a normalized search (see `normalizeSearch`) and keeps the original order.
 */
export function createRelationshipSearch<R extends LikeC4Model.Relationship>(
  relationships: readonly R[],
): (search: string) => readonly R[] {
  const fuzzy = createFuzzySearch(relationships, [
    { name: 'title', getFn: r => r.title ?? '' },
    { name: 'technology', getFn: r => r.technology ?? '' },
    { name: 'kind', getFn: r => r.kind ?? '' },
    { name: 'source', getFn: r => [r.source.title, r.source.id] },
    { name: 'target', getFn: r => [r.target.title, r.target.id] },
    { name: 'summary', getFn: r => r.summary.nonEmpty ? r.summary.text : '' },
  ])

  return (search) => {
    switch (true) {
      case search === '' || search === 'kind:':
        return relationships
      case search.startsWith('kind:'): {
        const kind = search.slice('kind:'.length)
        return relationships.filter(r => r.kind?.toLocaleLowerCase().includes(kind))
      }
      case search.startsWith('#'): {
        const tag = search.slice(1)
        return relationships.filter(r => r.tags.some(t => t.toLocaleLowerCase().includes(tag)))
      }
      case search.startsWith(METADATA_SEARCH_PREFIX):
        return relationships.filter(r => matchesMetadataSearch(r.metadata, search))
      default:
        return fuzzy(search)
    }
  }
}
