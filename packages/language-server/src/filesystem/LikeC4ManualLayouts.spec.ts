import type { DiagramNode, Fqn, LayoutedView, NodeId, ViewId } from '@likec4/core'
import { defu } from 'defu'
import type { OverrideProperties, Writable } from 'type-fest'
import { describe, it, vi } from 'vitest'
import { FileChangeType } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import { createTestServices as createTestServicesBase } from '../test'
import { WithLikeC4ManualLayouts } from './LikeC4ManualLayouts'
import { NoopFileSystemProvider } from './noop'
import type { FileSystemProvider, ManualLayoutUpdateListener } from './types'

// Helper to create services with mocked file system
async function createTestServices() {
  // Standalone provider: spies on it do not retain the services graph (vitest keeps mocks for the whole worker)
  const fs: FileSystemProvider = new NoopFileSystemProvider()
  vi.spyOn(fs, 'scanDirectory')
  vi.spyOn(fs, 'readFile')
  vi.spyOn(fs, 'writeFile')
  vi.spyOn(fs, 'deleteFile')

  const t = createTestServicesBase({
    context: {
      ...WithLikeC4ManualLayouts,
      fileSystemProvider: () => fs,
    },
  })
  await t.initialize()

  const projectData = await t.services.shared.workspace.ProjectsManager.registerProject({
    config: { name: 'test-project' },
    folderUri: URI.file('/test/workspace/src/test-project'),
  })

  const project = t.services.shared.workspace.ProjectsManager.getProject(projectData.id)

  const manualLayouts = t.services.shared.workspace.ManualLayouts
  return {
    services: t.services,
    fs,
    project,
    manualLayouts,
    [Symbol.asyncDispose]: async () => {
      await t[Symbol.asyncDispose]()
    },
  }
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

describe('LikeC4ManualLayouts', () => {
  describe('read', () => {
    it('should read manual layouts from snapshot files', async ({ expect }) => {
      await using t = await createTestServices()

      const mockView1 = createMockView({
        id: 'view1',
        title: 'View 1',
      })

      const mockView2 = createMockView({
        id: 'view2',
        title: 'View 2',
      })

      mockFsReads(t.fs, mockView1, mockView2)

      const result = await t.manualLayouts.read(t.project)

      expect(result).not.toBeNull()
      expect(result).toMatchObject({
        hash: expect.any(String),
        views: {
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
        },
      })

      // Verify that the views were read only once due to caching
      await expect(t.manualLayouts.read(t.project)).resolves.toBe(result)
      expect(t.fs.scanDirectory).toHaveBeenCalledTimes(1)
    })

    it('should return null when no snapshot files exist', async ({ expect }) => {
      await using t = await createTestServices()

      vi.mocked(t.fs.scanDirectory).mockResolvedValue([])

      const result = await t.manualLayouts.read(t.project)

      expect(result).toBeNull()

      // second read to verify caching
      await expect(t.manualLayouts.read(t.project)).resolves.toBeNull()
      expect(t.fs.scanDirectory).toHaveBeenCalledTimes(1)
    })

    it('should handle errors when reading snapshot files', async ({ expect }) => {
      await using t = await createTestServices()

      vi.mocked(t.fs.scanDirectory).mockResolvedValue([
        {
          uri: URI.file('/test/workspace/src/test-project/.likec4/view1.likec4.snap'),
          isFile: true,
          isDirectory: false,
        },
      ])

      vi.mocked(t.fs.readFile).mockRejectedValue(new Error('Failed to read file'))

      const result = await t.manualLayouts.read(t.project)

      expect(result).toBeNull()
    })

    it('should respect custom manualLayouts outDir config', async ({ expect }) => {
      await using t = await createTestServices()
      const projectsManager = t.services.shared.workspace.ProjectsManager

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

      vi.mocked(t.fs.scanDirectory).mockResolvedValue([])

      await t.manualLayouts.read(project)

      expect(t.fs.scanDirectory).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/test/workspace/src/test-project-2/custom-layouts',
        }),
        expect.any(Function),
      )
    })

    it('should cache results across multiple reads', async ({ expect }) => {
      await using t = await createTestServices()

      const mockView = createMockView({
        id: 'view1' as ViewId,
        title: 'View 1',
      })

      mockFsReads(t.fs, mockView)

      // First read
      const result1 = await t.manualLayouts.read(t.project)
      // Second read
      const result2 = await t.manualLayouts.read(t.project)

      // Should only scan once due to caching
      expect(t.fs.scanDirectory).toHaveBeenCalledTimes(1)
      expect(result1).toBe(result2)
    })
  })

  describe('write', () => {
    it('should write manual layout snapshot to file', async ({ expect }) => {
      await using t = await createTestServices()

      const layoutedView = createMockView({
        id: 'write-test',
      })

      vi.mocked(t.fs.writeFile).mockResolvedValue()

      const location = await t.manualLayouts.write(t.project, layoutedView)

      expect(t.fs.writeFile).toHaveBeenCalledTimes(1)
      expect(t.fs.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/test/workspace/src/test-project/.likec4/write-test.likec4.snap',
        }),
        expect.stringContaining('write-test'),
      )

      expect(location.uri).toBe('file:///test/workspace/src/test-project/.likec4/write-test.likec4.snap')
      expect(location.range).toBeDefined()
    })

    it('should omit manualLayout field when writing', async ({ expect }) => {
      await using t = await createTestServices()

      const layoutedView = {
        ...createMockView(),
        manualLayout: { some: 'data' }, // This should be omitted
      }

      vi.mocked(t.fs.writeFile).mockResolvedValue()

      await t.manualLayouts.write(t.project, layoutedView)

      const writtenContent = vi.mocked(t.fs.writeFile).mock.calls[0]?.[1]
      expect(writtenContent).not.toContain('manualLayout')
    })

    it('should respect custom manualLayouts outDir config when writing', async ({ expect }) => {
      await using t = await createTestServices()
      const projectsManager = t.services.shared.workspace.ProjectsManager

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

      vi.mocked(t.fs.writeFile).mockResolvedValue()

      await t.manualLayouts.write(project, layoutedView)

      expect(t.fs.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/test/workspace/src/test-project-2/custom-layouts/test-view.likec4.snap',
        }),
        expect.any(String),
      )
    })

    it('should update cache after writing', async ({ expect }) => {
      await using t = await createTestServices()

      // Prime the cache with initial view
      const existingView = createMockView({
        id: 'existing-view',
        title: 'Existing View',
        hash: 'hash0',
      })

      mockFsReads(t.fs, existingView)

      const result1 = await t.manualLayouts.read(t.project)

      expect(t.fs.scanDirectory).toHaveBeenCalledTimes(1)
      expect(t.fs.readFile).toHaveBeenCalledTimes(1)

      const layoutedView = createMockView({
        id: 'new-view',
        title: 'New View',
      })

      vi.mocked(t.fs.writeFile).mockResolvedValue()

      await t.manualLayouts.write(t.project, layoutedView)

      mockFsReads(t.fs, existingView, layoutedView)

      // Read again to verify cache was updated
      const result2 = await t.manualLayouts.read(t.project)

      expect(result2).not.toEqual(result1)

      expect(t.fs.scanDirectory).toHaveBeenCalledTimes(2)
      expect(t.fs.readFile).toHaveBeenCalledTimes(3)

      // expect(result).toHaveProperty('existing-view')
      // expect(result).toHaveProperty('new-view')
      // expect(result!['new-view' as ViewId]).toMatchObject({
      //   id: 'new-view',
      //   title: 'New View',
      // })
    })

    it('should handle write errors gracefully', async ({ expect }) => {
      await using t = await createTestServices()

      const layoutedView = createMockView()

      vi.mocked(t.fs.writeFile).mockRejectedValue(new Error('Failed to write file'))

      // Should not throw, but return a location
      const location = await t.manualLayouts.write(t.project, layoutedView)

      expect(location).toBeDefined()
      expect(location.uri).toBe('file:///test/workspace/src/test-project/.likec4/test-view.likec4.snap')
    })
  })

  describe('watched file changes', () => {
    it('should invalidate project when folder with snapshots is deleted', async ({ expect }) => {
      await using t = await createTestServices()
      mockFsReads(t.fs, createMockView({ id: 'view1' as ViewId }))
      const listener = vi.fn<ManualLayoutUpdateListener>()
      t.manualLayouts.onManualLayoutUpdate(listener)
      const handler = t.services.shared.lsp.DocumentUpdateHandler

      // Prime the cache
      await t.manualLayouts.read(t.project)
      expect(t.fs.scanDirectory).toHaveBeenCalledTimes(1)

      // Unrelated folder (and file) - cache is kept
      handler.didChangeWatchedFiles({
        changes: [
          { uri: URI.file('/test/workspace/src/test-project/model').toString(), type: FileChangeType.Deleted },
          { uri: URI.file('/test/workspace/src/test-project/a.c4').toString(), type: FileChangeType.Deleted },
        ],
      })
      await t.manualLayouts.read(t.project)
      expect(t.fs.scanDirectory).toHaveBeenCalledTimes(1)

      // Client sends single event for the deleted folder
      const folder = URI.file('/test/workspace/src/test-project/.likec4')
      handler.didChangeWatchedFiles({
        changes: [{ uri: folder.toString(), type: FileChangeType.Deleted }],
      })
      await vi.waitFor(() => {
        expect(listener).toHaveBeenCalledOnce()
      })
      const [event] = listener.mock.calls[0]!
      expect(event).toEqual({
        removed: expect.anything(),
        projectId: t.project.id,
      })
      expect('removed' in event && event.removed.toString()).toBe(folder.toString())
      await t.manualLayouts.read(t.project)
      expect(t.fs.scanDirectory).toHaveBeenCalledTimes(2)
    })
  })

  describe('clearCaches', () => {
    it('should clear all cached data', async ({ expect }) => {
      await using t = await createTestServices()

      const mockView = createMockView({
        id: 'view1' as ViewId,
        title: 'View 1',
      })
      mockFsReads(t.fs, mockView)

      // Prime the cache
      await t.manualLayouts.read(t.project)
      const callCount1 = vi.mocked(t.fs.scanDirectory).mock.calls.length
      expect(callCount1).toBeGreaterThan(0)

      // Clear caches
      t.manualLayouts.clearCaches()

      // Read again - should call scanDirectory again
      await t.manualLayouts.read(t.project)
      const callCount2 = vi.mocked(t.fs.scanDirectory).mock.calls.length
      expect(callCount2).toBe(callCount1 * 2)
    })
  })

  describe('icon path handling', () => {
    it('should convert absolute icon paths to relative when writing', async ({ expect }) => {
      await using t = await createTestServices()

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

      vi.mocked(t.fs.writeFile).mockResolvedValue()

      await t.manualLayouts.write(t.project, layoutedView)

      const writtenContent = vi.mocked(t.fs.writeFile).mock.calls[0]?.[1]
      expect(writtenContent).not.toContain('file:///test/workspace/src/test-project/assets/icon.svg')
      expect(writtenContent).toContain('file://./assets/icon.svg')
      // Path outside project folder should remain absolute
      expect(writtenContent).toContain('file:///test/workspace/out-of-project/icon2.svg')
    })

    it('should convert relative icon paths back to absolute when reading', async ({ expect }) => {
      await using t = await createTestServices()

      const mockView = createMockView({
        nodes: [{
          icon: 'file://./assets/icon.svg',
        }, {
          icon: 'file://./dir1/dir2/icon2.svg',
        }],
      })

      mockFsReads(t.fs, mockView)

      const result = await t.manualLayouts.read(t.project)

      expect(result).not.toBeNull()
      const view = result!.views[mockView.id]!
      expect(view).toBeDefined()
      expect(view.nodes[0]?.icon).toBe('file:///test/workspace/src/test-project/assets/icon.svg')
      expect(view.nodes[1]?.icon).toBe('file:///test/workspace/src/test-project/dir1/dir2/icon2.svg')
    })

    it('should preserve non-file icon paths when writing', async ({ expect }) => {
      await using t = await createTestServices()

      const layoutedView = createMockView({
        nodes: [{
          id: 'node1',
          icon: 'aws:s3',
        }],
      })

      vi.mocked(t.fs.writeFile).mockResolvedValue()

      await t.manualLayouts.write(t.project, layoutedView)

      expect(t.fs.writeFile).toHaveBeenCalledTimes(1)
      const writtenContent = vi.mocked(t.fs.writeFile).mock.calls[0]?.[1]
      expect(writtenContent).toBeDefined()
      expect(writtenContent).toContain('aws:s3')
    })

    // TODO: fix test on Windows
    it.runIf(process.platform !== 'win32')('should not convert paths outside project folder', async ({ expect }) => {
      await using t = await createTestServices()
      const layoutedView = createMockView({
        nodes: [{
          id: 'node1',
          icon: 'file:///external/path/icon.svg',
        }],
      })

      vi.mocked(t.fs.writeFile).mockResolvedValue()

      await t.manualLayouts.write(t.project, layoutedView)

      const writtenContent = vi.mocked(t.fs.writeFile).mock.calls[0]?.[1]
      // Should keep absolute path since it's outside project folder
      expect(writtenContent).toContain('file:///external/path/icon.svg')
    })

    it('should handle multiple nodes with mixed icon types', async ({ expect }) => {
      await using t = await createTestServices()

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

      vi.mocked(t.fs.writeFile).mockResolvedValue()

      await t.manualLayouts.write(t.project, layoutedView)

      const writtenContent = vi.mocked(t.fs.writeFile).mock.calls[0]?.[1]
      expect(writtenContent).toContain('file://./assets/icon1.svg')
      expect(writtenContent).toContain('aws:lambda')
      expect(writtenContent).not.toContain('file:///test/workspace/src/test-project/assets/icon1.svg')
    })
  })
})
