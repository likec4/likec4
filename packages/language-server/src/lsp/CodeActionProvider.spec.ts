import { describe, it } from 'vitest'
import { type CodeAction, type Diagnostic, CodeActionKind, CodeActionTriggerKind } from 'vscode-languageserver-protocol'
import type { DependencyState } from '../dependencies'
import { InstallDependencies } from '../protocol'
import { createTestServices } from '../test'
import { gitDependencyWorkspace, installed, notInstalled, unsupported } from './_git-dependencies-spec'

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

  describe('git dependencies', () => {
    async function quickFixes(state: DependencyState, transform = (d: Diagnostic) => d) {
      await using t = await gitDependencyWorkspace()
      t.setState(state, true)
      const { diagnostics } = await t.validateAll()
      const doc = t.consumer
      const position = doc.textDocument.positionAt(doc.textDocument.getText().indexOf('billing'))
      const actions = await t.services.lsp.CodeActionProvider!.getCodeActions(doc, {
        textDocument: { uri: doc.textDocument.uri },
        range: { start: position, end: position },
        context: { diagnostics: diagnostics.map(transform), triggerKind: CodeActionTriggerKind.Automatic },
      })
      return { actions, diagnostics }
    }

    it('offers install for not installed dependency', async ({ expect }) => {
      const { actions, diagnostics } = await quickFixes(notInstalled('consumer'))
      expect(actions).toHaveLength(1)
      const action = actions![0] as CodeAction
      expect(action).toMatchObject({
        title: `Install dependency 'billing'`,
        kind: CodeActionKind.QuickFix,
        isPreferred: true,
        diagnostics,
        command: {
          command: InstallDependencies.command,
          arguments: [{ projectId: 'consumer', name: 'billing' }],
        },
      })
    })

    it('offers install when the client dropped the diagnostic data', async ({ expect }) => {
      const { actions } = await quickFixes(notInstalled('consumer'), ({ data: _, ...d }) => d)
      expect(actions).toMatchObject([
        {
          title: `Install dependency 'billing'`,
          command: {
            command: InstallDependencies.command,
            arguments: [{ projectId: 'consumer', name: 'billing' }],
          },
        },
      ])
    })

    it.for(
      [
        ['unsupported', unsupported('consumer'), 1],
        ['installed with parse errors', installed('consumer', 'billing', 2), 1],
        ['installed', installed('consumer'), 0],
      ] as const,
    )('offers nothing for %s dependency', async ([_, state, diagnosticsCount], { expect }) => {
      const { actions, diagnostics } = await quickFixes(state)
      expect(diagnostics).toHaveLength(diagnosticsCount)
      expect(actions ?? []).toEqual([])
    })
  })
})
