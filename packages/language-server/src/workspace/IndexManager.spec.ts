import { describe, expect, it } from 'vitest'
import { URI } from 'vscode-uri'
import { createMultiProjectTestServices } from '../test'

describe.concurrent('IndexManager', () => {
  describe('projectElements', () => {
    it('should return elements that are included in the project', async ({ expect }) => {
      const { services, projectsManager } = await createMultiProjectTestServices({
        projectA: {
          spec: `
            specification {
              element component
            }
          `,
          model: `
            model {
              component sys1
              component sys2
            }
          `,
        },
        projectB: {
          spec: `
            specification {
              element component
            }
          `,
          model: `
            model {
              component sys3
            }
          `,
        },
      })

      await services.shared.workspace.DocumentBuilder.update(
        services.shared.workspace.LangiumDocuments.all.toArray().map(d => d.uri),
        [],
      )

      const indexManager = services.shared.workspace.IndexManager
      const projectAElements = indexManager.projectElements('projectA' as any).toArray()
      const projectBElements = indexManager.projectElements('projectB' as any).toArray()

      // projectA should have its own elements
      const projectAElementNames = projectAElements.map(e => e.name)
      expect(projectAElementNames).toContain('sys1')
      expect(projectAElementNames).toContain('sys2')
      expect(projectAElementNames).not.toContain('sys3')

      // projectB should have its own elements
      const projectBElementNames = projectBElements.map(e => e.name)
      expect(projectBElementNames).toContain('sys3')
      expect(projectBElementNames).not.toContain('sys1')
    })

    it('should include elements from included paths', async ({ expect }) => {
      const { services, addDocument, projectsManager } = await createMultiProjectTestServices({})

      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          include: { paths: ['../shared'] },
        },
        folderUri: URI.file('/test/workspace/projectA'),
      })

      await addDocument('projectA/spec.c4', 'specification { element component }')
      await addDocument('projectA/model.c4', 'model { component c1 }')
      await addDocument('shared/common.c4', 'model { component c2 }')

      await services.shared.workspace.DocumentBuilder.update(
        services.shared.workspace.LangiumDocuments.all.toArray().map(d => d.uri),
        [],
      )

      const indexManager = services.shared.workspace.IndexManager
      const projectAElements = indexManager.projectElements(projectA.id).toArray()

      const elementNames = projectAElements.map(e => e.name)
      expect(elementNames).toContain('c1')
      expect(elementNames).toContain('c2')
    })

    it('should exclude elements from excluded paths', async ({ expect }) => {
      const { services, addDocument, projectsManager } = await createMultiProjectTestServices({})

      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: ['temp'],
        },
        folderUri: URI.file('/test/workspace/projectA'),
      })

      await addDocument('projectA/spec.c4', 'specification { element component }')
      await addDocument('projectA/model.c4', 'model { component c1 }')
      await addDocument('projectA/temp/scratch.c4', 'model { component excluded }')

      await services.shared.workspace.DocumentBuilder.update(
        services.shared.workspace.LangiumDocuments.all.toArray().map(d => d.uri),
        [],
      )

      const indexManager = services.shared.workspace.IndexManager
      const projectAElements = indexManager.projectElements(projectA.id).toArray()

      const elementNames = projectAElements.map(e => e.name)
      expect(elementNames).toContain('c1')
      expect(elementNames).not.toContain('excluded')
    })

    it('should filter by node type when specified', async ({ expect }) => {
      const { services } = await createMultiProjectTestServices({
        projectA: {
          spec: `
            specification {
              element component
              tag important
            }
          `,
          model: `
            model {
              component sys1 #important
            }
          `,
        },
      })

      await services.shared.workspace.DocumentBuilder.update(
        services.shared.workspace.LangiumDocuments.all.toArray().map(d => d.uri),
        [],
      )

      const indexManager = services.shared.workspace.IndexManager
      
      // Get all elements
      const allElements = indexManager.projectElements('projectA' as any).toArray()
      expect(allElements.length).toBeGreaterThan(0)

      // Get only Element types
      const onlyElements = indexManager.projectElements('projectA' as any, 'Element').toArray()
      expect(onlyElements.length).toBeGreaterThan(0)
      expect(onlyElements.every(e => e.type === 'Element')).toBe(true)
    })

    it('should filter by URI set when specified', async ({ expect }) => {
      const { services, projects } = await createMultiProjectTestServices({
        projectA: {
          model1: 'specification { element component } model { component c1 }',
          model2: 'model { component c2 }',
        },
      })

      await services.shared.workspace.DocumentBuilder.update(
        services.shared.workspace.LangiumDocuments.all.toArray().map(d => d.uri),
        [],
      )

      const indexManager = services.shared.workspace.IndexManager
      const model1Uri = projects.projectA.model1.uri.toString()
      const uriSet = new Set([model1Uri])

      const filteredElements = indexManager.projectElements('projectA' as any, undefined, uriSet).toArray()

      // Should only include elements from model1
      const elementNames = filteredElements.map(e => e.name)
      expect(elementNames).toContain('c1')
      expect(elementNames).not.toContain('c2')
    })
  })
})