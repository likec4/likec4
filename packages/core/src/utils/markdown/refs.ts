/**
 * Syntax for links to model elements and views inside Markdown values:
 *
 * - `[[cloud.api]]` - link to element
 * - `[[cloud.api|API]]` - link to element with a custom label
 * - `[[view:index]]` - link to view
 * - `\[[` - literal `[[` (standard Markdown escaping)
 *
 * Implemented as a micromark syntax extension (tokenizer) plus mdast-util-from-markdown extension,
 * so refs are recognized by the same Markdown parser that renders them. This means:
 * - inline code, fenced code, inline HTML and autolinks are never scanned
 * - backslash escapes (`\[[`) are handled by the parser
 * - offsets are exact, even with escapes, entities, blockquotes and lists
 *
 * Grammar (one line, no nested brackets):
 * ```
 * ref    := '[[' (namespace ':')? target (('|' | '\|') label?)? ']]'
 * target := 1*(any char except whitespace, '[', ']', '|', '\')
 * label  := 1*(any char except line ending, '[', ']'; backslash escapes allowed)
 * ```
 * `\|` is accepted as the label separator, so that refs with labels can be used in GFM tables
 * (an unescaped `|` splits a table cell before inline parsing).
 */
import type { Literal, Nodes } from 'mdast'
import type { CompileContext, Extension as FromMarkdownExtension, Token } from 'mdast-util-from-markdown'
import { decodeString } from 'micromark-util-decode-string'
import type { Code, Construct, Effects, Extension as MicromarkExtension, State } from 'micromark-util-types'
import type { Processor } from 'unified'
import type { MarkdownRef } from './types'

/**
 * mdast node for a ref.
 * `value` is the fallback text (label, or target), so that `mdast-util-to-string` works as is.
 */
export interface LikeC4RefNode extends Literal {
  type: 'likec4Ref'
  ref: MarkdownRef
}

declare module 'mdast' {
  interface PhrasingContentMap {
    likec4Ref: LikeC4RefNode
  }
  interface RootContentMap {
    likec4Ref: LikeC4RefNode
  }
}

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    likec4Ref: 'likec4Ref'
    likec4RefMarker: 'likec4RefMarker'
    likec4RefTarget: 'likec4RefTarget'
    likec4RefSeparator: 'likec4RefSeparator'
    likec4RefLabel: 'likec4RefLabel'
  }
}

const VIEW_NAMESPACE = 'view'

const codes = {
  backslash: 92, // \
  colon: 58, // :
  leftSquareBracket: 91, // [
  rightSquareBracket: 93, // ]
  verticalBar: 124, // |
  space: 32,
  // micromark virtual codes: -5 CR, -4 LF, -3 CRLF, -2 horizontal tab, -1 virtual space
  horizontalTab: -2,
} as const

const whitespaceRe = /\s/u

function isLineEndingOrEof(code: Code): boolean {
  return code === null || code < codes.horizontalTab
}

function isTargetChar(code: Code): boolean {
  if (code === null || code <= codes.space) {
    return false
  }
  switch (code) {
    case codes.leftSquareBracket:
    case codes.rightSquareBracket:
    case codes.verticalBar:
    case codes.backslash:
      return false
  }
  return !whitespaceRe.test(String.fromCodePoint(code))
}

function isLabelChar(code: Code): boolean {
  return !isLineEndingOrEof(code) && code !== codes.leftSquareBracket && code !== codes.rightSquareBracket
}

function isAsciiPunctuation(code: Code): code is number {
  return code !== null && (
    (code >= 33 && code <= 47) || (code >= 58 && code <= 64) || (code >= 91 && code <= 96) ||
    (code >= 123 && code <= 126)
  )
}

function tokenizeRef(this: unknown, effects: Effects, ok: State, nok: State): State {
  // chars in target (including namespace)
  let targetSize = 0
  // chars after the first colon, null if there is no colon
  let afterColon: number | null = null

  return start

  function start(code: Code): State | undefined {
    if (code !== codes.leftSquareBracket) {
      return nok(code)
    }
    effects.enter('likec4Ref')
    effects.enter('likec4RefMarker')
    effects.consume(code)
    return openSecond
  }

  function openSecond(code: Code): State | undefined {
    if (code !== codes.leftSquareBracket) {
      return nok(code)
    }
    effects.consume(code)
    effects.exit('likec4RefMarker')
    return targetStart
  }

  function targetStart(code: Code): State | undefined {
    if (!isTargetChar(code) || code === codes.colon) {
      return nok(code)
    }
    effects.enter('likec4RefTarget')
    return targetInside(code)
  }

  function targetInside(code: Code): State | undefined {
    if (isTargetChar(code)) {
      if (afterColon !== null) {
        afterColon++
      } else if (code === codes.colon) {
        afterColon = 0
      }
      targetSize++
      effects.consume(code)
      return targetInside
    }
    // Empty target after namespace, e.g. `[[view:]]`
    if (targetSize === 0 || afterColon === 0) {
      return nok(code)
    }
    effects.exit('likec4RefTarget')
    switch (code) {
      case codes.rightSquareBracket: {
        effects.enter('likec4RefMarker')
        effects.consume(code)
        return closeSecond
      }
      case codes.verticalBar: {
        effects.enter('likec4RefSeparator')
        effects.consume(code)
        effects.exit('likec4RefSeparator')
        return labelStart
      }
      case codes.backslash: {
        effects.enter('likec4RefSeparator')
        effects.consume(code)
        return escapedSeparator
      }
    }
    return nok(code)
  }

  function escapedSeparator(code: Code): State | undefined {
    if (code !== codes.verticalBar) {
      return nok(code)
    }
    effects.consume(code)
    effects.exit('likec4RefSeparator')
    return labelStart
  }

  function labelStart(code: Code): State | undefined {
    // Empty label, `[[a|]]`
    if (code === codes.rightSquareBracket) {
      effects.enter('likec4RefMarker')
      effects.consume(code)
      return closeSecond
    }
    if (!isLabelChar(code)) {
      return nok(code)
    }
    effects.enter('likec4RefLabel')
    return labelInside(code)
  }

  function labelInside(code: Code): State | undefined {
    if (code === codes.rightSquareBracket) {
      effects.exit('likec4RefLabel')
      effects.enter('likec4RefMarker')
      effects.consume(code)
      return closeSecond
    }
    if (!isLabelChar(code)) {
      return nok(code)
    }
    effects.consume(code)
    return code === codes.backslash ? labelEscape : labelInside
  }

  function labelEscape(code: Code): State | undefined {
    if (isAsciiPunctuation(code)) {
      effects.consume(code)
      return labelInside
    }
    return labelInside(code)
  }

  function closeSecond(code: Code): State | undefined {
    if (code !== codes.rightSquareBracket) {
      return nok(code)
    }
    effects.consume(code)
    effects.exit('likec4RefMarker')
    effects.exit('likec4Ref')
    return ok
  }
}

const refConstruct: Construct = {
  name: 'likec4Ref',
  tokenize: tokenizeRef,
  // Before link/image label starts, so `[[` is never treated as a link reference
  add: 'before',
}

/**
 * micromark syntax extension for refs
 */
export const likec4RefSyntax: MicromarkExtension = {
  text: {
    [codes.leftSquareBracket]: refConstruct,
  },
}

function currentRefNode(ctx: CompileContext): LikeC4RefNode | null {
  const node = ctx.stack[ctx.stack.length - 1]
  return node?.type === 'likec4Ref' ? node : null
}

function enterRef(this: CompileContext, token: Token): void {
  const node: LikeC4RefNode = {
    type: 'likec4Ref',
    value: '',
    ref: {
      kind: 'element',
      namespace: null,
      target: '',
      label: null,
      range: { start: token.start.offset, end: token.end.offset },
      targetRange: { start: token.start.offset, end: token.start.offset },
    },
  }
  this.enter(node, token)
}

function exitRefTarget(this: CompileContext, token: Token): void {
  const node = currentRefNode(this)
  if (!node) {
    return
  }
  const raw = this.sliceSerialize(token)
  const colon = raw.indexOf(':')
  const namespace = colon > 0 ? raw.slice(0, colon) : null
  const targetStart = token.start.offset + (namespace !== null ? colon + 1 : 0)
  node.ref.namespace = namespace
  node.ref.kind = namespace === null ? 'element' : namespace === VIEW_NAMESPACE ? 'view' : 'unknown'
  node.ref.target = namespace !== null ? raw.slice(colon + 1) : raw
  node.ref.targetRange = { start: targetStart, end: token.end.offset }
}

function exitRefLabel(this: CompileContext, token: Token): void {
  const node = currentRefNode(this)
  if (!node) {
    return
  }
  const label = decodeString(this.sliceSerialize(token)).trim()
  node.ref.label = label !== '' ? label : null
}

function exitRef(this: CompileContext, token: Token): void {
  const node = currentRefNode(this)
  if (node) {
    node.value = node.ref.label ?? node.ref.target
  }
  this.exit(token)
}

/**
 * mdast-util-from-markdown extension, turns ref tokens into {@link LikeC4RefNode}
 */
export const likec4RefFromMarkdown: FromMarkdownExtension = {
  enter: {
    likec4Ref: enterRef,
  },
  exit: {
    likec4RefTarget: exitRefTarget,
    likec4RefLabel: exitRefLabel,
    likec4Ref: exitRef,
  },
}

/**
 * Visits all ref nodes, except refs inside links (anchors can't be nested).
 */
export function visitRefs(
  node: Nodes,
  visitor: (node: LikeC4RefNode, index: number, parent: Extract<Nodes, { children: unknown }>) => void,
): void {
  if (!('children' in node)) {
    return
  }
  node.children.forEach((child, index) => {
    switch (child.type) {
      case 'likec4Ref': {
        visitor(child, index, node)
        return
      }
      case 'link':
      case 'linkReference': {
        return
      }
      default: {
        visitRefs(child, visitor)
      }
    }
  })
}

/**
 * Turns refs inside links into plain text (anchors can't be nested).
 */
function unwrapRefsInLinks(node: Nodes, insideLink = false): void {
  if (!('children' in node)) {
    return
  }
  const isLink = insideLink || node.type === 'link' || node.type === 'linkReference'
  node.children.forEach((child, index) => {
    if (child.type === 'likec4Ref') {
      if (isLink) {
        node.children[index] = { type: 'text', value: child.value, ...(child.position && { position: child.position }) }
      }
      return
    }
    unwrapRefsInLinks(child, isLink)
  })
}

/**
 * Remark plugin, parses refs into {@link LikeC4RefNode}.
 */
export function remarkLikeC4Refs(this: Processor) {
  const data = this.data()
  const micromarkExtensions = data.micromarkExtensions ?? (data.micromarkExtensions = [])
  const fromMarkdownExtensions = data.fromMarkdownExtensions ?? (data.fromMarkdownExtensions = [])
  micromarkExtensions.push(likec4RefSyntax)
  fromMarkdownExtensions.push(likec4RefFromMarkdown)
  return (tree: Nodes) => {
    unwrapRefsInLinks(tree)
  }
}
