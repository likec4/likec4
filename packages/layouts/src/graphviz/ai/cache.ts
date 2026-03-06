import type { ComputedView } from '@likec4/core/types'
import type { LayoutHints } from './types'

/**
 * Compute a structural hash of a view for caching purposes.
 * Only considers: node IDs, node hierarchy (parent/children/kind), edge connections.
 * Does NOT consider: titles, descriptions, colors, icons, styles.
 */
export function computeStructuralKey(view: ComputedView): string {
  const parts: string[] = [
    view.autoLayout.direction,
    ...view.nodes
      .map(n => `${n.id}:${n.parent ?? ''}:${n.kind}:${n.children.join(',')}`)
      .sort(),
    ...view.edges
      .map(e => `${e.id}:${e.source}:${e.target}`)
      .sort(),
  ]
  // djb2 hash
  let hash = 5381
  const str = parts.join('|')
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(36)
}

interface CacheEntry {
  hints: LayoutHints
  timestamp: number
}

/**
 * Cache for AI-generated layout hints, keyed by structural hash of the view.
 * Cosmetic changes (titles, colors) don't invalidate the cache.
 */
export class LayoutHintsCache {
  private cache = new Map<string, CacheEntry>()
  private maxAgeMs: number

  constructor(maxAgeMs = 5 * 60 * 1000) {
    this.maxAgeMs = maxAgeMs
  }

  get(view: ComputedView): LayoutHints | undefined {
    const key = computeStructuralKey(view)
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() - entry.timestamp > this.maxAgeMs) {
      this.cache.delete(key)
      return undefined
    }
    return entry.hints
  }

  set(view: ComputedView, hints: LayoutHints): void {
    const key = computeStructuralKey(view)
    this.cache.set(key, { hints, timestamp: Date.now() })
  }

  invalidate(view: ComputedView): void {
    const key = computeStructuralKey(view)
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}
