import { describe, expect, it } from 'vitest'
import { URI } from 'vscode-uri'
import { createMultiProjectTestServices } from '../test'

describe.concurrent('LangiumDocuments', () => {
  describe('projectDocuments', () => {
    it('should return documents that belong to the project', async ({ expect }) => {
      const { services, addDocument, projectsManager } = await createMultiProjectTestServices({})

      const projectA = await projectsManager.registerProject({
        config: { name: 'projectA' },
        folderUri: URI.file('/test/workspace/projectA'),
      })

      const doc1 = await addDocument('projectA/model1.c4', 'model { component c1 }')
      const doc2 = await addDocument('projectA/model2.c4', 'model { component c2 }')
      const doc3 = await addDocument('outside/model3.c4', 'model { component c3 }')

      const documents = services.shared.workspace.LangiumDocuments
      const projectADocs = documents.projectDocuments(projectA.id).toArray()

      expect(projectADocs).toHaveLength(2)
      expect(projectADocs.map(d => d.uri.path)).toEqual([
        '/test/workspace/projectA/model1.c4',
        '/test/workspace/projectA/model2.c4',
      ])
    })

    it('should include documents from included paths', async ({ expect }) => {
      const { services, addDocument, projectsManager } = await createMultiProjectTestServices({})

      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          include: { paths: ['../shared'] },
        },
        folderUri: URI.file('/test/workspace/projectA'),
      })

      const doc1 = await addDocument('projectA/model.c4', 'model { component c1 }')
      const doc2 = await addDocument('shared/common.c4', 'model { component c2 }')

      const documents = services.shared.workspace.LangiumDocuments
      const projectADocs = documents.projectDocuments(projectA.id).toArray()

      expect(projectADocs).toHaveLength(2)
      expect(projectADocs.map(d => d.uri.path)).toContain('/test/workspace/projectA/model.c4')
      expect(projectADocs.map(d => d.uri.path)).toContain('/test/workspace/shared/common.c4')
    })

    it('should exclude documents marked as excluded by the project', async ({ expect }) => {
      const { services, addDocument, projectsManager } = await createMultiProjectTestServices({})

      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: ['temp'],
        },
        folderUri: URI.file('/test/workspace/projectA'),
      })

      const doc1 = await addDocument('projectA/model.c4', 'model { component c1 }')
      const doc2 = await addDocument('projectA/temp/scratch.c4', 'model { component c2 }')

      const documents = services.shared.workspace.LangiumDocuments
      const projectADocs = documents.projectDocuments(projectA.id).toArray()

      expect(projectADocs).toHaveLength(1)
      expect(projectADocs[0]!.uri.path).toBe('/test/workspace/projectA/model.c4')
    })

    it('should not include builtin documents', async ({ expect }) => {
      const { services, addDocument, projectsManager } = await createMultiProjectTestServices({})

      const projectA = await projectsManager.registerProject({
        config: { name: 'projectA' },
        folderUri: URI.file('/test/workspace/projectA'),
      })

      await addDocument('projectA/model.c4', 'model { component c1 }')

      const documents = services.shared.workspace.LangiumDocuments
      const projectADocs = documents.projectDocuments(projectA.id).toArray()

      // Should not include builtin likec4lib documents
      projectADocs.forEach(doc => {
        expect(doc.uri.path).not.toContain('likec4lib')
      })
    })
  })

  describe('groupedByProject', () => {
    it('should group documents by their project IDs', async ({ expect }) => {
      const { services, projectsManager } = await createMultiProjectTestServices({
        projectA: {
          model1: 'model { component c1 }',
          model2: 'model { component c2 }',
        },
        projectB: {
          model3: 'model { component c3 }',
        },
      })

      const documents = services.shared.workspace.LangiumDocuments
      const grouped = documents.groupedByProject()

      expect(grouped).toHaveProperty('projectA')
      expect(grouped).toHaveProperty('projectB')
      expect(grouped.projectA).toHaveLength(2)
      expect(grouped.projectB).toHaveLength(1)
    })

    it('should only include projects that have documents', async ({ expect }) => {
      const { services, projectsManager } = await createMultiProjectTestServices({
        projectA: {
          model: 'model { component c1 }',
        },
      })

      // Register a project with no documents
      await projectsManager.registerProject({
        config: { name: 'emptyProject' },
        folderUri: URI.file('/test/workspace/emptyProject'),
      })

      const documents = services.shared.workspace.LangiumDocuments
      const grouped = documents.groupedByProject()

      expect(grouped).toHaveProperty('projectA')
      expect(grouped).not.toHaveProperty('emptyProject')
    })

    it('should respect project inclusion rules', async ({ expect }) => {
      const { services, addDocument, projectsManager } = await createMultiProjectTestServices({})

      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          include: { paths: ['../shared'] },
        },
        folderUri: URI.file('/test/workspace/projectA'),
      })

      const projectB = await projectsManager.registerProject({
        config: { name: 'projectB' },
        folderUri: URI.file('/test/workspace/projectB'),
      })

      await addDocument('projectA/model.c4', 'model { component c1 }')
      await addDocument('projectB/model.c4', 'model { component c2 }')
      await addDocument('shared/common.c4', 'model { component c3 }')

      const documents = services.shared.workspace.LangiumDocuments
      const grouped = documents.groupedByProject()

      // projectA should include both its own document and the shared document
      expect(grouped.projectA).toHaveLength(2)
      // projectB should only include its own document
      expect(grouped.projectB).toHaveLength(1)
    })
  })
})