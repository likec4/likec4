import type { NodeId, ProjectId, ViewId } from '@likec4/core'
import { URI } from 'langium'
import { describe, it } from 'vitest'
import { createMultiProjectTestServices, mockMethod } from '../../test'

describe('LikeC4ModelBuilder -- projects', () => {
  it('should assign default project data', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({
      project1: {
        'doc.c4': `
          specification {
            element component
          }
          model {
            component c1
          }
        `,
      },
    })
    const model = await t.buildLikeC4Model('project1')
    expect(model.$data.elements).toMatchObject({
      c1: {
        id: 'c1',
        kind: 'component',
      },
    })
    expect(model.projectId).toBe('project1')
    expect(model.project).toEqual({
      id: 'project1',
      title: 'project1',
    })
  })

  it('should assign project data from config', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({})

    await t.projectsManager.registerProject({
      config: {
        name: 'test-project',
        title: 'Test Project',
        manualLayouts: {
          outDir: '.likec4-layouts',
        },
      },
      folderUri: URI.parse('file:///test/workspace/src/test-project-1'),
    })

    await t.addDocument(
      'test-project-1/doc.c4',
      `
        specification {
          element component
        }
        model {
          component c1
        }
      `,
    )

    const model = await t.buildLikeC4Model('test-project')
    expect(model.$data.elements).toMatchObject({
      c1: {
        id: 'c1',
        kind: 'component',
      },
    })
    expect(model.projectId).toBe('test-project')
    expect(model.project).toEqual({
      id: 'test-project',
      title: 'Test Project',
      manualLayouts: {
        outDir: '.likec4-layouts',
      },
    })

    // test-project is the only project, so it should be the default
    const defaultModel = await t.buildLikeC4Model('default')
    expect(defaultModel.$data.elements).toMatchObject({
      c1: {
        id: 'c1',
        kind: 'component',
      },
    })
    expect(defaultModel.projectId).toBe('test-project')
    expect(defaultModel.project).toEqual({
      id: 'test-project',
      title: 'Test Project',
      manualLayouts: {
        outDir: '.likec4-layouts',
      },
    })
  })

  it('should rebuild model when project config changes', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({})
    const folderUri = URI.parse('file:///test/workspace/src/test-project-1')
    // Config change rebuilds project documents, they are re-read from the file system
    const langiumDocuments = t.services.shared.workspace.LangiumDocuments
    mockMethod(t.services.shared.workspace.FileSystemProvider, 'readFile').mockImplementation(async uri =>
      langiumDocuments.getDocument(uri)?.textDocument.getText() ?? ''
    )

    await t.projectsManager.registerProject({
      config: {
        name: 'test-project',
        title: 'Before',
      },
      folderUri,
    })
    await t.addDocument(
      'test-project-1/doc.c4',
      `
        specification {
          element component
        }
        model {
          component c1
        }
      `,
    )
    const before = await t.buildLikeC4Model('test-project')
    expect(before.project.title).toBe('Before')

    // Same documents, only config is changed
    await t.projectsManager.registerProject({
      config: {
        name: 'test-project',
        title: 'After',
        styles: {
          theme: {
            colors: {
              primary: '#ff0000',
            },
          },
        },
      },
      folderUri,
    })

    const after = await t.buildLikeC4Model('test-project')
    expect(after.project.title).toBe('After')
    expect(after.$data.project.styles?.theme?.colors?.['primary']).toMatchObject({
      elements: { fill: '#ff0000' },
    })
  })

  describe('dependencies', () => {
    const spec = `
      specification {
        element component
      }
    `
    const sharedModel = `
      ${spec}
      model {
        component svc {
          component api
        }
        component other
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

    it('resolves import name that differs from the project name', async ({ expect }) => {
      await using t = await workspace({
        'shared-folder': { name: 'shared', model: sharedModel },
        'consumer': {
          name: 'consumer',
          dependencies: { billing: '../shared-folder' },
          model: `
            import { svc } from 'billing'
            ${spec}
            model {
              component c
              c -> svc
            }
          `,
        },
      })
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toEqual([])

      const model = await t.buildLikeC4Model('consumer')
      expect(Object.keys(model.$data.imports)).toEqual(['billing'])
      expect(model.$data.imports['billing' as ProjectId]?.map(e => e.id)).toEqual(['svc', 'svc.api'])
      expect(model.$data.importedProjects).toEqual({
        billing: {
          name: 'shared',
          source: { kind: 'workspace', projectId: 'shared' },
        },
      })
      expect(model.findElement('@billing.svc')).not.toBeNull()
      expect(model.findElement('@shared.svc')).toBeNull()
      expect(Object.values(model.$data.relations)).toMatchObject([
        {
          source: { model: 'c' },
          target: { project: 'billing', model: 'svc' },
        },
      ])
    })

    it('prefers the dependencies entry over a workspace project with the same name', async ({ expect }) => {
      await using t = await workspace({
        'billing': {
          name: 'billing',
          model: `
            ${spec}
            model {
              component legacy
            }
          `,
        },
        'shared': { name: 'shared', model: sharedModel },
        'consumer': {
          name: 'consumer',
          dependencies: { billing: '../shared' },
          model: `
            import { svc } from 'billing'
            ${spec}
            model {
              component c
              c -> svc
            }
          `,
        },
      })
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toEqual([])

      const model = await t.buildLikeC4Model('consumer')
      expect(model.$data.imports['billing' as ProjectId]?.map(e => e.id)).toEqual(['svc', 'svc.api'])
      expect(model.$data.importedProjects?.['billing' as ProjectId]).toEqual({
        name: 'shared',
        source: { kind: 'workspace', projectId: 'shared' },
      })
      expect(model.findElement('@billing.svc')).not.toBeNull()
      expect(model.findElement('@billing.legacy')).toBeNull()
    })

    it('fills metadata for projects imported by name without dependencies entry', async ({ expect }) => {
      await using t = await workspace({
        'shared': { name: 'shared', model: sharedModel },
        'consumer': {
          name: 'consumer',
          model: `
            import { svc } from 'shared'
            ${spec}
            model {
              component c
              c -> svc
            }
          `,
        },
      })
      const model = await t.buildLikeC4Model('consumer')
      expect(Object.keys(model.$data.imports)).toEqual(['shared'])
      expect(model.$data.importedProjects).toEqual({
        shared: {
          name: 'shared',
          source: { kind: 'workspace', projectId: 'shared' },
        },
      })
    })

    it('resolves descendants of the imported element', async ({ expect }) => {
      await using t = await workspace({
        'shared-folder': { name: 'shared', model: sharedModel },
        'consumer': {
          name: 'consumer',
          dependencies: { billing: '../shared-folder' },
          model: `
            import { svc } from 'billing'
            ${spec}
            model {
              component c
              c -> svc.api
            }
            views {
              view index {
                include c, svc.api
              }
            }
          `,
        },
      })
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toEqual([])

      const model = await t.buildLikeC4Model('consumer')
      expect(model.findElement('@billing.svc.api')).not.toBeNull()
      const [relation] = Object.values(model.$data.relations)
      expect(relation).toMatchObject({
        source: { model: 'c' },
        target: { project: 'billing', model: 'svc.api' },
      })
      expect(model.view('index' as ViewId).node('@billing.svc.api' as NodeId)).toBeTruthy()
    })

    it('rebuilds the consumer model when the imported project changes', async ({ expect }) => {
      await using t = await workspace({
        'shared-folder': { name: 'shared', model: sharedModel },
        'consumer': {
          name: 'consumer',
          dependencies: { billing: '../shared-folder' },
          model: `
            import { svc } from 'billing'
            ${spec}
            model {
              component c
              c -> svc
            }
          `,
        },
      })
      const before = await t.buildLikeC4Model('consumer')
      expect(before.findElement('@billing.svc.child')).toBeNull()

      await t.addDocument(
        'shared-folder/extend.c4',
        `
        model {
          extend svc {
            component child
          }
        }
      `,
      )
      // only documents of the imported project are rebuilt
      await t.validateAll()

      const after = await t.buildLikeC4Model('consumer')
      expect(after).not.toBe(before)
      expect(after.findElement('@billing.svc.child')).not.toBeNull()
    })

    it('keeps own import name for each consumer of the same project', async ({ expect }) => {
      await using t = await workspace({
        'shared-folder': { name: 'shared', model: sharedModel },
        'consumer1': {
          name: 'consumer1',
          dependencies: { billing: '../shared-folder' },
          model: `
            import { svc } from 'billing'
            ${spec}
            model {
              component c1
              c1 -> svc
            }
          `,
        },
        'consumer2': {
          name: 'consumer2',
          dependencies: { payments: '../shared-folder' },
          model: `
            import { svc, other } from 'payments'
            ${spec}
            model {
              component c2
              c2 -> svc
              c2 -> other
            }
          `,
        },
      })
      const { diagnostics } = await t.validateAll()
      expect(diagnostics).toEqual([])

      const model1 = await t.buildLikeC4Model('consumer1')
      expect(Object.keys(model1.$data.imports)).toEqual(['billing'])
      expect(Object.keys(model1.$data.importedProjects ?? {})).toEqual(['billing'])
      expect(model1.findElement('@billing.svc')).not.toBeNull()
      expect(model1.findElement('@payments.svc')).toBeNull()

      const model2 = await t.buildLikeC4Model('consumer2')
      expect(Object.keys(model2.$data.imports)).toEqual(['payments'])
      expect(model2.$data.importedProjects).toEqual({
        payments: {
          name: 'shared',
          source: { kind: 'workspace', projectId: 'shared' },
        },
      })
      expect(model2.findElement('@payments.svc')).not.toBeNull()
      expect(model2.findElement('@payments.other')).not.toBeNull()
      expect(model2.findElement('@billing.svc')).toBeNull()
    })

    it('does not import dependencies entry named as the project itself', async ({ expect }) => {
      await using t = await workspace({
        'shared-folder': { name: 'shared', model: sharedModel },
        'consumer': {
          name: 'consumer',
          dependencies: { consumer: '../shared-folder' },
          model: `
            import { svc } from 'consumer'
            ${spec}
            model {
              component c
            }
          `,
        },
      })
      const model = await t.buildLikeC4Model('consumer')
      expect(model.$data.imports).toEqual({})
      expect(model.$data).not.toHaveProperty('importedProjects')
      expect(model.findElement('@consumer.svc')).toBeNull()
    })

    it('keeps previous behaviour of self-import by own name without dependencies', async ({ expect }) => {
      await using t = await workspace({
        'consumer': {
          name: 'consumer',
          model: `
            import { c } from 'consumer'
            ${spec}
            model {
              component c
            }
          `,
        },
      })
      const model = await t.buildLikeC4Model('consumer')
      // as before dependencies: own elements are imported under own name
      expect(model.$data.imports['consumer' as ProjectId]?.map(e => e.id)).toEqual(['c'])
    })

    it('omits importedProjects when nothing is imported', async ({ expect }) => {
      await using t = await workspace({
        'shared-folder': { name: 'shared', model: sharedModel },
        'consumer': {
          name: 'consumer',
          dependencies: { billing: '../shared-folder' },
          model: `
            import { unknown } from 'billing'
            ${spec}
            model {
              component c
            }
          `,
        },
      })
      const model = await t.buildLikeC4Model('consumer')
      expect(model.$data.imports).toEqual({})
      expect(model.$data).not.toHaveProperty('importedProjects')
    })

    it('rebuilds the consumer model when only metadata of the import changes', async ({ expect }) => {
      await using t = await workspace({
        'shared-folder': { name: 'shared', model: sharedModel },
        'consumer': {
          name: 'consumer',
          dependencies: { billing: '../shared-folder' },
          model: `
            import { svc } from 'billing'
            ${spec}
            model {
              component c
              c -> svc
            }
          `,
        },
      })
      const before = await t.buildLikeC4Model('consumer')
      expect(before.$data.importedProjects?.['billing' as ProjectId]?.name).toBe('shared')

      // Same target project, different metadata
      const resolver = t.services.shared.workspace.DependencyResolver
      const resolveWithMeta = resolver.resolveWithMeta.bind(resolver)
      mockMethod(resolver, 'resolveWithMeta', (consumer, name) => {
        const resolved = resolveWithMeta(consumer, name)
        return resolved && { ...resolved, meta: { ...resolved.meta, name: 'renamed' } }
      })
      // Rebuild consumer documents without changes, the hash of parsed documents stays the same
      const langiumDocuments = t.services.shared.workspace.LangiumDocuments
      mockMethod(t.services.shared.workspace.FileSystemProvider, 'readFile').mockImplementation(async uri =>
        langiumDocuments.getDocument(uri)?.textDocument.getText() ?? ''
      )
      const consumerDoc = langiumDocuments.all.find(d => d.uri.path.endsWith('/consumer/model.c4'))!
      await t.services.shared.workspace.DocumentBuilder.update([consumerDoc.uri], [])
      await t.validateAll()

      const after = await t.buildLikeC4Model('consumer')
      expect(after.$data.importedProjects?.['billing' as ProjectId]?.name).toBe('renamed')
    })
  })
})
