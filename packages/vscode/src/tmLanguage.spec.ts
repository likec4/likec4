import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  type HighlighterCore,
  type LanguageRegistration,
  bundledLanguages,
  bundledThemes,
  createHighlighterCore,
  createOnigurumaEngine,
} from 'shiki'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * TextMate grammar copies, must be kept in sync
 */
const copies = {
  vscode: new URL('../likec4.tmLanguage.json', import.meta.url),
  playground: new URL('../../../apps/playground/likec4.tmLanguage.json', import.meta.url),
  docs: new URL('../../../apps/docs/likec4.tmLanguage.json', import.meta.url),
} as const

type Copy = keyof typeof copies

function readGrammar(copy: Copy): LanguageRegistration {
  return JSON.parse(readFileSync(fileURLToPath(copies[copy]), 'utf8'))
}

const REF = 'meta.link.ref.likec4'
const begin = 'punctuation.definition.link.begin.likec4'
const namespace = 'keyword.other.namespace.likec4'
const namespaceSeparator = 'punctuation.separator.namespace.likec4'
const target = 'entity.name.type.likec4 markup.underline.link.likec4'
const labelSeparator = 'punctuation.separator.label.likec4'
const label = 'string.other.link.description.likec4'
const end = 'punctuation.definition.link.end.likec4'

/**
 * Piece of a ref: text and its scopes inside `meta.link.ref.likec4` (empty if none)
 */
type Piece = [text: string, scopes: string]

const inline = (md: string) =>
  [
    `model {`,
    `  a = component {`,
    `    description '''See ${md} end'''`,
    `  }`,
    `}`,
  ].join('\n')

const block = (...lines: string[]) =>
  [
    `model {`,
    `  a = component {`,
    `    description '''`,
    ...lines.map(l => `      ${l}`),
    `    '''`,
    `  }`,
    `}`,
  ].join('\n')

describe.each(Object.keys(copies) as Copy[])('likec4.tmLanguage.json (%s): markdown-ref', copy => {
  let highlighter: HighlighterCore

  beforeAll(async () => {
    // Each copy has the same scopeName, so every copy gets its own highlighter
    highlighter = await createHighlighterCore({
      themes: [bundledThemes['github-dark']],
      langs: [bundledLanguages.markdown, { ...readGrammar(copy), name: 'likec4', embeddedLangs: ['markdown'] }],
      // Real oniguruma, as in VSCode
      engine: createOnigurumaEngine(import('shiki/wasm')),
    })
    return () => highlighter.dispose()
  })

  /**
   * Refs found in the code, as pieces with scopes
   */
  function refsIn(code: string): Piece[][] {
    const lines =
      highlighter.codeToTokens(code, { lang: 'likec4', theme: 'github-dark', includeExplanation: true }).tokens
    const refs: Piece[][] = []
    for (const line of lines) {
      let current: Piece[] | null = null
      for (const token of line) {
        for (const { content, scopes } of token.explanation ?? []) {
          const names = scopes.map(s => s.scopeName)
          const at = names.indexOf(REF)
          if (at < 0) {
            current = null
            continue
          }
          if (!current) {
            current = []
            refs.push(current)
          }
          current.push([content, names.slice(at + 1).join(' ')])
        }
      }
    }
    return refs
  }

  const cases: Array<[md: string, expected: Piece[]]> = [
    [String.raw`[[a]]`, [['[[', begin], ['a', target], [']]', end]]],
    // DSL escape: Markdown gets `[[a]]`, the escape is part of the ref
    [String.raw`\[[a]]`, [['\\', ''], ['[[', begin], ['a', target], [']]', end]]],
    [String.raw`[[a.b\\|L]]`, [['[[', begin], ['a.b', target], ['\\\\|', labelSeparator], ['L', label], [']]', end]]],
    [String.raw`[[a.b\|L]]`, [['[[', begin], ['a.b', target], ['\\|', labelSeparator], ['L', label], [']]', end]]],
    [String.raw`[[a.b|L]]`, [['[[', begin], ['a.b', target], ['|', labelSeparator], ['L', label], [']]', end]]],
    [
      String.raw`[[view:index]]`,
      [['[[', begin], ['view', namespace], [':', namespaceSeparator], ['index', target], [']]', end]],
    ],
    // Unknown namespace is still highlighted as a namespace (the validator warns)
    [
      String.raw`[[foo:bar|Bar]]`,
      [
        ['[[', begin],
        ['foo', namespace],
        [':', namespaceSeparator],
        ['bar', target],
        ['|', labelSeparator],
        ['Bar', label],
        [']]', end],
      ],
    ],
  ]

  it.each(cases)('%s is a ref', (md, expected) => {
    expect(refsIn(inline(md)), 'inline').toEqual([expected])
    expect(refsIn(block(`See ${md} end`)), 'block').toEqual([expected])
  })

  const notRefs = [
    // Markdown escape: `\\[[` in the DSL is `\[[` in Markdown
    String.raw`\\[[a]]`,
    // DSL escape and Markdown escape
    String.raw`\\\[[a]]`,
    // whitespace in the target
    String.raw`[[a b]]`,
    String.raw`[[ a]]`,
    // inline code
    '`[[a]]`',
    '`` x [[a]] ``',
  ]

  it.each(notRefs)('%s is not a ref', md => {
    expect(refsIn(inline(md)), 'inline').toEqual([])
    expect(refsIn(block(`See ${md} end`)), 'block').toEqual([])
  })

  it('fenced code is not a ref', () => {
    expect(refsIn(block('```', '[[a]]', '```', '[[b]]'))).toEqual([[['[[', begin], ['b', target], [']]', end]]])
    // Inline form (quotes not at the end of the line)
    const code = [
      `model {`,
      `  a = component {`,
      `    description '''See`,
      `      \`\`\``,
      `      [[a]]`,
      `      \`\`\``,
      `      [[b]]'''`,
      `  }`,
      `}`,
    ].join('\n')
    expect(refsIn(code)).toEqual([[['[[', begin], ['b', target], [']]', end]]])
  })

  it('plain strings are not processed', () => {
    const code = [
      `model {`,
      `  a = component {`,
      `    title 'See [[a]]'`,
      `    technology "See [[b]]"`,
      `  }`,
      `}`,
    ].join('\n')
    expect(refsIn(code)).toEqual([])
  })
})

describe('likec4.tmLanguage.json copies', () => {
  const vscode = readGrammar('vscode')

  it.each(['playground', 'docs'] as const)('%s has the same markdown rules as vscode', copy => {
    const grammar = readGrammar(copy)
    for (const rule of ['markdown-ref', 'markdown-inline-code', 'markdown-fenced-code']) {
      expect(grammar.repository[rule], `repository.${rule}`).toEqual(vscode.repository[rule])
    }
  })

  // vscode and playground embed the Markdown grammar and inject the ref rule into it
  it('playground has the same injections as vscode', () => {
    const playground = readGrammar('playground')
    expect(vscode.injections, 'vscode injections').toBeDefined()
    expect(playground.injections, 'injections').toEqual(vscode.injections)
  })

  // The docs grammar does not embed the Markdown grammar: its `markdown-string` rule includes `#markdown-ref`
  // directly, so it needs no injection
  it('docs includes markdown-ref in markdown strings', () => {
    const docs = readGrammar('docs')
    expect(docs.injections, 'injections').toBeUndefined()
    expect(docs.repository['markdown-string']?.patterns, 'markdown-string patterns').toContainEqual({
      include: '#markdown-ref',
    })
  })
})
