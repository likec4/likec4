import type { LikeC4ProjectConfig } from '@likec4/config'
import type { LayoutedView } from '@likec4/core/types'

export function filterLandingPageViews(
  views: ReadonlyArray<LayoutedView>,
  filter: LikeC4ProjectConfig['landingPage'],
): ReadonlyArray<LayoutedView> {
  if (!filter) return views

  if ('include' in filter) {
    return views.filter(view => matchesAny(view, filter.include))
  }

  if ('exclude' in filter) {
    return views.filter(view => !matchesAny(view, filter.exclude))
  }

  return views
}

function matchesAny(view: LayoutedView, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.startsWith('#')) {
      const tag = pattern.slice(1)
      return view.tags?.some(t => t === tag) ?? false
    }
    return view.id === pattern
  })
}
