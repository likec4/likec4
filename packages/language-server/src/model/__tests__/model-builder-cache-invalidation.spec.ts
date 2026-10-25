import type { LayoutedView, ProjectId, ViewId } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import { DocumentState } from 'langium'
import { describe, it } from 'vitest'
import { NoopLikeC4ManualLayouts } from '../../filesystem/noop'
import type { ManualLayoutsSnapshot } from '../../filesystem/types'
import { createMultiProjectTestServices, createTestServices } from '../../test'

const spec = `
  specification {
    element component
  }
`

/**
 * Builds the model from scratch with fresh services, used as an oracle
 */
async function freshModel(sources: Map<string, string>) {
  await using t = createTestServices()
  for (const [uri, text] of sources) {
    await t.addDocument(text, uri)
  }
  return await t.buildModel()
}

describe('LikeC4ModelBuilder -- cache invalidation', () => {
  describe('cached model equals model built from scratch', () => {
    type Step = [name: string, apply: (sources: Map<string, string>) => void]

    const steps: Step[] = [
      ['initial', s => {
        s.set('spec.c4', spec)
        s.set(
          'model.c4',
          `
          model {
            component sys1
            component sys2
            sys1 -> sys2
          }
          views {
            view index {
              include *
            }
          }
        `,
        )
      }],
      ['add document', s => {
        s.set(
          'extra.c4',
          `
          model {
            component sys3
            sys3 -> sys1
          }
        `,
        )
      }],
      ['change document', s => {
        s.set(
          'extra.c4',
          `
          model {
            component sys3 'Renamed'
            sys2 -> sys3
          }
        `,
        )
      }],
      ['introduce validation error', s => {
        s.set(
          'extra.c4',
          `
          model {
            component sys3
            sys3 -> unknown
          }
        `,
        )
      }],
      ['fix validation error', s => {
        s.set(
          'extra.c4',
          `
          model {
            component sys3
            sys3 -> sys2
          }
        `,
        )
      }],
      ['delete document', s => {
        s.delete('extra.c4')
      }],
    ]

    it('after each step', async ({ expect }) => {
      await using t = createTestServices()
      const sources = new Map<string, string>()

      for (const [name, apply] of steps) {
        const before = new Map(sources)
        apply(sources)

        // Sync documents with sources
        for (const uri of before.keys()) {
          if (!sources.has(uri) || sources.get(uri) !== before.get(uri)) {
            await t.removeDocument(
              t.services.shared.workspace.LangiumDocuments.all.find(d => d.uri.path.endsWith(`/src/${uri}`))!,
            )
          }
        }
        for (const [uri, text] of sources) {
          if (before.get(uri) !== text) {
            await t.addDocument(text, uri)
          }
        }

        const cached = await t.buildModel()
        const expected = await freshModel(sources)
        expect(cached, `step: ${name}`).toStrictEqual(expected)
      }
    })
  })

  it('returns same instance when nothing changed', async ({ expect }) => {
    await using t = createTestServices()
    await t.validate(`
      ${spec}
      model {
        component sys1
      }
      views {
        view index {
          include *
        }
      }
    `)
    const mb = t.services.likec4.ModelBuilder

    const parsed1 = await mb.parseModel()
    const computed1 = await mb.computeModel()
    await t.validateAll()
    const parsed2 = await mb.parseModel()
    const computed2 = await mb.computeModel()

    expect(parsed2).toBe(parsed1)
    expect(computed2).toBe(computed1)
  })

  it('keeps model of unrelated project when another project changes', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({
      a: {
        'model.c4': `
          ${spec}
          model {
            component a1
          }
        `,
      },
      b: {
        'model.c4': `
          ${spec}
          model {
            component b1
          }
        `,
      },
    })
    const modelB1 = await t.buildLikeC4Model('b')

    await t.addDocument(
      'a/extra.c4',
      `
      model {
        component a2
      }
    `,
    )
    const modelA2 = await t.buildLikeC4Model('a')
    const modelB2 = await t.buildLikeC4Model('b')

    expect(modelA2.findElement('a2')).not.toBeNull()
    expect(modelB2).toBe(modelB1)
  })

  it('invalidates importing project when imported project changes', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({
      owner: {
        'model.c4': `
          ${spec}
          model {
            component a
          }
        `,
      },
      consumer: {
        'model.c4': `
          import { a } from 'owner'
          model {
            component c
            c -> a
          }
        `,
      },
    })
    const before = await t.buildLikeC4Model('consumer')
    expect(before.findElement('@owner.a.child')).toBeNull()

    await t.addDocument(
      'owner/extend.c4',
      `
      model {
        extend a {
          component child
        }
      }
    `,
    )
    // only owner documents were rebuilt
    await t.validateAll()

    const after = await t.buildLikeC4Model('consumer')
    expect(after.findElement('@owner.a.child')).not.toBeNull()
  })

  it('keeps model of project not importing from changed project', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({
      owner: {
        'model.c4': `
          ${spec}
          model {
            component a
          }
        `,
      },
      consumer: {
        'model.c4': `
          import { a } from 'owner'
          model {
            component c
            c -> a
          }
        `,
      },
      unrelated: {
        'model.c4': `
          ${spec}
          model {
            component u
          }
        `,
      },
    })
    const consumerBefore = await t.buildLikeC4Model('consumer')
    const unrelatedBefore = await t.buildLikeC4Model('unrelated')

    await t.addDocument(
      'owner/extend.c4',
      `
      model {
        extend a {
          component child
        }
      }
    `,
    )
    await t.validateAll()

    const consumerAfter = await t.buildLikeC4Model('consumer')
    const unrelatedAfter = await t.buildLikeC4Model('unrelated')

    expect(consumerAfter).not.toBe(consumerBefore)
    expect(unrelatedAfter).toBe(unrelatedBefore)
  })

  it('invalidates transitively importing projects', async ({ expect }) => {
    // a <- b <- c
    await using t = await createMultiProjectTestServices({
      a: {
        'model.c4': `
          ${spec}
          model {
            component a1
          }
        `,
      },
      b: {
        'model.c4': `
          ${spec}
          import { a1 } from 'a'
          model {
            component b1
            b1 -> a1
          }
        `,
      },
      c: {
        'model.c4': `
          ${spec}
          import { b1 } from 'b'
          model {
            component c1
            c1 -> b1
          }
        `,
      },
    })
    const bBefore = await t.buildLikeC4Model('b')
    const cBefore = await t.buildLikeC4Model('c')
    expect(bBefore.findElement('@a.a1.child')).toBeNull()
    expect(cBefore.element('@b.b1')).toBeDefined()

    await t.addDocument(
      'a/extend.c4',
      `
      model {
        extend a1 {
          component child
        }
      }
    `,
    )
    await t.validateAll()

    const bAfter = await t.buildLikeC4Model('b')
    expect(bAfter.findElement('@a.a1.child')).not.toBeNull()

    // c does not see elements of a (imports are not re-exported), but must stay consistent
    const cAfter = await t.buildLikeC4Model('c')
    expect(cAfter.$data).toStrictEqual(cBefore.$data)

    // Change b, c must see the change
    await t.addDocument(
      'b/extend.c4',
      `
      model {
        extend b1 {
          component child
        }
      }
    `,
    )
    await t.validateAll()
    const cAfterB = await t.buildLikeC4Model('c')
    expect(cAfterB.findElement('@b.b1.child')).not.toBeNull()
  })

  it('does not mix models computed with and without manual layouts', async ({ expect }) => {
    const viewId = 'index' as ViewId
    const snapshot: ManualLayoutsSnapshot = {
      hash: 'snapshot-1',
      views: { [viewId]: { id: viewId } as LayoutedView },
    }
    await using t = createTestServices({
      context: {
        manualLayouts: () =>
          Object.assign(new NoopLikeC4ManualLayouts(), {
            read: () => Promise.resolve(snapshot),
          }),
      },
    })
    await t.validate(`
      ${spec}
      model {
        component sys1
      }
      views {
        view index {
          include *
        }
      }
    `)
    const mb = t.services.likec4.ModelBuilder

    const withLayouts = await mb.computeModel()
    expect(withLayouts.view(viewId).$view.hasManualLayout).toBe(true)

    // This is what LikeC4.ts (language-services) calls synchronously
    const withoutLayouts = mb.unsafeSyncComputeModel('default' as ProjectId)
    expect(withoutLayouts.view(viewId).$view.hasManualLayout).toBeFalsy()
  })

  describe('validation changes', () => {
    const elements = (...names: string[]) => `
      ${spec}
      model {
        ${names.map(n => `component ${n}`).join('\n')}
      }
    `
    const relations = `
      model {
        sys1 -> sys2
      }
    `

    it('keeps same instance if user edits text and error remains', async ({ expect }) => {
      await using t = createTestServices()
      const { document } = await t.validate(`
        ${spec}
        model {
          component sys1
          sys1 -> unknown
        }
      `)
      const mb = t.services.likec4.ModelBuilder
      const before = await mb.parseModel()

      await t.edit(
        document,
        `
        ${spec}
        model {
          // user is typing something
          component sys1
          sys1 -> unknown
        }
      `,
      )
      expect(document.diagnostics?.length).toBeGreaterThan(0)

      const after = await mb.parseModel()
      expect(after).toBe(before)
    })

    it('reparses document when its validation changes, but text does not', async ({ expect }) => {
      await using t = createTestServices()
      // relations.c4 is never edited, it changes validation state only because of elements.c4
      const elementsDoc = await t.addDocument(elements('sys1', 'sys2'), 'elements.c4')
      await t.addDocument(relations, 'relations.c4')

      const step = async (name: string, elementNames: string[], expectedRelations: number) => {
        const sources = new Map([
          ['elements.c4', elements(...elementNames)],
          ['relations.c4', relations],
        ])
        const model = await t.buildModel()
        expect(model, `step: ${name}`).toStrictEqual(await freshModel(sources))
        expect(Object.keys(model.relations), `step: ${name}`).toHaveLength(expectedRelations)
      }

      await step('valid', ['sys1', 'sys2'], 1)

      // introduce error in relations.c4
      await t.edit(elementsDoc, elements('sys1', 'sys3'))
      await step('error', ['sys1', 'sys3'], 0)

      // fix error in relations.c4
      await t.edit(elementsDoc, elements('sys1', 'sys2'))
      await step('fixed', ['sys1', 'sys2'], 1)
    })

    it('model requested between Linked and Validated is consistent after validation', async ({ expect }) => {
      await using t = createTestServices()
      const mb = t.services.likec4.ModelBuilder
      const builder = t.services.shared.workspace.DocumentBuilder
      // At Linked phase there are no diagnostics yet, parser considers everything valid
      // Emulate concurrent request (e.g. from LSP) while build is in progress.
      // Do not await inside the listener: parseModel waits for builder to reach Linked,
      // and builder reaches Linked only after all listeners are completed (deadlock)
      let atLinked: Promise<LikeC4Model.Parsed | null> | undefined
      builder.onBuildPhase(DocumentState.Linked, () => {
        atLinked ??= mb.parseModel()
      })

      const source = `
        ${spec}
        model {
          component sys1 {
            // invalid: is reported on validation only, parser skips invalid icons
            icon https://example.com/a.png
            icon https://example.com/b.png
          }
        }
      `
      const { errors } = await t.validate(source, 'model.c4')
      expect(atLinked).toBeDefined()
      await atLinked
      expect(errors).toContain('Icon must be defined once')

      const model = await t.buildModel()
      expect(model).toStrictEqual(await freshModel(new Map([['model.c4', source]])))
      // TODO: find a validation error that changes parsed data,
      // to ensure model at Linked differs from the final one
    })
  })
})
