import type { ViewId } from '@likec4/core'
import type { Disposable } from 'langium'
import { describe, vi } from 'vitest'
import { ast } from '../../ast'
import { test } from '../../test'
import { checksFromDiagnostics } from '../../validation'

// Invalid views are excluded, builder adds default index view
const defaultIndexTitle = 'Landscape view'

const asDisposable = (d: Disposable) => ({ [Symbol.dispose]: () => d.dispose() })

const duplicateViews = `
  views {
    view index {
      title 'First'
      include *
    }
    view index {
      title 'Duplicate'
      include *
    }
  }
`

describe('LikeC4ModelParser -- validation errors', () => {
  test('diagnostics point to invalid nodes', async ({ t, expect }) => {
    const { document, errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component sys1
      }
      ${duplicateViews}
    `)
    expect(errors).toEqual([
      `Duplicate view 'index'`,
      `Duplicate view 'index'`,
    ])

    const views = document.parseResult.value.views.flatMap(b => b.views)
    expect(views).toHaveLength(2)
    expect(views.every(ast.isLikeC4View)).toBe(true)

    const { isValid } = checksFromDiagnostics(document)
    expect(views.map(v => isValid(v))).toEqual([false, false])
  })

  test('excludes invalid nodes from parsed model', async ({ t, expect }) => {
    await t.validate(`
      specification {
        element component
      }
      model {
        component sys1
      }
      ${duplicateViews}
    `)
    const model = await t.buildModel()
    expect(model.views['index' as ViewId]?.title).toBe(defaultIndexTitle)
  })

  test('excludes invalid nodes after document is relinked with the same errors', async ({ t, expect }) => {
    // views.c4 references sys2 from elements.c4, so it is relinked when elements.c4 changes
    const elements = await t.addDocument(
      `
      specification {
        element component
      }
      model {
        component sys1
        component sys2
      }
    `,
      'elements.c4',
    )
    await t.addDocument(
      `
      views {
        view sys2 of sys2 {
          include *
        }
      }
      ${duplicateViews}
    `,
      'views.c4',
    )
    const before = await t.buildModel()
    expect(before.views['sys2' as ViewId]).toBeDefined()
    expect(before.views['index' as ViewId]?.title).toBe(defaultIndexTitle)

    // edit another document, validation errors in views.c4 remain the same
    await t.edit(
      elements,
      `
      specification {
        element component
      }
      model {
        component sys1 'Renamed'
        component sys2
      }
    `,
    )
    const after = await t.buildModel()
    expect(after.elements['sys1']?.title).toBe('Renamed')
    expect(after.views['index' as ViewId]?.title).toBe(defaultIndexTitle)
  })

  describe('onReparsedAfterValidation', () => {
    test('notifies when document has validation errors', async ({ t, expect }) => {
      const listener = vi.fn()
      using _ = asDisposable(t.services.likec4.ModelParser.onReparsedAfterValidation(listener))
      const { document } = await t.validate(`
        specification {
          element component
        }
        model {
          component sys1
        }
        ${duplicateViews}
      `)
      expect(listener).toHaveBeenCalledOnce()
      expect(listener).toHaveBeenCalledWith(document)
    })

    test('does not notify when document is valid', async ({ t, expect }) => {
      const listener = vi.fn()
      using _ = asDisposable(t.services.likec4.ModelParser.onReparsedAfterValidation(listener))
      await t.validate(`
        specification {
          element component
        }
        model {
          component sys1
        }
      `)
      expect(listener).not.toHaveBeenCalled()
    })
  })
})
