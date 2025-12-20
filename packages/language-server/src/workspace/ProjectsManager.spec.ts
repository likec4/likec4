import type { LikeC4ProjectJsonConfig } from '@likec4/config'
import type { ProjectId } from '@likec4/core'
import { describe, expect, it, vi } from 'vitest'
import { URI } from 'vscode-uri'
import { createMultiProjectTestServices } from '../test'
import { ProjectFolder } from './ProjectsManager'

const isWin = process.platform === 'win32'

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

      const project = await projectsManager.registerConfigFile(
        URI.parse('file:///test/workspace/src/test-project/.likec4rc'),
      )

      expect(projectsManager.all).toEqual(['test-project', 'default'])
      expect(project?.config).toEqual(config)
      expect(project?.folder).toBe('file:///test/workspace/src/test-project/')
    })

    it.runIf(!isWin)('should fail to load config file from node_modules', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'loadProjectConfig').mockRejectedValueOnce(new Error('should not be called'))

      await expect(
        projectsManager.registerConfigFile(
          URI.parse('file:///test/workspace/node_modules/test-project/.likec4rc'),
        ),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Path to /test/workspace/node_modules/test-project/.likec4rc is excluded by: **/node_modules/**]`,
      )
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
      await projectsManager.registerConfigFile(configFileUri)

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

    it.runIf(!isWin)('should fail to register project with empty name', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})

      const config = {
        name: '',
      }
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'loadProjectConfig').mockResolvedValue(config as any)

      const configFileUri = URI.parse('file:///test/workspace/src/test-project/.likec4rc')
      await expect(projectsManager.registerConfigFile(configFileUri)).rejects.toThrowErrorMatchingInlineSnapshot(
        `
        [Error: Failed to register project config /test/workspace/src/test-project/.likec4rc:
        Config validation failed:
        ✖ Project name cannot be empty
          → at name]
      `,
      )
    })

    it.runIf(!isWin)('should fail to register project with default name', async ({ expect }) => {
      const { projectsManager, services } = await createMultiProjectTestServices({})

      const config = {
        name: 'default',
      }
      const fs = services.shared.workspace.FileSystemProvider
      vi.spyOn(fs, 'loadProjectConfig').mockResolvedValue(config as any)

      const configFileUri = URI.parse('file:///test/workspace/src/test-project/.likec4rc')
      await expect(projectsManager.registerConfigFile(configFileUri)).rejects.toThrowErrorMatchingInlineSnapshot(
        `
        [Error: Failed to register project config /test/workspace/src/test-project/.likec4rc:
        Config validation failed:
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

    it.runIf(process.platform !== 'win32')(
      'should fail to register project with name containing "."',
      async ({ expect }) => {
        const { projectsManager, services } = await createMultiProjectTestServices({})

        const config = {
          name: 'one.two',
        }
        const fs = services.shared.workspace.FileSystemProvider
        vi.spyOn(fs, 'loadProjectConfig').mockResolvedValue(config as any)

        const configFileUri = URI.parse('file:///test/workspace/src/test-project/.likec4rc')
        await expect(projectsManager.registerConfigFile(configFileUri)).rejects.toThrowErrorMatchingInlineSnapshot(
          `
        [Error: Failed to register project config /test/workspace/src/test-project/.likec4rc:
        Config validation failed:
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
      },
    )

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

  describe('exclude paths', () => {
    it('should exclude paths', async ({ expect }) => {
      const { projectsManager, services, addDocument } = await createMultiProjectTestServices({})

      // Project A excludes the 'excluded' folder
      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: ['excluded'],
        },
        folderUri: URI.file('/test/workspace/src/projectA'),
      })

      // Add a document in projectA's folder
      const specDoc = await addDocument('projectA/specification.c4', 'specification { element component }')
      const modelDoc = await addDocument('projectA/models/model.c4', 'model { component c1 }')
      const excludedDoc = await addDocument('projectA/excluded/wrong.c4', 'model { component c2 }')

      // The excluded document should belong to projectB, not projectA
      expect(projectsManager.belongsTo(specDoc)).toBe('projectA')
      expect(projectsManager.belongsTo(modelDoc)).toBe('projectA')

      // The excluded document should belong to projectA, but be excluded
      expect(projectsManager.belongsTo(excludedDoc)).toBe('projectA')
      expect(projectsManager.isExcluded(excludedDoc)).toBe(true)

      // Check project documents
      const documents = services.shared.workspace.LangiumDocuments
      const projectADocs = documents.projectDocuments(projectA.id).toArray().map(d => d.uri.path)

      // ProjectA should not have the excluded document
      expect(projectADocs).toEqual([
        '/test/workspace/src/projectA/models/model.c4',
        '/test/workspace/src/projectA/specification.c4',
      ])
    })

    it('should exclude filename', async ({ expect }) => {
      const { projectsManager, services, addDocument } = await createMultiProjectTestServices({})

      // Project A excludes the 'excluded' folder
      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: ['**/wrong.c4'],
        },
        folderUri: URI.file('/test/workspace/src/projectA'),
      })

      // Add a document in projectA's folder
      const specDoc = await addDocument('projectA/specification.c4', 'specification { element component }')
      const excludedDoc1 = await addDocument('projectA/wrong.c4', 'model { component c2 }')
      const excludedDoc2 = await addDocument('projectA/nested/wrong.c4', 'model { component c2 }')

      // The excluded document should belong to projectB, not projectA
      expect(projectsManager.belongsTo(specDoc)).toBe('projectA')
      // The excluded document should belong to projectA, but be excluded
      expect(projectsManager.belongsTo(excludedDoc1)).toBe('projectA')
      expect(projectsManager.belongsTo(excludedDoc2)).toBe('projectA')
      expect(projectsManager.isExcluded(excludedDoc1)).toBe(true)
      expect(projectsManager.isExcluded(excludedDoc2)).toBe(true)

      // Check project documents
      const documents = services.shared.workspace.LangiumDocuments
      const projectADocs = documents.projectDocuments(projectA.id).toArray().map(d => d.uri.path)

      // ProjectA should not have the excluded document
      expect(projectADocs).toEqual([
        '/test/workspace/src/projectA/specification.c4',
      ])
    })

    it('should exclude paths without **/ prefix (issue fix)', async ({ expect }) => {
      const { projectsManager, services, addDocument } = await createMultiProjectTestServices({})

      // Test that exclude patterns work without the **/ prefix
      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: ['dist', 'build', 'temp'],
        },
        folderUri: URI.file('/test/workspace/src/projectA'),
      })

      // Add documents in various locations
      const specDoc = await addDocument('projectA/specification.c4', 'specification { element component }')
      const modelDoc = await addDocument('projectA/models/model.c4', 'model { component c1 }')
      const distDoc = await addDocument('projectA/dist/generated.c4', 'model { component c2 }')
      const buildDoc = await addDocument('projectA/build/output.c4', 'model { component c3 }')
      const nestedDistDoc = await addDocument('projectA/nested/dist/file.c4', 'model { component c4 }')
      const nestedBuildDoc = await addDocument('projectA/src/build/file.c4', 'model { component c5 }')
      const tempDoc = await addDocument('projectA/temp/file.c4', 'model { component c6 }')

      // Valid documents should not be excluded
      expect(projectsManager.belongsTo(specDoc)).toBe('projectA')
      expect(projectsManager.isExcluded(specDoc)).toBe(false)
      expect(projectsManager.belongsTo(modelDoc)).toBe('projectA')
      expect(projectsManager.isExcluded(modelDoc)).toBe(false)

      // Documents in excluded folders should be excluded
      expect(projectsManager.belongsTo(distDoc)).toBe('projectA')
      expect(projectsManager.isExcluded(distDoc)).toBe(true)
      expect(projectsManager.belongsTo(buildDoc)).toBe('projectA')
      expect(projectsManager.isExcluded(buildDoc)).toBe(true)
      expect(projectsManager.belongsTo(tempDoc)).toBe('projectA')
      expect(projectsManager.isExcluded(tempDoc)).toBe(true)

      // Nested excluded folders should also be excluded
      expect(projectsManager.belongsTo(nestedDistDoc)).toBe('projectA')
      expect(projectsManager.isExcluded(nestedDistDoc)).toBe(true)
      expect(projectsManager.belongsTo(nestedBuildDoc)).toBe('projectA')
      expect(projectsManager.isExcluded(nestedBuildDoc)).toBe(true)

      // Check project documents
      const documents = services.shared.workspace.LangiumDocuments
      const projectADocs = documents.projectDocuments(projectA.id).toArray().map(d => d.uri.path)

      // Only non-excluded documents should be in the project
      expect(projectADocs).toContain('/test/workspace/src/projectA/specification.c4')
      expect(projectADocs).toContain('/test/workspace/src/projectA/models/model.c4')
      expect(projectADocs).not.toContain('/test/workspace/src/projectA/dist/generated.c4')
      expect(projectADocs).not.toContain('/test/workspace/src/projectA/build/output.c4')
      expect(projectADocs).not.toContain('/test/workspace/src/projectA/temp/file.c4')
      expect(projectADocs).not.toContain('/test/workspace/src/projectA/nested/dist/file.c4')
      expect(projectADocs).not.toContain('/test/workspace/src/projectA/src/build/file.c4')
    })

    it('should handle mixed exclude patterns with and without **/', async ({ expect }) => {
      const { projectsManager, addDocument } = await createMultiProjectTestServices({})

      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: ['test-temp', '**/cache/**', 'node_modules'],
        },
        folderUri: URI.file('/test/workspace/src/projectA'),
      })

      const validDoc = await addDocument('projectA/src/model.c4', 'model { component c1 }')
      const tempDoc = await addDocument('projectA/test-temp/file.c4', 'model { component c2 }')
      const cacheDoc = await addDocument('projectA/deep/cache/file.c4', 'model { component c3 }')
      const nodeModulesDoc = await addDocument('projectA/node_modules/lib/file.c4', 'model { component c4 }')

      expect(projectsManager.isExcluded(validDoc)).toBe(false)
      expect(projectsManager.isExcluded(tempDoc)).toBe(true)
      expect(projectsManager.isExcluded(cacheDoc)).toBe(true)
      expect(projectsManager.isExcluded(nodeModulesDoc)).toBe(true)
    })

    it('should exclude with glob patterns', async ({ expect }) => {
      const { projectsManager, addDocument } = await createMultiProjectTestServices({})

      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: ['*.tmp.c4', 'test-*', '**/generated/**'],
        },
        folderUri: URI.file('/test/workspace/src/projectA'),
      })

      const validDoc = await addDocument('projectA/model.c4', 'model { component c1 }')
      const tmpDoc = await addDocument('projectA/draft.tmp.c4', 'model { component c2 }')
      const testDoc = await addDocument('projectA/test-something/file.c4', 'model { component c3 }')
      const generatedDoc = await addDocument('projectA/src/generated/types.c4', 'model { component c4 }')

      expect(projectsManager.isExcluded(validDoc)).toBe(false)
      expect(projectsManager.isExcluded(tmpDoc)).toBe(true)
      expect(projectsManager.isExcluded(testDoc)).toBe(true)
      expect(projectsManager.isExcluded(generatedDoc)).toBe(true)
    })

    it('should handle relative paths in exclude patterns', async ({ expect }) => {
      const { projectsManager, addDocument } = await createMultiProjectTestServices({})

      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: ['./dist', 'src/temp', '../excluded'],
        },
        folderUri: URI.file('/test/workspace/src/projectA'),
      })

      const validDoc = await addDocument('projectA/model.c4', 'model { component c1 }')
      const distDoc = await addDocument('projectA/dist/file.c4', 'model { component c2 }')
      const tempDoc = await addDocument('projectA/src/temp/file.c4', 'model { component c3 }')

      expect(projectsManager.isExcluded(validDoc)).toBe(false)
      expect(projectsManager.isExcluded(distDoc)).toBe(true)
      expect(projectsManager.isExcluded(tempDoc)).toBe(true)
    })

    it('should properly exclude deeply nested paths', async ({ expect }) => {
      const { projectsManager, addDocument } = await createMultiProjectTestServices({})

      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: ['.git', '.vscode', 'coverage'],
        },
        folderUri: URI.file('/test/workspace/src/projectA'),
      })

      const validDoc = await addDocument('projectA/deep/nested/model.c4', 'model { component c1 }')
      const gitDoc = await addDocument('projectA/.git/config.c4', 'model { component c2 }')
      const vscodeDoc = await addDocument('projectA/sub/.vscode/settings.c4', 'model { component c3 }')
      const coverageDoc = await addDocument('projectA/tests/coverage/report.c4', 'model { component c4 }')
      const deepCoverageDoc = await addDocument('projectA/a/b/c/coverage/file.c4', 'model { component c5 }')

      expect(projectsManager.isExcluded(validDoc)).toBe(false)
      expect(projectsManager.isExcluded(gitDoc)).toBe(true)
      expect(projectsManager.isExcluded(vscodeDoc)).toBe(true)
      expect(projectsManager.isExcluded(coverageDoc)).toBe(true)
      expect(projectsManager.isExcluded(deepCoverageDoc)).toBe(true)
    })

    it('should cache exclusion results per document', async ({ expect }) => {
      const { projectsManager, addDocument } = await createMultiProjectTestServices({})

      await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: ['temp'],
        },
        folderUri: URI.file('/test/workspace/src/projectA'),
      })

      const doc = await addDocument('projectA/temp/file.c4', 'model { component c1 }')

      // First call should compute and cache
      const result1 = projectsManager.isExcluded(doc)
      expect(result1).toBe(true)

      // Second call should use cached result
      const result2 = projectsManager.isExcluded(doc)
      expect(result2).toBe(true)

      // Both should be identical
      expect(result1).toBe(result2)
    })

    it('should handle edge case: empty exclude array', async ({ expect }) => {
      const { projectsManager, addDocument } = await createMultiProjectTestServices({})

      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: [],
        },
        folderUri: URI.file('/test/workspace/src/projectA'),
      })

      const doc1 = await addDocument('projectA/model.c4', 'model { component c1 }')
      const doc2 = await addDocument('projectA/node_modules/lib.c4', 'model { component c2 }')

      // With empty exclude, nothing should be excluded
      expect(projectsManager.isExcluded(doc1)).toBe(false)
      expect(projectsManager.isExcluded(doc2)).toBe(false)
    })

    it('should handle complex glob patterns', async ({ expect }) => {
      const { projectsManager, addDocument } = await createMultiProjectTestServices({})

      await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: ['**/*.backup.c4', '**/test/**/*.spec.c4', 'vendor/**/lib'],
        },
        folderUri: URI.file('/test/workspace/src/projectA'),
      })

      const validDoc = await addDocument('projectA/model.c4', 'model { component c1 }')
      const backupDoc = await addDocument('projectA/models/old.backup.c4', 'model { component c2 }')
      const specDoc = await addDocument('projectA/src/test/unit/login.spec.c4', 'model { component c3 }')
      const vendorDoc = await addDocument('projectA/vendor/acme/lib/core.c4', 'model { component c4 }')

      expect(projectsManager.isExcluded(validDoc)).toBe(false)
      expect(projectsManager.isExcluded(backupDoc)).toBe(true)
      expect(projectsManager.isExcluded(specDoc)).toBe(true)
      expect(projectsManager.isExcluded(vendorDoc)).toBe(true)
    })

    it('should exclude node_modules by default', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      const testdata = {
        'file:///test/workspace/doc.likec4': false,
        '/test/workspace/doc.likec4': false,
        'file:///test/workspace/node_modules/doc.likec4': true,
        '/test/workspace/node_modules/doc.likec4': true,
        'file:///node_modules/deep/doc.likec4': true,
      }

      Object.entries(testdata).forEach(([path, expected]) => {
        expect(projectsManager.isExcluded(path), `path: ${path} expected: ${expected}`).toEqual(expected)
      })
    })

    it('should exclude node_modules if configured', async ({ expect }) => {
      const { projectsManager: pm } = await createMultiProjectTestServices({})

      await pm.registerProject({
        config: {
          name: 'projectA',
          exclude: ['node_modules'],
        },
        folderUri: URI.file('/test/workspace/projectA'),
      })

      const testdata = {
        'file:///test/workspace/projectA/doc.likec4': false,
        '/test/workspace/projectA/doc.likec4': false,
        'file:///test/workspace/projectA/node_modules/doc.likec4': true,
        '/test/workspace/projectA/nested/node_modules/doc.likec4': true,
      }

      Object.entries(testdata).forEach(([path, expected]) => {
        expect(pm.isExcluded(path), `path: ${path}`).toBe(expected)
      })
    })
  })

  describe('include paths', () => {
    it('should resolve include paths relative to project folder', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      const config = {
        name: 'test-project',
        include: { paths: ['../shared', '../common/specs'] },
      }
      const folderUri = URI.parse('file:///test/workspace/src/test-project')

      await projectsManager.registerProject({
        config,
        folderUri,
      })

      const project = projectsManager.getProject('test-project' as ProjectId)
      expect(project.includePaths).toBeDefined()
      expect(project.includePaths).toHaveLength(2)
      expect(project.includePaths![0]!.toString()).toBe('file:///test/workspace/src/shared')
      expect(project.includePaths![1]!.toString()).toBe('file:///test/workspace/src/common/specs')
    })

    it('should match documents from include paths to the correct project', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      // Register two projects so that unmatched docs go to 'default' instead of the only project
      await projectsManager.registerProject({
        config: {
          name: 'proj-include-test',
          include: { paths: ['../shared-include-test'] },
        },
        folderUri: URI.parse('file:///test/include-test/src/proj-include-test'),
      })

      await projectsManager.registerProject({
        config: { name: 'other-project' },
        folderUri: URI.parse('file:///test/include-test/src/other-project'),
      })

      // Document in project folder
      expect(projectsManager.belongsTo('file:///test/include-test/src/proj-include-test/model.c4')).toBe(
        'proj-include-test',
      )

      // Document in include path
      expect(projectsManager.belongsTo('file:///test/include-test/src/shared-include-test/common.c4')).toBe(
        'proj-include-test',
      )

      // Document in nested include path folder
      expect(projectsManager.belongsTo('file:///test/include-test/src/shared-include-test/nested/deep.c4')).toBe(
        'proj-include-test',
      )

      // Document outside both project and include paths goes to default
      expect(projectsManager.belongsTo('file:///test/include-test/src/unrelated/file.c4')).toBe('default')
    })

    it('should return undefined includePaths when not configured', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      await projectsManager.registerProject({
        config: { name: 'no-includes' },
        folderUri: URI.parse('file:///test/workspace/src/no-includes'),
      })

      const project = projectsManager.getProject('no-includes' as ProjectId)
      expect(project.includePaths).toBeUndefined()
    })

    it('should reject empty includePaths array', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      await expect(
        projectsManager.registerProject({
          config: {
            name: 'empty-includes',
            include: { paths: [] },
          },
          folderUri: URI.parse('file:///test/workspace/src/empty-includes'),
        }),
      ).rejects.toThrow('Include paths cannot be empty')
    })

    it('getAllIncludePaths should return all configured include paths', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      await projectsManager.registerProject({
        config: {
          name: 'project1',
          include: { paths: ['../shared1'] },
        },
        folderUri: URI.parse('file:///test/workspace/src/project1'),
      })

      await projectsManager.registerProject({
        config: {
          name: 'project2',
          include: { paths: ['../shared2', '../common'] },
        },
        folderUri: URI.parse('file:///test/workspace/src/project2'),
      })

      await projectsManager.registerProject({
        config: { name: 'project3' }, // No includes
        folderUri: URI.parse('file:///test/workspace/src/project3'),
      })

      const allIncludes = projectsManager.getAllIncludePaths()
      expect(allIncludes).toHaveLength(3)

      expect(allIncludes).toContainEqual({
        projectId: 'project1',
        includePath: expect.objectContaining({
          path: '/test/workspace/src/shared1',
        }),
        includeConfig: expect.objectContaining({
          paths: ['../shared1'],
        }),
      })
      expect(allIncludes).toContainEqual({
        projectId: 'project2',
        includePath: expect.objectContaining({
          path: '/test/workspace/src/shared2',
        }),
        includeConfig: expect.objectContaining({
          paths: ['../shared2', '../common'],
        }),
      })
      expect(allIncludes).toContainEqual({
        projectId: 'project2',
        includePath: expect.objectContaining({
          path: '/test/workspace/src/common',
        }),
        includeConfig: expect.objectContaining({
          paths: ['../shared2', '../common'],
        }),
      })
    })

    it('should prioritize project folder over include paths when matching documents', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      // project2 includes project1's folder as an include path
      await projectsManager.registerProject({
        config: { name: 'project1' },
        folderUri: URI.parse('file:///test/workspace/src/project1'),
      })

      await projectsManager.registerProject({
        config: {
          name: 'project2',
          include: { paths: ['../project1'] }, // Overlaps with project1's folder
        },
        folderUri: URI.parse('file:///test/workspace/src/project2'),
      })

      // Documents in project1 folder should belong to project1, not project2
      // (project folder takes precedence)
      expect(projectsManager.belongsTo('file:///test/workspace/src/project1/model.c4')).toBe('project1')
    })

    it('should handle multiple projects sharing the same include path', async ({ expect }) => {
      const { projectsManager, services, addDocument } = await createMultiProjectTestServices({})

      // Both projects include the same shared directory
      const project1 = await projectsManager.registerProject({
        config: {
          name: 'a-project1',
          include: { paths: ['../shared'] },
        },
        folderUri: URI.parse('file:///test/workspace/src/a-project1'),
      })

      const project2 = await projectsManager.registerProject({
        config: {
          name: 'a-project2',
          include: { paths: ['../shared'] },
        },
        folderUri: URI.parse('file:///test/workspace/src/a-project2'),
      })

      const sharedDoc = await addDocument('shared/common.c4', 'specification { element component }')
      const project1Doc = await addDocument('a-project1/model.c4', 'model { component c1 }')
      const project2Doc = await addDocument('a-project2/model.c4', 'model { component c2 }')

      expect(projectsManager.belongsTo(project1Doc)).toBe('a-project1')
      expect(projectsManager.belongsTo(project2Doc)).toBe('a-project2')
      // Shared document should belong to the first project
      expect(projectsManager.belongsTo(sharedDoc)).toBe('a-project1')

      // Both projects should be able to access documents from the shared folder
      // when collecting their project documents
      const documents = services.shared.workspace.LangiumDocuments
      const project1Docs = documents.projectDocuments(project1.id).toArray().map(d => d.uri.path)
      const project2Docs = documents.projectDocuments(project2.id).toArray().map(d => d.uri.path)

      expect(project1Docs).toEqual([
        '/test/workspace/src/a-project1/model.c4',
        '/test/workspace/src/shared/common.c4',
      ])
      expect(project2Docs).toEqual([
        '/test/workspace/src/a-project2/model.c4',
        '/test/workspace/src/shared/common.c4',
      ])
    })

    it('should update include paths when project is reloaded with different config', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      const folderUri = URI.parse('file:///test/workspace/src/project1')

      // Initial registration with include paths
      await projectsManager.registerProject({
        config: {
          name: 'project1',
          include: { paths: ['../shared1', '../shared2'] },
        },
        folderUri,
      })

      let project = projectsManager.getProject('project1' as ProjectId)
      expect(project.includePaths).toHaveLength(2)

      // Reload with different include paths
      await projectsManager.registerProject({
        config: {
          name: 'project3',
          include: { paths: ['../new-shared'] },
        },
        folderUri,
      })

      project = projectsManager.getProject('project3' as ProjectId)
      expect(project.includePaths).toHaveLength(1)
      expect(project.includePaths![0]!.toString()).toBe('file:///test/workspace/src/new-shared')
    })

    it('should remove include paths when project is reloaded without includes', async ({ expect }) => {
      const { projectsManager } = await createMultiProjectTestServices({})

      const folderUri = URI.parse('file:///test/workspace/src/project1')

      // Initial registration with include paths
      await projectsManager.registerProject({
        config: {
          name: 'project1',
          include: { paths: ['../shared'] },
        },
        folderUri,
      })

      let project = projectsManager.getProject('project1' as ProjectId)
      expect(project.includePaths).toHaveLength(1)

      // Reload without include paths
      await projectsManager.registerProject({
        config: { name: 'project1' },
        folderUri,
      })

      project = projectsManager.getProject('project1' as ProjectId)
      expect(project.includePaths).toBeUndefined()
    })

    it('should handle document excluded by one project but included by another', async ({ expect }) => {
      const { projectsManager, services, addDocument } = await createMultiProjectTestServices({})

      // Project A excludes the 'excluded' folder
      const projectA = await projectsManager.registerProject({
        config: {
          name: 'projectA',
          exclude: ['excluded/'],
        },
        folderUri: URI.parse('file:///test/workspace/src/projectA'),
      })

      // Project B includes the excluded folder from projectA
      const projectB = await projectsManager.registerProject({
        config: {
          name: 'projectB',
          include: { paths: ['../projectA/excluded'] },
        },
        folderUri: URI.parse('file:///test/workspace/src/projectB'),
      })

      // Add a document in projectA's excluded folder
      const excludedDoc = await addDocument('projectA/excluded/model.c4', 'model { component c1 }')
      const projectADoc = await addDocument('projectA/specification.c4', 'specification { element component }')
      const projectBDoc = await addDocument('projectB/specification.c4', 'specification { element component }')

      // The excluded document should belong to projectB, not projectA
      expect(projectsManager.belongsTo(projectADoc)).toBe('projectA')
      expect(projectsManager.belongsTo(projectBDoc)).toBe('projectB')
      // The excluded document should belong to projectA, but be excluded
      expect(projectsManager.belongsTo(excludedDoc)).toBe('projectA')
      expect(projectsManager.isExcluded(excludedDoc)).toBe(true)

      // Check project documents
      const documents = services.shared.workspace.LangiumDocuments
      const projectADocs = documents.projectDocuments(projectA.id).toArray().map(d => d.uri.path)
      const projectBDocs = documents.projectDocuments(projectB.id).toArray().map(d => d.uri.path)

      // ProjectA should not have the excluded document
      expect(projectADocs).toEqual([
        '/test/workspace/src/projectA/specification.c4',
      ])

      // ProjectB should have both its own document and the excluded document from projectA
      expect(projectBDocs).toEqual([
        '/test/workspace/src/projectA/excluded/model.c4',
        '/test/workspace/src/projectB/specification.c4',
      ])
    })
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

    it.todo('should exclude node_modules', async ({ expect }) => {
      const { projectsManager: pm } = await createMultiProjectTestServices({})

      await pm.registerProject({
        config: {
          name: 'test1',
          exclude: ['node_modules'],
        },
        folderUri: 'c:\\my\\files',
      })
      expect(pm.isExcluded('c:\\my\\files\\doc.likec4')).toEqual(false)
      expect(pm.isExcluded('c:\\my\\files\\node_modules\\doc.likec4')).toEqual(true)
      expect(pm.isExcluded('c:\\my\\files\\nested\\node_modules\\doc.likec4')).toEqual(true)
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
