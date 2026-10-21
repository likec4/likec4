import { beforeAll, describe, expect, it } from 'vitest'
import { CancellationToken } from 'vscode-languageserver'
import type { LikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import { createTestServices } from '../test'
import type { LikeC4SemanticTokenProvider } from './SemanticTokenProvider'

type DecodedToken = {
  line: number
  char: number
  length: number
  type: string
}

/**
 * LSP semantic tokens are a flat array of 5-number groups, delta-encoded against the previous token.
 */
function decode(data: number[], tokenTypes: Record<string, number>): DecodedToken[] {
  const names = Object.fromEntries(Object.entries(tokenTypes).map(([name, index]) => [index, name]))
  const tokens: DecodedToken[] = []
  let line = 0
  let char = 0
  for (let i = 0; i < data.length; i += 5) {
    const [deltaLine, deltaChar, length, tokenType] = data.slice(i, i + 5) as [number, number, number, number, number]
    line += deltaLine
    char = deltaLine === 0 ? char + deltaChar : deltaChar
    tokens.push({ line, char, length, type: names[tokenType] ?? String(tokenType) })
  }
  return tokens
}

describe('SemanticTokenProvider', () => {
  let services: LikeC4Services
  let provider: LikeC4SemanticTokenProvider
  let doc: LikeC4LangiumDocument

  beforeAll(async () => {
    const test = createTestServices()
    services = test.services
    provider = services.lsp.SemanticTokenProvider as LikeC4SemanticTokenProvider
    doc = await test.parse(
      `
      specification {
        element component
      }
      model {
        component customer {
          descriptionFile ./markdown/customer.md
          link https://example.com/customer
        }
      }
    `,
      'doc.c4',
    )
  })

  async function tokens(): Promise<DecodedToken[]> {
    const result = await provider.semanticHighlight(doc, {
      textDocument: { uri: doc.uri.toString() },
    }, CancellationToken.None)
    return decode(result.data, provider.tokenTypes)
  }

  function tokenAt(tokens: DecodedToken[], text: string): DecodedToken | undefined {
    const line = doc.textDocument.getText().split('\n').find(l => l.includes(text))
    if (!line) {
      return undefined
    }
    const lineIndex = doc.textDocument.getText().split('\n').indexOf(line)
    const char = line.indexOf(text)
    return tokens.find(t => t.line === lineIndex && t.char === char && t.length === text.length)
  }

  it('highlights a descriptionFile path like a link', async ({ expect }) => {
    const all = await tokens()
    expect(tokenAt(all, './markdown/customer.md')?.type).toBe('string')
    expect(tokenAt(all, 'https://example.com/customer')?.type).toBe('string')
  })
})
