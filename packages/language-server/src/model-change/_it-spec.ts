import { UriUtils } from 'langium'
import { vol } from 'memfs'
import stripIndent from 'strip-indent'
import { test } from 'vitest'
import { URI } from 'vscode-uri'
import { WithFileSystem } from '../filesystem'
import type { ChangeView } from '../protocol'
import { createTestServices, mockMethod } from '../test'

let seq = 0

/**
 * Test with a `testDoc` fixture: writes the document to the in-memory file system (memfs)
 * and returns helpers to apply model changes and read the updated document.
 *
 * Specs using it must mock `node:fs` and `node:fs/promises` with `vi.mock`.
 */
export const it = test.extend('testDoc', ({ task }, { onCleanup }) => {
  const cleanup = [] as (() => Promise<void>)[]

  onCleanup(async () => {
    await Promise.allSettled(cleanup.map(fn => fn()))
    // The fixture value stays on the test context, release the services
    cleanup.length = 0
  })

  return async (document: string) => {
    const workspacePath = URI.file(`/test/workspace/model-change/src${++seq}`)
    vol.mkdirSync(workspacePath.fsPath, { recursive: true })
    const documentUri = UriUtils.joinPath(workspacePath, 'test.c4')

    vol.writeFileSync(documentUri.fsPath, stripIndent(document).trimEnd(), { encoding: 'utf-8' })

    const { initialize, services } = createTestServices({
      workspace: workspacePath.toString(),
      context: {
        ...WithFileSystem(),
      },
    })
    cleanup.push(() => services.likec4.LanguageServices.dispose())

    const workspace = services.shared.workspace
    const fs = workspace.FileSystemProvider

    mockMethod(fs, 'readDirectory').mockResolvedValue([{
      isDirectory: false,
      isFile: true,
      uri: documentUri,
    }])
    mockMethod(fs, 'readFile').mockImplementation(async uri => vol.readFileSync(uri.fsPath, 'utf-8').toString())
    mockMethod(fs, 'writeFile').mockImplementation(async (uri, content) => {
      vol.writeFileSync(uri.fsPath, content, { encoding: 'utf-8' })
    })

    await initialize()

    function read() {
      const document = workspace.LangiumDocuments.getDocument(documentUri)
      const memoryContent = document?.textDocument?.getText() ?? undefined
      task.context.expect(memoryContent).toBeDefined()
      const fsContent = vol.readFileSync(documentUri.fsPath, 'utf-8')
      task.context.expect(fsContent).toBeDefined()

      task.context.expect(memoryContent, 'Memory and FS content should be equal').toEqual(fsContent)

      return memoryContent!
    }

    async function change(params: ChangeView.Params) {
      const result = await services.likec4.ModelChanges.applyChange(params)
      task.context.expect(result.success).toBe(true)

      return read()
    }

    return { change, read }
  }
})
