import { mapToObj } from 'remeda'
import { describe, expect, it } from 'vitest'
import type { Fqn } from '../../types/element'
import type { ElementView, ViewId, ViewRule } from '../../types/view'
import { resolveRulesExtendedViews } from './resolve-extended-views'

function views(...views: ElementView[]): Record<ViewId, ElementView> {
  return mapToObj(views, view => [view.id, view])
}

describe('resolveRulesExtendedViews', () => {
  const viewRule1: ViewRule = {
    include: [
      {
        wildcard: true
      }
    ]
  }

  const viewRule2: ViewRule = {
    exclude: [
      {
        element: 'cloud' as Fqn,
        isDescedants: true
      }
    ]
  }

  const viewRule3: ViewRule = {
    targets: [],
    style: {}
  }

  const index: ElementView = {
    id: 'index',
    rules: [viewRule1]
  } as any

  const index2: ElementView = {
    id: 'index2',
    extends: 'index',
    rules: [viewRule2]
  } as any

  const index3: ElementView = {
    id: 'index3',
    extends: 'index2',
    rules: [viewRule3]
  } as any

  it('should merge rules', () => {
    const result = resolveRulesExtendedViews(views(index3, index, index2))
    expect(result).toEqual({
      index: {
        id: 'index',
        rules: [viewRule1]
      },
      index2: {
        id: 'index2',
        extends: 'index',
        rules: [viewRule1, viewRule2]
      },
      index3: {
        id: 'index3',
        extends: 'index2',
        rules: [viewRule1, viewRule2, viewRule3]
      }
    })
  })

  it('should merge other fields', () => {
    const index: ElementView = {
      id: 'index',
      title: 'Landscape',
      viewOf: 'cloud',
      rules: [viewRule1]
    } as any
    const result = resolveRulesExtendedViews(views(index3, index, index2))

    expect(result).toEqual({
      index,
      index2: {
        id: 'index2',
        extends: 'index',
        title: 'Landscape',
        viewOf: 'cloud',
        rules: [viewRule1, viewRule2]
      },
      index3: {
        id: 'index3',
        extends: 'index2',
        title: 'Landscape',
        viewOf: 'cloud',
        rules: [viewRule1, viewRule2, viewRule3]
      }
    })
  })

  it('should skip circular extends', () => {
    // Should be skipped because of circular extends
    const index3: ElementView = {
      id: 'index3',
      extends: 'index4'
    } as any
    const index4: ElementView = {
      id: 'index4',
      extends: 'index3'
    } as any
    // Should be dropped also, because parent is skipped
    const index5: ElementView = {
      id: 'index5',
      extends: 'index4'
    } as any

    const result = resolveRulesExtendedViews(views(index3, index5, index4, index, index2))

    expect(result).toEqual({
      index,
      index2: {
        id: 'index2',
        extends: 'index',
        rules: [viewRule1, viewRule2]
      }
    })
  })

  it('should skip with non-existing base', () => {
    const index3: ElementView = {
      id: 'index3',
      extends: 'oops'
    } as any

    const result = resolveRulesExtendedViews(views(index3, index, index2))

    expect(result).toEqual({
      index,
      index2: {
        id: 'index2',
        extends: 'index',
        rules: [viewRule1, viewRule2]
      }
    })
  })
})
