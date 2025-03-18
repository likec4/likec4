import { mapToObj } from 'remeda'
import { describe, expect, it } from 'vitest'
import type { Fqn } from '../../types/element'
import type { ElementView, ViewId, ViewRule } from '../../types/view'
import { resolveRulesExtendedViews } from './resolve-extended-views'

function views(...views: ElementView[]): Record<ViewId, ElementView> {
  return mapToObj(views, view => [view.id, {
    ...view,
    title: view.title ?? null,
    description: view.description ?? null,
    tags: view.tags ?? null,
    links: view.links ?? null,
    rules: view.rules ?? [],
  }])
}

describe('resolveRulesExtendedViews', () => {
  const viewRule1: ViewRule = {
    include: [
      {
        wildcard: true,
      },
    ],
  }

  const viewRule2: ViewRule = {
    exclude: [
      {
        element: 'cloud' as Fqn,
        isChildren: true,
      },
    ],
  }

  const viewRule3: ViewRule = {
    targets: [],
    style: {},
  }

  const index: ElementView = {
    id: 'index',
    title: null,
    description: null,
    tags: null,
    links: null,
    rules: [viewRule1],
  } as any

  const index2: ElementView = {
    id: 'index2',
    extends: 'index',
    title: null,
    description: null,
    tags: null,
    links: null,
    rules: [viewRule2],
  } as any

  const index3: ElementView = {
    id: 'index3',
    extends: 'index2',
    title: null,
    description: null,
    tags: null,
    links: null,
    rules: [viewRule3],
  } as any

  it('should merge rules', () => {
    const result = resolveRulesExtendedViews(views(index3, index, index2))
    expect(result).toMatchObject({
      index: {
        id: 'index',
        rules: [viewRule1],
      },
      index2: {
        id: 'index2',
        extends: 'index',
        rules: [viewRule1, viewRule2],
      },
      index3: {
        id: 'index3',
        extends: 'index2',
        rules: [viewRule1, viewRule2, viewRule3],
      },
    })
  })

  it('should merge other fields', () => {
    const index: ElementView = {
      id: 'index',
      title: 'Landscape',
      viewOf: 'cloud',
      rules: [viewRule1],
      links: null,
      tags: null,
      description: null,
    } as any
    const result = resolveRulesExtendedViews(views(index3, index, index2))

    expect(result).toEqual({
      index,
      index2: {
        id: 'index2',
        extends: 'index',
        title: 'Landscape',
        viewOf: 'cloud',
        links: null,
        tags: null,
        description: null,
        rules: [viewRule1, viewRule2],
      },
      index3: {
        id: 'index3',
        extends: 'index2',
        title: 'Landscape',
        viewOf: 'cloud',
        links: null,
        tags: null,
        description: null,
        rules: [viewRule1, viewRule2, viewRule3],
      },
    })
  })

  it('should skip circular extends', () => {
    // Should be skipped because of circular extends
    const index3: ElementView = {
      id: 'index3',
      extends: 'index4',
    } as any
    const index4: ElementView = {
      id: 'index4',
      extends: 'index3',
    } as any
    // Should be dropped also, because parent is skipped
    const index5: ElementView = {
      id: 'index5',
      extends: 'index4',
    } as any

    const result = resolveRulesExtendedViews(views(index3, index5, index4, index, index2))

    expect(result).toEqual({
      index,
      index2: {
        id: 'index2',
        extends: 'index',
        title: null,
        links: null,
        tags: null,
        description: null,
        rules: [viewRule1, viewRule2],
      },
    })
  })

  it('should inherit title, description', () => {
    // Should inherit title and description from the parent view
    const index: ElementView = {
      id: 'index',
      title: 'Root View',
      description: 'This is the root view',
      rules: [],
      links: null,
      tags: null,
    } as any
    const index2: ElementView = {
      id: 'index2',
      extends: 'index',
      description: 'This is the index2 view',
      rules: [],
    } as any
    const index3: ElementView = {
      id: 'index3',
      extends: 'index2',
      rules: [],
    } as any

    const result = resolveRulesExtendedViews(views(index3, index2, index))

    expect(result).toEqual({
      index,
      index2: {
        id: 'index2',
        extends: 'index',
        title: 'Root View',
        description: 'This is the index2 view',
        rules: [],
        links: null,
        tags: null,
      },
      index3: {
        description: 'This is the index2 view',
        extends: 'index2',
        id: 'index3',
        links: null,
        rules: [],
        tags: null,
        title: 'Root View',
      },
    })
  })

  it('should skip with non-existing base', () => {
    const index3: ElementView = {
      id: 'index3',
      extends: 'oops',
    } as any

    const result = resolveRulesExtendedViews(views(index3, index, index2))

    expect(result).toEqual({
      index,
      index2: {
        id: 'index2',
        extends: 'index',
        title: null,
        links: null,
        tags: null,
        description: null,
        rules: [viewRule1, viewRule2],
      },
    })
  })
})
