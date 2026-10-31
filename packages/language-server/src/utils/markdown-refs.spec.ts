import { extractRefs } from '@likec4/core/utils'
import { AstUtils, URI } from 'langium'
import { describe, expect } from 'vitest'
import { ast } from '../ast'
import { removeIndent } from '../model/parser/Base'
import { type TestServices as Services, testFileScope as it } from '../test'
import { markdownRefsOf } from './markdown-refs'

/**
 * Parses the document as is (no dedent), returns refs with the document text at their ranges
 */
async function refsIn(t: Services, text: string) {
  await t.initialize()
  const document = t.services.shared.workspace.LangiumDocumentFactory.fromString(
    text,
    URI.parse(`file:///test/workspace/src/refs-${Math.random().toString(36).slice(2)}.c4`),
  )
  t.services.shared.workspace.LangiumDocuments.addDocument(document)
  await t.services.shared.workspace.DocumentBuilder.build([document], { validation: false })
  expect(document.parseResult.lexerErrors).toEqual([])
  expect(document.parseResult.parserErrors).toEqual([])

  const nodes = AstUtils.streamAst(document.parseResult.value).filter(ast.isMarkdownOrString).toArray()
  const getText = document.textDocument.getText.bind(document.textDocument)
  return nodes.flatMap(node => {
    const refs = markdownRefsOf(node)
    // Refs are the same as the ones extracted from the model value
    const md = removeIndent(node)
    expect(refs.map(r => r.ref)).toEqual('md' in md ? extractRefs(md.md) : [])
    return refs.map(r => ({
      kind: r.ref.kind,
      text: getText(r.range),
      target: getText(r.targetRange),
      namespace: r.namespaceRange ? getText(r.namespaceRange) : null,
      offset: getText({
        start: document.textDocument.positionAt(r.offset.start),
        end: document.textDocument.positionAt(r.offset.end),
      }),
      line: r.range.start.line,
    }))
  })
}

describe('markdownRefsOf', () => {
  it('maps refs in single line markdown', async ({ t, expect }) => {
    const refs = await refsIn(
      t,
      [
        `model {`,
        `  a = component {`,
        `    description '''See [[cloud.api]] and [[view:index|Index]], [[foo:bar]]'''`,
        `    summary """Calls [[cloud.backend.api|API]]"""`,
        `  }`,
        `}`,
      ].join('\n'),
    )
    expect(refs).toEqual([
      {
        kind: 'element',
        text: '[[cloud.api]]',
        target: 'cloud.api',
        namespace: null,
        offset: '[[cloud.api]]',
        line: 2,
      },
      {
        kind: 'view',
        text: '[[view:index|Index]]',
        target: 'index',
        namespace: 'view',
        offset: '[[view:index|Index]]',
        line: 2,
      },
      {
        kind: 'unknown',
        text: '[[foo:bar]]',
        target: 'bar',
        namespace: 'foo',
        offset: '[[foo:bar]]',
        line: 2,
      },
      {
        kind: 'element',
        text: '[[cloud.backend.api|API]]',
        target: 'cloud.backend.api',
        namespace: null,
        offset: '[[cloud.backend.api|API]]',
        line: 3,
      },
    ])
  })

  it('maps refs in indented multi-line blocks, on the first and the last line, through dedent', async ({ t, expect }) => {
    const refs = await refsIn(
      t,
      [
        `model {`,
        `  a = component {`,
        `    description '''[[first]] line`,
        `      second [[a.b]]`,
        `        - list [[view:v1]]`,
        ``,
        `      last [[last]]'''`,
        `    technology """`,
        `      [[n1]]`,
        `        nested [[n2|N]]`,
        ``,
        `      [[n3]]`,
        `    """`,
        `  }`,
        `}`,
      ].join('\n'),
    )
    expect(refs.map(({ text, target, line }) => ({ text, target, line }))).toEqual([
      { text: '[[first]]', target: 'first', line: 2 },
      { text: '[[a.b]]', target: 'a.b', line: 3 },
      { text: '[[view:v1]]', target: 'v1', line: 4 },
      // The first line is not indented, so dedent keeps the indentation of the other lines,
      // and `last [[last]]` after the blank line is an indented code block in the model, not a ref
      { text: '[[n1]]', target: 'n1', line: 8 },
      { text: '[[n2|N]]', target: 'n2', line: 9 },
      // Here the block is dedented, so it is a paragraph
      { text: '[[n3]]', target: 'n3', line: 11 },
    ])
  })

  it('maps refs with CRLF line endings', async ({ t, expect }) => {
    const refs = await refsIn(
      t,
      [
        `model {`,
        `  a = component {`,
        `    description '''`,
        `      first [[a]]`,
        `        second [[view:b]]`,
        `    '''`,
        `  }`,
        `}`,
      ].join('\r\n'),
    )
    expect(refs.map(({ text, target, namespace, line }) => ({ text, target, namespace, line }))).toEqual([
      { text: '[[a]]', target: 'a', namespace: null, line: 3 },
      { text: '[[view:b]]', target: 'b', namespace: 'view', line: 4 },
    ])
  })

  it('maps refs after unicode', async ({ t, expect }) => {
    const refs = await refsIn(
      t,
      [
        `model {`,
        `  a = component {`,
        `    description '''Привет 🚀 мир [[a.b]] — 😀 [[view:v|Вид]]'''`,
        `  }`,
        `}`,
      ].join('\n'),
    )
    expect(refs.map(({ text, target, line }) => ({ text, target, line }))).toEqual([
      { text: '[[a.b]]', target: 'a.b', line: 2 },
      { text: '[[view:v|Вид]]', target: 'v', line: 2 },
    ])
  })

  it('maps refs after escaped quotes and other escapes', async ({ t, expect }) => {
    const refs = await refsIn(
      t,
      [
        `model {`,
        `  a = component {`,
        `    description '''It\\'s \\'quoted\\' [[a]]'''`,
        `    summary """Say \\"hi\\" \\t [[b|\\"B\\"]]\\n[[c]]"""`,
        `  }`,
        `}`,
      ].join('\n'),
    )
    expect(refs.map(({ text, target, line }) => ({ text, target, line }))).toEqual([
      { text: '[[a]]', target: 'a', line: 2 },
      { text: '[[b|\\"B\\"]]', target: 'b', line: 3 },
      { text: '[[c]]', target: 'c', line: 3 },
    ])
  })

  it('follows DSL escapes: \\[[ is consumed by the DSL, \\\\[[ is a Markdown escape', async ({ t, expect }) => {
    const refs = await refsIn(
      t,
      [
        `model {`,
        `  a = component {`,
        `    description '''\\[[a]] \\\\[[b]] [[c\\.d]]'''`,
        `  }`,
        `}`,
      ].join('\n'),
    )
    expect(refs.map(({ text, target }) => ({ text, target }))).toEqual([
      // the model value is `[[a]]`, a ref; the range starts at the DSL escape
      { text: '\\[[a]]', target: 'a' },
      // the model value is `[[c.d]]`
      { text: '[[c\\.d]]', target: 'c\\.d' },
    ])
  })

  it('ignores refs in code and plain strings', async ({ t, expect }) => {
    const refs = await refsIn(
      t,
      [
        `model {`,
        `  a = component {`,
        `    title 'Plain [[a]]'`,
        `    technology "Plain [[b]]"`,
        `    description '''`,
        `      \`[[c]]\``,
        ``,
        `      \`\`\``,
        `      [[d]]`,
        `      \`\`\``,
        `    '''`,
        `  }`,
        `}`,
      ].join('\n'),
    )
    expect(refs).toEqual([])
  })
})
