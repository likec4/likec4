import { UriUtils } from 'langium'
import { vol } from 'memfs'
import stripIndent from 'strip-indent'
import { type ExpectStatic, afterAll, describe, it, vi } from 'vitest'
import { URI } from 'vscode-uri'
import { WithFileSystem } from '../filesystem'
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

  async function change(params: ChangeView.Params) {
    await services.likec4.ModelChanges.applyChange(params)
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
  describe('change-property', () => {
    it('should update view title', async ({ expect }) => {
      const { change, read, fs } = await testDoc(
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
      await change({
        viewId: 'index' as any,
        change: {
          op: 'change-property',
          title: 'New Title',
        },
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
      await change({
        viewId: 'index' as any,
        change: {
          op: 'change-property',
          title: 'Updated Title',
        },
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
      await change({
        viewId: 'index' as any,
        change: {
          op: 'change-property',
          title: 'New Title',
          description: { md: 'New Description' },
        },
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

      await change({
        viewId: 'index' as any,
        change: {
          op: 'change-property',
          description: { md: 'Some Description' },
        },
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
      await change({
        viewId: 'index' as any,
        change: {
          op: 'change-property',
          description: { md: 'Updated Description' },
        },
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

      await change({
        viewId: 'index' as any,
        change: {
          op: 'change-property',
          description: { md: 'New Description' },
        },
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

      await change({
        viewId: 'index' as any,
        change: {
          op: 'change-property',
          title: 'New Title',
        },
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

      await change({
        viewId: 'index' as any,
        change: {
          op: 'change-property',
          title: 'New Title',
        },
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
  })
})
