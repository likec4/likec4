import type { LikeC4Model } from '@likec4/core/model'
import type { Fqn, ViewId } from '@likec4/core/types'

export interface IndexElementView {
  readonly id: ViewId
  readonly title: string
}

export interface IndexElement {
  readonly id: Fqn
  readonly title: string
  readonly kind: string
  /**
   * Title of the parent element, null for top-level elements
   */
  readonly parent: string | null
  readonly technology: string | null
  readonly tags: ReadonlyArray<string>
  /**
   * Relationships of the element itself, without the ones of its descendants
   */
  readonly incoming: number
  readonly outgoing: number
  readonly views: ReadonlyArray<IndexElementView>
}

export interface IndexKind {
  readonly kind: string
  readonly notation: string | null
  /**
   * Fill color of the kind's style
   */
  readonly color: string
  readonly elements: number
  readonly notInViews: number
}

export interface ElementsIndex {
  readonly elements: ReadonlyArray<IndexElement>
  /**
   * Kinds that have elements, the most used first
   */
  readonly kinds: ReadonlyArray<IndexKind>
  readonly notInViews: number
}

export type ElementSort = 'name' | 'kind' | 'relationships'

export interface ElementsFilter {
  /**
   * Only elements of this kind, null for all kinds
   */
  readonly kind: string | null
  readonly notInViews: boolean
  readonly search: string
  readonly sort: ElementSort
}

/**
 * Elements of the project (imported ones belong to their own project) with where they are used
 */
export function indexElements(model: LikeC4Model): ElementsIndex {
  const elements = [...model.elements()]
    .filter(el => !el.imported)
    .map((el): IndexElement => ({
      id: el.id,
      title: el.title,
      kind: el.kind,
      parent: el.parent?.title ?? null,
      technology: el.technology,
      tags: el.tags,
      incoming: [...el.incoming('direct')].length,
      outgoing: [...el.outgoing('direct')].length,
      views: [...el.views()].map(view => ({ id: view.id, title: view.titleOrUntitled })),
    }))

  const kinds = new Map<string, { elements: number; notInViews: number }>()
  for (const el of elements) {
    const counts = kinds.get(el.kind) ?? { elements: 0, notInViews: 0 }
    counts.elements++
    if (el.views.length === 0) {
      counts.notInViews++
    }
    kinds.set(el.kind, counts)
  }

  return {
    elements,
    kinds: [...kinds.entries()]
      .map(([kind, counts]): IndexKind => {
        const spec = model.specification.elements[kind]
        return {
          kind,
          notation: spec?.notation ?? null,
          color: model.$styles.colors(spec?.style?.color).elements.fill,
          ...counts,
        }
      })
      .sort((a, b) => b.elements - a.elements || a.kind.localeCompare(b.kind)),
    notInViews: elements.filter(el => el.views.length === 0).length,
  }
}

function matches(el: IndexElement, search: string): boolean {
  return [el.title, el.id, el.technology ?? '', ...el.tags].some(value => value.toLowerCase().includes(search))
}

/**
 * Elements that pass the filter, in the requested order
 */
export function selectElements(elements: ReadonlyArray<IndexElement>, filter: ElementsFilter): IndexElement[] {
  const search = filter.search.trim().toLowerCase()
  const byName = (a: IndexElement, b: IndexElement) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id)
  return elements
    .filter(el => {
      switch (true) {
        case filter.kind !== null && el.kind !== filter.kind:
        case filter.notInViews && el.views.length > 0:
          return false
        case search === '':
          return true
        default:
          return matches(el, search)
      }
    })
    .sort((a, b) => {
      switch (true) {
        case filter.sort === 'kind':
          return a.kind.localeCompare(b.kind) || byName(a, b)
        case filter.sort === 'relationships':
          return (b.incoming + b.outgoing) - (a.incoming + a.outgoing) || byName(a, b)
        default:
          return byName(a, b)
      }
    })
}
