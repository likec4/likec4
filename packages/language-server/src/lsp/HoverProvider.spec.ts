import { type AstNode, type LangiumDocument, AstUtils, URI } from 'langium'
import { describe, it } from 'vitest'
import { ast } from '../ast'
import { createMultiProjectTestServices } from '../test'

const spec = `
  specification {
    element component
    deploymentNode node
  }
`

async function aliasedImportWorkspace() {
  const t = await createMultiProjectTestServices({})
  await t.projectsManager.registerProject({
    config: { name: 'shared' },
    folderUri: URI.parse('file:///test/workspace/src/shared-folder'),
  })
  await t.addDocument(
    'shared-folder/model.c4',
    `
      ${spec}
      model {
        component svc 'Billing Service'
      }
    `,
  )
  await t.projectsManager.registerProject({
    config: { name: 'consumer', dependencies: { billing: '../shared-folder' } },
    folderUri: URI.parse('file:///test/workspace/src/consumer'),
  })
  const consumerDoc = await t.addDocument(
    'consumer/model.c4',
    `
      import { svc } from 'billing'
      ${spec}
      deployment {
        node n {
          myinst = instanceOf svc
        }
      }
    `,
  )
  const { diagnostics } = await t.validateAll()
  return { t, consumerDoc, diagnostics }
}

function deployedInstance(doc: LangiumDocument): ast.DeployedInstance {
  const node = AstUtils.streamAst(doc.parseResult.value).find((n: AstNode) => ast.isDeployedInstance(n))
  if (!node || !ast.isDeployedInstance(node)) {
    throw new Error('Deployed instance not found')
  }
  return node
}

describe('hover on deployed instance of an imported element', () => {
  it('shows title and kind of the element imported under a dependency name', async ({ expect }) => {
    const { t, consumerDoc, diagnostics } = await aliasedImportWorkspace()
    await using _ = t
    expect(diagnostics).toEqual([])

    const text = consumerDoc.textDocument.getText()
    const position = consumerDoc.textDocument.positionAt(text.indexOf('myinst') + 2)
    const hover = await t.services.lsp.HoverProvider!.getHoverContent(consumerDoc, {
      textDocument: { uri: consumerDoc.uri.toString() },
      position,
    })
    const contents = hover?.contents
    const value = typeof contents === 'object' && 'value' in contents ? contents.value : ''
    expect(value).toContain('instance of `@billing.svc`')
    expect(value).toContain('### Billing Service')
    expect(value).toContain('element kind `component`')
  })

  it('documents the element imported under a dependency name', async ({ expect }) => {
    const { t, consumerDoc } = await aliasedImportWorkspace()
    await using _ = t
    const documentation = t.services.documentation.DocumentationProvider.getDocumentation(
      deployedInstance(consumerDoc),
    )
    expect(documentation).toContain('**Billing Service**')
  })
})
