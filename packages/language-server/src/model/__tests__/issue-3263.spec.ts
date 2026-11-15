import { invariant, ViewId } from '@likec4/core'
import { AstUtils } from 'langium'
import { describe, it } from 'vitest'
import { URI } from 'vscode-uri'
import { ast } from '../../ast'
import { createMultiProjectTestServices } from '../../test'

const baseSpec = `
  specification {
    element system
    element app
    deploymentNode node
  }
`

type Files = Record<string, string>

/**
 * `overlay` includes `../base`, the setup from the issue, plus an optional `consumer` that imports from `base`.
 */
async function workspace({ base, overlay, consumer }: { base: Files; overlay: Files; consumer?: Files }) {
  const t = await createMultiProjectTestServices({})
  const folder = (name: string) => URI.parse(`file:///test/workspace/src/${name}`)
  await t.projectsManager.registerProject({ config: { name: 'base' }, folderUri: folder('base') })
  await t.projectsManager.registerProject({
    config: { name: 'overlay', include: { paths: ['../base'] } },
    folderUri: folder('overlay'),
  })
  if (consumer) {
    await t.projectsManager.registerProject({ config: { name: 'consumer' }, folderUri: folder('consumer') })
  }
  for (const [project, files] of Object.entries({ base, overlay, consumer: consumer ?? {} })) {
    for (const [name, content] of Object.entries(files)) {
      await t.addDocument(`${project}/${name}`, content)
    }
  }
  return t
}

type Workspace = Awaited<ReturnType<typeof workspace>>

/**
 * Names the scope provider offers for the reference `refText` in `path`, as completion asks on a linked document.
 * Builds the model of `base` first: that walks the documents of `base` and re-assigns the project of the shared ones.
 */
async function scopeAfterBaseWalk(t: Workspace, path: string, refText: string): Promise<string[]> {
  await t.buildLikeC4Model('base')
  const doc = t.services.shared.workspace.LangiumDocuments.all.find(d => d.uri.path.endsWith(path))
  invariant(doc, `document ${path} not found`)
  const ref = AstUtils.streamAllContents(doc.parseResult.value)
    .filter(ast.isFqnRef)
    .find(r => r.value.$refText === refText)
  invariant(ref, `reference ${refText} not found in ${path}`)
  return t.services.references.ScopeProvider
    .getScope({ container: ref, property: 'value', reference: ref.value })
    .getAllElements()
    .map(d => d.name)
    .toArray()
}

const nestedBase = {
  'base.c4': `
    ${baseSpec}
    model {
      system org {
        system ctx {
          app sibling
        }
      }
    }
  `,
}

// https://github.com/likec4/likec4/issues/3263
describe('issue #3263', () => {
  it('resolves an element added by a nested extend from a file that sorts first', async ({ expect }) => {
    await using t = await workspace({
      base: nestedBase,
      overlay: {
        'a-views.c4': `
          views {
            view plainView {
              include org.ctx.child
            }
            dynamic view dynView {
              org.ctx.sibling -> org.ctx.child 'step'
            }
          }
        `,
        'model.c4': `
          model {
            extend org.ctx {
              app child
            }
          }
        `,
      },
    })

    const { errors } = await t.validateAll()
    expect(errors).toEqual([])
    const model = await t.buildLikeC4Model('overlay')
    expect(model.view(ViewId('plainView')).$view.nodes.map(n => n.id)).toContain('org.ctx.child')
  })

  it('resolves an element added by a top-level extend', async ({ expect }) => {
    await using t = await workspace({
      base: {
        'base.c4': `
          ${baseSpec}
          model {
            system parent {
              app sibling
            }
          }
        `,
      },
      overlay: {
        'model.c4': `
          model {
            extend parent {
              app child
            }
          }
          views {
            view plainView {
              include parent.child
            }
          }
        `,
      },
    })

    const { errors } = await t.validateAll()
    expect(errors).toEqual([])
    const model = await t.buildLikeC4Model('overlay')
    expect(model.view(ViewId('plainView')).$view.nodes.map(n => n.id)).toContain('parent.child')
  })

  it('resolves a deployment node added by extend', async ({ expect }) => {
    await using t = await workspace({
      base: {
        'base.c4': `
          ${baseSpec}
          deployment {
            node dnHost {
              node dnExisting
            }
          }
        `,
      },
      overlay: {
        'model.c4': `
          deployment {
            extend dnHost {
              node dnChild
            }
          }
          views {
            deployment view depView {
              include dnHost, dnHost.dnChild, dnHost.dnExisting
            }
          }
        `,
      },
    })

    const { errors } = await t.validateAll()
    expect(errors).toEqual([])
    const model = await t.buildLikeC4Model('overlay')
    expect(model.view(ViewId('depView')).$view.nodes.map(n => n.id)).toContain('dnHost.dnChild')
  })

  it('does not leak the overlay extend into the base project', async ({ expect }) => {
    await using t = await workspace({
      base: nestedBase,
      overlay: {
        'model.c4': `
          model {
            extend org.ctx {
              app child
            }
          }
        `,
      },
    })

    const { errors } = await t.validateAll()
    expect(errors).toEqual([])
    expect((await t.buildLikeC4Model('base')).findElement('org.ctx.child')).toBeNull()
    expect((await t.buildLikeC4Model('overlay')).findElement('org.ctx.child')).not.toBeNull()
  })

  it('keeps nested references through an import resolved in the imported project', async ({ expect }) => {
    await using t = await workspace({
      base: nestedBase,
      overlay: {
        'model.c4': `
          model {
            extend org.ctx {
              app child
            }
          }
        `,
      },
      consumer: {
        'model.c4': `
          import { org } from 'base'
          specification {
            element app
          }
          model {
            app client
            client -> org.ctx.sibling
            client -> org.ctx.child
          }
        `,
      },
    })

    const { errors } = await t.validateAll()
    // `sibling` comes from base; `child` exists only in the overlay, so the consumer must not see it
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining(`named 'child'`)]))
    expect(errors).not.toEqual(expect.arrayContaining([expect.stringContaining(`named 'sibling'`)]))
  })
})

describe('issue #3263: references to elements added by extend, from other scopes of the overlay', () => {
  const overlayExtend = `
    model {
      extend org.ctx {
        app child
      }
    }
  `

  it('resolves the element by name inside the body of another extend', async ({ expect }) => {
    await using t = await workspace({
      base: nestedBase,
      overlay: {
        'model.c4': overlayExtend,
        'relations.c4': `
          model {
            extend org.ctx {
              sibling -> child
            }
          }
        `,
      },
    })

    const { errors } = await t.validateAll()
    expect(errors).toEqual([])
    expect(await scopeAfterBaseWalk(t, 'overlay/relations.c4', 'child')).toContain('child')
  })

  it('resolves the element by name inside a view of its parent', async ({ expect }) => {
    await using t = await workspace({
      base: nestedBase,
      overlay: {
        'model.c4': overlayExtend,
        'views.c4': `
          views {
            view ctxView of org.ctx {
              include child
            }
          }
        `,
      },
    })

    const { errors } = await t.validateAll()
    expect(errors).toEqual([])
    expect(await scopeAfterBaseWalk(t, 'overlay/views.c4', 'child')).toContain('child')
  })

  it('resolves a deployment node by name inside the body of another extend', async ({ expect }) => {
    await using t = await workspace({
      base: {
        'base.c4': `
          ${baseSpec}
          deployment {
            node dnHost {
              node dnExisting
            }
          }
        `,
      },
      overlay: {
        'model.c4': `
          deployment {
            extend dnHost {
              node dnChild
            }
          }
        `,
        'relations.c4': `
          deployment {
            extend dnHost {
              dnExisting -> dnChild
            }
          }
        `,
      },
    })

    const { errors } = await t.validateAll()
    expect(errors).toEqual([])
    expect(await scopeAfterBaseWalk(t, 'overlay/relations.c4', 'dnChild')).toContain('dnChild')
  })

  it('resolves the element through a deployed instance', async ({ expect }) => {
    await using t = await workspace({
      base: nestedBase,
      overlay: {
        'model.c4': overlayExtend,
        'deployment.c4': `
          deployment {
            node dnHost {
              inst = instanceOf org.ctx
            }
            node dnClient {
              client = instanceOf org.ctx.sibling
            }
            dnClient.client -> dnHost.inst.child
          }
        `,
      },
    })

    const { errors } = await t.validateAll()
    expect(errors).toEqual([])
    expect(await scopeAfterBaseWalk(t, 'overlay/deployment.c4', 'child')).toContain('child')
  })
})
