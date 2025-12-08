import type { DiagramNode, Fqn, Icon, LayoutedView, NodeId, ViewId } from '@likec4/core'
import { defu } from 'defu'
import { UriUtils } from 'langium'
import type { OverrideProperties, PartialDeep, Writable, WritableDeep } from 'type-fest'
import { describe, it, vi } from 'vitest'
import { URI } from 'vscode-uri'
import { createLanguageServices } from '../module'
import { WithLikeC4ManualLayouts } from './LikeC4ManualLayouts'

describe.concurrent('LikeC4ManualLayouts', () => {
  // Helper to create services with mocked file system
  async function createTestServices() {
    const services = createLanguageServices(
      {
        ...WithLikeC4ManualLayouts,
      },
    ).likec4

    // Mock filesystem methods
    const fs = services.shared.workspace.FileSystemProvider
    vi.spyOn(fs, 'scanDirectory')
    vi.spyOn(fs, 'readFile')
    vi.spyOn(fs, 'writeFile')
    vi.spyOn(fs, 'deleteFile')

    const projectData = await services.shared.workspace.ProjectsManager.registerProject({
      config: { name: 'test-project' },
      folderUri: URI.file('/test/workspace/src/test-project'),
    })

    const project = services.shared.workspace.ProjectsManager.getProject(projectData.id)

    const manualLayouts = services.likec4.ManualLayouts
    return { services, fs, project, manualLayouts }
  }

  type PartialNode = Partial<
    OverrideProperties<Writable<DiagramNode>, {
      id?: string
      icon?: string
    }>
  >

  type PartialView = Partial<
    OverrideProperties<Writable<LayoutedView>, {
      id?: string
      nodes?: PartialNode[]
    }>
  >

  // Helper to create mock LayoutedView with base defaults
  function createMockView(overrides?: PartialView): LayoutedView {
    const base: LayoutedView = {
      id: 'test-view' as ViewId,
      _type: 'element' as const,
      _stage: 'layouted' as const,
      _layout: 'manual' as const,
      title: 'Test View',
      description: {
        md: 'This is a **test** view',
      },
      hash: 'hash1',
      autoLayout: { direction: 'TB' as const, nodeSep: 60, rankSep: 50 },
      nodes: [{
        id: 'node1' as NodeId,
        parent: null,
        title: 'Node 1',
        color: 'primary',
        shape: 'rectangle' as const,
        technology: null,
        description: null,
        links: null,
        tags: [],
        notation: null,
        level: 0,
        modelRef: 'element1' as Fqn,
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        labelBBox: { x: 100, y: 200, width: 150, height: 20 },
        kind: 'element' as const,
        children: [],
        inEdges: [],
        outEdges: [],
        style: {},
      }],
      edges: [],
      bounds: { x: 0, y: 0, width: 100, height: 100 },
    }
    return defu(overrides || {}, base) as LayoutedView
  }

  function mockFsReads(fs: Awaited<ReturnType<typeof createTestServices>>['fs'], ...views: LayoutedView[]) {
    vi.mocked(fs.scanDirectory).mockResolvedValue(
      views.map(view => ({
        uri: URI.file(`/test/workspace/src/test-project/.likec4/${view.id}.likec4.snap`),
        isFile: true,
        isDirectory: false,
      })),
    )
    vi.mocked(fs.readFile).mockImplementation(async (uri) => {
      const view = views.find(v => uri.fsPath.endsWith(`${v.id}.likec4.snap`))
      if (!view) {
        throw new Error(`File not found: ${uri.fsPath}`)
      }
      return JSON.stringify(view)
    })
  }

  describe('read', () => {
    it('should read manual layouts from snapshot files', async ({ expect }) => {
      const { fs, project, manualLayouts } = await createTestServices()

      const mockView1 = createMockView({
        id: 'view1',
        title: 'View 1',
      })

      const mockView2 = createMockView({
        id: 'view2',
        title: 'View 2',
      })

      mockFsReads(fs, mockView1, mockView2)

      const result = await manualLayouts.read(project)

      expect(result).not.toBeNull()
      expect(result).toMatchObject({
        'view1': {
          id: 'view1',
          title: 'View 1',
          _layout: 'manual',
        },
        'view2': {
          id: 'view2',
          title: 'View 2',
          _layout: 'manual',
        },
      })

      // Verify that the views were read only once due to caching
      await expect(manualLayouts.read(project)).resolves.toBe(result)
      expect(fs.scanDirectory).toHaveBeenCalledTimes(1)
    })

    it('should return null when no snapshot files exist', async ({ expect }) => {
      const { fs, project, manualLayouts } = await createTestServices()

      vi.mocked(fs.scanDirectory).mockResolvedValue([])

      const result = await manualLayouts.read(project)

      expect(result).toBeNull()

      // second read to verify caching
      await expect(manualLayouts.read(project)).resolves.toBeNull()
      expect(fs.scanDirectory).toHaveBeenCalledTimes(1)
    })

    it('should handle errors when reading snapshot files', async ({ expect }) => {
      const { services, fs, project, manualLayouts } = await createTestServices()

      vi.mocked(fs.scanDirectory).mockResolvedValue([
        {
          uri: URI.file('/test/workspace/src/test-project/.likec4/view1.likec4.snap'),
          isFile: true,
          isDirectory: false,
        },
      ])

      vi.mocked(fs.readFile).mockRejectedValue(new Error('Failed to read file'))

      const result = await manualLayouts.read(project)

      expect(result).toBeNull()
    })

    it('should respect custom manualLayouts outDir config', async ({ expect }) => {
      const { services, fs, manualLayouts } = await createTestServices()
      const projectsManager = services.shared.workspace.ProjectsManager

      const projectData = await projectsManager.registerProject({
        config: {
          name: 'test-project-2',
          manualLayouts: {
            outDir: 'custom-layouts',
          },
        },
        folderUri: URI.file('/test/workspace/src/test-project-2'),
      })

      const project = projectsManager.getProject(projectData.id)

      vi.mocked(fs.scanDirectory).mockResolvedValue([])

      await manualLayouts.read(project)

      expect(fs.scanDirectory).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/test/workspace/src/test-project-2/custom-layouts',
        }),
        expect.any(Function),
      )
    })

    it('should cache results across multiple reads', async ({ expect }) => {
      const { fs, project, manualLayouts } = await createTestServices()

      const mockView = createMockView({
        id: 'view1' as ViewId,
        title: 'View 1',
      })

      mockFsReads(fs, mockView)

      // First read
      const result1 = await manualLayouts.read(project)
      // Second read
      const result2 = await manualLayouts.read(project)

      // Should only scan once due to caching
      expect(fs.scanDirectory).toHaveBeenCalledTimes(1)
      expect(result1).toBe(result2)
    })
  })

  describe('write', () => {
    it('should write manual layout snapshot to file', async ({ expect }) => {
      const { fs, project, manualLayouts } = await createTestServices()

      const layoutedView = createMockView({
        id: 'write-test',
      })

      vi.mocked(fs.writeFile).mockResolvedValue()

      const location = await manualLayouts.write(project, layoutedView)

      expect(fs.writeFile).toHaveBeenCalledTimes(1)
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/test/workspace/src/test-project/.likec4/write-test.likec4.snap',
        }),
        expect.stringContaining('write-test'),
      )

      expect(location.uri).toBe('file:///test/workspace/src/test-project/.likec4/write-test.likec4.snap')
      expect(location.range).toBeDefined()
    })

    it('should omit manualLayout field when writing', async ({ expect }) => {
      const { fs, project, manualLayouts } = await createTestServices()

      const layoutedView = {
        ...createMockView(),
        manualLayout: { some: 'data' }, // This should be omitted
      }

      vi.mocked(fs.writeFile).mockResolvedValue()

      await manualLayouts.write(project, layoutedView)

      const writtenContent = vi.mocked(fs.writeFile).mock.calls[0]?.[1]
      expect(writtenContent).not.toContain('manualLayout')
    })

    it('should respect custom manualLayouts outDir config when writing', async ({ expect }) => {
      const { services, fs, manualLayouts } = await createTestServices()
      const projectsManager = services.shared.workspace.ProjectsManager

      const projectData = await projectsManager.registerProject({
        config: {
          name: 'test-project-2',
          manualLayouts: {
            outDir: 'custom-layouts',
          },
        },
        folderUri: URI.file('/test/workspace/src/test-project-2'),
      })

      const project = projectsManager.getProject(projectData.id)

      const layoutedView = createMockView()

      vi.mocked(fs.writeFile).mockResolvedValue()

      await manualLayouts.write(project, layoutedView)

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/test/workspace/src/test-project-2/custom-layouts/test-view.likec4.snap',
        }),
        expect.any(String),
      )
    })

    it('should update cache after writing', async ({ expect }) => {
      const { fs, project, manualLayouts } = await createTestServices()

      // Prime the cache with initial view
      const existingView = createMockView({
        id: 'existing-view',
        title: 'Existing View',
        hash: 'hash0',
      })

      mockFsReads(fs, existingView)

      await manualLayouts.read(project)

      expect(fs.scanDirectory).toHaveBeenCalledTimes(1)
      expect(fs.readFile).toHaveBeenCalledTimes(1)

      const layoutedView = createMockView({
        id: 'new-view',
        title: 'New View',
      })

      vi.mocked(fs.writeFile).mockResolvedValue()

      await manualLayouts.write(project, layoutedView)

      // Read again to verify cache was updated
      const result = await manualLayouts.read(project)

      // Should not call scanDirectory/readFile again due to cache
      expect(fs.scanDirectory).toHaveBeenCalledTimes(1)
      expect(fs.readFile).toHaveBeenCalledTimes(1)

      expect(result).not.toBeNull()
      expect(result).toHaveProperty('existing-view')
      expect(result).toHaveProperty('new-view')
      expect(result!['new-view' as ViewId]).toMatchObject({
        id: 'new-view',
        title: 'New View',
      })
    })

    it('should handle write errors gracefully', async ({ expect }) => {
      const { fs, manualLayouts, project } = await createTestServices()

      const layoutedView = createMockView()

      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Failed to write file'))

      // Should not throw, but return a location
      const location = await manualLayouts.write(project, layoutedView)

      expect(location).toBeDefined()
      expect(location.uri).toBe('file:///test/workspace/src/test-project/.likec4/test-view.likec4.snap')
    })
  })

  describe('clearCaches', () => {
    it('should clear all cached data', async ({ expect }) => {
      const { fs, manualLayouts, project } = await createTestServices()

      const mockView = createMockView({
        id: 'view1' as ViewId,
        title: 'View 1',
      })
      mockFsReads(fs, mockView)

      // Prime the cache
      await manualLayouts.read(project)
      const callCount1 = vi.mocked(fs.scanDirectory).mock.calls.length
      expect(callCount1).toBeGreaterThan(0)

      // Clear caches
      manualLayouts.clearCaches()

      // Read again - should call scanDirectory again
      await manualLayouts.read(project)
      const callCount2 = vi.mocked(fs.scanDirectory).mock.calls.length
      expect(callCount2).toBe(callCount1 * 2)
    })
  })

  describe('icon path handling', () => {
    it('should convert absolute icon paths to relative when writing', async ({ expect }) => {
      const { fs, manualLayouts, project } = await createTestServices()

      const layoutedView = createMockView({
        nodes: [
          {
            icon: 'file:///test/workspace/src/test-project/assets/icon.svg',
          },
          {
            icon: 'file:///test/workspace/out-of-project/icon2.svg',
          },
        ],
      })

      vi.mocked(fs.writeFile).mockResolvedValue()

      await manualLayouts.write(project, layoutedView)

      const writtenContent = vi.mocked(fs.writeFile).mock.calls[0]?.[1]
      expect(writtenContent).not.toContain('file:///test/workspace/src/test-project/assets/icon.svg')
      expect(writtenContent).toContain('file://./assets/icon.svg')
      // Path outside project folder should remain absolute
      expect(writtenContent).toContain('file:///test/workspace/out-of-project/icon2.svg')
    })

    it('should convert relative icon paths back to absolute when reading', async ({ expect }) => {
      const { fs, manualLayouts, project } = await createTestServices()

      const mockView = createMockView({
        nodes: [{
          icon: 'file://./assets/icon.svg',
        }, {
          icon: 'file://./dir1/dir2/icon2.svg',
        }],
      })

      mockFsReads(fs, mockView)

      const result = await manualLayouts.read(project)

      expect(result).not.toBeNull()
      const view = result![mockView.id]
      expect(view).toBeDefined()
      expect(view!.nodes[0]?.icon).toBe('file:///test/workspace/src/test-project/assets/icon.svg')
      expect(view!.nodes[1]?.icon).toBe('file:///test/workspace/src/test-project/dir1/dir2/icon2.svg')
    })

    it('should preserve non-file icon paths when writing', async ({ expect }) => {
      const { fs, manualLayouts, project } = await createTestServices()

      const layoutedView = createMockView({
        nodes: [{
          id: 'node1',
          icon: 'aws:s3',
        }],
      })

      vi.mocked(fs.writeFile).mockResolvedValue()

      await manualLayouts.write(project, layoutedView)

      expect(fs.writeFile).toHaveBeenCalledTimes(1)
      const writtenContent = vi.mocked(fs.writeFile).mock.calls[0]?.[1]
      expect(writtenContent).toBeDefined()
      expect(writtenContent).toContain('aws:s3')
    })

    // TODO: fix test on Windows
    it.runIf(process.platform !== 'win32')('should not convert paths outside project folder', async ({ expect }) => {
      const { fs, manualLayouts, project } = await createTestServices()
      const layoutedView = createMockView({
        nodes: [{
          id: 'node1',
          icon: 'file:///external/path/icon.svg',
        }],
      })

      vi.mocked(fs.writeFile).mockResolvedValue()

      await manualLayouts.write(project, layoutedView)

      const writtenContent = vi.mocked(fs.writeFile).mock.calls[0]?.[1]
      // Should keep absolute path since it's outside project folder
      expect(writtenContent).toContain('file:///external/path/icon.svg')
    })

    it('should handle multiple nodes with mixed icon types', async ({ expect }) => {
      const { fs, manualLayouts, project } = await createTestServices()

      const layoutedView = createMockView({
        nodes: [
          {
            id: 'node1',
            icon: 'file:///test/workspace/src/test-project/assets/icon1.svg',
          },
          {
            id: 'node2',
            icon: 'aws:lambda',
          },
          {
            id: 'node3',
          },
        ],
      })

      vi.mocked(fs.writeFile).mockResolvedValue()

      await manualLayouts.write(project, layoutedView)

      const writtenContent = vi.mocked(fs.writeFile).mock.calls[0]?.[1]
      expect(writtenContent).toContain('file://./assets/icon1.svg')
      expect(writtenContent).toContain('aws:lambda')
      expect(writtenContent).not.toContain('file:///test/workspace/src/test-project/assets/icon1.svg')
    })
  })
})
