import type { AstNode, LangiumDocument } from 'langium'
import { AstUtils } from 'langium'
import type { Range } from 'vscode-languageserver-types'
import { type LikeC4LangiumDocument, ast } from '../ast'
import type { DocumentEdits } from './text-edits'

const Indent = '  '

interface Source {
  document: LangiumDocument
  text: string
}

function sourceOf(node: AstNode): Source {
  const document = AstUtils.getDocument(node)
  return { document, text: document.textDocument.getText() }
}

function lineStart(text: string, offset: number): number {
  return text.lastIndexOf('\n', offset - 1) + 1
}

function nextLineStart(text: string, offset: number): number {
  const index = text.indexOf('\n', offset)
  return index === -1 ? text.length : index + 1
}

function indentAt(text: string, offset: number): string {
  return /^[ \t]*/.exec(text.slice(lineStart(text, offset), offset))?.[0] ?? ''
}

function isFirstOnLine(text: string, offset: number): boolean {
  return text.slice(lineStart(text, offset), offset).trim() === ''
}

function isLastOnLine(text: string, offset: number): boolean {
  return text.slice(offset, nextLineStart(text, offset)).trim() === ''
}

/**
 * Source lines of the node, with the indent of the node replaced by `indent`.
 */
function linesOf(node: AstNode, indent: string): string[] {
  const cst = node.$cstNode
  if (!cst) {
    return []
  }
  const nodeIndent = indentAt(sourceOf(node).text, cst.offset)
  return cst.text.split('\n').map((line, index) => {
    const stripped = index === 0 ? line : line.startsWith(nodeIndent) ? line.slice(nodeIndent.length) : line.trimStart()
    return stripped.trim() === '' ? '' : indent + stripped
  })
}

class Inserter {
  constructor(private edits: DocumentEdits, private source: Source) {}

  at(offset: number, newText: string): void {
    const position = this.source.document.textDocument.positionAt(offset)
    this.edits.add(this.source.document, { range: { start: position, end: position }, newText })
  }

  /**
   * Inserts lines after the offset: on the next line if the offset ends its line, otherwise on new lines in place.
   */
  linesAfter(offset: number, lines: string[]): void {
    const { text } = this.source
    if (!isLastOnLine(text, offset)) {
      this.at(offset, '\n' + lines.join('\n') + '\n' + indentAt(text, offset))
      return
    }
    const position = nextLineStart(text, offset)
    const needsNewline = position === text.length && !text.endsWith('\n')
    this.at(position, (needsNewline ? '\n' : '') + lines.join('\n') + (needsNewline ? '' : '\n'))
  }

  /**
   * Inserts lines before the offset: on the previous line if the offset starts its line, otherwise on new lines in place.
   */
  linesBefore(offset: number, lines: string[]): void {
    const { text } = this.source
    if (isFirstOnLine(text, offset)) {
      this.at(lineStart(text, offset), lines.join('\n') + '\n')
    } else {
      this.at(offset, '\n' + lines.join('\n') + '\n' + indentAt(text, offset))
    }
  }
}

/**
 * Indent of the content of a block: the indent of its first item, or the block indent plus two spaces.
 */
function contentIndent(text: string, blockOffset: number, items: ReadonlyArray<AstNode>): string {
  const first = items.find(item => item.$cstNode && isFirstOnLine(text, item.$cstNode.offset))
  return first?.$cstNode ? indentAt(text, first.$cstNode.offset) : indentAt(text, blockOffset) + Indent
}

function tagsOf(tags: ast.Tags | undefined): ast.TagRef[] {
  return tags ? AstUtils.streamAst(tags).filter(ast.isTagRef).toArray() : []
}

function tagName(tag: ast.TagRef): string {
  return tag.$cstNode?.text ?? `#${tag.tag.$refText}`
}

function metadataLines(metadata: ast.MetadataBody, indent: string): string[] {
  const lines = linesOf(metadata, indent)
  const first = lines[0]
  if (first !== undefined && !first.trimStart().startsWith('metadata')) {
    lines[0] = indent + 'metadata ' + first.trimStart()
  }
  return lines
}

/**
 * Merges the content of `extend` into the element definition:
 * tags and props (links, metadata) go to the head of the body, children to the end.
 * Tags and links that the element already has are skipped, metadata keys override existing ones.
 */
function mergeIntoElement(edits: DocumentEdits, target: ast.Element, extend: ast.ExtendElement): void {
  const cst = target.$cstNode
  if (!cst) {
    return
  }
  const source = sourceOf(target)
  const { text } = source
  const insert = new Inserter(edits, source)
  const body = target.body
  const bodyItems = body ? [...(body.tags ? [body.tags] : []), ...body.props, ...body.elements] : []
  const indent = contentIndent(text, cst.offset, bodyItems)

  const existingTags = new Set(tagsOf(body?.tags).map(tagName))
  const tags = tagsOf(extend.body.tags).map(tagName).filter(tag => !existingTags.has(tag))

  const existingLinks = (body?.props ?? []).filter(ast.isLinkProperty)
  const links = extend.body.props
    .filter(ast.isLinkProperty)
    .filter(link => !existingLinks.some(l => l.value === link.value && l.title === link.title))
  const propLines = links.flatMap(link => linesOf(link, indent))

  const metadata = extend.body.props.find(ast.isMetadataBody)
  const targetMetadata = body?.props.find(ast.isMetadataBody)
  if (metadata && !targetMetadata) {
    propLines.push(...metadataLines(metadata, indent))
  }

  const childLines = extend.body.elements.flatMap(child => linesOf(child, indent))

  if (!body?.$cstNode) {
    const lines = [...(tags.length > 0 ? [indent + tags.join(' ')] : []), ...propLines, ...childLines]
    if (lines.length > 0) {
      insert.at(cst.end, ' {\n' + lines.join('\n') + '\n' + indentAt(text, cst.offset) + '}')
    }
    return
  }
  const open = body.$cstNode.offset
  const close = body.$cstNode.end - 1

  if (tags.length > 0) {
    const lastTag = tagsOf(body.tags).at(-1)?.$cstNode
    if (lastTag) {
      const separator = body.tags?.$cstNode?.text.includes(',') ? ', ' : ' '
      insert.at(lastTag.end, separator + tags.join(separator))
    } else {
      insert.linesAfter(open + 1, [indent + tags.join(' ')])
    }
  }

  if (propLines.length > 0) {
    const lastProp = body.props.at(-1)?.$cstNode
    const firstChild = body.elements[0]?.$cstNode
    const tagsEnd = body.tags?.$cstNode?.end
    switch (true) {
      case !!lastProp:
        insert.linesAfter(lastProp.end, propLines)
        break
      case !!firstChild:
        insert.linesBefore(firstChild.offset, propLines)
        break
      case tagsEnd !== undefined:
        insert.linesAfter(tagsEnd, propLines)
        break
      default:
        insert.linesBefore(close, propLines)
    }
  }

  if (metadata && targetMetadata?.$cstNode) {
    mergeMetadata(edits, insert, text, targetMetadata, metadata)
  }

  if (childLines.length > 0) {
    insert.linesBefore(close, childLines)
  }
}

function mergeMetadata(
  edits: DocumentEdits,
  insert: Inserter,
  text: string,
  target: ast.MetadataBody,
  metadata: ast.MetadataBody,
): void {
  const targetCst = target.$cstNode!
  const indent = contentIndent(text, targetCst.offset, target.props)
  const added: string[] = []
  for (const attribute of metadata.props) {
    const existing = target.props.find(a => a.key === attribute.key)
    if (existing) {
      edits.replaceNode(existing, attribute.$cstNode?.text ?? '')
    } else {
      added.push(...linesOf(attribute, indent))
    }
  }
  if (added.length > 0) {
    insert.linesBefore(targetCst.end - 1, added)
  }
}

/**
 * Model block that defines the node (for elements added by a diff: the block of the extended element).
 */
function modelBlockOf(node: AstNode | undefined): ast.Model | undefined {
  for (let current = node; current; current = current.$container) {
    if (ast.isModel(current)) {
      return current
    }
    if (ast.isExtendElement(current)) {
      return modelBlockOf(current.element.el.ref)
    }
    if (ast.isModelDiff(current)) {
      return undefined
    }
  }
  return undefined
}

/**
 * Model block that gets new root elements: the block with most root elements.
 */
function mainModelBlock(documents: ReadonlyArray<LikeC4LangiumDocument>): ast.Model | undefined {
  const blocks = documents.flatMap(document => document.parseResult.value.models)
  const rootElements = (block: ast.Model) => block.elements.filter(ast.isElement).length
  return blocks.reduce<ast.Model | undefined>(
    (best, block) => (!best || rootElements(block) > rootElements(best) ? block : best),
    undefined,
  )
}

function appendToModel(edits: DocumentEdits, model: ast.Model, item: AstNode): void {
  const cst = model.$cstNode
  if (!cst) {
    return
  }
  const source = sourceOf(model)
  const insert = new Inserter(edits, source)
  const indent = contentIndent(source.text, cst.offset, model.elements)
  const lines = linesOf(item, indent)
  const lastElement = model.elements.filter(ast.isElement).at(-1)?.$cstNode
  if (ast.isElement(item) && lastElement) {
    insert.linesAfter(lastElement.end, ['', ...lines])
  } else {
    insert.linesBefore(cst.end - 1, lines)
  }
}

/**
 * Adds edits that merge the `add` blocks of the diff into the model:
 * - `extend` of an existing element: into the element definition
 * - relations: into the model block that defines the root of the source
 * - other items (new root elements, `extend` of relations or of elements added by diffs): into the main model block
 *
 * Returns the items that are not merged (there is no model block to put them).
 */
export function mergeDiffAdds(
  edits: DocumentEdits,
  diff: ast.ModelDiff,
  documents: ReadonlyArray<LikeC4LangiumDocument>,
): AstNode[] {
  const mainBlock = mainModelBlock(documents)
  const unmerged: AstNode[] = []
  const toModel = (model: ast.Model | undefined, item: AstNode) => {
    if (model) {
      appendToModel(edits, model, item)
    } else {
      unmerged.push(item)
    }
  }
  for (const item of diff.adds.flatMap(add => add.elements)) {
    const extended = ast.isExtendElement(item) ? item.element.el.ref : undefined
    switch (true) {
      case ast.isExtendElement(item) && ast.isElement(extended)
        && !AstUtils.hasContainerOfType(extended, ast.isModelDiff):
        mergeIntoElement(edits, extended, item)
        break
      case ast.isRelation(item):
        toModel(modelBlockOf(item.source?.value.ref) ?? mainBlock, item)
        break
      default:
        toModel(mainBlock, item)
    }
  }
  return unmerged
}

/**
 * Model block with the items (used when there is no model block to merge them into).
 */
export function modelBlockWith(items: ReadonlyArray<AstNode>): string {
  const lines = items.flatMap((item, index) => [...(index > 0 ? [''] : []), ...linesOf(item, Indent)])
  return `model {\n${lines.join('\n')}\n}\n`
}

/**
 * Range of the diff with the comment lines right above it.
 */
export function diffRange(diff: ast.ModelDiff): Range | undefined {
  const cst = diff.$cstNode
  if (!cst) {
    return undefined
  }
  const { document, text } = sourceOf(diff)
  let start = cst.offset
  if (isFirstOnLine(text, start)) {
    start = lineStart(text, start)
    while (start > 0) {
      const previous = lineStart(text, start - 1)
      const line = text.slice(previous, start - 1).trim()
      if (!line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
        break
      }
      start = previous
    }
  }
  const end = isLastOnLine(text, cst.end) ? nextLineStart(text, cst.end) : cst.end
  return {
    start: document.textDocument.positionAt(start),
    end: document.textDocument.positionAt(end),
  }
}
