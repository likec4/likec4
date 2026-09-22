import type { ViewId } from '@likec4/core'
import { UriUtils } from 'langium'
import { vol } from 'memfs'
import stripIndent from 'strip-indent'
import { type ExpectStatic, describe, it, vi } from 'vitest'
import { URI } from 'vscode-uri'
import { WithFileSystem } from '../filesystem'
import type { ChangeView } from '../protocol'
import { createTestServices } from '../test'

vi.mock('node:fs')
vi.mock('node:fs/promises')

let seq = 0
async function testDoc(expect: ExpectStatic, document: string) {
  const workspacePath = URI.file(`/test/workspace/changeViewRouting/src${++seq}`)
  const documentUri = UriUtils.joinPath(workspacePath, 'test.c4')

  vol.mkdirSync(workspacePath.fsPath, { recursive: true })
  vol.writeFileSync(documentUri.fsPath, stripIndent(document).trimEnd(), { encoding: 'utf-8' })

  const { initialize, services } = createTestServices({
    workspace: workspacePath.toString(),
    context: {
      ...WithFileSystem(),
    },
  })

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
    expect(memoryContent).toBeDefined()
    const fsContent = vol.readFileSync(documentUri.fsPath, 'utf-8')
    expect(memoryContent, 'Memory and FS content should be equal').toEqual(fsContent)
    return memoryContent!
  }

  async function change(viewId: string, change: ChangeView.Params['change']) {
    const result = await services.likec4.ModelChanges.applyChange({ viewId: viewId as ViewId, change })
    expect(result.success).toBe(true)
    return read()
  }

  return { change, read }
}

const viewsBlock = (text: string) => text.slice(text.indexOf('views {'))

const expected = (text: string) => stripIndent(text).trim()

const spec = `
specification {
  element system
  tag next
  deploymentNode node
}
model {
  sys = system
  api = system
  sys -> api
}
deployment {
  node prod
}`

describe('change-routing', () => {
  it('inserts a routing property into a view without routing', async ({ expect }) => {
    const { change } = await testDoc(
      expect,
      `${spec}
views {
  view index {
    include *
  }
}`,
    )
    expect(await change('index', { op: 'change-routing', routing: 'ortho' })).toMatchInlineSnapshot(`
      "
      specification {
        element system
        tag next
        deploymentNode node
      }
      model {
        sys = system
        api = system
        sys -> api
      }
      deployment {
        node prod
      }
      views {
        view index {
          routing ortho
          include *
        }
      }"
    `)
  })

  it('inserts the property after existing tags and properties', async ({ expect }) => {
    const { change } = await testDoc(
      expect,
      `${spec}
views {
  view index {
    #next
    title 'Index'
    include *
  }
}`,
    )
    expect(viewsBlock(await change('index', { op: 'change-routing', routing: 'ortho' }))).toBe(expected(`
      views {
        view index {
          #next
          title 'Index'
          routing ortho
          include *
        }
      }`))
  })

  it('inserts the property before the steps of a dynamic view', async ({ expect }) => {
    const { change } = await testDoc(
      expect,
      `${spec}
views {
  dynamic view flow {
    sys -> api 'calls'
  }
}`,
    )
    expect(viewsBlock(await change('flow', { op: 'change-routing', routing: 'ortho' }))).toBe(expected(`
      views {
        dynamic view flow {
          routing ortho
          sys -> api 'calls'
        }
      }`))
  })

  it('inserts the property into a deployment view', async ({ expect }) => {
    const { change } = await testDoc(
      expect,
      `${spec}
views {
  deployment view deployed {
    include *
  }
}`,
    )
    expect(viewsBlock(await change('deployed', { op: 'change-routing', routing: 'ortho' }))).toBe(expected(`
      views {
        deployment view deployed {
          routing ortho
          include *
        }
      }`))
  })

  it('keeps the closing brace on its own line for a one-line extended view', async ({ expect }) => {
    const { change } = await testDoc(
      expect,
      `${spec}
views {
  view base {
    include *
  }
  view target extends base {}
}`,
    )
    expect(viewsBlock(await change('target', { op: 'change-routing', routing: 'ortho' }))).toBe(expected(`
      views {
        view base {
          include *
        }
        view target extends base {
          routing ortho
        }
      }`))
  })

  it('appends the parameter to an existing autoLayout rule instead of adding a property', async ({ expect }) => {
    const { change } = await testDoc(
      expect,
      `${spec}
views {
  view index {
    include *
    autoLayout LeftRight 120 110
  }
}`,
    )
    expect(viewsBlock(await change('index', { op: 'change-routing', routing: 'ortho' }))).toBe(expected(`
      views {
        view index {
          include *
          autoLayout LeftRight 120 110 ortho
        }
      }`))
  })

  it('replaces an existing autoLayout routing parameter', async ({ expect }) => {
    const { change } = await testDoc(
      expect,
      `${spec}
views {
  view index {
    include *
    autoLayout TopBottom 100 50 ortho
  }
}`,
    )
    expect(viewsBlock(await change('index', { op: 'change-routing', routing: 'spline' }))).toBe(expected(`
      views {
        view index {
          include *
          autoLayout TopBottom 100 50 spline
        }
      }`))
  })

  it('replaces the value of an existing routing property and keeps its punctuation', async ({ expect }) => {
    const { change } = await testDoc(
      expect,
      `${spec}
views {
  view index {
    routing: ortho;
    include *
  }
}`,
    )
    expect(viewsBlock(await change('index', { op: 'change-routing', routing: 'spline' }))).toBe(expected(`
      views {
        view index {
          routing: spline;
          include *
        }
      }`))
  })

  it('changes the property when both the property and the autoLayout parameter exist', async ({ expect }) => {
    const { change } = await testDoc(
      expect,
      `${spec}
views {
  view index {
    routing spline
    include *
    autoLayout TopBottom ortho
  }
}`,
    )
    expect(viewsBlock(await change('index', { op: 'change-routing', routing: 'ortho' }))).toBe(expected(`
      views {
        view index {
          routing ortho
          include *
          autoLayout TopBottom ortho
        }
      }`))
  })
})

describe('change-autolayout', () => {
  it('keeps the routing parameter when the direction changes', async ({ expect }) => {
    const { change } = await testDoc(
      expect,
      `${spec}
views {
  view index {
    include *
    autoLayout TopBottom ortho
  }
}`,
    )
    expect(await change('index', { op: 'change-autolayout', layout: { direction: 'LR', rankSep: 120 } })).toContain(
      'autoLayout LeftRight 120 ortho',
    )
  })
})
