import { type Fqn, type ViewId } from '@likec4/core'
import { UriUtils } from 'langium'
import { vol } from 'memfs'
import stripIndent from 'strip-indent'
import { describe, test, vi } from 'vitest'
import { URI } from 'vscode-uri'
import { WithFileSystem } from '../filesystem'
import type { ChangeView } from '../protocol'
import { createTestServices } from '../test'

vi.mock('node:fs')
vi.mock('node:fs/promises')
let seq = 0

export const it = test.extend('testDoc', ({ task }, { onCleanup }) => {
  const cleanup = [] as (() => Promise<void>)[]

  onCleanup(async () => {
    await Promise.allSettled(cleanup.map(fn => fn()))
  })

  return async (document: string) => {
    const workspacePath = URI.file(`/test/workspace/changeElementStyle/src${++seq}`)
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

    vi.spyOn(fs, 'readDirectory').mockResolvedValue([{
      isDirectory: false,
      isFile: true,
      uri: documentUri,
    }])
    vi.spyOn(fs, 'readFile').mockImplementation(async uri => vol.readFileSync(uri.fsPath, 'utf-8').toString())
    vi.spyOn(fs, 'writeFile').mockImplementation(async (uri, content) => {
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

describe('changeViewLayout', () => {
  it('replaces autoLayout with new value', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  system = system 'System'
}
views {
  view target {
    include *
    autoLayout LeftRight
      20 10
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-autolayout',
        layout: {
          direction: 'TB',
          rankSep: 40,
          nodeSep: 30,
        },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
      "
      specification {
        element system
      }
      model {
        system = system 'System'
      }
      views {
        view target {
          include *
          autoLayout TopBottom 40 30
        }
      }"
    `)
  })

  it('inserts a layout inside a view with only non-layout rules', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  system = system 'System'
}
views {
  view target {
    include *
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-autolayout',
        layout: {
          direction: 'TB',
          rankSep: 20,
        },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
      "
      specification {
        element system
      }
      model {
        system = system 'System'
      }
      views {
        view target {
          include *
          autoLayout TopBottom 20
        }
      }"
    `)
  })
})
