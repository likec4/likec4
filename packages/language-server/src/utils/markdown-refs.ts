import { type MarkdownRef, extractRefs } from '@likec4/core/utils'
import { type CstNode, type LangiumDocument, AstUtils, GrammarUtils } from 'langium'
import { isString } from 'remeda'
import { dedent } from 'strip-indent'
import type { Range } from 'vscode-languageserver-types'
import type { ast } from '../ast'

/**
 * Element/view ref found in a Markdown value, with positions in the source document.
 */
export interface DocumentMarkdownRef {
  ref: MarkdownRef
  /**
   * Offsets of the whole `[[…]]` in the document
   */
  offset: { start: number; end: number }
  /**
   * The whole `[[…]]`
   */
  range: Range
  /**
   * The target only (without namespace and label)
   */
  targetRange: Range
  /**
   * The namespace only (without `:`), `null` if the ref has no namespace
   */
  namespaceRange: Range | null
}

/**
 * Character of the unescaped token text with its span in the document
 */
type Span = { start: number; end: number }

/**
 * Mirrors `LikeC4ValueConverter` for `MarkdownString` (langium `ValueConverter.convertString`
 * applied to the token without the outer two quotes), keeping the document span of every resulting character.
 * An escape sequence (`\x`) becomes one character spanning two source characters.
 */
function unescapeWithSpans(token: string, tokenOffset: number): { text: string; spans: Span[] } {
  // Same as `LikeC4ValueConverter`: drop two quotes from each side, convertString drops one more
  const input = token.slice(2, -2)
  const inputOffset = tokenOffset + 2
  const spans: Span[] = []
  let text = ''
  for (let i = 1; i < input.length - 1; i++) {
    const start = inputOffset + i
    const c = input.charAt(i)
    if (c === '\\') {
      text += convertEscapeCharacter(input.charAt(++i))
      spans.push({ start, end: inputOffset + i + 1 })
    } else {
      text += c
      spans.push({ start, end: start + 1 })
    }
  }
  return { text, spans }
}

function convertEscapeCharacter(char: string): string {
  switch (char) {
    case 'b':
      return '\b'
    case 'f':
      return '\f'
    case 'n':
      return '\n'
    case 'r':
      return '\r'
    case 't':
      return '\t'
    case 'v':
      return '\v'
    case '0':
      return '\0'
    default:
      return char
  }
}

/**
 * Maps every character of `md` to its index in `text`, where `md` is `text` with some whitespace removed.
 *
 * Greedy leftmost matching. It may pick a removed whitespace instead of a kept one,
 * but it is exact for non-whitespace characters: all of them are kept, in order.
 * Refs start with `[` and end with `]`, targets have no whitespace, so all the offsets we map are exact.
 */
function alignSubsequence(md: string, text: string): number[] | null {
  const indexes: number[] = []
  let t = 0
  for (let j = 0; j < md.length; j++) {
    while (t < text.length && text[t] !== md[j]) {
      t++
    }
    if (t >= text.length) {
      return null
    }
    indexes.push(t++)
  }
  return indexes
}

/**
 * Finds element/view refs in a Markdown value (`'''…'''` / `"""…"""`) and maps them to document positions.
 * Plain strings (`'…'`, `"…"`) are not processed.
 *
 * Refs are extracted from exactly the text the model gets (and the renderer parses):
 * the token is unescaped by the value converter, then dedented and trimmed by `removeIndent` (`model/parser/Base.ts`).
 * Running `extractRefs` on the raw token text would be wrong: DSL escapes are consumed before Markdown sees the
 * text (e.g. `\[[a]]` in the source is `[[a]]` in the model, a ref; `\n` is a line break).
 * So offsets are mapped back through both steps:
 * - unescape is replayed while tracking the span of every character (an escape sequence spans two);
 * - dedent and trim only remove whitespace, so the result is aligned to the unescaped text as a subsequence.
 *
 * @param node MarkdownOrString node
 * @param document document of the node (resolved from the node if omitted)
 */
export function markdownRefsOf(node: ast.MarkdownOrString, document?: LangiumDocument): DocumentMarkdownRef[] {
  // Fast path, checked on the unescaped value
  if (!isString(node.markdown) || !node.markdown.includes('[[')) {
    return []
  }
  const leaf = GrammarUtils.findNodeForProperty(node.$cstNode, 'markdown')
  if (!leaf) {
    return []
  }
  return markdownRefsOfLeaf(leaf, node.markdown, document ?? AstUtils.getDocument(node))
}

function markdownRefsOfLeaf(leaf: CstNode, value: string, document: LangiumDocument): DocumentMarkdownRef[] {
  const { text, spans } = unescapeWithSpans(leaf.text, leaf.offset)
  // Safety net, if the value converter changes
  if (text !== value) {
    return []
  }
  // Same as `removeIndent` in `model/parser/Base.ts`
  const md = dedent(text).trim()
  const refs = extractRefs(md)
  if (refs.length === 0) {
    return []
  }
  const indexes = alignSubsequence(md, text)
  if (!indexes) {
    return []
  }
  const textDocument = document.textDocument
  // Document offset of the md character at `i`
  const startOf = (i: number) => spans[indexes[i]!]!.start
  // Document offset after the md character before `i` (`i` is exclusive)
  const endOf = (i: number) => spans[indexes[i - 1]!]!.end
  const toRange = (start: number, end: number): Range => ({
    start: textDocument.positionAt(start),
    end: textDocument.positionAt(end),
  })

  return refs.map(ref => {
    const start = startOf(ref.range.start)
    const end = endOf(ref.range.end)
    return {
      ref,
      offset: { start, end },
      range: toRange(start, end),
      targetRange: toRange(startOf(ref.targetRange.start), endOf(ref.targetRange.end)),
      // Namespace is between `[[` and `:`
      namespaceRange: ref.namespace !== null
        ? toRange(startOf(ref.range.start + 2), endOf(ref.targetRange.start - 1))
        : null,
    }
  })
}
