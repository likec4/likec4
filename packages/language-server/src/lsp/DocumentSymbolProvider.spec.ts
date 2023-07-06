import { textDocumentParams } from 'langium/test'
import { describe, it } from 'vitest'
import { SymbolKind } from 'vscode-languageserver-protocol'
import { createTestServices } from '../test'

describe('LikeC4DocumentSymbolProvider', () => {

  it('should show all specification symbols', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document, diagnostics } = await validate(`
        specification {
          element component
          tag next
        }
      `)
    expect(diagnostics).to.be.empty
    const symbols = await services.lsp.DocumentSymbolProvider.getSymbols(
      document,
      textDocumentParams(document)
    )
    console.log(JSON.stringify(symbols, null, 2))
    expect(symbols).toStrictEqual([
      {
        name: 'specification',
        kind: SymbolKind.Class,
        range: {
          start: {
            character: 0,
            line: 1
          },
          end: {
            character: 1,
            line: 4
          }
        },
        selectionRange: {
          start: {
            character: 0,
            line: 1
          },
          end: {
            character: 13,
            line: 1
          }
        },
        children: [
          {
            name: 'component',
            kind: SymbolKind.Class,
            range: {
              start: {
                character: 2,
                line: 2
              },
              end: {
                character: 19,
                line: 2
              }
            },
            selectionRange: {
              start: {
                character: 10,
                line: 2
              },
              end: {
                character: 19,
                line: 2
              }
            }
          },
          {
            name: '#next',
            kind: SymbolKind.Interface,
            range: {
              start: {
                character: 2,
                line: 3
              },
              end: {
                character: 10,
                line: 3
              }
            },
            selectionRange: {
              start: {
                character: 6,
                line: 3
              },
              end: {
                character: 10,
                line: 3
              }
            }
          }
        ]
      }
    ])
  })

})
