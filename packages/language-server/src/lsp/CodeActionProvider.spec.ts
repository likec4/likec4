import { describe, it } from 'vitest'
import { CodeActionTriggerKind } from 'vscode-languageserver-protocol'
import { createTestServices } from '../test'

describe('CodeActionProvider', () => {
  const source = `
specification {
  element component
}
model {
  component c1 {
    description 'Hello world'
  }
}
`

  async function actionsAt(needle: string, triggerKind: CodeActionTriggerKind = CodeActionTriggerKind.Invoked) {
    const { services, parse } = createTestServices()
    const doc = await parse(source)
    const position = doc.textDocument.positionAt(source.indexOf(needle) + 1)
    const actions = await services.lsp.CodeActionProvider!.getCodeActions(doc, {
      textDocument: { uri: doc.textDocument.uri },
      range: { start: position, end: position },
      context: { diagnostics: [], triggerKind },
    })
    return { actions, doc }
  }

  it('offers "Convert to Markdown" on a plain string', async ({ expect }) => {
    const { actions, doc } = await actionsAt('Hello')
    expect(actions).toHaveLength(1)
    const action = actions![0] as any
    expect(action.title).toBe('Convert to Markdown')
    const [edit] = action.edit.changes[doc.textDocument.uri]
    expect(edit.newText).toBe(`'''\n      Hello world\n    '''`)
  })

  it('offers nothing on a top-level keyword', async ({ expect }) => {
    const { actions } = await actionsAt('specification')
    expect(actions ?? []).toHaveLength(0)
  })

  it('offers safe delete on an element', async ({ expect }) => {
    const { actions } = await actionsAt('c1')
    expect(actions?.map(action => action.title)).toEqual(['Safe delete \'c1\''])
  })

  it('offers nothing when triggered automatically', async ({ expect }) => {
    const { actions } = await actionsAt('Hello', CodeActionTriggerKind.Automatic)
    expect(actions).toBeUndefined()
  })
})
