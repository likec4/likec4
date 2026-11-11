import { URI } from 'langium'
import { describe, it } from 'vitest'
import { createMultiProjectTestServices, createTestServices } from '../test'

describe('import checks', () => {
  it('should report invalid import from same project (default)', async ({ expect }) => {
    await using t = createTestServices()
    const { diagnostics } = await t.validate(`
      import c1 from 'default'
      specification {
        element component
      }
      model {
        component c1
      }
    `)
    expect.soft(diagnostics).toHaveLength(1)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: 'Imported project cannot be the same as the current project' },
    ])
  })

  it('should report invalid import from same project (non-default)', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({
      project1: {
        'doc1': `
          specification {
            element component
          }
          model {
            component c1
          }
        `,
        'doc2': `
          import c1 from 'project1'
        `,
      },
    })

    const { diagnostics } = await t.validateAll()
    expect.soft(diagnostics).toHaveLength(1)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: 'Imported project cannot be the same as the current project' },
    ])
  })

  it('should report invalid import', async ({ expect }) => {
    await using t = createTestServices()
    const { diagnostics } = await t.validate(`
      import c1 from 'project1'
    `)
    expect.soft(diagnostics).toHaveLength(2)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: `Could not resolve reference to Element named 'c1'.` },
      { severity: 1, message: 'Imported project not found' },
    ])
  })

  it('should not report valid imports', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({
      project1: {
        'doc1': `
          specification {
            element component
          }
          model {
            component c1
            component c2
          }
        `,
      },
      project2: {
        'doc2': `
          import c1 from 'project1'
          import c2 from 'project1'
        `,
      },
      project3: {
        'doc2': `
          import { c1, c2 } from 'project1'
        `,
      },
    })

    const { diagnostics } = await t.validateAll()
    expect.soft(diagnostics).toHaveLength(0)
  })
  it('should report invalid imports from another project', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({
      project1: {
        'doc1': `
          specification {
            element component
          }
          model {
            component c1
          }
        `,
      },
      project2: {
        'doc1': `
          import c2 from 'project1'
        `,
      },
    })

    const { diagnostics } = await t.validateAll()
    expect.soft(diagnostics).toHaveLength(1)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: `Could not resolve reference to Element named 'c2'.` },
    ])
  })

  describe('dependencies', () => {
    const sharedModel = `
      specification {
        element component
      }
      model {
        component c1
      }
    `

    /**
     * Creates a workspace with the given projects, each project in `src/<folder>`
     */
    async function workspace(
      projects: Record<string, { name: string; dependencies?: Record<string, string>; model: string }>,
    ) {
      const t = await createMultiProjectTestServices({})
      for (const [folder, { name, dependencies, model }] of Object.entries(projects)) {
        await t.projectsManager.registerProject({
          config: {
            name,
            ...(dependencies && { dependencies }),
          },
          folderUri: URI.parse(`file:///test/workspace/src/${folder}`),
        })
        await t.addDocument(`${folder}/model.c4`, model)
      }
      return t
    }

    it('should not report import by name from dependencies', async ({ expect }) => {
      await using t = await workspace({
        'shared-folder': { name: 'shared', model: sharedModel },
        'consumer': {
          name: 'consumer',
          dependencies: { billing: '../shared-folder' },
          model: `import c1 from 'billing'`,
        },
      })
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toEqual([])
    })

    it('should report unknown import name', async ({ expect }) => {
      await using t = await workspace({
        'shared-folder': { name: 'shared', model: sharedModel },
        'consumer': {
          name: 'consumer',
          dependencies: { billing: '../shared-folder' },
          model: `import c1 from 'payments'`,
        },
      })
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toMatchObject([
        { severity: 1, message: `Could not resolve reference to Element named 'c1'.` },
        { severity: 1, message: 'Imported project not found' },
      ])
      expect(diagnostics).toHaveLength(2)
    })

    it('should report dependencies entry pointing to unknown folder', async ({ expect }) => {
      await using t = await workspace({
        // workspace project with the same name is not used, the entry wins
        'shared': { name: 'shared', model: sharedModel },
        'consumer': {
          name: 'consumer',
          dependencies: { shared: '../missing' },
          model: `import c1 from 'shared'`,
        },
      })
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toMatchObject([
        { severity: 1, message: `Could not resolve reference to Element named 'c1'.` },
        { severity: 1, message: 'Imported project not found' },
      ])
      expect(diagnostics).toHaveLength(2)
    })

    it('should report dependencies entry pointing to the project itself', async ({ expect }) => {
      await using t = await workspace({
        'consumer': {
          name: 'consumer',
          dependencies: { self: '../consumer' },
          model: `
            import c1 from 'self'
            specification {
              element component
            }
            model {
              component c1
            }
          `,
        },
      })
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toMatchObject([
        { severity: 1, message: 'Imported project cannot be the same as the current project' },
      ])
      expect(diagnostics).toHaveLength(1)
    })
  })
})
