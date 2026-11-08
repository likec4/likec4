import type { LangiumDocument } from 'langium'
import { describe, expect } from 'vitest'
import type { LocationLink } from 'vscode-languageserver'
import { type TestServices as Services, testFileScope as it } from '../test'

const modelSource = `
  specification {
    element component
  }
  model {
    component cloud {
      component backend {
        component api
      }
    }
  }
  views {
    view index {
      include *
    }
  }
`

/**
 * Requests definition at the given offset of `needle` in the document
 */
async function definitionAt(t: Services, document: LangiumDocument, needle: string, delta = 0) {
  const text = document.textDocument.getText()
  const index = text.indexOf(needle)
  expect(index, `needle ${needle}`).toBeGreaterThanOrEqual(0)
  const position = document.textDocument.positionAt(index + delta)
  return await t.services.lsp.DefinitionProvider!.getDefinition(document, {
    textDocument: { uri: document.uri.toString() },
    position,
  })
}

/**
 * Location link with the document text at its ranges
 */
function describeLinks(t: Services, source: LangiumDocument, links: LocationLink[] | undefined) {
  return links?.map(link => {
    const target = t.services.shared.workspace.LangiumDocuments.all.find(d => d.uri.toString() === link.targetUri)
    return {
      targetUri: link.targetUri,
      selection: target?.textDocument.getText(link.targetSelectionRange),
      range: target?.textDocument.getText(link.targetRange).split('\n')[0],
      origin: link.originSelectionRange ? source.textDocument.getText(link.originSelectionRange) : undefined,
    }
  })
}

describe('LikeC4DefinitionProvider', () => {
  it('resolves element refs in markdown', async ({ t, expect }) => {
    const document = await t.addDocument(`
      ${modelSource}
      model {
        component docs {
          description '''
            Calls [[cloud]] and [[cloud.backend.api|API]]
          '''
        }
      }
    `)
    await t.validateAll()

    // cursor on the first [
    let links = await definitionAt(t, document, '[[cloud]]')
    expect(describeLinks(t, document, links)).toEqual([
      {
        targetUri: document.uri.toString(),
        selection: 'cloud',
        range: 'component cloud {',
        origin: 'cloud',
      },
    ])

    // nested element, cursor on the label
    links = await definitionAt(t, document, '[[cloud.backend.api|API]]', 22)
    expect(describeLinks(t, document, links)).toEqual([
      {
        targetUri: document.uri.toString(),
        selection: 'api',
        range: 'component api',
        origin: 'cloud.backend.api',
      },
    ])

    // cursor right after ]]
    links = await definitionAt(t, document, '[[cloud.backend.api|API]]', '[[cloud.backend.api|API]]'.length)
    expect(links).toHaveLength(1)
  })

  it('resolves element declared in another document', async ({ t, expect }) => {
    const modelDoc = await t.addDocument(modelSource)
    const document = await t.addDocument(`
      model {
        component docs {
          description """
            See [[cloud.backend]]
          """
        }
      }
    `)
    await t.validateAll()

    const links = await definitionAt(t, document, '[[cloud.backend]]', 5)
    expect(describeLinks(t, document, links)).toEqual([
      {
        targetUri: modelDoc.uri.toString(),
        selection: 'backend',
        range: 'component backend {',
        origin: 'cloud.backend',
      },
    ])
  })

  it('resolves view refs', async ({ t, expect }) => {
    const document = await t.addDocument(`
      ${modelSource}
      model {
        component docs {
          description '''See [[view:index|Index]]'''
        }
      }
    `)
    await t.validateAll()

    // cursor on the namespace
    const links = await definitionAt(t, document, '[[view:index', 3)
    expect(describeLinks(t, document, links)).toEqual([
      {
        targetUri: document.uri.toString(),
        selection: 'index',
        range: 'view index {',
        origin: 'index',
      },
    ])
  })

  it('returns nothing for missing targets and unknown namespaces', async ({ t, expect }) => {
    const document = await t.addDocument(`
      ${modelSource}
      model {
        component docs {
          description '''[[cloud.missing]] [[view:missing]] [[foo:cloud]]'''
        }
      }
    `)
    await t.validateAll()

    expect(await definitionAt(t, document, '[[cloud.missing]]', 4)).toBeUndefined()
    expect(await definitionAt(t, document, '[[view:missing]]', 8)).toBeUndefined()
    expect(await definitionAt(t, document, '[[foo:cloud]]', 7)).toBeUndefined()
  })

  it('falls back to the default behaviour outside refs', async ({ t, expect }) => {
    const document = await t.addDocument(`
      ${modelSource}
      model {
        component docs {
          description '''Not a ref: cloud'''
        }
        docs -> cloud.backend
      }
    `)
    await t.validateAll()

    // inside markdown, not on a ref
    expect(await definitionAt(t, document, 'Not a ref: cloud', 12)).toBeUndefined()

    // element reference in the relation
    const links = await definitionAt(t, document, 'docs -> cloud.backend', 'docs -> cloud.'.length)
    expect(describeLinks(t, document, links)).toEqual([
      {
        targetUri: document.uri.toString(),
        selection: 'backend',
        range: 'component backend {',
        origin: 'backend',
      },
    ])
  })
})
