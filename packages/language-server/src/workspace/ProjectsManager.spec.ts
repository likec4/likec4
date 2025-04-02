import type { ProjectId } from '@likec4/core'
import { withProtocol } from 'ufo'
import { describe, it, vi } from 'vitest'
import { URI } from 'vscode-uri'
import { parseConfigJson } from '../config'
import { createMultiProjectTestServices } from '../test'

// Mock parseConfigJson
vi.mock('../config', () => ({
  parseConfigJson: vi.fn(),
}))

describe.concurrent('ProjectsManager', () => {
  it('should assign likec4ProjectId to docs', async ({ expect }) => {
    const { projects, addDocumentOutside, validateAll } = await createMultiProjectTestServices({
      project1: {
        'specs': `
          specification {
            element component
          }
          model {
            component c1
          }
        `,
        'model': `
          model {
            component c2
          }
        `,
      },
      project2: {
        'specs': `
          specification {
            element component
          }
          model {
            component c1
          }
        `,
      },
    })

    const { errors, warnings } = await validateAll()
    expect(errors).toHaveLength(0)
    expect(warnings).toHaveLength(0)

    expect(projects.project1.specs).toHaveProperty('likec4ProjectId', 'project1')
    expect(projects.project1.model).toHaveProperty('likec4ProjectId', 'project1')
    expect(projects.project2.specs).toHaveProperty('likec4ProjectId', 'project2')

    const outside = await addDocumentOutside('specification { element component }')
    expect(outside).not.toHaveProperty('likec4ProjectId')
    await validateAll()
    expect(outside).toHaveProperty('likec4ProjectId', 'default')
  })

  describe('registerProject', () => {
    it('should register project with URI and config', async ({ expect }) => {
      const { services } = await createMultiProjectTestServices({})
      const projectsManager = services.shared.workspace.ProjectsManager

      const config = {
        name: 'test-project',
        exclude: ['/node_modules/'],
      }
      const folderUri = URI.parse('file:///test/workspace/src/test-project')

      await projectsManager.registerProject({
        config,
        folderUri,
      })

      expect(projectsManager.all).toContain('test-project')
      const project = projectsManager.getProject('test-project')
      expect(project.config).toEqual(config)
      expect(project.folder.toString()).toBe(folderUri.toString())
    })

    it('should register project with config file URI', async ({ expect }) => {
      const { services } = await createMultiProjectTestServices({})
      const projects = services.shared.workspace.ProjectsManager

      const config = {
        name: 'test-project',
        exclude: ['/node_modules/'],
      }
      ;(parseConfigJson as any).mockReturnValue(config)
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'readFile').mockResolvedValue('')

      const configFileUri = URI.parse('file:///test/workspace/src/test-project/.likec4rc')
      await projects.registerProject(configFileUri)

      expect(projects.all).toContain('test-project')
      const project = projects.getProject('test-project' as ProjectId)
      expect(project.config).toEqual(config)
      expect(project.folder.toString()).toBe(URI.parse('file:///test/workspace/src/test-project').toString())
    })

    it('should handle duplicate project names by appending numbers', async ({ expect }) => {
      const { services } = await createMultiProjectTestServices({})
      const projectsManager = services.shared.workspace.ProjectsManager

      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'readFile').mockResolvedValue('')

      const config = {
        name: 'test-project',
        exclude: ['/node_modules/'],
      }
      const folderUri1 = URI.parse('file:///test/workspace/src/test-project-1')
      const folderUri2 = URI.parse('file:///test/workspace/src/test-project-2')

      await projectsManager.registerProject({
        config,
        folderUri: folderUri1,
      })
      await projectsManager.registerProject({
        config,
        folderUri: folderUri2,
      })

      expect(projectsManager.all).toContain('test-project')
      expect(projectsManager.all).toContain('test-project-1')
    })

    it('should handle folder URIs with and without protocol', async ({ expect }) => {
      const { services } = await createMultiProjectTestServices({})
      const projectsManager = services.shared.workspace.ProjectsManager

      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'readFile').mockResolvedValue('')

      const config = {
        name: 'test-project',
        exclude: ['/node_modules/'],
      }
      const folderUri1 = URI.parse('file:///test/workspace/src/test-project-1')
      const folderUri2 = '/test/workspace/src/test-project-2'

      await projectsManager.registerProject({
        config,
        folderUri: folderUri1,
      })
      await projectsManager.registerProject({
        config,
        folderUri: folderUri2,
      })

      expect(projectsManager.all).toContain('test-project')
      expect(projectsManager.all).toContain('test-project-1')
      expect(projectsManager.getProject('test-project' as ProjectId).folder.toString()).toBe(folderUri1.toString())
      expect(projectsManager.getProject('test-project-1' as ProjectId).folder.toString()).toBe(
        withProtocol(folderUri2, 'file://'),
      )
    })
  })
})
