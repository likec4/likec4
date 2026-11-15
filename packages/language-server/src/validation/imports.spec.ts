import type { ProjectId } from '@likec4/core/types'
import { URI } from 'langium'
import { describe, it, vi } from 'vitest'
import { gitDependencyWorkspace, installed, notInstalled, unsupported } from '../lsp/_git-dependencies-spec'
import { createMultiProjectTestServices, createTestServices } from '../test'
import { DependencyDiagnosticCodes } from './imports'

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

    it('should report dependencies entry named as the project itself', async ({ expect }) => {
      await using t = await workspace({
        'shared-folder': { name: 'shared', model: sharedModel },
        'consumer': {
          name: 'consumer',
          dependencies: { consumer: '../shared-folder' },
          model: `import c1 from 'consumer'`,
        },
      })
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toMatchObject([
        { severity: 1, message: 'Import name cannot be the same as the name of the current project' },
      ])
      expect(diagnostics).toHaveLength(1)
    })
  })

  describe('git dependencies', () => {
    it('reports not installed dependency', async ({ expect }) => {
      await using t = await gitDependencyWorkspace()
      t.setState(notInstalled('consumer'), true)
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toMatchObject([
        {
          severity: 1,
          code: DependencyDiagnosticCodes.NotInstalled,
          message: 'Dependency \'billing\' is not installed. Run the quick fix or `likec4 install`.',
          data: { projectId: 'consumer', name: 'billing' },
          range: { start: { line: 0, character: 15 } },
        },
      ])
      expect(diagnostics).toHaveLength(1)
    })

    it('reports unsupported dependency', async ({ expect }) => {
      await using t = await gitDependencyWorkspace()
      t.setState(unsupported('consumer'), true)
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toMatchObject([
        {
          severity: 1,
          code: DependencyDiagnosticCodes.Unsupported,
          message: expect.stringContaining(
            'Dependency \'billing\' cannot be loaded: remote dependencies are not supported',
          ),
        },
      ])
      expect(diagnostics).toHaveLength(1)
    })

    it('reports one warning with the number of files with parse errors', async ({ expect }) => {
      await using t = await gitDependencyWorkspace()
      t.setState(installed('consumer', 'billing', 2), true)
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toMatchObject([
        {
          severity: 2,
          code: DependencyDiagnosticCodes.ParseErrors,
          message: expect.stringContaining('Dependency \'billing\' has 2 files with parse errors'),
        },
      ])
      expect(diagnostics).toHaveLength(1)
    })

    it('reports nothing for installed dependency without parse errors', async ({ expect }) => {
      await using t = await gitDependencyWorkspace()
      t.setState(installed('consumer'), true)
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toEqual([])
    })

    it('reports nothing for names that are not git dependencies', async ({ expect }) => {
      await using t = await gitDependencyWorkspace()
      // a git dependency of another consumer, with the same name
      t.setState(notInstalled('billing'), true)
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toEqual([])
    })

    // Step 2: the name of a git dependency that is not installed does not resolve (no instance),
    // so imported names get linking errors in addition to the dependency diagnostic (stubs are step 3).
    // The generic "Imported project not found" is not added.
    it.for(
      [
        ['not installed', notInstalled('consumer'), DependencyDiagnosticCodes.NotInstalled],
        ['unsupported', unsupported('consumer'), DependencyDiagnosticCodes.Unsupported],
      ] as const,
    )('reports %s dependency once when the name does not resolve', async ([_, state, code], { expect }) => {
      await using t = await gitDependencyWorkspace({
        provider: false,
        consumerModel: `import { c1, c2 } from 'billing'`,
      })
      t.setState(state, true)
      const { diagnostics } = await t.validateAll()
      expect(diagnostics.filter(d => d.code === code)).toHaveLength(1)
      expect(diagnostics.map(d => d.message)).not.toContain('Imported project not found')
      // One linking error per imported name
      expect(diagnostics.filter(d => d.code !== code).map(d => d.message).sort()).toEqual([
        `Could not resolve reference to Element named 'c1'.`,
        `Could not resolve reference to Element named 'c2'.`,
      ])
    })

    it('revalidates consumer documents when states change', async ({ expect }) => {
      await using t = await gitDependencyWorkspace()
      t.setState(notInstalled('consumer'), true)
      const { diagnostics } = await t.validateAll()
      expect(diagnostics.map(d => d.code)).toEqual([DependencyDiagnosticCodes.NotInstalled])

      t.setState(installed('consumer', 'billing', 1))
      await vi.waitFor(() => {
        expect(t.consumer.diagnostics?.map(d => d.code)).toEqual([DependencyDiagnosticCodes.ParseErrors])
      })
      expect(t.consumer.diagnostics?.[0]?.message).toContain('has 1 file with parse errors')

      t.setState(installed('consumer'))
      await vi.waitFor(() => {
        expect(t.consumer.diagnostics).toEqual([])
      })
    })

    it('does not revalidate when states of the consumer did not change', async ({ expect }) => {
      await using t = await gitDependencyWorkspace()
      t.setState(notInstalled('consumer'), true)
      await t.validateAll()
      const diagnostics = t.consumer.diagnostics
      expect(diagnostics?.map(d => d.code)).toEqual([DependencyDiagnosticCodes.NotInstalled])

      // The producer fires without a change (e.g. after every sync)
      t.fire({ consumers: ['consumer' as ProjectId] })
      await new Promise(resolve => setTimeout(resolve, 20))
      await t.services.shared.workspace.WorkspaceLock.read(() => undefined)
      // Same diagnostics: the document was not rebuilt
      expect(t.consumer.diagnostics).toBe(diagnostics)
    })
  })
})
