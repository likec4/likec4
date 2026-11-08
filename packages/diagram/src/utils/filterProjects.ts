import type { LikeC4ProjectData } from '../LikeC4ProjectsProvider'

function escapeRegExp(value: string): string {
  return value.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Splits a search query into lowercase terms; `*` inside a term matches any characters.
 */
export function projectSearchTerms(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(term => term.replaceAll('*', '').length > 0)
}

/**
 * Keeps the projects whose id, title or path match every term of the query.
 */
export function filterProjects<P extends Pick<LikeC4ProjectData, 'id' | 'title' | 'path'>>(
  projects: ReadonlyArray<P>,
  query: string,
): ReadonlyArray<P> {
  const terms = projectSearchTerms(query)
  if (terms.length === 0) {
    return projects
  }
  const matchers = terms.map(term => new RegExp(term.split('*').map(escapeRegExp).join('.*')))
  return projects.filter(({ id, title, path }) => {
    const haystack = [id, title, path].filter(Boolean).join('\n').toLowerCase()
    return matchers.every(matcher => matcher.test(haystack))
  })
}

/**
 * Literal fragments of the query, to highlight in the matching projects.
 */
export function projectSearchHighlights(query: string): string[] {
  return projectSearchTerms(query).flatMap(term => term.split('*')).filter(Boolean)
}
