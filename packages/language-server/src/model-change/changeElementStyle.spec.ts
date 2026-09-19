import { type Fqn, type ViewChange, type ViewId, invariant } from '@likec4/core'
import { TextDocument, UriUtils } from 'langium'
import { vol } from 'memfs'
import stripIndent from 'strip-indent'
import { type ExpectStatic, describe, expect, it, vi } from 'vitest'
import { URI } from 'vscode-uri'
import { WithFileSystem } from '../filesystem'
import type { ChangeView } from '../protocol'
import { createTestServices } from '../test'
import { changeElementStyle } from './changeElementStyle'

vi.mock('node:fs')
vi.mock('node:fs/promises')

let seq = 0
async function testDoc(expect: ExpectStatic, document: string) {
  const workspacePath = URI.file(`/test/workspace/changeElementStyle/src${++seq}`)
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
    expect(fsContent).toBeDefined()

    expect(memoryContent, 'Memory and FS content should be equal').toEqual(fsContent)

    return memoryContent!
  }

  async function change(params: ChangeView.Params) {
    const result = await services.likec4.ModelChanges.applyChange(params)
    expect(result.success).toBe(true)

    return read()
  }

  return { change, read }
}

describe('changeElementStyle', () => {
  it('inserts a style inside a view with only non-style rules', async ({ expect }) => {
    const { change, read } = await testDoc(
      expect,
      `
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    include *
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-element-style',
        targets: ['user' as Fqn],
        style: { shape: 'person' },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
"
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    include *
    style user {
      shape person
    }
  }
}"`)
  })

  it('updates an existing style for the same element', async ({ expect }) => {
    const { change, read } = await testDoc(
      expect,
      `
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    style user {
      shape person
    }
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-element-style',
        targets: ['user' as Fqn],
        style: { shape: 'mobile' },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
"
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    style user {
      shape mobile
    }
  }
}"`)
  })

  it('inserts a style while preserving an existing style for another element', async ({ expect }) => {
    const { change, read } = await testDoc(
      expect,
      `
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    style app {
      shape rectangle
    }
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-element-style',
        targets: ['user' as Fqn],
        style: { shape: 'person' },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
"
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    style app {
      shape rectangle
    }
    style user {
      shape person
    }
  }
}"`)
  })

  it('inserts a style inside a dynamic view with no rules', async ({ expect }) => {
    const { change, read } = await testDoc(
      expect,
      `
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-element-style',
        targets: ['user' as Fqn],
        style: { shape: 'person' },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
"
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    style user {
      shape person
    }
  }
}"`)
  })
})
