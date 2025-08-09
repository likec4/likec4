import type { ProjectId } from '@likec4/core'
import { withProtocol } from 'ufo'
import { describe, it, vi } from 'vitest'
import { URI } from 'vscode-uri'
import { createMultiProjectTestServices } from '../test'

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
      const { projectsManager } = await createMultiProjectTestServices({})

      const config = {
        name: 'test-project',
      }
      const folderUri = URI.parse('file:///test/workspace/src/test-project')

      await projectsManager.registerProject({
        config,
        folderUri,
      })

      expect(projectsManager.all).toContain('test-project')
      const project = projectsManager.getProject('test-project' as ProjectId)
      expect(project.config).toEqual(config)
      expect(project.folder.toString()).toBe(folderUri.toString())
    })

    it('should register project with config file URI', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})

      const config = {
        name: 'test-project',
      }
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(config))

      const configFileUri = URI.parse('file:///test/workspace/src/test-project/.likec4rc')
      await projectsManager.registerProject(configFileUri)

      expect(projectsManager.all).toContain('test-project')
      const project = projectsManager.getProject('test-project' as ProjectId)
      expect(project.config).toEqual(config)
      expect(project.folder.toString()).toBe(URI.parse('file:///test/workspace/src/test-project').toString())
    })

    it('should fail to register project with empty name', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})

      const config = {
        name: '',
      }
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(config))

      const configFileUri = URI.parse('file:///test/workspace/src/test-project/.likec4rc')
      await expect(projectsManager.registerProject(configFileUri)).rejects.toThrowErrorMatchingInlineSnapshot(
        `[ValiError: Project name cannot be empty]`,
      )
    })

    it('should fail to register project with default name', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})

      const config = {
        name: 'default',
      }
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(config))

      const configFileUri = URI.parse('file:///test/workspace/src/test-project/.likec4rc')
      await expect(projectsManager.registerProject(configFileUri)).rejects.toThrowErrorMatchingInlineSnapshot(
        `[ValiError: Project name cannot be "default"]`,
      )
      await expect(projectsManager.registerProject({ config, folderUri: configFileUri })).rejects
        .toThrowErrorMatchingInlineSnapshot(
          `[ValiError: Project name cannot be "default"]`,
        )
    })

    it('should fail to register project with name containing "."', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})

      const config = {
        name: 'one.two',
      }
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(config))

      const configFileUri = URI.parse('file:///test/workspace/src/test-project/.likec4rc')
      await expect(projectsManager.registerProject(configFileUri)).rejects.toThrowErrorMatchingInlineSnapshot(
        `[ValiError: Project name cannot contain ".", try to use A-z, 0-9, _ and -]`,
      )
      await expect(projectsManager.registerProject({ config, folderUri: configFileUri })).rejects
        .toThrowErrorMatchingInlineSnapshot(
          `[ValiError: Project name cannot contain ".", try to use A-z, 0-9, _ and -]`,
        )
    })

    it('should handle duplicate project names by appending numbers', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      const config = {
        name: 'test-project',
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
      const { projectsManager } = await createMultiProjectTestServices({})

      const config = {
        name: 'test-project',
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

  it('should exclude node_modules', async ({ expect }) => {
    const { projectsManager } = await createMultiProjectTestServices({})

    expect(projectsManager.belongsTo('file:///test/workspace/doc.likec4')).toEqual('default')
    expect(projectsManager.checkIfExcluded(URI.parse('file:///test/workspace/doc.likec4'))).toEqual(false)
    expect(projectsManager.checkIfExcluded(
      URI.parse('file:///test/workspace/node_modules/doc.likec4'),
    )).toEqual(true)

    expect(projectsManager.checkIfExcluded(
      URI.parse('file:///test/workspace/node_modules/deep/doc.likec4'),
    )).toEqual(true)
  })

  it('should correctly return project for documents', async ({ expect }) => {
    const { projectsManager: pm } = await createMultiProjectTestServices({})

    const projects = [
      'project1',
      'project1/sub1',
      'qwe',
      'qwe-qwe', // https://github.com/likec4/likec4/issues/2099
    ]
    for (const project of projects) {
      await pm.registerProject({
        config: { name: project },
        folderUri: URI.parse(`file:///test/${project}`),
      })
    }

    expect(pm.belongsTo('file:///test/outside/doc.likec4')).toEqual('default')
    expect(pm.belongsTo('file:///test/project1/doc.likec4')).toEqual('project1')
    expect(pm.belongsTo('file:///test/project1/sub1/doc.likec4')).toEqual('project1/sub1')
    expect(pm.belongsTo('file:///test/project1/sub1/f1/doc.likec4')).toEqual('project1/sub1')
    expect(pm.belongsTo('file:///test/project1/sub1-doc.likec4')).toEqual('project1')
    expect(pm.belongsTo('file:///test/qwe/doc.likec4')).toEqual('qwe')
    expect(pm.belongsTo('file:///test/qwe-qwe/doc.likec4')).toEqual('qwe-qwe')
  })
})
