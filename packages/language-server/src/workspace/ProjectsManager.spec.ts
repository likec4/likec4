import type { LikeC4ProjectJsonConfig } from '@likec4/config'
import type { ProjectId } from '@likec4/core'
import { describe, expect, it, vi } from 'vitest'
import { URI } from 'vscode-uri'
import { createMultiProjectTestServices } from '../test'
import { ProjectFolder } from './ProjectsManager'

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

  describe('loadConfigFile', () => {
    it('should load config file', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})

      const config: LikeC4ProjectJsonConfig = {
        name: 'test-project',
        styles: {
          defaults: {
            color: 'red',
          },
        },
      }
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'loadProjectConfig').mockResolvedValue(config as any)

      const project = await projectsManager.loadConfigFile({
        isFile: true,
        isDirectory: false,
        uri: URI.parse('file:///test/workspace/src/test-project/.likec4rc'),
      })

      expect(projectsManager.all).toEqual(['test-project', 'default'])
      expect(project?.config).toEqual(config)
      expect(project?.folder).toBe('file:///test/workspace/src/test-project/')
    })

    it('should not load config file from node_modules', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'loadProjectConfig').mockRejectedValueOnce(new Error('should not be called'))

      const project = await projectsManager.loadConfigFile({
        isFile: true,
        isDirectory: false,
        uri: URI.parse('file:///test/workspace/node_modules/test-project/.likec4rc'),
      })

      expect(project).toBeUndefined()
    })
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
      expect(project.folderUri.toString()).toBe('file:///test/workspace/src/test-project/')
    })

    it('should register project with config file URI', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})

      const config = {
        name: 'test-project',
      }
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'loadProjectConfig').mockResolvedValue(config as any)

      const configFileUri = URI.parse('file:///test/workspace/src/test-project/.likec4rc')
      await projectsManager.registerProject(configFileUri)

      expect(projectsManager.all).toContain('test-project')
      const project = projectsManager.getProject('test-project' as ProjectId)
      expect(project.config).toEqual(config)
      expect(project.folderUri.toString()).toBe('file:///test/workspace/src/test-project/')
    })

    it('should update project with registered folder URI', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      const folderUri = URI.parse('file:///test/workspace/src/test-project')

      const project1 = await projectsManager.registerProject({
        config: {
          name: 'tst',
        },
        folderUri,
      })
      const project1Config = project1.config
      expect(project1Config).toEqual({
        name: 'tst',
      })
      expect(projectsManager.all).toEqual(['tst', 'default'])

      const project2 = await projectsManager.registerProject({
        config: {
          name: 'tst',
          title: 'Test Project',
        },
        folderUri,
      })
      // no new project registered
      expect(projectsManager.all).toEqual(['tst', 'default'])

      // same project instance
      expect(project2).toBe(project1)
      expect(project2.config).toBe(project1.config)
      // different config object
      expect(project2.config).not.toBe(project1Config)
      expect(project2.config).toEqual({
        name: 'tst',
        title: 'Test Project',
      })
    })

    it('should re-register project if name is changed', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      const folderUri = URI.parse('file:///test/workspace/src/test-project')

      const project1 = await projectsManager.registerProject({
        config: {
          name: 'tst',
        },
        folderUri,
      })
      const project1Config = project1.config
      expect(project1Config).toEqual({
        name: 'tst',
      })
      expect(projectsManager.all).toEqual(['tst', 'default'])

      const project2 = await projectsManager.registerProject({
        config: {
          name: 'tst2',
          title: 'Test Project',
        },
        folderUri,
      })
      // no new project registered
      expect(projectsManager.all).toEqual(['tst2', 'default'])

      // same project instance
      expect(project2).toBe(project1)
      expect(project2.config).toBe(project1.config)
      // different config object
      expect(project2.config).not.toBe(project1Config)
      expect(project2.config).toEqual({
        name: 'tst2',
        title: 'Test Project',
      })
    })

    it('should fail to register project with empty name', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})

      const config = {
        name: '',
      }
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'loadProjectConfig').mockResolvedValue(config as any)

      const configFileUri = URI.parse('file:///test/workspace/src/test-project/.likec4rc')
      await expect(projectsManager.registerProject(configFileUri)).rejects.toThrowErrorMatchingInlineSnapshot(
        `
        [Error: Config validation failed:
        ✖ Project name cannot be empty
          → at name]
      `,
      )
    })

    it('should fail to register project with default name', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})

      const config = {
        name: 'default',
      }
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'loadProjectConfig').mockResolvedValue(config as any)

      const configFileUri = URI.parse('file:///test/workspace/src/test-project/.likec4rc')
      await expect(projectsManager.registerProject(configFileUri)).rejects.toThrowErrorMatchingInlineSnapshot(
        `
        [Error: Config validation failed:
        ✖ Project name cannot be "default"
          → at name]
      `,
      )
      await expect(projectsManager.registerProject({ config, folderUri: configFileUri })).rejects
        .toThrowErrorMatchingInlineSnapshot(
          `
        [Error: Config validation failed:
        ✖ Project name cannot be "default"
          → at name]
      `,
        )
    })

    it('should fail to register project with name containing "."', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})

      const config = {
        name: 'one.two',
      }
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'loadProjectConfig').mockResolvedValue(config as any)

      const configFileUri = URI.parse('file:///test/workspace/src/test-project/.likec4rc')
      await expect(projectsManager.registerProject(configFileUri)).rejects.toThrowErrorMatchingInlineSnapshot(
        `
        [Error: Config validation failed:
        ✖ Project name cannot contain ".", "@" or "#", try to use A-z, 0-9, _ and -
          → at name]
      `,
      )
      await expect(projectsManager.registerProject({ config, folderUri: configFileUri })).rejects
        .toThrowErrorMatchingInlineSnapshot(
          `
        [Error: Config validation failed:
        ✖ Project name cannot contain ".", "@" or "#", try to use A-z, 0-9, _ and -
          → at name]
      `,
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

      expect(projectsManager.all).toEqual([
        'test-project',
        'test-project-1',
        'default',
      ])
    })
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
    expect(projectsManager.getProject('test-project' as ProjectId).folderUri.toString()).toBe(
      'file:///test/workspace/src/test-project-1/',
    )
    expect(projectsManager.getProject('test-project-1' as ProjectId).folderUri.toString()).toBe(
      'file:///test/workspace/src/test-project-2/',
    )
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

  describe('#defaultProjectId', () => {
    it('should return "default" when there are no projects', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})
      expect(projectsManager.defaultProjectId).toBe('default')
      expect(projectsManager.all).toEqual(['default'])
    })

    it('should return the only project id when exactly one project exists', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      await projectsManager.registerProject({
        config: { name: 'p1' },
        folderUri: URI.parse('file:///test/workspace/src/p1'),
      })

      expect(projectsManager.defaultProjectId).toBe('p1')
      expect(projectsManager.all).toEqual(['p1', 'default'])
    })

    it('should be undefined when multiple projects exist and no explicit default is set', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      await projectsManager.registerProject({
        config: { name: 'p1' },
        folderUri: URI.parse('file:///test/workspace/src/p1'),
      })
      await projectsManager.registerProject({
        config: { name: 'p2' },
        folderUri: URI.parse('file:///test/workspace/src/p2'),
      })

      expect(projectsManager.defaultProjectId).toBeUndefined()
      // "all" should include both projects and the global default
      expect(projectsManager.all).toEqual(['p1', 'p2', 'default'])
    })

    it('should allow setting explicit default project among multiple and make it first in all()', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      await projectsManager.registerProject({
        config: { name: 'p1' },
        folderUri: URI.parse('file:///test/workspace/src/p1'),
      })
      await projectsManager.registerProject({
        config: { name: 'p2' },
        folderUri: URI.parse('file:///test/workspace/src/p2'),
      })

      projectsManager.defaultProjectId = 'p2' as ProjectId

      expect(projectsManager.defaultProjectId).toBe('p2')
      expect(projectsManager.all).toEqual(['p2', 'p1', 'default'])
    })

    it('should reset explicit default when set to undefined or "default"', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      await projectsManager.registerProject({
        config: { name: 'p1' },
        folderUri: URI.parse('file:///test/workspace/src/p1'),
      })
      await projectsManager.registerProject({
        config: { name: 'p2' },
        folderUri: URI.parse('file:///test/workspace/src/p2'),
      })

      projectsManager.defaultProjectId = 'p1' as ProjectId
      expect(projectsManager.defaultProjectId).toBe('p1')

      // Reset via undefined
      projectsManager.defaultProjectId = undefined
      expect(projectsManager.defaultProjectId).toBeUndefined()

      // Set again and reset via "default"
      projectsManager.defaultProjectId = 'p2' as ProjectId
      expect(projectsManager.defaultProjectId).toBe('p2')
      projectsManager.defaultProjectId = 'default' as ProjectId
      expect(projectsManager.defaultProjectId).toBeUndefined()
    })

    it('setting explicit default to non-existing project should throw', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      await projectsManager.registerProject({
        config: { name: 'p1' },
        folderUri: URI.parse('file:///test/workspace/src/p1'),
      })

      expect(() => {
        projectsManager.defaultProjectId = 'unknown' as ProjectId
      }).toThrowError(/Project "unknown" not found/)
    })

    it('resetting explicit default in single-project workspace should fall back to that project', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      await projectsManager.registerProject({
        config: { name: 'solo' },
        folderUri: URI.parse('file:///test/workspace/src/solo'),
      })

      // Explicitly set and then reset
      projectsManager.defaultProjectId = 'solo' as ProjectId
      expect(projectsManager.defaultProjectId).toBe('solo')
      projectsManager.defaultProjectId = undefined
      // With one project, getter returns that id
      expect(projectsManager.defaultProjectId).toBe('solo')
    })
  })

  describe.runIf(process.platform === 'win32')('On Windows', () => {
    it('should handle folder URIs', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      const folderUri1 = 'c:\\my\\files'
      const folderUri2 = 'c:\\my\\files-ext'

      await projectsManager.registerProject({
        config: { name: 'test1' },
        folderUri: folderUri1,
      })
      await projectsManager.registerProject({
        config: { name: 'test2' },
        folderUri: folderUri2,
      })

      expect.soft(projectsManager.all).to.include.members(['test1', 'test2'])
      expect.soft(projectsManager.getProject('test1' as ProjectId).folderUri.toString()).toBe(
        'file:///c%3A/my/files/',
      )
      expect.soft(projectsManager.getProject('test2' as ProjectId).folderUri.toString()).toBe(
        'file:///c%3A/my/files-ext/',
      )
    })

    it('should exclude node_modules', async ({ expect }) => {
      const { projectsManager: pm } = await createMultiProjectTestServices({})

      await pm.registerProject({
        config: {
          name: 'test1',
          exclude: ['**/node_modules/**'],
        },
        folderUri: 'c:\\my\\files',
      })
      expect(pm.checkIfExcluded('c:\\my\\files\\doc.likec4')).toEqual(false)
      expect(pm.checkIfExcluded('c:\\my\\files\\node_modules\\doc.likec4')).toEqual(true)
    })

    it('should correctly return project for documents', async ({ expect }) => {
      const { projectsManager: pm } = await createMultiProjectTestServices({})

      const projects = [
        'project1',
        'project1\\sub1',
        'qwe',
        'qwe-qwe', // https://github.com/likec4/likec4/issues/2099
      ]
      for (const project of projects) {
        await pm.registerProject({
          config: { name: project },
          folderUri: `c:\\my\\files\\${project}`,
        })
      }

      expect(pm.belongsTo('file:///test/outside/doc.likec4')).toEqual('default')
      expect(pm.belongsTo('c:\\my\\files\\project1\\doc.likec4')).toEqual('project1')
      expect(pm.belongsTo('c:\\my\\files\\project1\\sub1\\doc.likec4')).toEqual('project1\\sub1')
      expect(pm.belongsTo('c:\\my\\files\\project1\\sub1\\f1\\doc.likec4')).toEqual('project1\\sub1')
      expect(pm.belongsTo('c:\\my\\files\\project1\\sub1-doc.likec4')).toEqual('project1')
      expect(pm.belongsTo('c:\\my\\files\\qwe\\doc.likec4')).toEqual('qwe')
      expect(pm.belongsTo('c:\\my\\files\\qwe-qwe\\doc.likec4')).toEqual('qwe-qwe')
    })
  })
})

describe('ProjectFolder', () => {
  it.each([
    ['file:///test/project1', 'file:///test/project1/'],
    ['/test/project1', 'file:///test/project1/'],
    ['file:///test/project1/', 'file:///test/project1/'],
    ['/test/project1/', 'file:///test/project1/'],
    ['file:///test/project1/sub1', 'file:///test/project1/sub1/'],
    ['file:///test/project1/sub1/', 'file:///test/project1/sub1/'],
    [URI.parse('file:///test/project1'), 'file:///test/project1/'],
    [URI.file('/test/project1'), 'file:///test/project1/'],
  ])('convert %s -> %s', (input, expected) => {
    expect(ProjectFolder(input)).toEqual(expected)
  })
})
