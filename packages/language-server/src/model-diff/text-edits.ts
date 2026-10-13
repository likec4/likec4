import { getOrCreate } from '@likec4/core/utils'
import type { AstNode, CstNode, LangiumDocument } from 'langium'
import { AstUtils } from 'langium'
import { TextDocument } from 'vscode-languageserver-textdocument'
import type { Range, TextEdit, WorkspaceEdit } from 'vscode-languageserver-types'
import { ast } from '../ast'

/**
 * Text edits grouped by document URI
 */
export class DocumentEdits {
  readonly #edits = new Map<string, { document: LangiumDocument; edits: TextEdit[] }>()

  /**
   * Documents with edits
   */
  get documents(): LangiumDocument[] {
    return [...this.#edits.values()].map(e => e.document)
  }

  add(document: LangiumDocument, edit: TextEdit): void {
    getOrCreate(this.#edits, document.uri.toString(), () => ({ document, edits: [] })).edits.push(edit)
  }

  /**
   * Deletes the node; whole lines are deleted when the node is the only content on them.
   */
  deleteNode(node: AstNode): void {
    if (!node.$cstNode) {
      return
    }
    const document = AstUtils.getDocument(node)
    this.add(document, { range: wholeLinesRange(document, node.$cstNode), newText: '' })
  }

  /**
   * Replaces the source text of the node.
   */
  replaceNode(node: AstNode, newText: string): void {
    if (!node.$cstNode) {
      return
    }
    this.add(AstUtils.getDocument(node), { range: node.$cstNode.range, newText })
  }

  /**
   * Returns edits without overlaps: an edit inside another edit is dropped.
   */
  toWorkspaceEdit(): WorkspaceEdit {
    const changes: Record<string, TextEdit[]> = {}
    for (const [uri, { document, edits }] of this.#edits) {
      changes[uri] = withoutOverlaps(document, edits)
    }
    return { changes }
  }

  /**
   * Text of the changed documents before and after the edits.
   */
  preview(): DocumentChange[] {
    return [...this.#edits].flatMap(([uri, { document, edits }]) => {
      const before = document.textDocument.getText()
      const after = TextDocument.applyEdits(document.textDocument, withoutOverlaps(document, edits))
      return before !== after ? [{ uri, before, after }] : []
    })
  }
}

export interface DocumentChange {
  uri: string
  before: string
  after: string
}

function wholeLinesRange(document: LangiumDocument, cst: CstNode): Range {
  const textDocument = document.textDocument
  const text = textDocument.getText()
  const { start, end } = cst.range
  const lineStart = textDocument.offsetAt({ line: start.line, character: 0 })
  const nextLineStart = textDocument.offsetAt({ line: end.line + 1, character: 0 })
  const before = text.slice(lineStart, cst.offset)
  const after = text.slice(cst.end, nextLineStart)
  if (before.trim() !== '' || after.trim() !== '') {
    return cst.range
  }
  return {
    start: { line: start.line, character: 0 },
    end: textDocument.positionAt(nextLineStart),
  }
}

function withoutOverlaps(document: LangiumDocument, edits: TextEdit[]): TextEdit[] {
  const textDocument = document.textDocument
  const withOffsets = edits
    .map(edit => ({
      edit,
      start: textDocument.offsetAt(edit.range.start),
      end: textDocument.offsetAt(edit.range.end),
    }))
    // Larger edits first, so the edits inside them are dropped
    .sort((a, b) => a.start - b.start || b.end - a.end)
  const result = [] as typeof withOffsets
  for (const current of withOffsets) {
    const overlaps = result.some(kept => current.start < kept.end && kept.start < current.end)
    const isDuplicateInsert = result.some(kept =>
      kept.start === current.start && kept.end === current.end && kept.edit.newText === current.edit.newText
    )
    if (!overlaps && !isDuplicateInsert) {
      result.push(current)
    }
  }
  // Inserts go before a deletion that starts at the same offset (`TextDocument.applyEdits` rejects the other order)
  return result
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .map(r => r.edit)
}

/**
 * Comma separated list in the DSL (`include a, b, c`, `style a, b {}`, `import { a, b } from`).
 * The last item is the outermost AST node, previous items are nested via `prev`.
 */
export type ListItem = ast.Expressions | ast.FqnExpressions | ast.Imported

export function isListItem(node: AstNode): node is ListItem {
  return ast.isExpressions(node) || ast.isFqnExpressions(node) || ast.isImported(node)
}

/**
 * Node that owns the list (predicate, style rule, import statement)
 */
export function listOwner(item: ListItem): AstNode {
  return listRoot(item).$container
}

function listRoot(item: ListItem): ListItem {
  let root: ListItem = item
  while (isListItem(root.$container) && root.$container.$type === item.$type) {
    root = root.$container
  }
  return root
}

function listItems(root: ListItem): ListItem[] {
  const items = [] as ListItem[]
  for (let item: ListItem | undefined = root; item; item = item.prev) {
    items.unshift(item)
  }
  return items
}

function itemCst(item: ListItem): CstNode | undefined {
  return ast.isImported(item) ? item.imported.$refNode : item.value?.$cstNode
}

/**
 * Removes items from comma separated lists.
 * If all items of a list are removed, the node that owns the list is deleted.
 */
export function removeListItems(edits: DocumentEdits, removed: ReadonlySet<ListItem>): void {
  const roots = new Set([...removed].map(listRoot))
  for (const root of roots) {
    const items = listItems(root).filter(item => !!itemCst(item))
    const remaining = items.filter(item => !removed.has(item))
    if (remaining.length === 0) {
      edits.deleteNode(root.$container)
      continue
    }
    if (remaining.length === items.length) {
      continue
    }
    const document = AstUtils.getDocument(root)
    const text = document.textDocument.getText()
    const first = itemCst(items[0]!)!
    const last = itemCst(items[items.length - 1]!)!
    let newText = ''
    for (const item of remaining) {
      const cst = itemCst(item)!
      if (newText !== '') {
        // Keep the original separator in front of the item (preserves line breaks)
        const index = items.indexOf(item)
        const previous = itemCst(items[index - 1]!)!
        newText += text.slice(previous.end, cst.offset)
      }
      newText += text.slice(cst.offset, cst.end)
    }
    edits.add(document, {
      range: { start: first.range.start, end: last.range.end },
      newText,
    })
  }
}
