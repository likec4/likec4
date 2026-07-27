import { textDocumentParams } from 'langium/test'
import { describe } from 'vitest'
import { SymbolKind } from 'vscode-languageserver-types'
import { testFileScope as it } from '../test'

describe('LikeC4DocumentSymbolProvider', () => {
  it('should show all specification symbols', async ({ expect, t, validate }) => {
    const { document, diagnostics } = await validate(`
        specification {
          element component
          tag next
        }
      `)
    expect(diagnostics).to.be.empty
    const symbols = await t.services.lsp.DocumentSymbolProvider.getSymbols(
      document,
      textDocumentParams(document),
    )
    expect(symbols).toStrictEqual([
      {
        name: 'specification',
        kind: SymbolKind.Namespace,
        range: {
          start: {
            character: 0,
            line: 1,
          },
          end: {
            character: 1,
            line: 4,
          },
        },
        selectionRange: {
          start: {
            character: 0,
            line: 1,
          },
          end: {
            character: 13,
            line: 1,
          },
        },
        children: [
          {
            name: 'component',
            kind: SymbolKind.TypeParameter,
            range: {
              start: {
                character: 2,
                line: 2,
              },
              end: {
                character: 19,
                line: 2,
              },
            },
            selectionRange: {
              start: {
                character: 10,
                line: 2,
              },
              end: {
                character: 19,
                line: 2,
              },
            },
          },
          {
            name: '#next',
            kind: SymbolKind.EnumMember,
            range: {
              start: {
                character: 2,
                line: 3,
              },
              end: {
                character: 10,
                line: 3,
              },
            },
            selectionRange: {
              start: {
                character: 6,
                line: 3,
              },
              end: {
                character: 10,
                line: 3,
              },
            },
          },
        ],
      },
    ])
  })

  it('should keep element detail from visually merging with name when kind equals name (#3091)', async ({ expect, t, validate }) => {
    const { document, diagnostics } = await validate(`
        specification {
          element model
        }
        model {
          model model
        }
      `)
    expect(diagnostics).to.be.empty
    const symbols = await t.services.lsp.DocumentSymbolProvider.getSymbols(
      document,
      textDocumentParams(document),
    )
    const modelContainer = symbols.find(s => s.name === 'model')
    expect(modelContainer).toBeDefined()
    expect(modelContainer!.detail).toBeUndefined()

    const elementSymbol = modelContainer!.children?.[0]
    expect(elementSymbol).toBeDefined()
    // Regression: `detail` used to be the bare kind ('model'), which some LSP clients
    // (e.g. Zed) render directly adjacent to `name` with no separator of their own,
    // producing the literal displayed text 'modelmodel'. Wrapping in parens keeps the
    // two fields visually distinct regardless of client-side formatting.
    expect(elementSymbol!.name).toBe('model')
    expect(elementSymbol!.detail).toBe('(model)')
  })
})
