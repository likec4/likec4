import type { LayoutedView, ViewId } from '@likec4/core'
import { UriUtils } from 'langium'
import { vol } from 'memfs'
import stripIndent from 'strip-indent'
import { type ExpectStatic, describe, it, vi } from 'vitest'
import { URI } from 'vscode-uri'
import { WithFileSystem, WithLikeC4ManualLayouts } from '../filesystem'
import type { ChangeView } from '../protocol'
import { createTestServices } from '../test'

vi.mock('node:fs')
vi.mock('node:fs/promises')

let seq = 0
async function testDoc(expect: ExpectStatic, document: string) {
  const workspacePath = URI.file('/test/workspace/src' + ++seq)
  const documentUri = UriUtils.joinPath(workspacePath, 'test.c4')

  vol.mkdirSync(workspacePath.fsPath, { recursive: true })
  vol.writeFileSync(documentUri.fsPath, stripIndent(document).trimEnd(), { encoding: 'utf-8' })

  const { initialize, services } = createTestServices({
    workspace: workspacePath.toString(),
    context: {
      ...WithFileSystem(),
    },
  })

  const fs = services.shared.workspace.FileSystemProvider
  vi.spyOn(fs, 'readDirectory').mockResolvedValue([{
    isDirectory: false,
    isFile: true,
    uri: documentUri,
  }])
  vi.spyOn(fs, 'readFile').mockImplementation((uri) => vol.promises.readFile(uri.fsPath, 'utf-8') as any)
  vi.spyOn(fs, 'writeFile').mockImplementation(async (path, data) => {
    vol.writeFileSync(path.fsPath, data, { encoding: 'utf-8' })
  })

  await initialize()

  function readFromMemory() {
    const doc = services.shared.workspace.LangiumDocuments.getDocument(documentUri)
    return doc?.textDocument?.getText() ?? undefined
  }

  function readFromFS() {
    return vol.readFileSync(documentUri.fsPath, 'utf-8')
  }

  async function change(
    viewId: string,
    change: ChangeView.Params['change'] | {
      op: 'change-property'
      tags?: string[]
    },
  ) {
    await services.likec4.ModelChanges.applyChange({
      viewId: viewId as any,
      change: change as ChangeView.Params['change'],
    })
    return readFromMemory()
  }

  function read() {
    const memoryContent = readFromMemory()
    expect(memoryContent).toBeDefined()
    const fsContent = readFromFS()
    expect(fsContent).toBeDefined()
    expect(memoryContent, 'Memory and FS content should be equal').toEqual(fsContent)
    return memoryContent!
  }

  return { change, read, fs }
}

describe('viewChange', () => {
  describe('implicit views', () => {
    async function implicitViewTest(expect: ExpectStatic) {
      const test = createTestServices({
        projectConfig: { implicitViews: true },
        context: {
          ...WithFileSystem(),
          ...WithLikeC4ManualLayouts,
        },
      })
      const { errors } = await test.validate(`
        specification {
          element component
        }
        model {
          component sys1
        }
      `)
      expect(errors).toEqual([])
      return test
    }

    const implicitViewId = '__sys1' as ViewId
    const layout = {
      id: implicitViewId,
      _type: 'element',
      _stage: 'layouted',
      _layout: 'manual',
      title: 'sys1',
      description: null,
      hash: 'test-hash',
      autoLayout: { direction: 'TB' },
      nodes: [],
      edges: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 },
    } satisfies LayoutedView

    it('saves and resets manual layouts', async ({ expect }) => {
      const { services } = await implicitViewTest(expect)
      const manualLayouts = services.shared.workspace.ManualLayouts
      const location = {
        uri: 'file:///test/workspace/src/.likec4/__sys1.likec4.snap',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
      }
      const write = vi.spyOn(manualLayouts, 'write').mockResolvedValue(location)
      const remove = vi.spyOn(manualLayouts, 'remove').mockResolvedValue(location)

      await expect(services.likec4.ModelChanges.applyChange({
        viewId: implicitViewId,
        change: {
          op: 'save-view-snapshot',
          layout,
        },
      })).resolves.toEqual({ success: true, location })
      expect(write).toHaveBeenCalledOnce()

      await expect(services.likec4.ModelChanges.applyChange({
        viewId: implicitViewId,
        change: { op: 'reset-manual-layout' },
      })).resolves.toEqual({ success: true, location })
      expect(remove).toHaveBeenCalledOnce()
    })

    it('rejects layouts for unknown views', async ({ expect }) => {
      const { services } = await implicitViewTest(expect)
      const write = vi.spyOn(services.shared.workspace.ManualLayouts, 'write')

      const result = await services.likec4.ModelChanges.applyChange({
        viewId: '__unknown' as ViewId,
        change: {
          op: 'save-view-snapshot',
          layout: { ...layout, id: '__unknown' as ViewId },
        },
      })

      expect(result.success).toBe(false)
      expect(write).not.toHaveBeenCalled()
    })

    it('continues to reject source edits', async ({ expect }) => {
      const { services } = await implicitViewTest(expect)

      const result = await services.likec4.ModelChanges.applyChange({
        viewId: implicitViewId,
        change: {
          op: 'change-autolayout',
          layout: { direction: 'LR' },
        },
      })

      expect(result.success).toBe(false)
    })
  })

  describe('change-property', () => {
    it('should update view title', async ({ expect }) => {
      const { change, read } = await testDoc(
        expect,
        `
      views {
        view index {
          include *
        }
        view index2
      }`,
      )

      // Initial change - set title
      await change('index', {
        op: 'change-property',
        title: 'New Title',
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        views {
          view index {
            title 'New Title'
            include *
          }
          view index2
        }"
      `)

      // Second change - update title
      await change('index', {
        op: 'change-property',
        title: 'Updated Title',
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        views {
          view index {
            title 'Updated Title'
            include *
          }
          view index2
        }"
      `)
    })

    it('should update title and description', async ({ expect }) => {
      const { change, read } = await testDoc(
        expect,
        `
          views {
            view index {
              include *
            }
          }
      `,
      )

      // Initial change - set title and description
      await change('index', {
        op: 'change-property',
        title: 'New Title',
        description: { md: 'New Description' },
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        views {
          view index {
            title 'New Title'
            description '''
              New Description
            '''
            include *
          }
        }"
      `)
    })

    it('should update description only', async ({ expect }) => {
      const { change, read } = await testDoc(
        expect,
        `
          views {
            view index {
              include *
            }
          }
      `,
      )

      await change('index', {
        op: 'change-property',
        description: { md: 'Some Description' },
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        views {
          view index {
            description '''
              Some Description
            '''
            include *
          }
        }"
      `)

      // Update existing description
      await change('index', {
        op: 'change-property',
        description: { md: 'Updated Description' },
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        views {
          view index {
            description '''
              Updated Description
            '''
            include *
          }
        }"
      `)
    })

    it('should insert description after existing title', async ({ expect }) => {
      const { change, read } = await testDoc(
        expect,
        `
          views {
            view index {
              title 'Existing Title'
              include *
            }
          }
      `,
      )

      await change('index', {
        op: 'change-property',
        description: { md: 'New Description' },
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        views {
          view index {
            title 'Existing Title'
            description '''
              New Description
            '''
            include *
          }
        }"
      `)
    })

    it('should insert title before existing description', async ({ expect }) => {
      const { change, read } = await testDoc(
        expect,
        `
          views {
            view index {
              description 'Existing Description'
              include *
            }
          }
      `,
      )

      await change('index', {
        op: 'change-property',
        title: 'New Title',
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        views {
          view index {
            title 'New Title'
            description 'Existing Description'
            include *
          }
        }"
      `)
    })

    it('should set title on view with empty body', async ({ expect }) => {
      const { change, read } = await testDoc(
        expect,
        `
          views {
            view index { }
          }
      `,
      )

      await change('index', {
        op: 'change-property',
        title: 'New Title',
      })
      // Formatter will take care of spacing - we just check that the title is there
      expect(read()).toMatchInlineSnapshot(`
        "
        views {
          view index {
            title 'New Title' }
        }"
      `)
    })

    it('should set title on view with empty body', async ({ expect }) => {
      const { change, read } = await testDoc(
        expect,
        `
          views {
            view index { }
          }
      `,
      )

      await change('index', {
        op: 'change-property',
        title: 'Folder / New Title',
      })
      // Formatter will take care of spacing - we just check that the title is there
      expect(read()).toMatchInlineSnapshot(`
        "
        views {
          view index {
            title 'Folder / New Title' }
        }"
      `)
    })

    it('should stay in folder', async ({ expect }) => {
      const { change, read } = await testDoc(
        expect,
        `
          views "Root / A" {
            view index {
              include *
            }
          }
        `,
      )

      await change('index', {
        op: 'change-property',
        title: 'Root/ A     / New Title',
      })
      expect(read(), 'truncate common path (and normalize)').toMatchInlineSnapshot(`
        "
        views "Root / A" {
          view index {
            title 'New Title'
            include *
          }
        }"
      `)

      await change('index', {
        op: 'change-property',
        title: 'New Title',
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        views "Root / A" {
          view index {
            title 'New Title'
            include *
          }
        }"
      `)

      await change('index', {
        op: 'change-property',
        title: 'Root/ B/ New',
      })
      expect(read(), 'should not fail, only truncate common path').toMatchInlineSnapshot(`
        "
        views "Root / A" {
          view index {
            title 'B / New'
            include *
          }
        }"
      `)
    })

    it('should add tag to view with existing tags', async ({ expect }) => {
      const { change, read } = await testDoc(
        expect,
        `
          specification {
            tag existing1
            tag existing2
            tag existing3
            tag newtag
          }
          views {
            view index {
              #existing1, #existing2 #existing3
              include *
            }
          }
        `,
      )

      await change('index', {
        op: 'change-property',
        tags: ['existing1', 'existing2', 'existing3', 'newtag'],
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        specification {
          tag existing1
          tag existing2
          tag existing3
          tag newtag
        }
        views {
          view index {
            #existing1 #existing2 #existing3 #newtag
            include *
          }
        }"
      `)
    })

    it('should remove tag from view with multiple tags', async ({ expect }) => {
      const { change, read } = await testDoc(
        expect,
        `
          specification {
            tag first
            tag second
          }
          views {
            view index {
              #first, #second
              include *
            }
            view index2 {
              #first #second
              include *
            }
          }
        `,
      )

      await change('index', {
        op: 'change-property',
        tags: ['second'],
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        specification {
          tag first
          tag second
        }
        views {
          view index {
            #second
            include *
          }
          view index2 {
            #first #second
            include *
          }
        }"
      `)
      // Now update index2
      await change('index2', {
        op: 'change-property',
        tags: ['second'],
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        specification {
          tag first
          tag second
        }
        views {
          view index {
            #second
            include *
          }
          view index2 {
            #second
            include *
          }
        }"
      `)
    })

    it('should remove the only tag from view', async ({ expect }) => {
      const { change, read } = await testDoc(
        expect,
        `
          specification {
            tag lonely
          }
          views {
            view index1 {
              #lonely
              include *
            }
            view index2 {

                #lonely
              include *
            }
          }
        `,
      )
      await change('index1', {
        op: 'change-property',
        tags: [],
      })
      await change('index2', {
        op: 'change-property',
        tags: [],
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        specification {
          tag lonely
        }
        views {
          view index1 {
            include *
          }
          view index2 {
            include *
          }
        }"
      `)
    })

    it('should remove middle tag from mixed space-comma group', async ({ expect }) => {
      const { change, read } = await testDoc(
        expect,
        `
          specification {
            tag a
            tag b
            tag c
          }
          views {
            view index {
              #a #b, #c
              include *
            }
          }
        `,
      )

      // Replace tags with #a and #c (removing #b)
      await change('index', {
        op: 'change-property',
        tags: ['a', 'c'],
      })
      expect(read()).toMatchInlineSnapshot(`
        "
        specification {
          tag a
          tag b
          tag c
        }
        views {
          view index {
            #a #c
            include *
          }
        }"
      `)
    })
  })
})
