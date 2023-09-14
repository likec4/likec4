import { mapToObj } from 'remeda'
import { describe, expect, it } from 'vitest'
import type { ElementView, Fqn, ViewID, ViewRule } from '../types'
import { resolveRulesExtendedViews } from './resolve-extended-views'

function views(...views: ElementView[]): Record<ViewID, ElementView> {
  return mapToObj(views, view => [view.id, view])
}

describe('resolveRulesExtendedViews', () => {
  const viewRule1: ViewRule = {
    isInclude: true,
    exprs: [
      {
        wildcard: true
      }
    ]
  }

  const viewRule2: ViewRule = {
    isInclude: false,
    exprs: [
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

  it('should throw on circular extends', () => {
    const index: ElementView = {
      id: 'index',
      extends: 'index3'
    } as any

    expect(() => {
      resolveRulesExtendedViews(views(index3, index, index2))
    }).toThrow('Circular view extends detected')
  })

  it('should throw on non-existing base', () => {
    const index4: ElementView = {
      id: 'index4',
      extends: 'oops'
    } as any

    expect(() => {
      resolveRulesExtendedViews(views(index3, index4, index, index2))
    }).toThrow(`Cannot find base view 'oops' for 'index4'`)
  })
})
